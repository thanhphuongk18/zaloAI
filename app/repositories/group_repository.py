from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.group import Group

class GroupRepository:
    @staticmethod
    def get_all(db: Session, active_only: bool = False) -> List[Group]:
        query = db.query(Group)
        if active_only:
            query = query.filter(Group.active == True)
        return query.order_by(Group.id.asc()).all()

    @staticmethod
    def get_by_id(db: Session, group_id: int) -> Optional[Group]:
        return db.query(Group).filter(Group.id == group_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Group]:
        return db.query(Group).filter(Group.name == name).first()

    @staticmethod
    def create(db: Session, group: Group) -> Group:
        db.add(group)
        db.commit()
        db.refresh(group)
        return group

    @staticmethod
    def update(db: Session, group: Group) -> Group:
        db.commit()
        db.refresh(group)
        return group

    @staticmethod
    def delete(db: Session, group: Group) -> None:
        db.delete(group)
        db.commit()
