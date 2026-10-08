from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.member import Member

class MemberRepository:
    @staticmethod
    def get_all(db: Session, active_only: bool = False) -> List[Member]:
        query = db.query(Member)
        if active_only:
            query = query.filter(Member.active == True)
        return query.order_by(Member.name.asc()).all()

    @staticmethod
    def get_by_id(db: Session, member_id: int) -> Optional[Member]:
        return db.query(Member).filter(Member.id == member_id).first()

    @staticmethod
    def create(db: Session, member: Member) -> Member:
        db.add(member)
        db.commit()
        db.refresh(member)
        return member

    @staticmethod
    def update(db: Session, member: Member) -> Member:
        db.commit()
        db.refresh(member)
        return member

    @staticmethod
    def delete(db: Session, member: Member) -> None:
        db.delete(member)
        db.commit()
