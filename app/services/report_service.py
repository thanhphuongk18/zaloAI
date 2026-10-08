from datetime import datetime, date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.report import Report
from app.repositories.report_repository import ReportRepository
from app.repositories.group_repository import GroupRepository
from app.repositories.member_repository import MemberRepository
from app.schemas.report import ReportCreate, ReportUpdate, ReportResponse

class ReportService:
    @staticmethod
    def _to_response(report: Report) -> ReportResponse:
        return ReportResponse(
            id=report.id,
            group_id=report.group_id,
            member_id=report.member_id,
            group_name=report.group.name if report.group else None,
            member_name=report.member.name if report.member else None,
            content=report.content,
            report_date=report.report_date,
            reported_at=report.reported_at,
            created_at=report.created_at,
            updated_at=report.updated_at
        )

    @staticmethod
    def list_reports(
        db: Session,
        report_date: Optional[date] = None,
        group_id: Optional[int] = None,
        member_id: Optional[int] = None
    ) -> List[ReportResponse]:
        reports = ReportRepository.get_all(db, report_date=report_date, group_id=group_id, member_id=member_id)
        return [ReportService._to_response(r) for r in reports]

    @staticmethod
    def get_report(db: Session, report_id: int) -> ReportResponse:
        report = ReportRepository.get_by_id(db, report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
        return ReportService._to_response(report)

    @staticmethod
    def create_report(db: Session, report_in: ReportCreate) -> ReportResponse:
        group = GroupRepository.get_by_id(db, report_in.group_id)
        if not group or not group.active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Active Group not found")

        member = MemberRepository.get_by_id(db, report_in.member_id)
        if not member or not member.active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Active Member not found")

        reported_at = report_in.reported_at or datetime.utcnow()

        report = Report(
            group_id=report_in.group_id,
            member_id=report_in.member_id,
            content=report_in.content,
            report_date=report_in.report_date,
            reported_at=reported_at
        )
        saved = ReportRepository.create(db, report)
        # re-query to load relationships
        full_report = ReportRepository.get_by_id(db, saved.id)
        return ReportService._to_response(full_report)

    @staticmethod
    def update_report(db: Session, report_id: int, report_in: ReportUpdate) -> ReportResponse:
        report = ReportRepository.get_by_id(db, report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

        if report_in.group_id is not None:
            group = GroupRepository.get_by_id(db, report_in.group_id)
            if not group or not group.active:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Active Group not found")
            report.group_id = report_in.group_id

        if report_in.member_id is not None:
            member = MemberRepository.get_by_id(db, report_in.member_id)
            if not member or not member.active:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Active Member not found")
            report.member_id = report_in.member_id

        if report_in.content is not None:
            report.content = report_in.content

        if report_in.report_date is not None:
            report.report_date = report_in.report_date

        if report_in.reported_at is not None:
            report.reported_at = report_in.reported_at

        saved = ReportRepository.update(db, report)
        full_report = ReportRepository.get_by_id(db, saved.id)
        return ReportService._to_response(full_report)

    @staticmethod
    def delete_report(db: Session, report_id: int) -> dict:
        report = ReportRepository.get_by_id(db, report_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
        ReportRepository.delete(db, report)
        return {"message": "Report deleted successfully"}
