
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.schemas.role import Role

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False
    full_name: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str

# Properties to receive via API on update (Self)
class UserUpdate(UserBase):
    password: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

# Properties to receive via API on update (Admin)
class UserAdminUpdate(UserBase):
    role_id: Optional[UUID] = None
    is_verified: Optional[bool] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDBBase(UserBase):
    id: UUID
    created_at: datetime
    role_id: Optional[UUID] = None
    role: Optional[Role] = None  # Include full role object

    model_config = ConfigDict(from_attributes=True)

# Additional properties to return via API
class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
