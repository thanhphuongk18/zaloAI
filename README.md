# ⚡ Zalo Report Hub

> **Web app cá nhân quản lý và tổng hợp báo cáo hằng ngày từ các nhóm Zalo (FastAPI + SQLite + Vanilla JS + Browser Extension)**

---

## 📖 Giới thiệu

**Zalo Report Hub** là hệ thống quản lý và tổng hợp báo cáo công việc nội bộ dành riêng cho team phát triển:
* Quản lý tập trung 2 nhóm Zalo trọng điểm:
  1. **Báo Cáo Leader_Dev & Game**
  2. **Game Dev Intern - 8/2026**
* Xem nhanh tỷ lệ hoàn thành báo cáo trong ngày, danh sách ai **Đã báo cáo** và cảnh báo ai **Chưa báo cáo**.
* Tích hợp sẵn **Browser Extension (Opera GX / Chrome / Edge)** giúp **tự động cào và đồng bộ tin nhắn từ Zalo Web (chat.zalo.me) về hệ thống chỉ với 1-Click**, không cần copy-paste thủ công.
* Kiến trúc chuẩn **Python Only**, siêu nhẹ, chạy hoàn toàn local, dữ liệu lưu trữ bền vững trong SQLite.

---

## 🛠️ Công nghệ sử dụng

* **Backend**: Python 3.13+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0
* **Database**: SQLite (`data/reports.db`) - Tự động khởi tạo và cấu hình
* **Frontend**: HTML5, CSS3 (Modern Dark Glassmorphism), Vanilla JavaScript (Không dùng React/Vue cồng kềnh)
* **Automation**: Browser Extension Manifest V3 tương thích 100% với Opera GX, Google Chrome, Microsoft Edge

---

## 📂 Cấu trúc thư mục

```text
zaloAI/
│
├── app/
│   ├── main.py                     # FastAPI app entry point, mount routers & static
│   ├── api/
│   │   └── routes/
│   │       ├── dashboard.py        # API tổng hợp số liệu ngày
│   │       ├── reports.py          # API CRUD báo cáo & bộ lọc
│   │       ├── members.py          # API quản lý thành viên
│   │       ├── groups.py           # API quản lý nhóm Zalo
│   │       └── zalo_sync.py        # API tiếp nhận đồng bộ từ Zalo Extension
│   ├── database/
│   │   ├── database.py             # SQLite engine & session maker
│   │   └── seed.py                 # Idempotent seed data
│   ├── models/                     # SQLAlchemy ORM Models (Group, Member, Report)
│   ├── schemas/                    # Pydantic Schemas request/response
│   ├── repositories/               # Query layer
│   ├── services/                   # Business logic layer
│   ├── templates/
│   │   └── index.html              # Giao diện Web SPA
│   └── static/
│       ├── css/style.css           # Styling giao diện Dark Mode
│       └── js/                     # Controller modules (dashboard, reports, members, groups)
│
├── extension/                      # Chrome / Opera GX Extension tự động cào tin nhắn
│   ├── manifest.json
│   ├── content.js                  # Script quét tin nhắn trên chat.zalo.me
│   ├── style.css                   # Giao diện nút nổi trên Zalo Web
│   ├── popup.html & popup.js
│   └── HUONG_DAN_CAI_DAT.md
│
├── data/
│   └── reports.db                  # File SQLite Database (Tự tạo khi chạy app)
│
├── requirements.txt                # Danh sách thư viện Python cần thiết
└── README.md                       # Tài liệu hướng dẫn này
```

---

## 🚀 Hướng dẫn Clone và Khởi chạy dự án

### 1. Yêu cầu hệ thống
* Đã cài đặt **Git**: [https://git-scm.com/](https://git-scm.com/)
* Đã cài đặt **Python 3.10+** (khuyên dùng Python 3.12 hoặc 3.13): [https://www.python.org/](https://www.python.org/)

---

### 2. Các bước thực hiện

#### Bước 1: Clone dự án về máy
Mở Terminal / PowerShell và chạy:
```bash
git clone <URL_REPOSITORY_CỦA_BẠN>
cd zaloAI
```

#### Bước 2: Tạo và kích hoạt môi trường ảo (Virtual Environment)

* **Trên Windows (PowerShell)**:
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```
  *(Nếu gặp lỗi `ExecutionPolicy` chặn file `.ps1`, chạy: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` rồi chạy lại lệnh Activate).*

* **Trên macOS / Linux**:
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

#### Bước 3: Cài đặt các thư viện cần thiết
```bash
pip install -r requirements.txt
```

#### Bước 4: Khởi chạy máy chủ Backend
Chạy server qua lệnh:
```bash
uvicorn app.main:app --reload
```
*(Hoặc chạy trực tiếp qua đường dẫn Python trong `.venv`)*:
```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Server sẽ khởi động và thông báo:
```text
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

#### Bước 5: Truy cập ứng dụng
* 🌐 **Web Dashboard chính**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* 📚 **Tài liệu API tương tác (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* 🩺 **Kiểm tra trạng thái server (Health Check)**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 🔌 Cài đặt Extension Tự Động Đồng Bộ Zalo Web

Dành cho **Opera GX**, **Google Chrome**, **Microsoft Edge**:

1. Mở trình duyệt, nhập vào thanh địa chỉ:
   * Trên **Opera GX**: `opera://extensions`
   * Trên **Chrome**: `chrome://extensions`
   * Trên **Edge**: `edge://extensions`
2. Gạt công tắc **Developer mode (Chế độ nhà phát triển)** ở góc trên bên phải sang **BẬT (ON)**.
3. Nhấn vào nút **Load unpacked (Tải tiện ích đã giải nén)** ở góc trên bên trái.
4. Chọn thư mục `extension` trong dự án (ví dụ: `D:\zaloAI\extension`) $\rightarrow$ Nhấn **Select Folder**.
5. Mở tab **[https://chat.zalo.me](https://chat.zalo.me)** và nhấn **F5** để tải tiện ích.

### Cách dùng:
* Mở nhóm **`Báo Cáo Leader_Dev & Game`** hoặc **`Game Dev Intern - 8/2026`** trên Zalo Web.
* Bấm vào nút nổi màu tím **`⚡ Đồng bộ Báo Cáo`** ở góc phải màn hình.
* Tiện ích sẽ tự động quét tin nhắn, tên người gửi, thời gian và đẩy về Web App.
* Mở Web App tại [http://127.0.0.1:8000](http://127.0.0.1:8000) $\rightarrow$ Toàn bộ báo cáo và danh sách ai chưa nộp báo cáo đã được cập nhật ngay tức thì!

---

## 🌟 Các tính năng chính

| Tính năng | Mô tả |
| :--- | :--- |
| **KPI Daily Stats** | Thống kê số lượng thành viên, số người đã báo cáo, số người chưa báo cáo, thanh tiến độ hoàn thành % trong ngày. |
| **Điều hướng ngày** | Chuyển nhanh giữa Hôm nay, Hôm qua, Ngày mai hoặc chọn ngày bất kỳ qua Date Picker. |
| **Phân loại nhóm** | Báo cáo được tự động gom vào đúng nhóm Zalo tương ứng kèm giờ gửi và tên thành viên. |
| **Cảnh báo thiếu báo cáo** | Liệt kê danh sách thành viên chưa nộp báo cáo trong ngày kèm nút nhập nhanh. |
| **Lọc & Quản lý** | Tab quản lý Thành viên, Nhóm Zalo, và Bộ lọc báo cáo theo ngày, nhóm, thành viên. |
| **Chống trùng lặp** | Hệ thống tự động lọc trùng nội dung khi đồng bộ nhiều lần từ Zalo. |

---

## 📝 Giấy phép
Dự án được xây dựng phục vụ mục đích cá nhân và quản lý nội bộ nhóm.
