from fastapi import APIRouter, Depends, HTTPException

from backend.api.dependencies import get_current_user
from backend.services import chat_service, message_service

router = APIRouter()


@router.get("/chats/{chat_id}/messages")
async def get_messages(chat_id: str, user_id: str = Depends(get_current_user)):
    chat = await chat_service.get_chat(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return await message_service.get_messages(chat_id)
