"""Data importer service for loading postal code data into the database."""

import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.postal_code import PostalCode, OfficePostalCode, Prefecture, City, SyncHistory
from app.services.parser import PostalCodeParser, OfficePostalCodeParser, PREFECTURE_DATA

logger = logging.getLogger(__name__)

BATCH_SIZE = 5000


class Importer:
    """Imports postal code data into the database."""
    
    def __init__(self, db: Session):
        self.db = db
        self.postal_parser = PostalCodeParser()
        self.office_parser = OfficePostalCodeParser()
    
    def init_prefectures(self) -> int:
        """Initialize prefecture master data.
        
        Returns:
            Number of prefectures inserted
        """
        count = 0
        for code, name, name_kana in PREFECTURE_DATA:
            existing = self.db.query(Prefecture).filter(Prefecture.code == code).first()
            if not existing:
                prefecture = Prefecture(code=code, name=name, name_kana=name_kana)
                self.db.add(prefecture)
                count += 1
        
        self.db.commit()
        logger.info(f"Initialized {count} prefectures")
        return count
    
    def import_postal_codes(
        self, 
        directory: Path,
        sync_history: Optional[SyncHistory] = None
    ) -> int:
        """Import postal codes from CSV files in a directory.
        
        Args:
            directory: Directory containing CSV files
            sync_history: Optional sync history record to update
            
        Returns:
            Number of records imported
        """
        logger.info(f"Importing postal codes from {directory}")
        
        batch: List[Dict[str, Any]] = []
        total_count = 0
        cities_seen: Dict[str, Dict[str, str]] = {}
        
        for record in self.postal_parser.parse_directory(directory):
            batch.append(record)
            
            # Track city data for master table
            city_code = record["local_gov_code"]
            if city_code not in cities_seen:
                pref_code = city_code[:2]
                cities_seen[city_code] = {
                    "code": city_code,
                    "prefecture_code": pref_code,
                    "name": record["city"],
                    "name_kana": record["city_kana"],
                }
            
            if len(batch) >= BATCH_SIZE:
                self._insert_postal_codes_batch(batch)
                total_count += len(batch)
                logger.info(f"Imported {total_count} records...")
                batch = []
        
        # Insert remaining records
        if batch:
            self._insert_postal_codes_batch(batch)
            total_count += len(batch)
        
        # Update city master
        self._update_cities(list(cities_seen.values()))
        
        if sync_history:
            sync_history.records_added = total_count
        
        self.db.commit()
        logger.info(f"Completed importing {total_count} postal codes")
        return total_count
    
    def _insert_postal_codes_batch(self, batch: List[Dict[str, Any]]) -> None:
        """Insert a batch of postal codes using bulk insert."""
        postal_codes = [PostalCode(**record) for record in batch]
        self.db.bulk_save_objects(postal_codes)
        self.db.flush()
    
    def _update_cities(self, cities: List[Dict[str, str]]) -> None:
        """Update city master table."""
        for city_data in cities:
            existing = self.db.query(City).filter(City.code == city_data["code"]).first()
            if not existing:
                city = City(**city_data)
                self.db.add(city)
        self.db.flush()
    
    def import_office_postal_codes(
        self,
        directory: Path,
        sync_history: Optional[SyncHistory] = None
    ) -> int:
        """Import office postal codes from CSV files in a directory.
        
        Args:
            directory: Directory containing CSV files
            sync_history: Optional sync history record to update
            
        Returns:
            Number of records imported
        """
        logger.info(f"Importing office postal codes from {directory}")
        
        batch: List[Dict[str, Any]] = []
        total_count = 0
        
        for record in self.office_parser.parse_directory(directory):
            batch.append(record)
            
            if len(batch) >= BATCH_SIZE:
                self._insert_office_postal_codes_batch(batch)
                total_count += len(batch)
                logger.info(f"Imported {total_count} office records...")
                batch = []
        
        if batch:
            self._insert_office_postal_codes_batch(batch)
            total_count += len(batch)
        
        if sync_history:
            sync_history.records_added = total_count
        
        self.db.commit()
        logger.info(f"Completed importing {total_count} office postal codes")
        return total_count
    
    def _insert_office_postal_codes_batch(self, batch: List[Dict[str, Any]]) -> None:
        """Insert a batch of office postal codes using bulk insert."""
        office_codes = [OfficePostalCode(**record) for record in batch]
        self.db.bulk_save_objects(office_codes)
        self.db.flush()
    
    def clear_postal_codes(self) -> int:
        """Delete all postal codes from the database.
        
        Returns:
            Number of records deleted
        """
        count = self.db.query(PostalCode).delete()
        self.db.commit()
        logger.info(f"Deleted {count} postal codes")
        return count
    
    def clear_office_postal_codes(self) -> int:
        """Delete all office postal codes from the database.
        
        Returns:
            Number of records deleted
        """
        count = self.db.query(OfficePostalCode).delete()
        self.db.commit()
        logger.info(f"Deleted {count} office postal codes")
        return count
    
    def apply_diff_add(self, directory: Path) -> int:
        """Apply add diff data (new records).
        
        Args:
            directory: Directory containing add CSV files
            
        Returns:
            Number of records added
        """
        return self.import_postal_codes(directory)
    
    def apply_diff_del(self, directory: Path) -> int:
        """Apply delete diff data (remove records).
        
        Args:
            directory: Directory containing delete CSV files
            
        Returns:
            Number of records deleted
        """
        count = 0
        for record in self.postal_parser.parse_directory(directory):
            # Find and delete matching record
            deleted = self.db.query(PostalCode).filter(
                PostalCode.postal_code == record["postal_code"],
                PostalCode.local_gov_code == record["local_gov_code"],
                PostalCode.town == record["town"]
            ).delete()
            count += deleted
        
        self.db.commit()
        logger.info(f"Deleted {count} postal codes from diff")
        return count
    
    def create_sync_history(
        self,
        sync_type: str,
        data_type: str,
        file_url: Optional[str] = None
    ) -> SyncHistory:
        """Create a new sync history record.
        
        Args:
            sync_type: 'full' or 'diff'
            data_type: 'postal_codes' or 'offices'
            file_url: URL of the downloaded file
            
        Returns:
            New SyncHistory record
        """
        history = SyncHistory(
            sync_type=sync_type,
            data_type=data_type,
            file_url=file_url,
            status="running",
            started_at=datetime.utcnow()
        )
        self.db.add(history)
        self.db.commit()
        return history
    
    def complete_sync_history(
        self,
        history: SyncHistory,
        status: str = "completed",
        error_message: Optional[str] = None
    ) -> None:
        """Mark a sync history record as completed.
        
        Args:
            history: SyncHistory record to update
            status: Final status ('completed' or 'failed')
            error_message: Error message if failed
        """
        history.status = status
        history.completed_at = datetime.utcnow()
        if error_message:
            history.error_message = error_message
        self.db.commit()
