import json
import re
from datetime import datetime, timedelta, timezone

import anthropic

from backend.config.settings import settings
from backend.config.constants import (
    SPECIALIST_COLLECTIONS,
    SPECIALIST_DISPLAY_NAMES,
    SPECIALIST_MODEL,
    SPECIALIST_MAX_TOKENS,
    SYNTHESIS_MODEL,
    SYNTHESIS_MAX_TOKENS,
    TRIAGE_MODEL,
    TRIAGE_MAX_TOKENS,
)
from backend.graph.state import AgentState, SpecialistResponse
from backend.rag.retriever import retrieve_context
from backend.utils.history import get_sliding_window
from backend.utils.prompt_templates import (
    TRIAGE_SYSTEM_PROMPT,
    SYNTHESIS_SYSTEM_PROMPT,
    CLARIFICATION_SYSTEM_PROMPT,
    DOC_SUMMARY_SYSTEM_PROMPT,
    get_specialist_system_prompt,
)

_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


def _compute_confidence(specialist_response: str, synthesis: str) -> float:
    """Heuristic: % of specialist's key words that appear in the synthesis."""
    stop = {
        'the', 'a', 'an', 'is', 'it', 'to', 'of', 'and', 'in', 'for', 'with',
        'on', 'at', 'by', 'as', 'be', 'was', 'are', 'were', 'this', 'that',
        'have', 'has', 'had', 'not', 'or', 'but', 'if', 'from', 'can', 'will',
        'may', 'should', 'your', 'you', 'we', 'they', 'their', 'its', 'also',
        'which', 'who', 'when', 'what', 'how', 'would', 'could', 'patient',
        'doctor', 'medical', 'health', 'recommend', 'please', 'note', 'important',
    }

    def key_words(text: str) -> set:
        return {
            w.strip('.,!?;:()[]"\'')
            for w in text.lower().split()
            if len(w) > 4 and w.strip('.,!?;:()[]"\'') not in stop
        }

    spec_words = key_words(specialist_response)
    synth_words = key_words(synthesis)
    if not spec_words:
        return 0.5
    overlap = len(spec_words & synth_words)
    raw = min(overlap / len(spec_words), 1.0)
    return round(max(raw, 0.3), 2)


# ── TRIAGE NODE ───────────────────────────────────────────────────────────────

async def triage_node(state: AgentState) -> dict:
    cb = state.get("stream_callback")
    if cb:
        await cb({"type": "triage_start", "timestamp": _ts()})

    if state.get("mode") == "generic":
        if cb:
            await cb({
                "type": "triage_complete",
                "selected_specialists": ["general_practitioner"],
                "timestamp": _ts(),
            })
        return {"selected_specialists": ["general_practitioner"], "triage_reasoning": "generic mode"}

    if state.get("mode") == "manual":
        raw = state.get("manual_specialists") or []
        specialists = [s for s in raw if s in SPECIALIST_COLLECTIONS] or ["general_practitioner"]
        if cb:
            await cb({
                "type": "triage_complete",
                "selected_specialists": specialists,
                "timestamp": _ts(),
            })
        return {"selected_specialists": specialists, "triage_reasoning": "manual specialist selection"}

    response = await _client.messages.create(
        model=TRIAGE_MODEL,
        max_tokens=TRIAGE_MAX_TOKENS,
        system=[{
            "type": "text",
            "text": TRIAGE_SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{"role": "user", "content": state["user_message"]}],
    )

    raw = response.content[0].text.strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        parsed = json.loads(match.group()) if match else {}

    specialists = parsed.get("specialists", ["general_practitioner"])
    specialists = [s for s in specialists if s in SPECIALIST_COLLECTIONS] or ["general_practitioner"]

    if cb:
        await cb({
            "type": "triage_complete",
            "selected_specialists": specialists,
            "timestamp": _ts(),
        })

    return {
        "selected_specialists": specialists,
        "triage_reasoning": parsed.get("reasoning", ""),
    }


# ── CLARIFICATION NODE ───────────────────────────────────────────────────────

async def clarification_node(state: AgentState) -> dict:
    cb = state.get("stream_callback")

    if state.get("mode") in ("generic", "manual"):
        return {"needs_clarification": False, "clarification_questions": []}

    if cb:
        await cb({"type": "clarification_checking", "timestamp": _ts()})
    history = state.get("message_history", [])
    context_msgs = [*get_sliding_window(history), {"role": "user", "content": state["user_message"]}]

    response = await _client.messages.create(
        model=TRIAGE_MODEL,
        max_tokens=300,
        system=[{
            "type": "text",
            "text": CLARIFICATION_SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=context_msgs,
    )

    raw = response.content[0].text.strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        parsed = json.loads(match.group()) if match else {}

    needs = bool(parsed.get("needs_clarification", False))
    questions: list[str] = parsed.get("questions", [])[:3]

    if needs and questions:
        if cb:
            await cb({"type": "clarification_needed", "questions": questions, "timestamp": _ts()})
        return {"needs_clarification": True, "clarification_questions": questions}

    return {"needs_clarification": False, "clarification_questions": []}


# ── CHAT TITLE GENERATOR ─────────────────────────────────────────────────────

async def generate_chat_title(user_message: str) -> str:
    try:
        response = await _client.messages.create(
            model=TRIAGE_MODEL,
            max_tokens=30,
            system="Generate a short 4-6 word title for a medical consultation chat based on the patient's query. Return ONLY the title text, no quotes or punctuation at the end.",
            messages=[{"role": "user", "content": user_message[:300]}],
        )
        title = response.content[0].text.strip().strip('"\'')
        return title[:70] if title else user_message[:50]
    except Exception:
        clean = user_message.strip().replace('\n', ' ')
        if len(clean) <= 50:
            return clean
        truncated = clean[:50]
        last_space = truncated.rfind(' ')
        return (truncated[:last_space] + '…') if last_space > 15 else truncated + '…'


# ── DOCUMENT SUMMARIZER ───────────────────────────────────────────────────────

async def summarize_document(extracted_text: str) -> str:
    preview = extracted_text[:3500]
    response = await _client.messages.create(
        model=TRIAGE_MODEL,
        max_tokens=400,
        system=[{
            "type": "text",
            "text": DOC_SUMMARY_SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{"role": "user", "content": f"Medical document text:\n\n{preview}"}],
    )
    return response.content[0].text.strip()


# ── POST-SYNTHESIS PROCESSING ─────────────────────────────────────────────────

_HEALTH_EXTRACTION_PROMPT = (
    "You are a medical data extractor. From this consultation, extract health events and "
    "decide if a follow-up check-in is needed.\n\n"
    "Return ONLY valid JSON, no other text:\n"
    "{\n"
    '  "health_events": [\n'
    '    {"event_type": "symptom|diagnosis|medication|test_result|other",\n'
    '     "title": "Short title ≤60 chars",\n'
    '     "description": "One sentence",\n'
    '     "severity": "mild|moderate|severe|null"}\n'
    "  ],\n"
    '  "follow_up": {\n'
    '    "needed": true,\n'
    '    "question": "Brief personalised check-in question",\n'
    '    "days_from_now": 2,\n'
    '    "urgency": "normal|urgent"\n'
    "  }\n"
    "}\n\n"
    "Follow-up is needed when: symptoms are acute, a treatment was started, or monitoring is advised."
)


async def _run_post_synthesis(state: AgentState, synthesis: str, cb) -> None:
    """Confidence scoring (heuristic) + health event extraction + follow-up scheduling."""

    # 1. Confidence scoring — zero LLM cost
    for r in state.get("specialist_responses", []):
        score = _compute_confidence(r["response"], synthesis)
        if cb:
            await cb({
                "type": "agent_confidence",
                "agent": r["specialist"],
                "confidence": score,
                "timestamp": _ts(),
            })

    # 2. Health events + follow-up (one Haiku call)
    try:
        context_text = (
            f"Patient query: {state['user_message']}\n\n"
            f"Doctor's response:\n{synthesis[:2000]}"
        )
        response = await _client.messages.create(
            model=TRIAGE_MODEL,
            max_tokens=600,
            system=_HEALTH_EXTRACTION_PROMPT,
            messages=[{"role": "user", "content": context_text}],
        )
        raw = response.content[0].text.strip()
        try:
            extracted = json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            extracted = json.loads(match.group()) if match else {}

        health_events: list = extracted.get("health_events", [])
        follow_up: dict = extracted.get("follow_up", {})

        # Store health events
        if health_events and state.get("user_id") and state.get("chat_id"):
            try:
                from backend.services.timeline_service import create_health_events
                await create_health_events(state["user_id"], state["chat_id"], health_events)
            except Exception:
                pass

        if cb and health_events:
            await cb({"type": "health_events_extracted", "events": health_events, "timestamp": _ts()})

        # Schedule follow-up
        if follow_up.get("needed") and state.get("user_id") and state.get("chat_id"):
            try:
                from backend.services.followup_service import create_follow_up
                days = max(1, min(int(follow_up.get("days_from_now", 2)), 14))
                scheduled_for = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
                fu_id = await create_follow_up(
                    user_id=state["user_id"],
                    chat_id=state["chat_id"],
                    question=follow_up.get("question", "How are you feeling?"),
                    scheduled_for=scheduled_for,
                    urgency=follow_up.get("urgency", "normal"),
                    message_summary=state["user_message"][:200],
                )
                if cb and fu_id:
                    await cb({
                        "type": "follow_up_scheduled",
                        "follow_up_id": fu_id,
                        "question": follow_up.get("question"),
                        "days_from_now": days,
                        "urgency": follow_up.get("urgency", "normal"),
                        "timestamp": _ts(),
                    })
            except Exception:
                pass

    except Exception:
        pass


# ── SPECIALIST NODE FACTORY ───────────────────────────────────────────────────

def make_specialist_node(specialist_key: str):
    collection_name = SPECIALIST_COLLECTIONS[specialist_key]
    display_name = SPECIALIST_DISPLAY_NAMES[specialist_key]
    system_prompt = get_specialist_system_prompt(specialist_key, display_name)

    async def specialist_node(state: AgentState) -> dict:
        cb = state.get("stream_callback")
        user_msg = state["user_message"]
        start_time = datetime.now(timezone.utc)

        if cb:
            await cb({"type": "agent_start", "agent": specialist_key,
                      "display_name": display_name, "timestamp": _ts()})
            await cb({"type": "agent_thinking", "agent": specialist_key,
                      "step": "Searching medical literature...", "timestamp": _ts()})

        context, source_ids = retrieve_context(user_msg, collection_name)

        if cb:
            await cb({"type": "agent_thinking", "agent": specialist_key,
                      "step": "Formulating response...", "timestamp": _ts()})

        history = get_sliding_window(state["message_history"])
        doc_ctx = state.get("document_context") or ""
        global_ctx = state.get("global_context") or ""

        parts = []
        if global_ctx:
            parts.append(f"Patient background information:\n{global_ctx}")
        if doc_ctx:
            parts.append(f"Patient's uploaded medical records:\n{doc_ctx}")
        if context:
            parts.append(f"Relevant medical literature:\n{context}")
        parts.append(f"Patient query: {user_msg}")
        user_content_text = "\n\n".join(parts)

        # Inject vision block if image present (all specialists receive it)
        image_data = state.get("image_data")
        image_mime = state.get("image_mime") or "image/jpeg"
        if image_data:
            user_content: object = [
                {"type": "image", "source": {
                    "type": "base64",
                    "media_type": image_mime,
                    "data": image_data,
                }},
                {"type": "text", "text": user_content_text},
            ]
        else:
            user_content = user_content_text

        full_response = ""
        token_count = 0
        async with _client.messages.stream(
            model=SPECIALIST_MODEL,
            max_tokens=SPECIALIST_MAX_TOKENS,
            system=[{
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[*history, {"role": "user", "content": user_content}],
        ) as stream:
            async for text in stream.text_stream:
                full_response += text
                token_count += 1
                if cb:
                    await cb({"type": "agent_token", "agent": specialist_key,
                              "token": text, "timestamp": _ts()})

        elapsed_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        if cb:
            await cb({"type": "agent_complete", "agent": specialist_key,
                      "response": full_response, "elapsed_ms": elapsed_ms,
                      "token_count": token_count, "timestamp": _ts()})

        return {
            "specialist_responses": [SpecialistResponse(
                specialist=specialist_key,
                display_name=display_name,
                response=full_response,
                rag_sources=source_ids,
            )]
        }

    specialist_node.__name__ = f"specialist_{specialist_key}"
    return specialist_node


# ── SYNTHESIS NODE ────────────────────────────────────────────────────────────

async def synthesis_node(state: AgentState) -> dict:
    cb = state.get("stream_callback")
    if cb:
        await cb({"type": "synthesis_start", "timestamp": _ts()})

    specialist_block = "\n\n".join(
        f"## {r['display_name']}\n{r['response']}"
        for r in state["specialist_responses"]
    )

    user_content = (
        f"Patient query: {state['user_message']}\n\n"
        f"Specialist consultations:\n{specialist_block}\n\n"
        "Please synthesize a single, cohesive, patient-friendly response."
    )

    history = get_sliding_window(state["message_history"])

    full_response = ""
    async with _client.messages.stream(
        model=SYNTHESIS_MODEL,
        max_tokens=SYNTHESIS_MAX_TOKENS,
        system=[{
            "type": "text",
            "text": SYNTHESIS_SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[*history, {"role": "user", "content": user_content}],
    ) as stream:
        async for text in stream.text_stream:
            full_response += text
            if cb:
                await cb({"type": "synthesis_token", "token": text, "timestamp": _ts()})

    if cb:
        await cb({"type": "synthesis_complete", "full_response": full_response, "timestamp": _ts()})

    # Post-synthesis: confidence + health events + follow-up (non-blocking best-effort)
    await _run_post_synthesis(state, full_response, cb)

    return {"final_response": full_response}
