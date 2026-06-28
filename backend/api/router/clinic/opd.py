"""
/opd  + /opd-case-sheet

OPD endpoints:
  GET    /opd                                ?hospital_id&page&limit&search&filter_by_status&from_date&to_date&gender_filter
  POST   /opd                                create OPD
  PATCH  /opd/{opd_id}                       ?status=...
  GET    /opd/getOne/{opd_id}
  GET    /opd/visit-history/{patient_id}
  GET    /opd/dashboard/data                 today's counts
  POST   /opd/update-clinvoice-transaction       link clinvoice transcript_id to an OPD

OPD case sheet (separate prefix):
  POST   /opd-case-sheet                     create/replace
  PATCH  /opd-case-sheet/update              partial update by opd_id
  GET    /opd-case-sheet/{opd_id}            fetch
"""
from datetime import date, datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.utils.jwt_auth import get_current_user
from db.database import get_db
from db.models import Doctor, OPD, OPDCaseSheet, Patient, User

opd_router = APIRouter(prefix="/opd", tags=["OPD"])
case_router = APIRouter(prefix="/opd-case-sheet", tags=["OPD Case Sheet"])


# ----- Schemas -----

class OPDIn(BaseModel):
    patient_id: int
    hospital_id: int
    doctor_id: Optional[int] = None
    slot_id: Optional[int] = None
    date: Optional[str] = None
    time: Optional[str] = None
    slot_start_time: Optional[str] = None
    slot_end_time: Optional[str] = None
    priority: Optional[str] = "normal"
    specialist: Optional[str] = None
    amount: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = "walk-in"
    module: Optional[str] = "opd"
    token: Optional[str] = None

    class Config:
        extra = "ignore"


class ClinVoiceTxnLink(BaseModel):
    opd_id: int
    clinvoice_transaction_id: Optional[str] = None
    # Frontend's useConsultationRecording sends `trans_id`; accept it as an alias.
    trans_id: Optional[str] = None

    class Config:
        extra = "ignore"


class CaseSheetIn(BaseModel):
    opd_id: int
    sheet_type: Optional[str] = "medical"   # medical / dental / manual
    payload: Optional[dict[str, Any]] = None
    casesheet: Optional[dict[str, Any]] = None
    clinvoice_transaction_id: Optional[str] = None


# ----- Helpers -----

async def _serialize_opd(db: AsyncSession, o: OPD) -> dict:
    patient = (await db.execute(select(Patient).where(Patient.id == o.patient_id))).scalars().first() if o.patient_id else None
    doctor = (await db.execute(select(Doctor).where(Doctor.id == o.doctor_id))).scalars().first() if o.doctor_id else None
    
    # Normalize opd_status for frontend compatibility:
    raw_status = o.opd_status or ""
    normalized_status = raw_status
    if raw_status == "start":
        normalized_status = "inprocess"
    elif raw_status == "end":
        normalized_status = "completed"
        
    return {
        "id": o.id,
        "user_id": o.user_id,
        "hospital_id": o.hospital_id,
        "patient_id": o.patient_id,
        "patient_name": patient.patient_name if patient else None,
        "patient_salutation": patient.salutation if patient else None,
        "patient_mobile": patient.mobile_no if patient else None,
        "patient_email": patient.email if patient else None,
        "patient_age": patient.age if patient else None,
        "patient_image": patient.image if patient else None,
        "gender": patient.gender if patient else None,
        "date": o.date,
        "time": o.time,
        "priority": o.priority,
        "specialist": o.specialist,
        "doctor_id": o.doctor_id,
        "doctor_name": doctor.name if doctor else None,
        "doctor_email": doctor.email if doctor else None,
        "doctor_mobile": doctor.primary_mobile_no if doctor else None,
        "amount": o.amount,
        "message": o.message,
        "opd_status": normalized_status,
        "source": o.source,
        "slot_id": o.slot_id,
        "slot_start_time": o.slot_start_time,
        "slot_end_time": o.slot_end_time,
        "live_consult": o.live_consult,
        "cancellation_reason": o.cancellation_reason,
        "opd_status_id": o.opd_status_id,
        "is_token_verified": o.is_token_verified,
        "is_consultation_closed": o.is_consultation_closed,
        "module": o.module,
        "clinvoice_transaction_id": o.clinvoice_transaction_id,
        "token": o.token,
        "status": o.status,
        "created_at": o.created_at,
        "updated_at": o.updated_at,
    }


# ----- OPD endpoints -----

@opd_router.get("")
async def list_opds(
    hospital_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    filter_by_status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    gender_filter: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    def _parse_dt(s: str) -> Optional[datetime]:
        if not s:
            return None
        # Accept "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS"
        try:
            if len(s) == 10:
                return datetime.fromisoformat(s + "T00:00:00")
            return datetime.fromisoformat(s.replace("Z", ""))
        except Exception:
            return None

    q = select(OPD).where(OPD.user_id == user.id, OPD.hospital_id == hospital_id, OPD.status != "deleted")
    if filter_by_status:
        if filter_by_status == "completed":
            q = q.where(or_(OPD.opd_status == "completed", OPD.opd_status == "end"))
        elif filter_by_status == "pending":
            q = q.where(or_(OPD.opd_status == "pending", OPD.opd_status == "start"))
        elif filter_by_status == "inprocess":
            q = q.where(or_(OPD.opd_status == "inprocess", OPD.opd_status == "in_progress", OPD.opd_status == "start"))
        else:
            q = q.where(OPD.opd_status == filter_by_status)
    from_dt = _parse_dt(from_date)
    to_dt = _parse_dt(to_date)
    if from_dt:
        q = q.where(OPD.created_at >= from_dt)
    if to_dt:
        q = q.where(OPD.created_at <= to_dt)

    if search or gender_filter:
        # need patient join
        q = q.join(Patient, Patient.id == OPD.patient_id)
        if search:
            like = f"%{search}%"
            q = q.where(or_(Patient.patient_name.ilike(like), Patient.mobile_no.ilike(like)))
        if gender_filter:
            q = q.where(Patient.gender == gender_filter)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(q.order_by(OPD.id.desc()).limit(limit).offset((page - 1) * limit))).scalars().all()
    data = [await _serialize_opd(db, o) for o in rows]
    return {"status_code": 200, "data": data, "total": total, "page": page, "limit": limit}


@opd_router.post("")
async def create_opd(payload: OPDIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    o = OPD(**payload.dict())
    o.user_id = user.id
    if not o.date:
        o.date = date.today().isoformat()
    db.add(o)
    await db.commit()
    await db.refresh(o)
    return {"status_code": 201, "message": "OPD created", "data": await _serialize_opd(db, o)}


@opd_router.patch("/{opd_id}")
async def patch_opd_status(opd_id: int, status: Optional[str] = None, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(OPD).where(OPD.id == opd_id, OPD.user_id == user.id))).scalars().first()
    if not o:
        raise HTTPException(status_code=404, detail="OPD not found")
    if status:
        o.opd_status = status
    await db.commit()
    await db.refresh(o)
    return {"status_code": 200, "data": await _serialize_opd(db, o)}


@opd_router.get("/getOne/{opd_id}")
async def get_one_opd(opd_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(OPD).where(OPD.id == opd_id, OPD.user_id == user.id))).scalars().first()
    if not o:
        raise HTTPException(status_code=404, detail="OPD not found")
    return {"status_code": 200, "data": await _serialize_opd(db, o)}


@opd_router.get("/visit-history/{patient_id}")
async def visit_history(patient_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(OPD).where(OPD.user_id == user.id, OPD.patient_id == patient_id).order_by(OPD.created_at.desc())
    )).scalars().all()
    return {"status_code": 200, "data": [await _serialize_opd(db, o) for o in rows]}


@opd_router.get("/dashboard/data")
async def dashboard_data(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = date.today()
    yesterday = today - timedelta(days=1)

    async def _count(d: date, status: Optional[str] = None) -> int:
        q = select(func.count()).select_from(OPD).where(
            OPD.user_id == user.id,
            func.date(OPD.created_at) == d,
            OPD.status != "deleted",
        )
        if status:
            if status == "pending":
                q = q.where(or_(OPD.opd_status == "pending", OPD.opd_status == "start", OPD.opd_status == "in_progress", OPD.opd_status == "inprocess"))
            elif status == "completed":
                q = q.where(or_(OPD.opd_status == "completed", OPD.opd_status == "end"))
            else:
                q = q.where(OPD.opd_status == status)
        return (await db.execute(q)).scalar_one()

    def _pct_change(today_v: int, yest_v: int) -> float:
        if yest_v == 0:
            return 0.0 if today_v == 0 else 100.0
        return round((today_v - yest_v) / yest_v * 100, 2)

    def _share(part: int, total: int) -> float:
        return round(part / total * 100, 2) if total else 0.0

    total_today = await _count(today)
    total_yest = await _count(yesterday)

    out: dict[str, Any] = {"total_today": total_today, "total_change_percent": _pct_change(total_today, total_yest)}
    for st in ("pending", "in_progress", "completed", "paused"):
        t = await _count(today, st)
        y = await _count(yesterday, st)
        out[f"{st}_today"] = t
        out[f"{st}_today_percent"] = _share(t, total_today)
        out[f"{st}_change_percent"] = _pct_change(t, y)

    return {"status_code": 200, "data": out}


@opd_router.post("/update-clinvoice-transaction")
async def link_clinvoice_transaction(payload: ClinVoiceTxnLink, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(OPD).where(OPD.id == payload.opd_id, OPD.user_id == user.id))).scalars().first()
    if not o:
        raise HTTPException(status_code=404, detail="OPD not found")
    o.clinvoice_transaction_id = payload.clinvoice_transaction_id or payload.trans_id
    await db.commit()
    return {"status_code": 200, "message": "OPD linked to clinvoice transcript"}


# ----- OPD Case Sheet -----

def _serialize_case(c: OPDCaseSheet) -> dict:
    return {
        "id": c.id,
        "opd_id": c.opd_id,
        "user_id": c.user_id,
        "hospital_id": c.hospital_id,
        "doctor_id": c.doctor_id,
        "patient_id": c.patient_id,
        "sheet_type": c.sheet_type,
        "payload": c.payload,
        "casesheet": c.payload,
        "clinvoice_transaction_id": c.clinvoice_transaction_id,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
    }


@case_router.post("")
async def upsert_case_sheet(payload: CaseSheetIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(OPD).where(OPD.id == payload.opd_id, OPD.user_id == user.id))).scalars().first()
    if not o:
        raise HTTPException(status_code=404, detail="OPD not found")

    async def _apply_updates(row: OPDCaseSheet) -> OPDCaseSheet:
        if payload.sheet_type:
            row.sheet_type = payload.sheet_type
        cs_data = payload.payload if payload.payload is not None else payload.casesheet
        if cs_data is not None:
            row.payload = cs_data
        if payload.clinvoice_transaction_id is not None:
            row.clinvoice_transaction_id = payload.clinvoice_transaction_id
        await db.commit()
        await db.refresh(row)
        return row

    existing = (await db.execute(select(OPDCaseSheet).where(OPDCaseSheet.opd_id == payload.opd_id))).scalars().first()
    if existing:
        existing = await _apply_updates(existing)
        return {"status_code": 200, "data": _serialize_case(existing)}

    cs_data = payload.payload if payload.payload is not None else payload.casesheet
    c = OPDCaseSheet(
        opd_id=payload.opd_id,
        user_id=user.id,
        hospital_id=o.hospital_id,
        doctor_id=o.doctor_id,
        patient_id=o.patient_id,
        sheet_type=payload.sheet_type or "medical",
        payload=cs_data,
        clinvoice_transaction_id=payload.clinvoice_transaction_id,
    )
    db.add(c)
    try:
        await db.commit()
        await db.refresh(c)
        return {"status_code": 201, "data": _serialize_case(c)}
    except IntegrityError:
        # Concurrent POST won — rollback our insert and treat as an update on the existing row.
        await db.rollback()
        existing = (await db.execute(select(OPDCaseSheet).where(OPDCaseSheet.opd_id == payload.opd_id))).scalars().first()
        if not existing:
            raise
        existing = await _apply_updates(existing)
        return {"status_code": 200, "data": _serialize_case(existing)}


@case_router.patch("/update")
async def patch_case_sheet(payload: CaseSheetIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    c = (await db.execute(select(OPDCaseSheet).where(OPDCaseSheet.opd_id == payload.opd_id, OPDCaseSheet.user_id == user.id))).scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Case sheet not found — POST one first")
    if payload.sheet_type:
        c.sheet_type = payload.sheet_type
    cs_data = payload.payload if payload.payload is not None else payload.casesheet
    if cs_data is not None:
        c.payload = cs_data
    if payload.clinvoice_transaction_id is not None:
        c.clinvoice_transaction_id = payload.clinvoice_transaction_id
    await db.commit()
    await db.refresh(c)
    return {"status_code": 200, "data": _serialize_case(c)}


@case_router.get("/{opd_id}")
async def get_case_sheet(opd_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    c = (await db.execute(select(OPDCaseSheet).where(OPDCaseSheet.opd_id == opd_id, OPDCaseSheet.user_id == user.id))).scalars().first()
    if not c:
        return {"status_code": 200, "data": None}
    return {"status_code": 200, "data": _serialize_case(c)}
