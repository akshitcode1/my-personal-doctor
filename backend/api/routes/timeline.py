from fastapi import APIRouter, Depends

from backend.api.dependencies import get_current_user
from backend.services.timeline_service import get_health_timeline, get_health_summary

router = APIRouter()


@router.get("/health-timeline")
async def health_timeline(
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user),
):
    events = await get_health_timeline(user_id, limit=limit, offset=offset)
    return {"events": events, "limit": limit, "offset": offset}


@router.get("/health-summary")
async def health_summary(user_id: str = Depends(get_current_user)):
    return await get_health_summary(user_id)
