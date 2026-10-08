from datetime import date
from sqlalchemy.orm import Session
from app.repositories.group_repository import GroupRepository
from app.repositories.member_repository import MemberRepository
from app.repositories.report_repository import ReportRepository
from app.schemas.dashboard import (
    DashboardDailyResponse,
    DashboardGroupItem,
    DashboardReportItem,
    DashboardMemberItem
)

class DashboardService:
    @staticmethod
    def get_daily_dashboard(db: Session, target_date: date) -> DashboardDailyResponse:
        # 1. Get active groups and active members
        active_groups = GroupRepository.get_all(db, active_only=True)
        active_members = MemberRepository.get_all(db, active_only=True)

        # 2. Get all reports for the target date
        reports = ReportRepository.get_by_date(db, target_date)

        # Map reports by group_id
        reports_by_group = {g.id: [] for g in active_groups}
        reported_member_ids = set()

        for r in reports:
            reported_member_ids.add(r.member_id)
            item = DashboardReportItem(
                id=r.id,
                member_id=r.member_id,
                member_name=r.member.name if r.member else f"Member #{r.member_id}",
                content=r.content,
                reported_at=r.reported_at,
                created_at=r.created_at
            )
            if r.group_id in reports_by_group:
                reports_by_group[r.group_id].append(item)

        # Construct group items
        group_items = []
        for g in active_groups:
            group_items.append(DashboardGroupItem(
                group_id=g.id,
                group_name=g.name,
                description=g.description,
                reports=reports_by_group.get(g.id, [])
            ))

        # Identify unreported members
        unreported_members = [
            DashboardMemberItem(id=m.id, name=m.name)
            for m in active_members
            if m.id not in reported_member_ids
        ]

        total_members = len(active_members)
        reported_count = len(reported_member_ids)
        unreported_count = len(unreported_members)
        total_reports = len(reports)

        return DashboardDailyResponse(
            date=target_date,
            total_members=total_members,
            reported_members=reported_count,
            unreported_members=unreported_count,
            total_reports=total_reports,
            groups=group_items,
            unreported_member_list=unreported_members
        )
