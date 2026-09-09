from datetime import datetime, timezone

from backend.services.supabase_client import get_supabase


async def create_health_events(user_id: str, chat_id: str, events: list[dict]) -> None:
    if not events:
        return
    db = get_supabase()
    rows = []
    for ev in events:
        rows.append({
            "user_id": user_id,
            "chat_id": chat_id,
            "event_type": ev.get("event_type", "other"),
            "title": (ev.get("title") or "")[:120],
            "description": ev.get("description") or "",
            "severity": ev.get("severity") or None,
            "occurred_at": datetime.now(timezone.utc).isoformat(),
        })
    db.table("health_events").insert(rows).execute()


async def get_health_timeline(user_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
    db = get_supabase()
    result = (
        db.table("health_events")
        .select("*")
        .eq("user_id", user_id)
        .order("occurred_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


async def get_health_summary(user_id: str) -> dict:
    events = await get_health_timeline(user_id, limit=200)
    by_type: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    for ev in events:
        t = ev.get("event_type", "other")
        by_type[t] = by_type.get(t, 0) + 1
        s = ev.get("severity")
        if s:
            by_severity[s] = by_severity.get(s, 0) + 1
    return {
        "total": len(events),
        "by_type": by_type,
        "by_severity": by_severity,
        "recent": events[:5],
    }
