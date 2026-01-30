"""Data downloader service for Japan Post postal code files."""

import os
import zipfile
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class Downloader:
    """Downloads and extracts postal code data from Japan Post website."""
    
    def __init__(self):
        self.data_dir = Path(settings.data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    async def get_file_info(self, url: str) -> Tuple[Optional[datetime], Optional[int]]:
        """Get file modification date and size from HTTP headers.
        
        Args:
            url: URL to check
            
        Returns:
            Tuple of (last_modified datetime, content_length) or (None, None) if unavailable
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.head(url, follow_redirects=True)
                response.raise_for_status()
                
                last_modified = None
                if "last-modified" in response.headers:
                    last_modified = datetime.strptime(
                        response.headers["last-modified"],
                        "%a, %d %b %Y %H:%M:%S %Z"
                    )
                
                content_length = None
                if "content-length" in response.headers:
                    content_length = int(response.headers["content-length"])
                
                return last_modified, content_length
            except Exception as e:
                logger.error(f"Failed to get file info for {url}: {e}")
                return None, None
    
    async def download_file(self, url: str, filename: Optional[str] = None) -> Optional[Path]:
        """Download a file from URL.
        
        Args:
            url: URL to download from
            filename: Optional filename, defaults to URL basename
            
        Returns:
            Path to downloaded file or None if failed
        """
        if filename is None:
            filename = url.split("/")[-1]
        
        filepath = self.data_dir / filename
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                logger.info(f"Downloading {url}...")
                response = await client.get(url, follow_redirects=True)
                response.raise_for_status()
                
                filepath.write_bytes(response.content)
                logger.info(f"Downloaded to {filepath}")
                return filepath
            except Exception as e:
                logger.error(f"Failed to download {url}: {e}")
                return None
    
    def extract_zip(self, zip_path: Path) -> Optional[Path]:
        """Extract a ZIP file.
        
        Args:
            zip_path: Path to ZIP file
            
        Returns:
            Path to extracted directory or None if failed
        """
        extract_dir = zip_path.parent / zip_path.stem
        extract_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            with zipfile.ZipFile(zip_path, "r") as zf:
                zf.extractall(extract_dir)
            logger.info(f"Extracted to {extract_dir}")
            return extract_dir
        except Exception as e:
            logger.error(f"Failed to extract {zip_path}: {e}")
            return None
    
    async def download_and_extract(self, url: str) -> Optional[Path]:
        """Download and extract a ZIP file.
        
        Args:
            url: URL to download from
            
        Returns:
            Path to extracted directory or None if failed
        """
        zip_path = await self.download_file(url)
        if zip_path is None:
            return None
        
        extract_dir = self.extract_zip(zip_path)
        
        # Clean up ZIP file
        try:
            os.remove(zip_path)
        except Exception as e:
            logger.warning(f"Failed to remove {zip_path}: {e}")
        
        return extract_dir
    
    async def download_utf_all(self) -> Optional[Path]:
        """Download and extract the full UTF-8 postal code data.
        
        Returns:
            Path to extracted directory
        """
        return await self.download_and_extract(settings.jp_post_utf_all_url)
    
    async def download_jigyosyo(self) -> Optional[Path]:
        """Download and extract the business office postal code data.
        
        Returns:
            Path to extracted directory
        """
        return await self.download_and_extract(settings.jp_post_jigyosyo_url)
    
    async def download_utf_diff(self, year_month: str) -> Tuple[Optional[Path], Optional[Path]]:
        """Download and extract diff data for a specific month.
        
        Args:
            year_month: Year and month in YYMM format (e.g., "2501" for Jan 2025)
            
        Returns:
            Tuple of (add_dir, del_dir) paths or (None, None) if failed
        """
        add_url = settings.jp_post_utf_add_url_template.format(yymm=year_month)
        del_url = settings.jp_post_utf_del_url_template.format(yymm=year_month)
        
        add_dir = await self.download_and_extract(add_url)
        del_dir = await self.download_and_extract(del_url)
        
        return add_dir, del_dir
