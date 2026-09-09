"""
Backfill health events from existing chat history.
Run once after creating the health_events table:

    python scripts/backfill_health_events.py
"""
import asyncio
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config.settings import settings
from backend.services.supabase_client import get_supabase
import anthropic

EXTRACT_PROMPT = """You are a medical data extractor. Given a doctor's response to a patient, extract any health events mentioned.

Return ONLY valid JSON with this structure:
{
  "health_events": [
    {
      "event_type": "symptom|diagnosis|medication|test_result|other",
      "title": "short title (max 80 chars)",
      "description": "brief description",
      "severity": "mild|moderate|severe|null"
    }
  ]
}

Rules:
- event_type must be exactly one of: symptom, diagnosis, medication, test_result, other
- severity is null if not clearly stated
- Only extract concrete medical facts, not general advice
- Return {"health_events": []} if nothing specific is mentioned
- Do NOT include follow-up recommendations as events

Doctor's response:
"""

async def extract_events(client: anthropic.Anthropic, text: str) -> list[dict]:
    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=800,
            messages=[{"role": "user", "content": EXTRACT_PROMPT + text[:3000]}],
        )
        raw = response.content[0].text.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        return data.get("health_events", [])
    except Exception as e:
        print(f"  [skip] extraction failed: {e}")
        return []


async def main():
    db = get_supabase()
    anthropic_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    print("Fetching all assistant messages...")
    result = (
        db.table("messages")
        .select("id, chat_id, user_id, content, created_at")
        .eq("role", "assistant")
        .order("created_at", desc=False)
        .execute()
    )
    messages = result.data or []
    print(f"Found {len(messages)} assistant messages to process.")

    retry = "--retry" in sys.argv
    existing = db.table("health_events").select("chat_id").execute()
    already_processed = set() if retry else {row["chat_id"] for row in (existing.data or [])}
    print(f"{'Retry mode — reprocessing all' if retry else f'Skipping {len(already_processed)} chats already processed.'}")

    inserted_total = 0
    for i, msg in enumerate(messages):
        chat_id = msg["chat_id"]
        if chat_id in already_processed:
            continue

        content = msg.get("content", "")
        # Skip very short messages and system markers
        if len(content) < 100 or content.startswith("__"):
            continue

        print(f"[{i+1}/{len(messages)}] chat={chat_id[:8]}... ", end="", flush=True)
        events = await extract_events(anthropic_client, content)

        if not events:
            print("no events")
            continue

        rows = []
        for ev in events:
            rows.append({
                "user_id": msg["user_id"],
                "chat_id": chat_id,
                "event_type": ev.get("event_type", "other"),
                "title": (ev.get("title") or "")[:120],
                "description": ev.get("description") or "",
                "severity": ev.get("severity") if ev.get("severity") != "null" else None,
                "occurred_at": msg["created_at"],
            })

        db.table("health_events").insert(rows).execute()
        inserted_total += len(rows)
        already_processed.add(chat_id)
        print(f"inserted {len(rows)} event(s)")

        # Small delay to avoid Anthropic rate limits
        await asyncio.sleep(0.3)

    print(f"\nDone. Inserted {inserted_total} health events total.")


if __name__ == "__main__":
    asyncio.run(main())
