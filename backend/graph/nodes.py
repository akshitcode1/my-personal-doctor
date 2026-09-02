import json
import re
from datetime import datetime, timezone

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

# AsyncAnthropic — never blocks the event loop
_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── TRIAGE NODE ───────────────────────────────────────────────────────────────

async def triage_node(state: AgentState) -> dict:
    cb = state.get("stream_callback")
    if cb:
        await cb({"type": "triage_start", "timestamp": _ts()})

    # Generic mode: skip triage LLM — route straight to GP
    if state.get("mode") == "generic":
        if cb:
            await cb({
                "type": "triage_complete",
                "selected_specialists": ["general_practitioner"],
                "timestamp": _ts(),
            })
        return {"selected_specialists": ["general_practitioner"], "triage_reasoning": "generic mode"}

    # Manual mode: user chose one or more specialists — skip triage LLM
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
        system=[
            {
                "type": "text",
                "text": TRIAGE_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
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
    """
    Runs after triage. Uses Haiku to decide if 2-3 targeted follow-up questions
    would improve the consultation. If yes, emits clarification_needed and stops
    the graph. If no, the conditional edge proceeds to specialists.
    """
    cb = state.get("stream_callback")

    # Generic and manual modes: no clarification, proceed immediately
    if state.get("mode") in ("generic", "manual"):
        return {"needs_clarification": False, "clarification_questions": []}

    if cb:
        await cb({"type": "clarification_checking", "timestamp": _ts()})
    history = state.get("message_history", [])

    # Build conversation context so it doesn't re-ask after user has already answered
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
            await cb({
                "type": "clarification_needed",
                "questions": questions,
                "timestamp": _ts(),
            })
        return {"needs_clarification": True, "clarification_questions": questions}

    return {"needs_clarification": False, "clarification_questions": []}


# ── CHAT TITLE GENERATOR (standalone, called outside graph) ──────────────────

async def generate_chat_title(user_message: str) -> str:
    """Generate a concise 4-6 word chat title from the first user message."""
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
        # Fallback: first 50 chars of message, trimmed to word boundary
        clean = user_message.strip().replace('\n', ' ')
        if len(clean) <= 50:
            return clean
        truncated = clean[:50]
        last_space = truncated.rfind(' ')
        return (truncated[:last_space] + '…') if last_space > 15 else truncated + '…'


# ── DOCUMENT SUMMARIZER (standalone, called outside graph) ────────────────────

async def summarize_document(extracted_text: str) -> str:
    """Generate a plain-English summary of a medical document using Haiku."""
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


# ── SPECIALIST NODE FACTORY ───────────────────────────────────────────────────

def make_specialist_node(specialist_key: str):
    collection_name = SPECIALIST_COLLECTIONS[specialist_key]
    display_name = SPECIALIST_DISPLAY_NAMES[specialist_key]
    system_prompt = get_specialist_system_prompt(specialist_key, display_name)

    async def specialist_node(state: AgentState) -> dict:
        cb = state.get("stream_callback")
        user_msg = state["user_message"]

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

        user_content_parts = []
        if global_ctx:
            user_content_parts.append(f"Patient background information:\n{global_ctx}")
        if doc_ctx:
            user_content_parts.append(f"Patient's uploaded medical records:\n{doc_ctx}")
        if context:
            user_content_parts.append(f"Relevant medical literature:\n{context}")

        user_content_parts.append(f"Patient query: {user_msg}")
        user_content = "\n\n".join(user_content_parts)

        full_response = ""
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
                if cb:
                    await cb({"type": "agent_token", "agent": specialist_key,
                              "token": text, "timestamp": _ts()})

        if cb:
            await cb({"type": "agent_complete", "agent": specialist_key,
                      "response": full_response, "timestamp": _ts()})

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
        await cb({"type": "synthesis_complete", "full_response": full_response,
                  "timestamp": _ts()})

    return {"final_response": full_response}
