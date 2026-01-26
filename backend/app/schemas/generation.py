from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from enum import Enum


class GenerationStatus(str, Enum):
    SCHEDULED = "scheduled"
    FETCHING = "fetching"
    GENERATING = "generating"
    COMPLETE = "complete"
    FAILED = "failed"


class GenerationLog(BaseModel):
    id: str
    user_id: str
    scheduled_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: GenerationStatus
    notebook_id: Optional[str] = None
    sources_used: Optional[Any] = None
    error_message: Optional[str] = None
