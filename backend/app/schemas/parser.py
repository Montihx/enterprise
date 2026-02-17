from typing import Optional, Dict, Any, List, Union
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# --- Specific Config Schemas ---

class GeneralConfig(BaseModel):
    shikimori_api_domain: str = "https://shikimori.one/"
    proxy_enabled: bool = False
    proxy_address: Optional[str] = None
    proxy_port: Optional[str] = None
    proxy_user: Optional[str] = None
    proxy_pass: Optional[str] = None
    admin_path_pattern: str = "/admin.php"
    kodik_api_key: Optional[str] = None
    cron_key: Optional[str] = None
    user_agent: str = "KitsuEngine/2.0 (Python/3.12)"

class NotificationConfig(BaseModel):
    email_notifications: bool = False
    admin_email: str = ""
    webhook_enabled: bool = False
    webhook_url: str = ""
    notify_on_success: bool = False
    notify_on_error: bool = True
    notify_on_conflict: bool = True
    summary_report: str = "weekly"

class AdvancedConfig(BaseModel):
    async_semaphores: int = 5
    request_delay_ms: int = 200
    fuzzy_threshold: float = 0.85
    debug_logs: bool = False
    deep_sync_pages: int = 50
    force_reprocess_media: bool = False

class BlacklistConfig(BaseModel):
    banned_ids: str = ""
    banned_genres: str = "Hentai, Yaoi, Yuri, Boys Love, Girls Love, Shounen Ai"
    banned_keywords: str = "camrip, ts, gambling, official stream only"

# --- Parser Settings ---
class ParserSettingsBase(BaseModel):
    category: str
    description: Optional[str] = None
    config: Dict[str, Any]

class ParserSettingsCreate(ParserSettingsBase):
    pass

class ParserSettingsUpdate(BaseModel):
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class ParserSettings(ParserSettingsBase):
    id: UUID
    updated_at: datetime
    updated_by: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)

# --- Parser Jobs ---
class ParserJobBase(BaseModel):
    parser_name: str
    job_type: str

class ParserJobCreate(ParserJobBase):
    pass

class ParserJobUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None
    items_processed: Optional[int] = None
    items_created: Optional[int] = None
    items_updated: Optional[int] = None
    items_skipped: Optional[int] = None
    items_failed: Optional[int] = None
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None

class ParserJob(ParserJobBase):
    id: UUID
    status: str
    progress: int
    
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    
    items_processed: int
    items_created: int
    items_failed: int
    items_skipped: int = 0
    items_updated: int = 0
    
    error_message: Optional[str] = None
    
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Parser Job Logs ---
class ParserJobLogBase(BaseModel):
    level: str
    message: str
    details: Optional[Dict[str, Any]] = None
    item_type: Optional[str] = None
    item_id: Optional[str] = None

class ParserJobLogCreate(ParserJobLogBase):
    parser_job_id: UUID

class ParserJobLog(ParserJobLogBase):
    id: UUID
    parser_job_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Scheduled Jobs ---
class ScheduledJobBase(BaseModel):
    parser_name: str
    job_type: str
    cron_expression: str
    is_active: bool = True

class ScheduledJobCreate(ScheduledJobBase):
    pass

class ScheduledJobUpdate(BaseModel):
    parser_name: Optional[str] = None
    job_type: Optional[str] = None
    cron_expression: Optional[str] = None
    is_active: Optional[bool] = None

class ScheduledJob(ScheduledJobBase):
    id: UUID
    last_run_at: Optional[datetime] = None
    next_run_at: datetime
    created_at: datetime
    created_by: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)

# --- Conflicts ---
class ParserConflictBase(BaseModel):
    conflict_type: str
    item_type: str
    external_id: Optional[str] = None
    existing_data: Optional[Dict[str, Any]] = None
    incoming_data: Optional[Dict[str, Any]] = None

class ParserConflictCreate(ParserConflictBase):
    parser_job_id: UUID
    item_id: Optional[UUID] = None

class ParserConflictUpdate(BaseModel):
    status: str
    resolution_strategy: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[UUID] = None

class ParserConflict(ParserConflictBase):
    id: UUID
    parser_job_id: UUID
    item_id: Optional[UUID] = None
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ResolveConflictRequest(BaseModel):
    strategy: str # 'replace', 'ignore'

# --- Live Search & Fetch ---
class SearchQuery(BaseModel):
    query: str

class FetchFullQuery(BaseModel):
    kodik_id: Optional[str] = None
    shikimori_id: Optional[str] = None
