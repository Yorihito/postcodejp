"""Office postal code API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.postal_code import OfficePostalCode
from app.schemas.postal_code import (
    OfficePostalCodeResponse,
    OfficePostalCodeListResponse,
)

router = APIRouter(prefix="/api/offices", tags=["Office Postal Codes"])


@router.get(
    "/{postal_code}",
    response_model=List[OfficePostalCodeResponse],
    summary="事業所郵便番号から情報を取得",
    description="7桁の事業所郵便番号を指定して、事業所情報を取得します。"
)
def get_office_by_postal_code(
    postal_code: str,
    db: Session = Depends(get_db)
):
    """Get office information by postal code."""
    postal_code = postal_code.replace("-", "").replace("−", "")
    
    if len(postal_code) != 7 or not postal_code.isdigit():
        raise HTTPException(
            status_code=400,
            detail="郵便番号は7桁の数字で指定してください"
        )
    
    results = db.query(OfficePostalCode).filter(
        OfficePostalCode.postal_code == postal_code
    ).all()
    
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"郵便番号 {postal_code} に該当する事業所が見つかりません"
        )
    
    return results


@router.get(
    "/search",
    response_model=OfficePostalCodeListResponse,
    summary="事業所名で検索",
    description="事業所名の一部をキーワードとして検索します。"
)
def search_offices(
    q: str = Query(..., min_length=1, description="検索キーワード"),
    limit: int = Query(default=20, ge=1, le=100, description="取得件数"),
    offset: int = Query(default=0, ge=0, description="オフセット"),
    db: Session = Depends(get_db)
):
    """Search offices by name."""
    search_term = f"%{q}%"
    
    query = db.query(OfficePostalCode).filter(
        or_(
            OfficePostalCode.office_name.ilike(search_term),
            OfficePostalCode.office_kana.ilike(search_term),
        )
    )
    
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    
    return OfficePostalCodeListResponse(total=total, items=items)


@router.get(
    "/prefecture/{prefecture}",
    response_model=OfficePostalCodeListResponse,
    summary="都道府県で事業所を検索",
    description="指定した都道府県内の事業所一覧を取得します。"
)
def get_offices_by_prefecture(
    prefecture: str,
    limit: int = Query(default=50, ge=1, le=200, description="取得件数"),
    offset: int = Query(default=0, ge=0, description="オフセット"),
    db: Session = Depends(get_db)
):
    """Get offices by prefecture."""
    query = db.query(OfficePostalCode).filter(
        OfficePostalCode.prefecture == prefecture
    ).order_by(OfficePostalCode.office_name)
    
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    
    return OfficePostalCodeListResponse(total=total, items=items)
