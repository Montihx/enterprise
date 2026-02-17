
from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud.crud_role import role as crud_role
from app.schemas.role import Role

router = APIRouter()

@router.get("/", response_model=List[Role])
async def read_roles(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve roles.
    """
    roles = await crud_role.get_multi(db, skip=skip, limit=limit)
    return roles
