from fastapi import APIRouter, Depends, HTTPException

from backend.api.dependencies import get_current_user
from backend.services.followup_service import (
    get_pending_follow_ups,
    dismiss_follow_up,
    resolve_follow_up,
)

router = APIRouter()


@router.get("/follow-ups")
async def list_follow_ups(user_id: str = Depends(get_current_user)):
    items = await get_pending_follow_ups(user_id)
    return {"follow_ups": items}


@router.post("/follow-ups/{follow_up_id}/dismiss")
async def dismiss(follow_up_id: str, user_id: str = Depends(get_current_user)):
    await dismiss_follow_up(follow_up_id, user_id)
    return {"status": "dismissed"}


@router.post("/follow-ups/{follow_up_id}/resolve")
async def resolve(follow_up_id: str, user_id: str = Depends(get_current_user)):
    await resolve_follow_up(follow_up_id, user_id)
    return {"status": "resolved"}
