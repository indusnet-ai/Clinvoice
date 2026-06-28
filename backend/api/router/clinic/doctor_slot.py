"""
/doctor-slot

  POST   /doctor-slot                                                    create slot(s)
  GET    /doctor-slot?hospital_id&doctor_id&limit&page                   list
  PATCH  /doctor-slot/update-slots/update-time-for-all-slots             update all slots' time window/duration
  DELETE /doctor-slot/{doctor_slot_id}                                   delete
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.utils.jwt_auth import get_current_user
from db.database import get_db
from db.models import DoctorSlot, User

router = APIRouter(prefix="/doctor-slot", tags=["Doctor Slot"])


class SlotItem(BaseModel):
    dayname: Optional[str] = None
    start_time: str
    end_time: str
    duration: Optional[str] = None
    status: Optional[str] = None

    class Config:
        extra = "ignore"


class SlotBatchIn(BaseModel):
    """Frontend payload — top-level ids + `slots` array."""
    doctor_id: int
    hospital_id: int
    user_id: Optional[int] = None
    slots: Optional[List[SlotItem]] = None

    # Single-slot fallback
    dayname: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: Optional[str] = None
    status: Optional[str] = None

    class Config:
        extra = "ignore"


def _serialize(s: DoctorSlot) -> dict:
    return {
        "id": s.id,
        "doctor_id": s.doctor_id,
        "hospital_id": s.hospital_id,
        "user_id": s.user_id,
        "dayname": s.dayname,
        "start_time": s.start_time,
        "end_time": s.end_time,
        "duration": s.duration,
        "status": s.status,
        "is_active": s.is_active,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
    }


@router.post("")
async def create_slots(payload: SlotBatchIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    created: List[DoctorSlot] = []
    if payload.slots:
        for s in payload.slots:
            row = DoctorSlot(
                doctor_id=payload.doctor_id,
                hospital_id=payload.hospital_id,
                user_id=user.id,
                dayname=s.dayname,
                start_time=s.start_time,
                end_time=s.end_time,
                duration=s.duration,
                status=s.status,
            )
            db.add(row)
            created.append(row)
    else:
        if not payload.start_time or not payload.end_time:
            raise HTTPException(status_code=400, detail="start_time and end_time required")
        row = DoctorSlot(
            doctor_id=payload.doctor_id,
            hospital_id=payload.hospital_id,
            user_id=user.id,
            dayname=payload.dayname,
            start_time=payload.start_time,
            end_time=payload.end_time,
            duration=payload.duration,
            status=payload.status,
        )
        db.add(row)
        created.append(row)
    await db.commit()
    for r in created:
        await db.refresh(r)
    return {"status_code": 201, "message": "Slots created", "data": [_serialize(r) for r in created]}


@router.get("")
async def list_slots(
    hospital_id: int,
    doctor_id: int,
    limit: int = Query(100, ge=1, le=500),
    page: int = Query(1, ge=1),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(DoctorSlot)
        .where(
            DoctorSlot.user_id == user.id,
            DoctorSlot.hospital_id == hospital_id,
            DoctorSlot.doctor_id == doctor_id,
        )
    )
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(q.order_by(DoctorSlot.start_time).limit(limit).offset((page - 1) * limit))).scalars().all()
    return {"status_code": 200, "data": [_serialize(r) for r in rows], "total": total, "page": page, "limit": limit}


@router.patch("/update-slots/update-time-for-all-slots")
async def update_all_slots(
    doctor_id: int, hospital_id: int, user_id: int,
    start_time: str, end_time: str, duration: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(DoctorSlot).where(
                DoctorSlot.user_id == user.id,
                DoctorSlot.hospital_id == hospital_id,
                DoctorSlot.doctor_id == doctor_id,
            )
        )
    ).scalars().all()
    for r in rows:
        r.start_time = start_time
        r.end_time = end_time
        r.duration = duration
    await db.commit()
    return {"status_code": 200, "message": f"Updated {len(rows)} slots"}


@router.delete("/{doctor_slot_id}")
async def delete_slot(doctor_slot_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(select(DoctorSlot).where(DoctorSlot.id == doctor_slot_id, DoctorSlot.user_id == user.id))).scalars().first()
    if not row:
        raise HTTPException(status_code=404, detail="Slot not found")
    await db.delete(row)
    await db.commit()
    return {"status_code": 200, "message": "Slot deleted"}
