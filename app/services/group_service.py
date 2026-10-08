from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.group import Group
from app.repositories.group_repository import GroupRepository
from app.schemas.group import GroupCreate, GroupUpdate

class GroupService:
    @staticmethod
    def list_groups(db: Session, active_only: bool = False) -> List[Group]:
        return GroupRepository.get_all(db, active_only=active_only)

    @staticmethod
    def get_group(db: Session, group_id: int) -> Group:
        group = GroupRepository.get_by_id(db, group_id)
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        return group

    @staticmethod
    def create_group(db: Session, group_in: GroupCreate) -> Group:
        existing = GroupRepository.get_by_name(db, group_in.name)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group name already exists")
        group = Group(
            name=group_in.name,
            description=group_in.description,
            active=group_in.active
        )
        return GroupRepository.create(db, group)

    @staticmethod
    def update_group(db: Session, group_id: int, group_in: GroupUpdate) -> Group:
        group = GroupService.get_group(db, group_id)
        if group_in.name is not None and group_in.name != group.name:
            existing = GroupRepository.get_by_name(db, group_in.name)
            if existing and existing.id != group_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group name already exists")
            group.name = group_in.name
        if group_in.description is not None:
            group.description = group_in.description
        if group_in.active is not None:
            group.active = group_in.active
        return GroupRepository.update(db, group)

    @staticmethod
    def delete_group(db: Session, group_id: int) -> dict:
        group = GroupService.get_group(db, group_id)
        # Soft delete by setting active=False to preserve report relations
        group.active = False
        GroupRepository.update(db, group)
        return {"message": "Group deactivated successfully"}
