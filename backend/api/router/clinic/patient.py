"""
/patient/*

  GET    /patient/fetch                       ?limit&page&search
  POST   /patient/create
  PATCH  /patient/update/{patientid}
  DELETE /patient/delete/{id}
  GET    /patient/fetch-using-mobile          ?mobile_no
  GET    /patient/getOne/{patient_id}
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.utils.jwt_auth import get_current_user
from db.database import get_db
from db.models import Hospital, Patient, User

router = APIRouter(prefix="/patient", tags=["Patient"])


class PatientIn(BaseModel):
    patient_name: str
    salutation: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[str] = None
    blood_group: Optional[str] = None
    country_code: Optional[str] = None
    mobile_no: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None
    hospital_id: Optional[int] = None
    user_id: Optional[int] = None

    class Config:
        extra = "ignore"


class PatientPatch(PatientIn):
    patient_name: Optional[str] = None


def _serialize(p: Patient) -> dict:
    return {
        "id": p.id,
        "user_id": p.user_id,
        "hospital_id": p.hospital_id,
        "image": p.image,
        "salutation": p.salutation,
        "patient_name": p.patient_name,
        "gender": p.gender,
        "dob": p.dob,
        "age": p.age,
        "blood_group": p.blood_group,
        "country_code": p.country_code,
        "mobile_no": p.mobile_no,
        "email": p.email,
        "address": p.address,
        "status": p.status,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


async def _current_hospital_id(db: AsyncSession, user_id: int) -> Optional[int]:
    h = (await db.execute(select(Hospital).where(Hospital.user_id == user_id))).scalars().first()
    return h.id if h else None


@router.get("/fetch")
async def list_patients(
    limit: int = Query(10, ge=1, le=200),
    page: int = Query(1, ge=1),
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Patient).where(Patient.user_id == user.id, Patient.status != "deleted")
    if search:
        like = f"%{search}%"
        q = q.where(or_(Patient.patient_name.ilike(like), Patient.mobile_no.ilike(like), Patient.email.ilike(like)))

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(q.order_by(Patient.id.desc()).limit(limit).offset((page - 1) * limit))).scalars().all()
    return {"status_code": 200, "data": [_serialize(p) for p in rows], "total": total, "page": page, "limit": limit}


@router.post("/create")
async def create_patient(payload: PatientIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = Patient(**payload.dict(exclude={"user_id"}))
    p.user_id = user.id
    if p.hospital_id is None:
        p.hospital_id = await _current_hospital_id(db, user.id)
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return {"status_code": 201, "message": "Patient created", "data": _serialize(p)}


@router.patch("/update/{patient_id}")
async def update_patient(patient_id: int, payload: PatientPatch, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(Patient).where(Patient.id == patient_id, Patient.user_id == user.id))).scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    for k, v in payload.dict(exclude_unset=True, exclude={"user_id"}).items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return {"status_code": 200, "message": "Patient updated", "data": _serialize(p)}


@router.delete("/delete/{patient_id}")
async def delete_patient(patient_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(Patient).where(Patient.id == patient_id, Patient.user_id == user.id))).scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    p.status = "deleted"
    p.updated_at = datetime.utcnow()
    await db.commit()
    return {"status_code": 200, "message": "Patient deleted"}


@router.get("/fetch-using-mobile")
async def fetch_by_mobile(mobile_no: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(Patient).where(
            Patient.user_id == user.id,
            Patient.mobile_no == mobile_no,
            Patient.status != "deleted",
        )
    )).scalars().all()
    # Frontend reads res.data.length — always return an array.
    return {"status_code": 200, "data": [_serialize(p) for p in rows]}


@router.get("/getOne/{patient_id}")
async def get_one_patient(patient_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(Patient).where(Patient.id == patient_id, Patient.user_id == user.id))).scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    row = _serialize(p)
    # Frontend reads `profileData?.data?.[0]` — wrap in an array.
    return {"status_code": 200, "data": [row]}
