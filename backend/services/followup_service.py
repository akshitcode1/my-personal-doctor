from datetime import datetime, timezone
from typing import Optional

from backend.services.supabase_client import get_supabase


async def create_follow_up(
    user_id: str,
    chat_id: str,
    question: str,
    scheduled_for: str,
    urgency: str = "normal",
    message_summary: str = "",
) -> Optional[str]:
    db = get_supabase()
    result = (
        db.table("follow_up_schedule")
        .insert({
            "user_id": user_id,
            "chat_id": chat_id,
            "follow_up_question": question[:500],
            "message_summary": message_summary[:300],
            "scheduled_for": scheduled_for,
            "urgency": urgency,
            "status": "pending",
        })
        .execute()
    )
    rows = result.data or []
    return rows[0]["id"] if rows else None


async def get_pending_follow_ups(user_id: str) -> list[dict]:
    db = get_supabase()
    result = (
        db.table("follow_up_schedule")
        .select("*, chats(title)")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .order("scheduled_for", desc=False)
        .execute()
    )
    return result.data or []


async def get_due_follow_ups(user_id: str) -> list[dict]:
    db = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    result = (
        db.table("follow_up_schedule")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .lte("scheduled_for", now)
        .execute()
    )
    return result.data or []


async def dismiss_follow_up(follow_up_id: str, user_id: str) -> None:
    db = get_supabase()
    db.table("follow_up_schedule").update({"status": "dismissed"}).eq("id", follow_up_id).eq("user_id", user_id).execute()


async def resolve_follow_up(follow_up_id: str, user_id: str) -> None:
    db = get_supabase()
    db.table("follow_up_schedule").update({"status": "resolved"}).eq("id", follow_up_id).eq("user_id", user_id).execute()
