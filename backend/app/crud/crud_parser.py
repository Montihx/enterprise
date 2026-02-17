from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.models.parser import ParserSettings, ParserJob, ScheduledParserJob, ParserConflict, ParserJobLog
from app.schemas.parser import (
    ParserSettingsCreate, ParserSettingsUpdate, 
    ParserJobCreate, ParserJobUpdate,
    ScheduledJobCreate, ScheduledJobUpdate,
    ParserConflictCreate, ParserConflictUpdate,
    ParserJobLogCreate
)

class CRUDParserSettings:
    async def get_by_category(self, db: AsyncSession, category: str) -> Optional[ParserSettings]:
        result = await db.execute(select(ParserSettings).filter(ParserSettings.category == category))
        return result.scalars().first()

    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[ParserSettings]:
        result = await db.execute(select(ParserSettings).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: Union[ParserSettingsCreate, Dict[str, Any]]) -> ParserSettings:
        if isinstance(obj_in, dict):
            data = obj_in
        else:
            data = obj_in.model_dump()
        db_obj = ParserSettings(**data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: ParserSettings, obj_in: Union[ParserSettingsUpdate, Dict[str, Any]]
    ) -> ParserSettings:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

class CRUDParserJob:
    async def get(self, db: AsyncSession, id: UUID) -> Optional[ParserJob]:
        result = await db.execute(select(ParserJob).filter(ParserJob.id == id))
        return result.scalars().first()

    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[ParserJob]:
        query = select(ParserJob).order_by(desc(ParserJob.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: ParserJobCreate) -> ParserJob:
        db_obj = ParserJob(
            parser_name=obj_in.parser_name,
            job_type=obj_in.job_type,
            status="pending",
            progress=0
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: ParserJob, obj_in: ParserJobUpdate
    ) -> ParserJob:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

class CRUDParserJobLog:
    async def get_multi_by_job(
        self, db: AsyncSession, *, job_id: UUID, skip: int = 0, limit: int = 500
    ) -> List[ParserJobLog]:
        query = (
            select(ParserJobLog)
            .filter(ParserJobLog.parser_job_id == job_id)
            .order_by(desc(ParserJobLog.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[ParserJobLog]:
        query = select(ParserJobLog).order_by(desc(ParserJobLog.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: ParserJobLogCreate) -> ParserJobLog:
        db_obj = ParserJobLog(**obj_in.model_dump())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

class CRUDScheduledJob:
    async def get(self, db: AsyncSession, id: UUID) -> Optional[ScheduledParserJob]:
        result = await db.execute(select(ScheduledParserJob).filter(ScheduledParserJob.id == id))
        return result.scalars().first()

    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[ScheduledParserJob]:
        result = await db.execute(select(ScheduledParserJob).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: ScheduledJobCreate) -> ScheduledParserJob:
        next_run = datetime.utcnow() + timedelta(hours=1)
        
        db_obj = ScheduledParserJob(
            parser_name=obj_in.parser_name,
            job_type=obj_in.job_type,
            cron_expression=obj_in.cron_expression,
            is_active=obj_in.is_active,
            next_run_at=next_run
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: ScheduledParserJob, obj_in: ScheduledJobUpdate
    ) -> ScheduledParserJob:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: UUID) -> ScheduledParserJob:
        result = await db.execute(select(ScheduledParserJob).filter(ScheduledParserJob.id == id))
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
        return db_obj

class CRUDParserConflict:
    async def get(self, db: AsyncSession, id: UUID) -> Optional[ParserConflict]:
        result = await db.execute(select(ParserConflict).filter(ParserConflict.id == id))
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, status: str = 'pending'
    ) -> List[ParserConflict]:
        query = select(ParserConflict)
        if status:
            query = query.filter(ParserConflict.status == status)
        query = query.order_by(desc(ParserConflict.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: ParserConflictCreate) -> ParserConflict:
        db_obj = ParserConflict(**obj_in.model_dump())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: ParserConflict, obj_in: ParserConflictUpdate
    ) -> ParserConflict:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

parser_settings = CRUDParserSettings()
parser_job = CRUDParserJob()
parser_job_log = CRUDParserJobLog()
scheduled_job = CRUDScheduledJob()
parser_conflict = CRUDParserConflict()