from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database.database import init_db
from app.api.routes import dashboard, reports, members, groups, zalo_sync, notion

BASE_DIR = Path(__file__).resolve().parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and idempotent seed data
    init_db()
    yield

app = FastAPI(
    title="Zalo Reports Management API",
    description="Tool cá nhân quản lý và tổng hợp báo cáo từ các nhóm Zalo",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Include API Routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])
app.include_router(groups.router, prefix="/api/groups", tags=["Groups"])
app.include_router(zalo_sync.router, prefix="/api/zalo", tags=["Zalo Sync"])
app.include_router(notion.router, prefix="/api/notion", tags=["Notion Sync"])

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "Zalo Reports Management API"}

@app.get("/", tags=["Frontend"])
def serve_frontend():
    index_path = BASE_DIR / "templates" / "index.html"
    return FileResponse(str(index_path))
