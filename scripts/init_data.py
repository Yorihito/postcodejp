#!/usr/bin/env python3
"""Initial data loading script."""

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.services.downloader import Downloader
from app.services.importer import Importer
from app.config import get_settings

settings = get_settings()


async def main():
    """Main entry point for initial data loading."""
    print("=" * 60)
    print("PostcodeJP - Initial Data Loading")
    print("=" * 60)
    
    db = SessionLocal()
    downloader = Downloader()
    importer = Importer(db)
    
    try:
        # Initialize prefecture master data
        print("\n[1/4] Initializing prefecture master data...")
        pref_count = importer.init_prefectures()
        print(f"      Initialized {pref_count} prefectures")
        
        # Download and import postal codes
        print("\n[2/4] Downloading postal code data from Japan Post...")
        print(f"      URL: {settings.jp_post_utf_all_url}")
        
        history = importer.create_sync_history(
            sync_type="full",
            data_type="postal_codes",
            file_url=settings.jp_post_utf_all_url
        )
        
        data_dir = await downloader.download_utf_all()
        if data_dir is None:
            print("      ERROR: Failed to download postal code data")
            importer.complete_sync_history(history, "failed", "Download failed")
            return 1
        
        print("\n[3/4] Importing postal code data...")
        postal_count = importer.import_postal_codes(data_dir, history)
        importer.complete_sync_history(history, "completed")
        print(f"      Imported {postal_count:,} postal code records")
        
        # Download and import office postal codes
        print("\n[4/4] Downloading and importing office postal code data...")
        print(f"      URL: {settings.jp_post_jigyosyo_url}")
        
        office_history = importer.create_sync_history(
            sync_type="full",
            data_type="offices",
            file_url=settings.jp_post_jigyosyo_url
        )
        
        office_dir = await downloader.download_jigyosyo()
        if office_dir is None:
            print("      ERROR: Failed to download office postal code data")
            importer.complete_sync_history(office_history, "failed", "Download failed")
            return 1
        
        office_count = importer.import_office_postal_codes(office_dir, office_history)
        importer.complete_sync_history(office_history, "completed")
        print(f"      Imported {office_count:,} office postal code records")
        
        print("\n" + "=" * 60)
        print("Initial data loading completed successfully!")
        print(f"  - Postal codes: {postal_count:,} records")
        print(f"  - Office codes: {office_count:,} records")
        print("=" * 60)
        
        return 0
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1
        
    finally:
        db.close()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
