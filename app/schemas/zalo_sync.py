from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel

class ZaloMessageItem(BaseModel):
    sender_name: str
    content: str
    report_date: Optional[date] = None
    reported_time: Optional[str] = None # e.g. "09:30" or ISO format

class ZaloSyncPayload(BaseModel):
    group_name: str
    messages: List[ZaloMessageItem]

class ZaloSyncResponse(BaseModel):
    success: bool
    group_id: int
    group_name: str
    total_received: int
    added_count: int
    duplicate_count: int
    new_members: List[str]
    message: str
