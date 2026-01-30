"""Postal code API endpoints."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app.models.postal_code import PostalCode, Prefecture, City
from app.schemas.postal_code import (
    PostalCodeResponse,
    PostalCodeListResponse,
    PrefectureResponse,
    CityResponse,
)

router = APIRouter(prefix="/api", tags=["Postal Codes"])


@router.get(
    "/postal-codes/{postal_code}",
    response_model=List[PostalCodeResponse],
    summary="郵便番号から住所を取得",
    description="7桁の郵便番号を指定して、該当する住所情報を取得します。同一郵便番号に複数の町域が該当する場合は複数件返されます。"
)
def get_by_postal_code(
    postal_code: str,
    db: Session = Depends(get_db)
):
    """Get addresses by postal code."""
    # Remove hyphen if present
    postal_code = postal_code.replace("-", "").replace("−", "")
    
    if len(postal_code) != 7 or not postal_code.isdigit():
        raise HTTPException(
            status_code=400,
            detail="郵便番号は7桁の数字で指定してください"
        )
    
    results = db.query(PostalCode).filter(
        PostalCode.postal_code == postal_code
    ).all()
    
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"郵便番号 {postal_code} に該当する住所が見つかりません"
        )
    
    return results


@router.get(
    "/postal-codes/search",
    response_model=PostalCodeListResponse,
    summary="住所から郵便番号を検索",
    description="住所の一部（都道府県名、市区町村名、町域名）をキーワードとして検索します。"
)
def search_postal_codes(
    q: str = Query(..., min_length=1, description="検索キーワード"),
    limit: int = Query(default=20, ge=1, le=100, description="取得件数"),
    offset: int = Query(default=0, ge=0, description="オフセット"),
    db: Session = Depends(get_db)
):
    """Search postal codes by address keyword."""
    # Build search query
    search_term = f"%{q}%"
    
    query = db.query(PostalCode).filter(
        or_(
            PostalCode.prefecture.ilike(search_term),
            PostalCode.city.ilike(search_term),
            PostalCode.town.ilike(search_term),
            PostalCode.prefecture_kana.ilike(search_term),
            PostalCode.city_kana.ilike(search_term),
            PostalCode.town_kana.ilike(search_term),
        )
    )
    
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    
    return PostalCodeListResponse(total=total, items=items)


@router.get(
    "/prefectures",
    response_model=List[PrefectureResponse],
    summary="都道府県一覧を取得",
    description="全都道府県の一覧を取得します。"
)
def get_prefectures(db: Session = Depends(get_db)):
    """Get all prefectures."""
    return db.query(Prefecture).order_by(Prefecture.code).all()


@router.get(
    "/prefectures/{code}/cities",
    response_model=List[CityResponse],
    summary="市区町村一覧を取得",
    description="指定した都道府県に属する市区町村の一覧を取得します。"
)
def get_cities_by_prefecture(
    code: str,
    db: Session = Depends(get_db)
):
    """Get cities by prefecture code."""
    if len(code) != 2:
        raise HTTPException(
            status_code=400,
            detail="都道府県コードは2桁で指定してください"
        )
    
    cities = db.query(City).filter(
        City.prefecture_code == code
    ).order_by(City.code).all()
    
    if not cities:
        raise HTTPException(
            status_code=404,
            detail=f"都道府県コード {code} に該当する市区町村が見つかりません"
        )
    
    return cities


@router.get(
    "/cities/{code}/postal-codes",
    response_model=PostalCodeListResponse,
    summary="市区町村の郵便番号一覧を取得",
    description="指定した市区町村に属する郵便番号の一覧を取得します。"
)
def get_postal_codes_by_city(
    code: str,
    limit: int = Query(default=100, ge=1, le=500, description="取得件数"),
    offset: int = Query(default=0, ge=0, description="オフセット"),
    db: Session = Depends(get_db)
):
    """Get postal codes by city code."""
    query = db.query(PostalCode).filter(
        PostalCode.local_gov_code == code
    ).order_by(PostalCode.postal_code)
    
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    
    if not items:
        raise HTTPException(
            status_code=404,
            detail=f"市区町村コード {code} に該当する郵便番号が見つかりません"
        )
    
    return PostalCodeListResponse(total=total, items=items)


@router.get(
    "/stats",
    summary="データ統計を取得",
    description="郵便番号データの統計情報を取得します。"
)
def get_stats(db: Session = Depends(get_db)):
    """Get data statistics."""
    postal_count = db.query(PostalCode).count()
    prefecture_count = db.query(Prefecture).count()
    city_count = db.query(City).count()
    
    return {
        "postal_codes_count": postal_count,
        "prefectures_count": prefecture_count,
        "cities_count": city_count,
    }
