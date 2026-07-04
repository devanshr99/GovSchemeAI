from typing import Optional
from fastapi import APIRouter, Depends, Query, Header, HTTPException, status

from app.routers.dashboard import verify_admin
from app.services.security_hardener import security_hardener

router = APIRouter(prefix="/api/admin", tags=["Security Hardening"])


@router.post("/logout")
async def logout_admin(
    token: Optional[str] = Query(None),
    x_admin_token: Optional[str] = Header(None)
):
    """
    Invalidates the current admin token session by adding it to the blacklist.
    """
    active_token = token or x_admin_token
    if not active_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing auth token to invalidate."
        )

    # Validate token is active before blacklisting
    await verify_admin(token=token, x_admin_token=x_admin_token)

    # Invalidate
    security_hardener.blacklist_token(active_token)
    return {
        "status": "success",
        "message": "Token invalidated. Session logged out successfully."
    }
