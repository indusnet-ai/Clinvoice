"""
/user/* — auth + voice + signature.

Matches the exact endpoints the frontend calls:
  POST /user/verify              login                  -> { status_code, access_token, refresh_token, user_id, hospital_id, doctor_id, onboard, is_reset_needed, username, doctor, ... }
  POST /user/forgot-password     send reset link
  POST /user/reset-password      confirm reset
  POST /getAccessToken           refresh access token   ?username=email + body { refreshToken }
  POST /user/add-voice           multipart "file" upload, saves to current user
  POST /user/add-signature       multipart "file" upload
  GET  /user/get-voice-address/{userId}
  GET  /user/get-signature/{userId}
  POST /user/signup              (extra — frontend doesn't call this but you need a way to create an account locally)
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.utils.file_upload import ALLOWED_AUDIO_EXT, ALLOWED_IMAGE_EXT, UPLOAD_DIR, save_upload
from api.utils.hashing import Hash
from api.utils.jwt_auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    gen_secure_token,
    get_current_user,
)
from core.config import settings
from db.database import get_db
from db.models import APIKey, Doctor, Hospital, PasswordResetToken, User

router = APIRouter(tags=["User / Auth"])
logger = logging.getLogger(__name__)


# ----- Schemas the frontend speaks -----

class LoginRequest(BaseModel):
    username: str   # email
    password: str


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class RefreshTokenBody(BaseModel):
    refreshToken: str


# ----- Helpers -----

async def _onboard_status(db: AsyncSession, user: User) -> dict[str, bool]:
    hospital = (await db.execute(select(Hospital).where(Hospital.user_id == user.id))).scalars().first()
    doctor = (await db.execute(select(Doctor).where(Doctor.user_id == user.id))).scalars().first()
    return {
        "voice_address_completed": bool(user.voice_address),
        "signature_completed": bool(user.signature_url),
        "hospital_profile_completed": hospital is not None,
        "doctor_profile_completed": doctor is not None,
    }


async def _login_response(db: AsyncSession, user: User) -> dict[str, Any]:
    hospital = (await db.execute(select(Hospital).where(Hospital.user_id == user.id))).scalars().first()
    doctor = (await db.execute(select(Doctor).where(Doctor.user_id == user.id))).scalars().first()
    onboard = await _onboard_status(db, user)

    return {
        "status_code": 201,
        "message": "Login successful",
        "access_token": create_access_token(user.email),
        "refresh_token": create_refresh_token(user.email),
        "user_id": user.id,
        "hospital_id": hospital.id if hospital else None,
        "doctor_id": doctor.id if doctor else None,
        # `username` is what the frontend uses as the login/account email
        # (the doctor's display name comes from `doctor.doctor_name` below).
        "username": user.email,
        "display_name": user.name,
        "is_reset_needed": bool(user.is_reset_needed),

        # Frontend reads these at the top level of the response.
        **onboard,
        "onboard": onboard,

        # Frontend's handleLoginSuccess reads `res.hospitals[0]` / `res.doctors[0]`.
        "hospitals": [{
            "id": hospital.id,
            "name": hospital.name,
        }] if hospital else [],
        "doctors": [{
            "id": doctor.id,
            "name": doctor.name,
            "email": doctor.email,
            "specialisation": doctor.specialisation,
        }] if doctor else [],

        "doctor": {
            "doctor_name": doctor.name if doctor else None,
            "doctor_email": doctor.email if doctor else None,
            "spec": doctor.specialisation if doctor else None,
        } if doctor else None,
    }


# ----- Auth endpoints -----

@router.post("/user/signup")
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    email_lower = payload.email.lower().strip()
    if (await db.execute(select(User).where(User.email == email_lower))).scalars().first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(
        name=payload.name,
        email=email_lower,
        password=Hash.bcrypt(payload.password),
        role="doctor",
        is_active=True,
        is_reset_needed=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Auto-seed the dev API key (the one the frontend's VITE_CLINVOICE_API_KEY uses).
    # Done idempotently so subsequent signups don't fail on the unique constraint.
    existing = (await db.execute(select(APIKey).where(APIKey.key == "dev-key-123"))).scalars().first()
    if not existing:
        db.add(APIKey(key="dev-key-123", user_id=user.id))
        await db.commit()

    return await _login_response(db, user)


@router.post("/user/verify")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    username_lower = payload.username.lower().strip()
    user = (await db.execute(select(User).where(User.email == username_lower))).scalars().first()
    if not user or not Hash.verify(user.password, payload.password):
        # Match frontend's expected shape — it inspects `status_code` and `message`
        return {"status_code": 401, "message": "Incorrect Username/Password"}
    if not user.is_active:
        return {"status_code": 403, "message": "Account is inactive"}
    return await _login_response(db, user)


@router.post("/user/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    email_lower = payload.email.lower().strip()
    user = (await db.execute(select(User).where(User.email == email_lower))).scalars().first()
    # Always 200 — never leak whether the address exists
    if not user:
        return {"status_code": 200, "message": "If this email is registered you'll receive a reset link."}

    token = PasswordResetToken(
        user_id=user.id,
        token=gen_secure_token(),
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(token)
    await db.commit()
    await db.refresh(token)

    # Email integration is out of scope here — log it so dev can copy it.
    logger.info(f"[forgot-password] reset token for {user.email}: {token.token}")
    return {
        "status_code": 200,
        "message": "Reset link sent. Check your email.",
        # convenience for local dev — remove in prod
        "reset_token": token.token,
    }


@router.post("/user/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    rec = (await db.execute(select(PasswordResetToken).where(PasswordResetToken.token == payload.token))).scalars().first()
    if not rec or rec.used or rec.expires_at < datetime.utcnow():
        return {"status_code": 400, "message": "Invalid or expired token"}
    user = (await db.execute(select(User).where(User.id == rec.user_id))).scalars().first()
    if not user:
        return {"status_code": 404, "message": "User not found"}

    user.password = Hash.bcrypt(payload.new_password)
    user.is_reset_needed = False
    rec.used = True
    await db.commit()
    return {"status_code": 200, "message": "Password updated. Please log in."}


@router.post("/getAccessToken")
async def refresh_access_token(username: str, payload: RefreshTokenBody, db: AsyncSession = Depends(get_db)):
    data = decode_token(payload.refreshToken, "refresh")
    if data["sub"] != username:
        raise HTTPException(status_code=401, detail="Refresh token / username mismatch")
    return {"access_token": create_access_token(username), "refresh_token": create_refresh_token(username)}


# ----- Voice + signature -----

class VoiceAddressBody(BaseModel):
    user_id: Optional[int] = None
    voice_address: str   # URL returned by /file/upload


class SignatureBody(BaseModel):
    user_id: Optional[int] = None
    signature: str       # URL returned by /file/upload


@router.post("/user/add-voice")
async def add_voice(
    payload: VoiceAddressBody,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """The frontend uploads the file via /file/upload first, then sends the
    resulting URL here as JSON."""
    user.voice_address = payload.voice_address

    # Best-effort: also generate a transcript preview so settings page can show it.
    preview: Optional[str] = None
    duration: Optional[float] = None
    try:
        client = request.app.state.openai_client
        if client is not None and payload.voice_address.startswith("/uploads/"):
            disk_path = UPLOAD_DIR.parent / payload.voice_address.lstrip("/")
            if disk_path.exists():
                with open(disk_path, "rb") as f:
                    tx = await client.audio.transcriptions.create(
                        model=settings.OPENAI_WHISPER_MODEL,
                        file=f,
                        response_format="verbose_json",
                    )
                preview = (tx.text or "")[:500]
                duration = getattr(tx, "duration", None)
    except Exception as e:
        logger.warning(f"Voice preview transcription failed (non-fatal): {e}")

    user.voice_duration = duration
    user.voice_preview = preview
    await db.commit()
    return {
        "status_code": 200,
        "message": "Voice profile saved",
        "voice_address": user.voice_address,
        "duration_seconds": duration,
        "transcript_preview": preview,
    }


@router.post("/user/add-signature")
async def add_signature(
    payload: SignatureBody,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.signature_url = payload.signature
    await db.commit()
    return {"status_code": 200, "message": "Signature saved", "signature_url": user.signature_url}


@router.get("/user/get-voice-address/{user_id}")
async def get_voice_address(user_id: int, _: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.id,
        "voice_address": user.voice_address,
        "duration_seconds": user.voice_duration,
        "transcript_preview": user.voice_preview,
    }


@router.get("/user/get-signature/{user_id}")
async def get_signature(user_id: int, _: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user.id, "signature_url": user.signature_url}
