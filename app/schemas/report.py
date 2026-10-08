from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ReportBase(BaseModel):
    group_id: int
    member_id: int
    content: str
    report_date: date
    reported_at: Optional[datetime] = None

class ReportCreate(ReportBase):
    pass

class ReportUpdate(BaseModel):
    group_id: Optional[int] = None
    member_id: Optional[int] = None
    content: Optional[str] = None
    report_date: Optional[date] = None
    reported_at: Optional[datetime] = None

class ReportResponse(ReportBase):
    id: int
    group_name: Optional[str] = None
    member_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
