from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.member import MemberCreate, MemberUpdate, MemberResponse
from app.services.member_service import MemberService

router = APIRouter()

@router.get("", response_model=List[MemberResponse])
def get_members(active_only: bool = Query(False), db: Session = Depends(get_db)):
    return MemberService.list_members(db, active_only=active_only)

@router.get("/{id}", response_model=MemberResponse)
def get_member(id: int, db: Session = Depends(get_db)):
    return MemberService.get_member(db, id)

@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(member_in: MemberCreate, db: Session = Depends(get_db)):
    return MemberService.create_member(db, member_in)

@router.put("/{id}", response_model=MemberResponse)
def update_member(id: int, member_in: MemberUpdate, db: Session = Depends(get_db)):
    return MemberService.update_member(db, id, member_in)

@router.delete("/{id}")
def delete_member(id: int, db: Session = Depends(get_db)):
    return MemberService.delete_member(db, id)
