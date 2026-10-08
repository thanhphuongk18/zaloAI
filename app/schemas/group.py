from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    active: bool = True

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class GroupResponse(GroupBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
