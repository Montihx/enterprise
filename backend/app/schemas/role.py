
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    pass

class Role(RoleBase):
    id: UUID
    
    model_config = ConfigDict(from_attributes=True)
