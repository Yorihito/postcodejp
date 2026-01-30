"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Prefecture schemas
class PrefectureBase(BaseModel):
    """Base prefecture schema."""
    code: str = Field(..., description="都道府県コード（2桁）", examples=["13"])
    name: str = Field(..., description="都道府県名", examples=["東京都"])
    name_kana: str = Field(..., description="都道府県名（カナ）", examples=["トウキョウト"])


class PrefectureResponse(PrefectureBase):
    """Prefecture response schema."""
    
    class Config:
        from_attributes = True


# City schemas
class CityBase(BaseModel):
    """Base city schema."""
    code: str = Field(..., description="市区町村コード（5桁）", examples=["13101"])
    prefecture_code: str = Field(..., description="都道府県コード", examples=["13"])
    name: str = Field(..., description="市区町村名", examples=["千代田区"])
    name_kana: str = Field(..., description="市区町村名（カナ）", examples=["チヨダク"])


class CityResponse(CityBase):
    """City response schema."""
    
    class Config:
        from_attributes = True


# Postal code schemas
class PostalCodeBase(BaseModel):
    """Base postal code schema."""
    postal_code: str = Field(..., description="郵便番号（7桁）", examples=["1000001"])
    prefecture: str = Field(..., description="都道府県名", examples=["東京都"])
    city: str = Field(..., description="市区町村名", examples=["千代田区"])
    town: str = Field(..., description="町域名", examples=["千代田"])


class PostalCodeResponse(PostalCodeBase):
    """Postal code response schema."""
    id: int
    local_gov_code: str = Field(..., description="全国地方公共団体コード")
    old_postal_code: Optional[str] = Field(None, description="旧郵便番号（5桁）")
    prefecture_kana: str = Field(..., description="都道府県名（カナ）")
    city_kana: str = Field(..., description="市区町村名（カナ）")
    town_kana: str = Field(..., description="町域名（カナ）")
    
    class Config:
        from_attributes = True


class PostalCodeListResponse(BaseModel):
    """Postal code list response schema."""
    total: int = Field(..., description="総件数")
    items: List[PostalCodeResponse] = Field(..., description="郵便番号リスト")


# Office postal code schemas
class OfficePostalCodeBase(BaseModel):
    """Base office postal code schema."""
    postal_code: str = Field(..., description="郵便番号（7桁）")
    office_name: str = Field(..., description="事業所名")
    prefecture: str = Field(..., description="都道府県名")
    city: str = Field(..., description="市区町村名")


class OfficePostalCodeResponse(OfficePostalCodeBase):
    """Office postal code response schema."""
    id: int
    local_gov_code: str
    office_kana: str = Field(..., description="事業所名（カナ）")
    town: Optional[str] = Field(None, description="町域名")
    address_detail: Optional[str] = Field(None, description="番地等")
    old_postal_code: Optional[str] = Field(None, description="旧郵便番号")
    post_office: Optional[str] = Field(None, description="取扱郵便局")
    office_type: int = Field(..., description="種別（0:大口、1:私書箱）")
    
    class Config:
        from_attributes = True


class OfficePostalCodeListResponse(BaseModel):
    """Office postal code list response schema."""
    total: int = Field(..., description="総件数")
    items: List[OfficePostalCodeResponse] = Field(..., description="事業所リスト")


# Sync history schemas
class SyncHistoryResponse(BaseModel):
    """Sync history response schema."""
    id: int
    sync_type: str = Field(..., description="同期タイプ（full/diff）")
    data_type: str = Field(..., description="データタイプ")
    file_url: Optional[str] = None
    file_date: Optional[datetime] = None
    records_added: int = 0
    records_deleted: int = 0
    records_updated: int = 0
    status: str = Field(..., description="ステータス")
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SyncStatusResponse(BaseModel):
    """Current sync status response."""
    is_syncing: bool = Field(..., description="同期中かどうか")
    last_sync: Optional[SyncHistoryResponse] = Field(None, description="最後の同期情報")
    postal_codes_count: int = Field(..., description="郵便番号データ件数")
    office_codes_count: int = Field(..., description="事業所データ件数")


# Search query schemas
class PostalCodeSearchQuery(BaseModel):
    """Postal code search query parameters."""
    q: str = Field(..., min_length=1, description="検索キーワード")
    limit: int = Field(default=20, ge=1, le=100, description="取得件数")
    offset: int = Field(default=0, ge=0, description="オフセット")


class OfficeSearchQuery(BaseModel):
    """Office search query parameters."""
    q: str = Field(..., min_length=1, description="検索キーワード")
    limit: int = Field(default=20, ge=1, le=100, description="取得件数")
    offset: int = Field(default=0, ge=0, description="オフセット")
