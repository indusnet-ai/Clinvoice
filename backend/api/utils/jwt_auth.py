"""
JWT helpers + the `get_current_user` dependency.

Bearer-token auth is used by every clinic endpoint (frontend `service: "backend"`).
The legacy `X-API-Key` flow is unchanged and lives in `api_auth.py`.
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from db.database import get_db
from db.models import User

# tokenUrl is just an OpenAPI hint for Swagger's "Authorize" button.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user/verify", auto_error=False)


def create_access_token(subject: str, minutes: Optional[int] = None) -> str:
    exp = datetime.utcnow() + timedelta(minutes=minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": subject, "exp": exp, "type": "access"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": subject, "exp": exp, "type": "refresh"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str, expected_type: str = "access") -> dict:
    creds_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        data = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if data.get("type") != expected_type or not data.get("sub"):
            raise creds_exc
        return data
    except JWTError:
        raise creds_exc


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    payload = decode_token(token, "access")
    user = (await db.execute(select(User).where(User.email == payload["sub"]))).scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def gen_secure_token() -> str:
    return secrets.token_urlsafe(48)
