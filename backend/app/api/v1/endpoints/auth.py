from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud.crud_user import user as crud_user
from app.schemas.token import Token, TokenPayload, RefreshTokenRequest
from app.schemas.user import UserCreate, User
from app.services.audit_service import audit_service
from app.main import limiter

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
@limiter.limit("5/minute")
async def login_access_token(
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login. Rate limited to protect against brute force.
    """
    user = await crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    
    if not user:
        await audit_service.log_action(
            db, actor_id=None, action="login_fail", resource_type="auth", 
            meta={"email": form_data.username, "ip": request.client.host if request.client else "unknown"},
            success=False, error_message="Incorrect credentials"
        )
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    await audit_service.log_action(db, actor_id=user.id, action="login_success", resource_type="auth")
    
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "refresh_token": security.create_refresh_token(
            user.id, expires_delta=refresh_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=User)
@limiter.limit("3/hour")
async def register_user(
    *,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user. Rate limited to prevent mass registration.
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="User with this email exists")
    user = await crud_user.get_by_username(db, username=user_in.username)
    if user:
         raise HTTPException(status_code=400, detail="User with this username exists")
        
    user = await crud_user.create(db, obj_in=user_in)
    await audit_service.log_action(db, actor_id=user.id, action="register", resource_type="user", resource_id=user.id)
    return user

@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    request_data: RefreshTokenRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Consume a refresh token to generate a new access/refresh pair.
    Token must be provided in the request body for security.
    Ensures the cryptographic 'type' claim is 'refresh'.
    """
    try:
        payload = jwt.decode(
            request_data.refresh_token, 
            settings.SECRET_KEY, 
            algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Invalid token type: refresh token required"
            )
    except (JWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Refresh token expired or invalid signature"
        )
    
    user = await crud_user.get(db, id=token_data.sub)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User associated with token is inactive or purged")
        
    return {
        "access_token": security.create_access_token(user.id),
        "refresh_token": security.create_refresh_token(user.id),
        "token_type": "bearer",
    }