"""Admin API endpoints for data management."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.postal_code import PostalCode, OfficePostalCode, SyncHistory
from app.schemas.postal_code import SyncHistoryResponse, SyncStatusResponse
from app.services.scheduler import sync_all_data
from app.config import get_settings

router = APIRouter(prefix="/api/admin", tags=["Admin"])
settings = get_settings()


def verify_admin_key(x_api_key: str = Header(None)):
    """Verify admin API key.
    
    Raises:
        HTTPException: If authentication is required and the key is invalid or missing.
    """
    # Check if authentication is required
    if not settings.require_admin_auth:
        # Authentication disabled (not recommended for production)
        return
    
    if not settings.admin_api_key:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: Admin API key not configured"
        )
    
    if not x_api_key or x_api_key != settings.admin_api_key:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing API key"
        )
    return x_api_key


@router.post(
    "/sync",
    summary="手動でデータ同期を実行",
    description="日本郵便のサイトから最新データをダウンロードして同期します。バックグラウンドで実行されます。"
)
async def trigger_sync(
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_admin_key)
):
    """Trigger a manual data sync."""
    background_tasks.add_task(sync_all_data)
    return {"message": "同期処理をバックグラウンドで開始しました"}


@router.get(
    "/sync/status",
    response_model=SyncStatusResponse,
    summary="同期ステータスを取得",
    description="現在の同期状態とデータ件数を取得します。"
)
def get_sync_status(db: Session = Depends(get_db)):
    """Get current sync status."""
    # Check if any sync is running
    running_sync = db.query(SyncHistory).filter(
        SyncHistory.status == "running"
    ).first()
    
    # Get last completed sync
    last_sync = db.query(SyncHistory).filter(
        SyncHistory.status == "completed"
    ).order_by(SyncHistory.completed_at.desc()).first()
    
    # Get counts
    postal_count = db.query(PostalCode).count()
    office_count = db.query(OfficePostalCode).count()
    
    return SyncStatusResponse(
        is_syncing=running_sync is not None,
        last_sync=last_sync,
        postal_codes_count=postal_count,
        office_codes_count=office_count,
    )


@router.get(
    "/sync/history",
    response_model=List[SyncHistoryResponse],
    summary="同期履歴を取得",
    description="過去の同期履歴一覧を取得します。"
)
def get_sync_history(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get sync history."""
    return db.query(SyncHistory).order_by(
        SyncHistory.started_at.desc()
    ).limit(limit).all()
