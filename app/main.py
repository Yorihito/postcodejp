"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import postal_codes, offices, admin
from app.services.scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting PostcodeJP API...")
    start_scheduler()
    yield
    # Shutdown
    logger.info("Shutting down PostcodeJP API...")
    stop_scheduler()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
## 郵便番号検索API

日本郵便の郵便番号データを使用した検索APIです。

### 機能
- 郵便番号から住所を検索
- 住所から郵便番号を検索
- 事業所の個別郵便番号を検索
- 都道府県・市区町村一覧

### データソース
- [日本郵便 郵便番号データダウンロード](https://www.post.japanpost.jp/zipcode/download.html)
""",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
# Configure allowed origins from environment variable or use restrictive defaults
allowed_origins = settings.cors_origins.split(",") if hasattr(settings, 'cors_origins') and settings.cors_origins else ["https://func-postcodejp.azurewebsites.net"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include routers
app.include_router(postal_codes.router)
app.include_router(offices.router)
app.include_router(admin.router)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
