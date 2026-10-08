import re
import json
import urllib.request
from typing import Dict, Any, Optional, List, Tuple
from datetime import date

NOTION_VERSION = "2022-06-28"

class NotionService:
    @staticmethod
    def extract_links(text: str) -> List[str]:
        return re.findall(r'https?://[^\s]+', text)

    @staticmethod
    def parse_report_content(raw_text: str, default_sender: str = "") -> Dict[str, Any]:
        """
        Phân tích chính xác:
        1. Người gửi (từ dòng đầu tiên hoặc default_sender)
        2. Tên nhóm (Nhóm 1_Game, Nhóm 2_Game... hỗ trợ gạch ngang, gạch dưới, hai chấm)
        3. Ngày báo cáo (từ "Ngày 7/10", "Ngày 08/10/2026", "Ngày 8/10")
        4. Link đính kèm
        """
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]

        # 1. Người gửi thực tế
        sender = default_sender
        if lines and not lines[0].lower().startswith("báo cáo") and len(lines[0]) < 40:
            sender = lines[0]
        # Nếu default_sender có kèm trong ngoặc: "Nhóm 4_Game (Huân Nguyễn)" -> lấy Huân Nguyễn
        if "(" in sender and ")" in sender:
            m_s = re.search(r'\(([^)]+)\)', sender)
            if m_s:
                sender = m_s.group(1).strip()

        # 2. Tên nhóm (bắt buộc tìm số nhóm + game)
        m_team = re.search(r'nhóm\s*(\d+)[\s_\-:–—]*game', raw_text, re.IGNORECASE)
        if m_team:
            team_name = f"Nhóm {m_team.group(1)}_Game"
        else:
            # Fallback nếu tin nhắn có từ game
            m_num = re.search(r'nhóm\s*(\d+)', raw_text, re.IGNORECASE)
            if m_num:
                team_name = f"Nhóm {m_num.group(1)}_Game"
            else:
                team_name = "Nhóm Game"

        # 3. Ngày báo cáo: trích xuất trực tiếp từ nội dung tin nhắn
        m_date = re.search(r'ngày\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?', raw_text, re.IGNORECASE)
        if m_date:
            d = int(m_date.group(1))
            m = int(m_date.group(2))
            y = int(m_date.group(3)) if m_date.group(3) else 2026
            if y < 100:
                y += 2000
            report_date = date(y, m, d)
            date_display = f"{d}/{m}"
        else:
            report_date = date.today()
            date_display = f"{report_date.day}/{report_date.month}"

        # 4. Link đính kèm
        links = re.findall(r'https?://[^\s]+', raw_text)
        link = links[0] if links else None

        return {
            "sender": sender or "Thành viên Zalo",
            "team_name": team_name,
            "report_date": report_date,
            "date_display": date_display,
            "date_iso": str(report_date),
            "link": link
        }

    @staticmethod
    def get_existing_notion_titles(token: str, database_id: str) -> List[str]:
        """Lấy danh sách các dòng đã tồn tại trong Notion để chống trùng lặp"""
        clean_db_id = database_id.replace("-", "").strip()
        url = f"https://api.notion.com/v1/databases/{clean_db_id}/query"
        headers = {
            "Authorization": f"Bearer {token.strip()}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json"
        }
        req = urllib.request.Request(url, data=json.dumps({"page_size": 100}).encode("utf-8"), headers=headers)
        try:
            with urllib.request.urlopen(req) as res:
                data = json.loads(res.read().decode("utf-8"))
                titles = []
                for row in data.get("results", []):
                    title_prop = row.get("properties", {}).get("Nhóm Game", {}).get("title", [])
                    if title_prop:
                        titles.append(title_prop[0].get("text", {}).get("content", ""))
                return titles
        except Exception as e:
            print("[Notion get_existing_titles error]", e)
            return []

    @staticmethod
    def insert_row(
        token: str,
        database_id: str,
        title_text: str,
        progress_text: str,
        link_url: Optional[str],
        report_date_str: str,
        sender_name: str
    ) -> bool:
        clean_db_id = database_id.replace("-", "").strip()
        url = "https://api.notion.com/v1/pages"

        headers = {
            "Authorization": f"Bearer {token.strip()}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json"
        }

        clean_progress = progress_text[:1900]

        properties: Dict[str, Any] = {
            "Nhóm Game": {
                "title": [
                    { "text": { "content": title_text } }
                ]
            },
            "Tiến độ": {
                "rich_text": [
                    { "text": { "content": clean_progress } }
                ]
            },
            "Ngày báo cáo": {
                "date": {
                    "start": report_date_str
                }
            },
            "Người gửi": {
                "rich_text": [
                    { "text": { "content": sender_name } }
                ]
            }
        }

        if link_url:
            properties["Link đính kèm"] = {
                "url": link_url.strip()
            }

        payload = {
            "parent": { "database_id": clean_db_id },
            "properties": properties
        }

        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
        try:
            with urllib.request.urlopen(req) as res:
                return res.status == 200
        except Exception as e:
            print("[Notion insert_row error]", e)
            return False
