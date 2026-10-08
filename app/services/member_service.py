from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.member import Member
from app.repositories.member_repository import MemberRepository
from app.schemas.member import MemberCreate, MemberUpdate

class MemberService:
    @staticmethod
    def list_members(db: Session, active_only: bool = False) -> List[Member]:
        return MemberRepository.get_all(db, active_only=active_only)

    @staticmethod
    def get_member(db: Session, member_id: int) -> Member:
        member = MemberRepository.get_by_id(db, member_id)
        if not member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
        return member

    @staticmethod
    def create_member(db: Session, member_in: MemberCreate) -> Member:
        member = Member(
            name=member_in.name,
            active=member_in.active
        )
        return MemberRepository.create(db, member)

    @staticmethod
    def update_member(db: Session, member_id: int, member_in: MemberUpdate) -> Member:
        member = MemberService.get_member(db, member_id)
        if member_in.name is not None:
            member.name = member_in.name
        if member_in.active is not None:
            member.active = member_in.active
        return MemberRepository.update(db, member)

    @staticmethod
    def delete_member(db: Session, member_id: int) -> dict:
        member = MemberService.get_member(db, member_id)
        # Soft delete by setting active=False to preserve historic reports
        member.active = False
        MemberRepository.update(db, member)
        return {"message": "Member deactivated successfully"}
