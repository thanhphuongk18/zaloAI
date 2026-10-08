from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class DashboardReportItem(BaseModel):
    id: int
    member_id: int
    member_name: str
    content: str
    reported_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DashboardGroupItem(BaseModel):
    group_id: int
    group_name: str
    description: Optional[str] = None
    reports: List[DashboardReportItem]

    model_config = ConfigDict(from_attributes=True)

class DashboardMemberItem(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class DashboardDailyResponse(BaseModel):
    date: date
    total_members: int
    reported_members: int
    unreported_members: int
    total_reports: int
    groups: List[DashboardGroupItem]
    unreported_member_list: List[DashboardMemberItem]

    model_config = ConfigDict(from_attributes=True)
