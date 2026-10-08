import json
from pathlib import Path
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.report import Report
from app.services.notion_service import NotionService

router = APIRouter()

CONFIG_FILE = Path(__file__).resolve().parent.parent.parent.parent / "data" / "notion_config.json"

class NotionConfig(BaseModel):
    token: str
    page_id_or_db_id: str

def load_notion_config():
    if CONFIG_FILE.exists():
        try:
            return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}

def save_notion_config(data: dict):
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

@router.get("/config")
def get_config():
    cfg = load_notion_config()
    token = cfg.get("token", "")
    masked_token = f"{token[:8]}...{token[-4:]}" if len(token) > 12 else ("Đã cấu hình" if token else "")
    return {
        "is_configured": bool(token and (cfg.get("database_id") or cfg.get("page_id"))),
        "database_id": cfg.get("database_id", ""),
        "page_id": cfg.get("page_id", ""),
        "masked_token": masked_token
    }

@router.post("/setup")
def setup_notion(payload: NotionConfig):
    token = payload.token.strip()
    target_id = payload.page_id_or_db_id.strip()

    if not token or not target_id:
        raise HTTPException(status_code=400, detail="Token và Page/Database ID không được để trống")

    # Lưu cấu hình
    cfg = {
        "token": token,
        "database_id": target_id
    }
    save_notion_config(cfg)
    return {
        "success": True,
        "message": "Đã lưu cấu hình Notion Database!",
        "database_id": target_id
    }

@router.post("/sync-reports")
def sync_reports_to_notion(db: Session = Depends(get_db)):
    cfg = load_notion_config()
    token = cfg.get("token")
    db_id = cfg.get("database_id")

    if not token or not db_id:
        raise HTTPException(status_code=400, detail="Chưa cấu hình Notion Token hoặc Database ID!")

    # Lấy các báo cáo hiện có
    reports = db.query(Report).order_by(Report.id.asc()).all()
    if not reports:
        return {"success": True, "synced_count": 0, "message": "Không có báo cáo nào để đẩy lên Notion."}

    # 1. Phân tích từng báo cáo để lấy thông tin chuẩn
    parsed_items = []
    for r in reports:
        p = NotionService.parse_report_content(r.content, r.member.name if r.member else "")
        parsed_items.append({
            "report_id": r.id,
            "sender": p["sender"],
            "team_name": p["team_name"],
            "date_iso": p["date_iso"],
            "date_display": p["date_display"],
            "link": p["link"],
            "content": r.content
        })

    # 2. Gom nhóm theo (team_name, date_display) để đánh số lần báo cáo (Lần 1, Lần 2...)
    # Ví dụ: Nhóm 5_Game ngày 7/10 có 2 báo cáo -> Lần 1, Lần 2
    groups_by_day = defaultdict(list)
    for item in parsed_items:
        key = (item["team_name"], item["date_display"])
        groups_by_day[key].append(item)

    # 3. Lấy danh sách các dòng đã có trên Notion để chống trùng lặp
    existing_titles = set(NotionService.get_existing_notion_titles(token, db_id))

    synced_count = 0
    duplicate_count = 0

    for (team_name, date_display), items in groups_by_day.items():
        for idx, item in enumerate(items, start=1):
            # Tạo tiêu đề chuẩn format theo yêu cầu:
            # "Nhóm X_Game - Ngày d/m (Báo cáo lần 1)"
            if len(items) > 1:
                title_text = f"{team_name} - Ngày {date_display} (Báo cáo lần {idx})"
            else:
                title_text = f"{team_name} - Ngày {date_display} (Báo cáo lần 1)"

            # Kiểm tra nếu đã có trên Notion thì bỏ qua (chống duplicate)
            if title_text in existing_titles:
                duplicate_count += 1
                continue

            success = NotionService.insert_row(
                token=token,
                database_id=db_id,
                title_text=title_text,
                progress_text=item["content"],
                link_url=item["link"],
                report_date_str=item["date_iso"],
                sender_name=item["sender"]
            )
            if success:
                synced_count += 1
                existing_titles.add(title_text)

    return {
        "success": True,
        "synced_count": synced_count,
        "duplicate_count": duplicate_count,
        "message": f"Đã đẩy thành công {synced_count} báo cáo lên Notion (Bỏ qua {duplicate_count} dòng đã có)!"
    }
