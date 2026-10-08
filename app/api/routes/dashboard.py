from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.dashboard import DashboardDailyResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()

@router.get("/daily", response_model=DashboardDailyResponse)
def get_daily_dashboard(
    date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db)
):
    return DashboardService.get_daily_dashboard(db, target_date=date)
