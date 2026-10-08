from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.group import GroupCreate, GroupUpdate, GroupResponse
from app.services.group_service import GroupService

router = APIRouter()

@router.get("", response_model=List[GroupResponse])
def get_groups(active_only: bool = Query(False), db: Session = Depends(get_db)):
    return GroupService.list_groups(db, active_only=active_only)

@router.get("/{id}", response_model=GroupResponse)
def get_group(id: int, db: Session = Depends(get_db)):
    return GroupService.get_group(db, id)

@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(group_in: GroupCreate, db: Session = Depends(get_db)):
    return GroupService.create_group(db, group_in)

@router.put("/{id}", response_model=GroupResponse)
def update_group(id: int, group_in: GroupUpdate, db: Session = Depends(get_db)):
    return GroupService.update_group(db, id, group_in)

@router.delete("/{id}")
def delete_group(id: int, db: Session = Depends(get_db)):
    return GroupService.delete_group(db, id)
