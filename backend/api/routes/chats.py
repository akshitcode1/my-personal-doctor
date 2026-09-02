from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.api.dependencies import get_current_user
from backend.services import chat_service

router = APIRouter()


class CreateChatRequest(BaseModel):
    title: str = "New Consultation"


class UpdateChatRequest(BaseModel):
    title: str


@router.get("/chats")
async def list_chats(user_id: str = Depends(get_current_user)):
    return await chat_service.get_chats(user_id)


@router.post("/chats", status_code=status.HTTP_201_CREATED)
async def create_chat(body: CreateChatRequest, user_id: str = Depends(get_current_user)):
    return await chat_service.create_chat(user_id, body.title)


@router.get("/chats/{chat_id}")
async def get_chat(chat_id: str, user_id: str = Depends(get_current_user)):
    chat = await chat_service.get_chat(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.patch("/chats/{chat_id}")
async def update_chat(chat_id: str, body: UpdateChatRequest, user_id: str = Depends(get_current_user)):
    chat = await chat_service.update_chat_title(chat_id, user_id, body.title)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.delete("/chats/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(chat_id: str, user_id: str = Depends(get_current_user)):
    await chat_service.delete_chat(chat_id, user_id)
