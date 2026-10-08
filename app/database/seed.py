from sqlalchemy.orm import Session
from app.models.group import Group
from app.models.member import Member
from app.models.report import Report

def seed_data(db: Session):
    """
    Idempotent seed data: Configure the 2 actual target groups.
    Keep members and reports clean for real production/personal usage.
    """
    target_groups = [
        {
            "id": 1,
            "name": "Báo Cáo Leader_Dev & Game",
            "description": "Nhóm báo cáo tiến độ dành cho Leader Dev & Game",
            "active": True
        },
        {
            "id": 2,
            "name": "Game Dev Intern - 8/2026",
            "description": "Nhóm báo cáo công việc thực tập sinh Game Dev - Tháng 8/2026",
            "active": True
        },
    ]

    for g_info in target_groups:
        existing = db.query(Group).filter(Group.id == g_info["id"]).first()
        if not existing:
            group = Group(
                id=g_info["id"],
                name=g_info["name"],
                description=g_info["description"],
                active=g_info["active"]
            )
            db.add(group)
        else:
            existing.name = g_info["name"]
            existing.description = g_info["description"]
            existing.active = g_info["active"]
    db.commit()

    print(f"Groups initialized: {db.query(Group).count()} groups")
