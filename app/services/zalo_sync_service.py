import re
from datetime import date, datetime, time
from typing import List
from sqlalchemy.orm import Session
from app.models.group import Group
from app.models.member import Member
from app.models.report import Report
from app.schemas.zalo_sync import ZaloSyncPayload, ZaloSyncResponse
from app.services.notion_service import NotionService
from app.api.routes.notion import load_notion_config

class ZaloSyncService:
    @staticmethod
    def sync_messages(db: Session, payload: ZaloSyncPayload) -> ZaloSyncResponse:
        clean_group_name = payload.group_name.strip()
        
        # 1. Tìm hoặc tạo Group
        group = db.query(Group).filter(Group.name.ilike(f"%{clean_group_name}%")).first()
        if not group:
            group = Group(
                name=clean_group_name,
                description=f"Nhóm Zalo đồng bộ: {clean_group_name}",
                active=True
            )
            db.add(group)
            db.commit()
            db.refresh(group)

        added_count = 0
        duplicate_count = 0
        new_members: List[str] = []

        notion_cfg = load_notion_config()
        notion_token = notion_cfg.get("token")
        notion_db_id = notion_cfg.get("database_id")
        notion_synced_count = 0

        # Lấy danh sách titles đã có trên Notion để chống trùng
        existing_notion_titles = set()
        if notion_token and notion_db_id:
            existing_notion_titles = set(NotionService.get_existing_notion_titles(notion_token, notion_db_id))

        for msg in payload.messages:
            content = msg.content.strip()
            if not content:
                continue

            lower_content = content.lower()

            # Lọc bỏ tin DEV
            if "_dev" in lower_content or re.search(r"nhóm\s*\d+[_ ]*dev", lower_content):
                continue

            # Phân tích thông tin chuyên sâu từ nội dung tin nhắn
            parsed = NotionService.parse_report_content(content, msg.sender_name.strip())
            team_name = parsed["team_name"]
            sender_name = parsed["sender"]
            report_date = parsed["report_date"]
            date_display = parsed["date_display"]
            link_url = parsed["link"]

            # Tìm hoặc tạo Member
            member = db.query(Member).filter(Member.name.ilike(sender_name)).first()
            if not member:
                member = Member(name=sender_name, active=True)
                db.add(member)
                db.commit()
                db.refresh(member)
                new_members.append(sender_name)

            reported_at = datetime.utcnow()
            if msg.reported_time:
                try:
                    time_parts = msg.reported_time.strip().split(":")
                    if len(time_parts) >= 2:
                        h = int(time_parts[0])
                        m = int(time_parts[1])
                        reported_at = datetime.combine(report_date, time(h, m))
                except Exception:
                    pass

            # Kiểm tra trùng lặp trên SQLite
            existing = db.query(Report).filter(
                Report.group_id == group.id,
                Report.member_id == member.id,
                Report.report_date == report_date,
                Report.content == content
            ).first()

            if existing:
                duplicate_count += 1
                continue

            # Lưu vào Database Web App
            new_report = Report(
                group_id=group.id,
                member_id=member.id,
                content=content,
                report_date=report_date,
                reported_at=reported_at
            )
            db.add(new_report)
            added_count += 1

            # Đẩy lên Notion: Tính số lần báo cáo trong ngày
            if notion_token and notion_db_id:
                # Đếm số báo cáo của nhóm này trong ngày đó trong DB
                same_day_count = db.query(Report).filter(
                    Report.group_id == group.id,
                    Report.report_date == report_date,
                    Report.content.ilike(f"%{team_name}%")
                ).count() + 1

                title_text = f"{team_name} - Ngày {date_display} (Báo cáo lần {same_day_count})"

                if title_text not in existing_notion_titles:
                    success_notion = NotionService.insert_row(
                        token=notion_token,
                        database_id=notion_db_id,
                        title_text=title_text,
                        progress_text=content,
                        link_url=link_url,
                        report_date_str=str(report_date),
                        sender_name=sender_name
                    )
                    if success_notion:
                        notion_synced_count += 1
                        existing_notion_titles.add(title_text)

        db.commit()

        notion_msg = f" & Đã tự động đẩy {notion_synced_count} báo cáo lên Notion!" if notion_synced_count > 0 else ""
        return ZaloSyncResponse(
            success=True,
            group_id=group.id,
            group_name=group.name,
            total_received=len(payload.messages),
            added_count=added_count,
            duplicate_count=duplicate_count,
            new_members=new_members,
            message=f"Đồng bộ thành công {added_count} báo cáo Game vào Web App{notion_msg} (Bỏ qua {duplicate_count} trùng)."
        )
