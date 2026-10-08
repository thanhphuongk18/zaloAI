from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.report import Report

class ReportRepository:
    @staticmethod
    def get_all(
        db: Session,
        report_date: Optional[date] = None,
        group_id: Optional[int] = None,
        member_id: Optional[int] = None
    ) -> List[Report]:
        query = db.query(Report).options(joinedload(Report.group), joinedload(Report.member))
        if report_date:
            query = query.filter(Report.report_date == report_date)
        if group_id:
            query = query.filter(Report.group_id == group_id)
        if member_id:
            query = query.filter(Report.member_id == member_id)
        return query.order_by(Report.reported_at.desc()).all()

    @staticmethod
    def get_by_id(db: Session, report_id: int) -> Optional[Report]:
        return db.query(Report).options(joinedload(Report.group), joinedload(Report.member)).filter(Report.id == report_id).first()

    @staticmethod
    def get_by_date(db: Session, report_date: date) -> List[Report]:
        return db.query(Report).options(joinedload(Report.group), joinedload(Report.member)).filter(
            Report.report_date == report_date
        ).order_by(Report.reported_at.asc()).all()

    @staticmethod
    def create(db: Session, report: Report) -> Report:
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def update(db: Session, report: Report) -> Report:
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def delete(db: Session, report: Report) -> None:
        db.delete(report)
        db.commit()
