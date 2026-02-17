from typing import List, Optional, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.core.config import settings
from app.crud.crud_user import user as crud_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import TokenPayload
from app.services.audit_service import audit_service

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.type != "access":
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    user = await crud_user.get(db, id=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Insufficient elevated privileges"
        )
    return current_user

def check_permissions(required_permissions: List[str]):
    """
    Dependency factory for checking granular permissions.
    Supports wildcards (e.g., 'content.*').
    """
    async def _permission_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.is_superuser:
            return current_user
            
        user_permissions = current_user.role.permissions if current_user.role else []
        if "*" in user_permissions:
            return current_user
            
        for req in required_permissions:
            # Check for exact match or wildcard match
            match = any(
                p == req or (p.endswith(".*") and req.startswith(p[:-2]))
                for p in user_permissions
            )
            if not match:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Resource Locked: Missing permission [{req}]"
                )
        return current_user
    return _permission_checker

def audit_trail(action: str, resource_type: str):
    """
    Automated audit trail dependency for administrative mutations.
    Ensures every change is logged before the endpoint logic executes.
    """
    async def _audit_hook(
        request: Request,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_active_superuser)
    ) -> User:
        await audit_service.log_action(
            db, 
            actor_id=current_user.id, 
            action=action, 
            resource_type=resource_type,
            actor_ip=request.client.host if request.client else None,
            meta={"path": request.url.path, "method": request.method}
        )
        return current_user
    return _audit_hook
