from fastapi import Header, HTTPException, status
from backend.services.supabase_client import get_supabase


def _verify_token(token: str) -> str:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token")
    try:
        supabase = get_supabase()
        response = supabase.auth.get_user(token)
        user_id = response.user.id if response.user else None
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    token = authorization.removeprefix("Bearer ").strip()
    return _verify_token(token)


async def verify_ws_token(token: str) -> str | None:
    try:
        return _verify_token(token)
    except HTTPException:
        return None
