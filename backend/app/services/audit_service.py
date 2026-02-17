from typing import Any, Dict, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system import AuditLog
from app.core.logging import logger

class AuditService:
    async def log_action(
        self,
        db: AsyncSession,
        *,
        actor_id: Optional[UUID],
        action: str,
        resource_type: str,
        resource_id: Optional[UUID] = None,
        meta: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ):
        """
        Record a system or administrative action for forensic analysis.
        """
        try:
            entry = AuditLog(
                actor_id=actor_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                meta_info=meta or {},
                success=success,
                error_message=error_message
            )
            db.add(entry)
            await db.commit()
            
            logger.info(
                "Audit: Action Recorded",
                action=action,
                resource=resource_type,
                success=success
            )
        except Exception as e:
            logger.error("Audit Service: Storage Failure", error=str(e))

audit_service = AuditService()
