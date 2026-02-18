from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, Query
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError

from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud.crud_user import user as crud_user
from app.schemas.token import Token, TokenPayload, RefreshTokenRequest
from app.schemas.user import UserCreate, User
from app.services.audit_service import audit_service
from app.services.email_service import (
    email_service,
    generate_verification_token,
    generate_reset_token,
    verify_reset_token,
    verify_verification_token,
)
from app.core.limiter import limiter

router = APIRouter()


# ─── Schemas ────────────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    user_id: str
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ─── Login ──────────────────────────────────────────────────────────────────

@router.post("/login/access-token", response_model=Token)
@limiter.limit("5/minute")
async def login_access_token(
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """OAuth2 compatible token login. Rate limited to 5/min per IP."""
    user = await crud_user.authenticate(db, email=form_data.username, password=form_data.password)

    if not user:
        await audit_service.log_action(
            db, actor_id=None, action="login_fail", resource_type="auth",
            meta={"email": form_data.username, "ip": request.client.host if request.client else "unknown"},
            success=False, error_message="Incorrect credentials",
        )
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    await audit_service.log_action(db, actor_id=user.id, action="login_success", resource_type="auth")

    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(user.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
    }


# ─── Register ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=User)
@limiter.limit("3/hour")
async def register_user(
    *,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """Create new user. Rate limited to 3/hour. Sends verification email."""
    existing = await crud_user.get_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email exists")
    existing = await crud_user.get_by_username(db, username=user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="User with this username exists")

    user = await crud_user.create(db, obj_in=user_in)
    await audit_service.log_action(db, actor_id=user.id, action="register", resource_type="user", resource_id=user.id)

    # Send verification email (non-blocking — failure doesn't abort registration)
    try:
        token = generate_verification_token(str(user.id), user.email)
        email_service.send_verification(user.email, user.username, token, str(user.id))
    except Exception:
        pass  # Log but don't fail registration

    return user


# ─── Refresh Token ───────────────────────────────────────────────────────────

@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    request_data: RefreshTokenRequest,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Consume a refresh token to get a new access/refresh pair."""
    try:
        payload = jwt.decode(request_data.refresh_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = TokenPayload(**payload)
        if token_data.type != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type: refresh token required")
    except (JWTError, Exception):
        raise HTTPException(status_code=403, detail="Refresh token expired or invalid")

    user = await crud_user.get(db, id=token_data.sub)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found or inactive")

    return {
        "access_token": security.create_access_token(user.id),
        "refresh_token": security.create_refresh_token(user.id),
        "token_type": "bearer",
    }


# ─── Email Verification ──────────────────────────────────────────────────────

@router.post("/send-verification")
@limiter.limit("3/hour")
async def send_verification_email(
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
) -> Any:
    """Resend email verification link."""
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    token = generate_verification_token(str(current_user.id), current_user.email)
    email_service.send_verification(current_user.email, current_user.username, token, str(current_user.id))
    return {"message": "Verification email sent"}


@router.get("/verify-email")
async def verify_email(
    token: str = Query(...),
    uid: str = Query(...),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Verify email with token from verification link."""
    from uuid import UUID
    try:
        user_id = UUID(uid)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "Email already verified"}

    if not verify_verification_token(token, uid, user.email):
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    await crud_user.update(db, db_obj=user, obj_in={"is_verified": True})
    await audit_service.log_action(db, actor_id=user.id, action="email_verified", resource_type="user", resource_id=user.id)
    return {"message": "Email verified successfully"}


# ─── Password Reset ──────────────────────────────────────────────────────────

@router.post("/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Send password reset email. Always returns 200 to prevent email enumeration."""
    user = await crud_user.get_by_email(db, email=body.email)
    if user and user.is_active:
        token = generate_reset_token(str(user.id), user.hashed_password)
        email_service.send_password_reset(user.email, user.username, token, str(user.id))
    # Always return same response regardless of whether email exists
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
@limiter.limit("5/hour")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Reset password using token from email link."""
    from uuid import UUID
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    try:
        user_id = UUID(body.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await crud_user.get(db, id=user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid reset request")

    if not verify_reset_token(body.token, body.user_id, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    await crud_user.update(db, db_obj=user, obj_in={"password": body.new_password})
    await audit_service.log_action(db, actor_id=user.id, action="password_reset", resource_type="user", resource_id=user.id)
    return {"message": "Password updated successfully"}


# ─── Change Password (authenticated) ────────────────────────────────────────

@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
) -> Any:
    """Change password with current password verification."""
    if not security.verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from current")

    await crud_user.update(db, db_obj=current_user, obj_in={"password": body.new_password})
    await audit_service.log_action(
        db, actor_id=current_user.id, action="password_changed",
        resource_type="user", resource_id=current_user.id,
    )
    return {"message": "Password changed successfully"}
