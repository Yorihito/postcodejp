"""SQLAlchemy ORM models for postal code data."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, SmallInteger, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Prefecture(Base):
    """Prefecture master table."""
    
    __tablename__ = "prefectures"
    
    code = Column(String(2), primary_key=True)
    name = Column(String(10), nullable=False)
    name_kana = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    cities = relationship("City", back_populates="prefecture")


class City(Base):
    """City master table."""
    
    __tablename__ = "cities"
    
    code = Column(String(5), primary_key=True)
    prefecture_code = Column(String(2), ForeignKey("prefectures.code"), nullable=False)
    name = Column(String(50), nullable=False)
    name_kana = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    prefecture = relationship("Prefecture", back_populates="cities")


class PostalCode(Base):
    """Postal code master table for addresses."""
    
    __tablename__ = "postal_codes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    local_gov_code = Column(String(5), nullable=False, index=True)
    old_postal_code = Column(String(5))
    postal_code = Column(String(7), nullable=False, index=True)
    prefecture_kana = Column(String(50), nullable=False)
    city_kana = Column(String(100), nullable=False)
    town_kana = Column(Text, nullable=False)
    prefecture = Column(String(10), nullable=False, index=True)
    city = Column(String(50), nullable=False, index=True)
    town = Column(Text, nullable=False, index=True)
    multi_postal_flag = Column(SmallInteger, default=0)
    koaza_banchi_flag = Column(SmallInteger, default=0)
    chome_flag = Column(SmallInteger, default=0)
    multi_town_flag = Column(SmallInteger, default=0)
    update_flag = Column(SmallInteger, default=0)
    change_reason = Column(SmallInteger, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class OfficePostalCode(Base):
    """Postal code master table for business offices."""
    
    __tablename__ = "office_postal_codes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    local_gov_code = Column(String(5), nullable=False)
    office_kana = Column(Text, nullable=False)
    office_name = Column(Text, nullable=False, index=True)
    prefecture = Column(String(10), nullable=False, index=True)
    city = Column(String(50), nullable=False)
    town = Column(Text)
    address_detail = Column(Text)
    postal_code = Column(String(7), nullable=False, index=True)
    old_postal_code = Column(String(5))
    post_office = Column(Text)
    office_type = Column(SmallInteger, default=0)  # 0: 大口, 1: 私書箱
    multi_number = Column(SmallInteger, default=0)
    change_reason = Column(SmallInteger, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class SyncHistory(Base):
    """Sync history table for tracking data updates."""
    
    __tablename__ = "sync_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sync_type = Column(String(20), nullable=False)  # 'full' or 'diff'
    data_type = Column(String(20), nullable=False)  # 'postal_codes' or 'offices'
    file_url = Column(Text)
    file_date = Column(DateTime(timezone=True))
    records_added = Column(Integer, default=0)
    records_deleted = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    status = Column(String(20), nullable=False)  # 'pending', 'running', 'completed', 'failed'
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True))
