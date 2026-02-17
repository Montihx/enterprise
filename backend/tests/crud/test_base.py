import pytest
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import Base
from app.crud.base import CRUDBase
from pydantic import BaseModel
import uuid

# Test Model
class TestModel(Base):
    __tablename__ = "test_crud_base"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(nullable=False)

class TestCreate(BaseModel):
    name: str

class TestUpdate(BaseModel):
    name: str

crud_test = CRUDBase[TestModel, TestCreate, TestUpdate](TestModel)

@pytest.mark.asyncio
async def test_crud_base_workflow(db_session: AsyncSession):
    # Setup table for test
    async with db_session.bind.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 1. Create
    obj_in = TestCreate(name="Original")
    db_obj = await crud_test.create(db_session, obj_in=obj_in)
    assert db_obj.name == "Original"
    assert isinstance(db_obj.id, uuid.UUID)

    # 2. Get
    found = await crud_test.get(db_session, id=db_obj.id)
    assert found.name == "Original"

    # 3. Update
    obj_update = TestUpdate(name="Updated")
    updated = await crud_test.update(db_session, db_obj=db_obj, obj_in=obj_update)
    assert updated.name == "Updated"

    # 4. Remove
    removed = await crud_test.remove(db_session, id=db_obj.id)
    assert removed.id == db_obj.id
    
    check = await crud_test.get(db_session, id=db_obj.id)
    assert check is None
