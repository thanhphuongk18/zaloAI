from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.report import ReportCreate, ReportUpdate, ReportResponse
from app.services.report_service import ReportService

router = APIRouter()

@router.get("", response_model=List[ReportResponse])
def get_reports(
    date: Optional[date] = Query(None),
    group_id: Optional[int] = Query(None),
    member_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return ReportService.list_reports(db, report_date=date, group_id=group_id, member_id=member_id)

@router.get("/{id}", response_model=ReportResponse)
def get_report(id: int, db: Session = Depends(get_db)):
    return ReportService.get_report(db, id)

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(report_in: ReportCreate, db: Session = Depends(get_db)):
    return ReportService.create_report(db, report_in)

@router.put("/{id}", response_model=ReportResponse)
def update_report(id: int, report_in: ReportUpdate, db: Session = Depends(get_db)):
    return ReportService.update_report(db, id, report_in)

@router.delete("/{id}")
def delete_report(id: int, db: Session = Depends(get_db)):
    return ReportService.delete_report(db, id)
