"""
/doctor

  POST  /doctor                body = Doctor JSON
  PATCH /doctor/{doctor_id}    partial update
  GET   /doctor                ?limit&page&search   -> { data, total, page, limit }
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.utils.jwt_auth import get_current_user
from db.database import get_db
from db.models import Doctor, User

router = APIRouter(prefix="/doctor", tags=["Doctor"])


class DoctorIn(BaseModel):
    name: str
    image: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    email: Optional[str] = None
    primary_mobile_no_country_code: Optional[str] = None
    primary_mobile_no: Optional[str] = None
    secondary_mobile_no_country_code: Optional[str] = None
    secondary_mobile_no: Optional[str] = None
    graduation: Optional[str] = None
    specialisation: Optional[str] = None
    mrn: Optional[str] = None
    registration_council: Optional[str] = None
    registration_at: Optional[str] = None
    experience: Optional[str] = None
    user_id: Optional[int] = None
    hospital_id: Optional[int] = None

    class Config:
        extra = "ignore"


class DoctorPatch(DoctorIn):
    name: Optional[str] = None


def _serialize(d: Doctor) -> dict:
    return {
        "id": d.id,
        "user_id": d.user_id,
        "hospital_id": d.hospital_id,
        "image": d.image,
        "name": d.name,
        "gender": d.gender,
        "dob": d.dob,
        "email": d.email,
        "primary_mobile_no_country_code": d.primary_mobile_no_country_code,
        "primary_mobile_no": d.primary_mobile_no,
        "secondary_mobile_no_country_code": d.secondary_mobile_no_country_code,
        "secondary_mobile_no": d.secondary_mobile_no,
        "graduation": d.graduation,
        "specialisation": d.specialisation,
        "mrn": d.mrn,
        "registration_council": d.registration_council,
        "registration_at": d.registration_at,
        "experience": d.experience,
        "created_at": d.created_at,
        "updated_at": d.updated_at,
    }


@router.post("")
async def create_doctor(payload: DoctorIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(Doctor).where(Doctor.user_id == user.id))).scalars().first()
    if existing:
        for k, v in payload.dict(exclude={"user_id"}).items():
            if v is not None:
                setattr(existing, k, v)
        await db.commit()
        await db.refresh(existing)
        row = _serialize(existing)
        # Frontend reads `res.response.id` / `.name` / `.email` / `.specialisation`
        return {"status_code": 200, "message": "Doctor updated", "data": row, "response": row}

    d = Doctor(**payload.dict(exclude={"user_id"}))
    d.user_id = user.id
    db.add(d)
    await db.commit()
    await db.refresh(d)
    row = _serialize(d)
    return {"status_code": 201, "message": "Doctor created", "data": row, "response": row}


@router.patch("/{doctor_id}")
async def update_doctor(doctor_id: int, payload: DoctorPatch, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(Doctor).where(Doctor.id == doctor_id, Doctor.user_id == user.id))).scalars().first()
    if not d:
        raise HTTPException(status_code=404, detail="Doctor not found")
    for k, v in payload.dict(exclude_unset=True, exclude={"user_id"}).items():
        setattr(d, k, v)
    await db.commit()
    await db.refresh(d)
    row = _serialize(d)
    return {"status_code": 200, "message": "Doctor updated", "data": row, "response": row}


@router.get("")
async def list_doctors(
    limit: int = Query(10, ge=1, le=200),
    page: int = Query(1, ge=1),
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Doctor).where(Doctor.user_id == user.id)
    if search:
        like = f"%{search}%"
        q = q.where(or_(Doctor.name.ilike(like), Doctor.specialisation.ilike(like), Doctor.email.ilike(like)))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(q.order_by(Doctor.id.desc()).limit(limit).offset((page - 1) * limit))).scalars().all()
    return {
        "status_code": 200,
        "data": [_serialize(d) for d in rows],
        "total": total,
        "page": page,
        "limit": limit,
    }
