"""
/hospital/*

  POST  /hospital/add               body = Hospital JSON (frontend response shape)
  PATCH /hospital/update/{id}       partial update
  GET   /hospital/get               ?limit&page&search   -> { data, total, page, limit }
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from api.utils.jwt_auth import get_current_user
from db.database import get_db
from db.models import Hospital, User

router = APIRouter(prefix="/hospital", tags=["Hospital"])


# ----- Schemas (match frontend exactly) -----

class HospitalIn(BaseModel):
    name: str
    logo: Optional[str] = None
    type: Optional[int] = None
    year_of_establishment: Optional[str] = None
    email: Optional[str] = None
    primary_mobile_no_country_code: Optional[str] = None
    primary_mobile_no: Optional[str] = None
    secondary_mobile_no_country_code: Optional[str] = None
    secondary_mobile_no: Optional[str] = None
    licence_number: Optional[str] = None
    certificate: Optional[str] = None
    website_url: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    user_id: Optional[int] = None   # frontend sends this; we override with current user

    class Config:
        extra = "ignore"


class HospitalPatch(HospitalIn):
    name: Optional[str] = None


def _serialize(h: Hospital) -> dict:
    return {
        "id": h.id,
        "user_id": h.user_id,
        "name": h.name,
        "logo": h.logo,
        "type": h.type,
        "year_of_establishment": h.year_of_establishment,
        "email": h.email,
        "primary_mobile_no_country_code": h.primary_mobile_no_country_code,
        "primary_mobile_no": h.primary_mobile_no,
        "secondary_mobile_no_country_code": h.secondary_mobile_no_country_code,
        "secondary_mobile_no": h.secondary_mobile_no,
        "licence_number": h.licence_number,
        "certificate": h.certificate,
        "website_url": h.website_url,
        "address": h.address,
        "country": h.country,
        "state": h.state,
        "district": h.district,
        "pincode": h.pincode,
        "created_at": h.created_at,
        "updated_at": h.updated_at,
    }


@router.post("/add")
async def add_hospital(payload: HospitalIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(Hospital).where(Hospital.user_id == user.id))).scalars().first()
    if existing:
        # upsert behaviour — keep frontend onboarding idempotent
        for k, v in payload.dict(exclude={"user_id"}).items():
            if v is not None:
                setattr(existing, k, v)
        await db.commit()
        await db.refresh(existing)
        row = _serialize(existing)
        # Frontend reads `res.data?.[0]?.id` — return as a single-element list.
        return {"status_code": 200, "message": "Hospital updated", "data": [row], "response": row}

    h = Hospital(**payload.dict(exclude={"user_id"}))
    h.user_id = user.id
    db.add(h)
    await db.commit()
    await db.refresh(h)
    row = _serialize(h)
    return {"status_code": 201, "message": "Hospital created", "data": [row], "response": row}


@router.patch("/update/{hospital_id}")
async def update_hospital(hospital_id: int, payload: HospitalPatch, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    h = (await db.execute(select(Hospital).where(Hospital.id == hospital_id, Hospital.user_id == user.id))).scalars().first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    for k, v in payload.dict(exclude_unset=True, exclude={"user_id"}).items():
        setattr(h, k, v)
    await db.commit()
    await db.refresh(h)
    return {"status_code": 200, "message": "Hospital updated", "data": _serialize(h)}


@router.get("/get")
async def list_hospitals(
    limit: int = Query(10, ge=1, le=200),
    page: int = Query(1, ge=1),
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Hospital).where(Hospital.user_id == user.id)
    if search:
        like = f"%{search}%"
        q = q.where(or_(Hospital.name.ilike(like), Hospital.city if False else Hospital.address.ilike(like)))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(q.order_by(Hospital.id.desc()).limit(limit).offset((page - 1) * limit))).scalars().all()
    return {
        "status_code": 200,
        "data": [_serialize(h) for h in rows],
        "total": total,
        "page": page,
        "limit": limit,
    }
