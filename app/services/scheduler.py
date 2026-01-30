"""Scheduler service for automatic data updates."""

import logging
from datetime import datetime
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.services.downloader import Downloader
from app.services.importer import Importer

logger = logging.getLogger(__name__)
settings = get_settings()

scheduler = AsyncIOScheduler()


async def sync_all_data():
    """Synchronize all postal code data from Japan Post."""
    logger.info("Starting scheduled data sync...")
    
    db = SessionLocal()
    try:
        downloader = Downloader()
        importer = Importer(db)
        
        # Download and import address postal codes
        history = importer.create_sync_history(
            sync_type="full",
            data_type="postal_codes",
            file_url=settings.jp_post_utf_all_url
        )
        
        try:
            # Clear existing data
            importer.clear_postal_codes()
            
            # Download and import new data
            data_dir = await downloader.download_utf_all()
            if data_dir:
                importer.init_prefectures()
                importer.import_postal_codes(data_dir, history)
                importer.complete_sync_history(history, "completed")
            else:
                importer.complete_sync_history(history, "failed", "Download failed")
        except Exception as e:
            logger.error(f"Failed to sync postal codes: {e}")
            importer.complete_sync_history(history, "failed", str(e))
        
        # Download and import office postal codes
        office_history = importer.create_sync_history(
            sync_type="full",
            data_type="offices",
            file_url=settings.jp_post_jigyosyo_url
        )
        
        try:
            importer.clear_office_postal_codes()
            
            data_dir = await downloader.download_jigyosyo()
            if data_dir:
                importer.import_office_postal_codes(data_dir, office_history)
                importer.complete_sync_history(office_history, "completed")
            else:
                importer.complete_sync_history(office_history, "failed", "Download failed")
        except Exception as e:
            logger.error(f"Failed to sync office postal codes: {e}")
            importer.complete_sync_history(office_history, "failed", str(e))
        
        logger.info("Data sync completed")
        
    finally:
        db.close()


async def check_and_sync():
    """Check for updates and sync if needed.
    
    This function checks the Last-Modified header of the data files
    and only syncs if there are updates.
    """
    logger.info("Checking for data updates...")
    
    db = SessionLocal()
    try:
        downloader = Downloader()
        
        # Check postal codes file
        last_modified, _ = await downloader.get_file_info(settings.jp_post_utf_all_url)
        
        if last_modified:
            # Check if we need to update
            from app.models.postal_code import SyncHistory
            last_sync = db.query(SyncHistory).filter(
                SyncHistory.data_type == "postal_codes",
                SyncHistory.status == "completed"
            ).order_by(SyncHistory.completed_at.desc()).first()
            
            if last_sync and last_sync.file_date:
                if last_modified <= last_sync.file_date:
                    logger.info("No updates available, skipping sync")
                    return
            
            logger.info(f"Updates available (file date: {last_modified})")
        
        # Perform full sync
        await sync_all_data()
        
    finally:
        db.close()


def start_scheduler():
    """Start the background scheduler."""
    scheduler.add_job(
        check_and_sync,
        CronTrigger(
            hour=settings.sync_schedule_hour,
            minute=settings.sync_schedule_minute
        ),
        id="postal_code_sync",
        replace_existing=True
    )
    scheduler.start()
    logger.info(
        f"Scheduler started. Daily sync at {settings.sync_schedule_hour:02d}:{settings.sync_schedule_minute:02d}"
    )


def stop_scheduler():
    """Stop the background scheduler."""
    scheduler.shutdown()
    logger.info("Scheduler stopped")
