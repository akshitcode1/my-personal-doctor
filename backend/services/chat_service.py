from typing import Optional
from backend.services.supabase_client import get_supabase


async def create_chat(user_id: str, title: str = "New Consultation") -> dict:
    sb = get_supabase()
    result = sb.table("chats").insert({"user_id": user_id, "title": title}).execute()
    return result.data[0]


async def get_chats(user_id: str) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table("chats")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data


async def get_chat(chat_id: str, user_id: str) -> Optional[dict]:
    sb = get_supabase()
    try:
        result = (
            sb.table("chats")
            .select("*")
            .eq("id", chat_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return result.data if result.data else None
    except Exception:
        return None


async def update_chat_title(chat_id: str, user_id: str, title: str) -> Optional[dict]:
    sb = get_supabase()
    result = (
        sb.table("chats")
        .update({"title": title})
        .eq("id", chat_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None


async def delete_chat(chat_id: str, user_id: str) -> bool:
    sb = get_supabase()
    sb.table("chats").delete().eq("id", chat_id).eq("user_id", user_id).execute()
    return True


async def touch_chat(chat_id: str) -> None:
    sb = get_supabase()
    from datetime import datetime, timezone
    sb.table("chats").update({"updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", chat_id).execute()
