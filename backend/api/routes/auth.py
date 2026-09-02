from fastapi import APIRouter, Depends
from backend.api.dependencies import get_current_user
from backend.services.supabase_client import get_supabase

router = APIRouter()


@router.get("/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("profiles").select("*").eq("id", user_id).single().execute()
    return result.data


@router.post("/auth/verify")
async def verify_token(user_id: str = Depends(get_current_user)):
    return {"user_id": user_id, "valid": True}
