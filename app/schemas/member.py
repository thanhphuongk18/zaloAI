from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class MemberBase(BaseModel):
    name: str
    active: bool = True

class MemberCreate(MemberBase):
    pass

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None

class MemberResponse(MemberBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
