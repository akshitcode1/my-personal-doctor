import json
from typing import Optional
from backend.services.supabase_client import get_supabase
from backend.services.chat_service import touch_chat


async def save_message(
    chat_id: str,
    user_id: str,
    role: str,
    content: str,
    selected_specialists: Optional[list[str]] = None,
    specialist_responses: Optional[list[dict]] = None,
) -> dict:
    sb = get_supabase()
    payload: dict = {
        "chat_id": chat_id,
        "user_id": user_id,
        "role": role,
        "content": content,
    }
    if selected_specialists:
        payload["selected_specialists"] = selected_specialists
    if specialist_responses:
        payload["specialist_responses"] = json.dumps(specialist_responses)
    result = sb.table("messages").insert(payload).execute()
    await touch_chat(chat_id)
    return result.data[0]


async def get_messages(chat_id: str) -> list[dict]:
    sb = get_supabase()
    result = (
        sb.table("messages")
        .select("*")
        .eq("chat_id", chat_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data
