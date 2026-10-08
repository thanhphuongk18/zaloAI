from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.zalo_sync import ZaloSyncPayload, ZaloSyncResponse
from app.services.zalo_sync_service import ZaloSyncService

router = APIRouter()

@router.post("/sync", response_model=ZaloSyncResponse)
def sync_zalo_messages(payload: ZaloSyncPayload, db: Session = Depends(get_db)):
    return ZaloSyncService.sync_messages(db, payload)
