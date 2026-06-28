"""
Local-disk file upload helper.

Files go under <PROJECT_ROOT>/uploads/<subdir>/<uuid>.<ext> and are served via
the StaticFiles mount registered at /uploads in main.py.
"""
import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = PROJECT_ROOT / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


ALLOWED_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
ALLOWED_DOC_EXT = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_AUDIO_EXT = {".wav", ".mp3", ".webm", ".m4a", ".ogg"}
MAX_FILE_SIZE_MB = 25


async def save_upload(
    file: UploadFile,
    subdir: str,
    allowed_ext: Optional[set] = None,
    max_mb: int = MAX_FILE_SIZE_MB,
) -> str:
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if allowed_ext and ext not in allowed_ext:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type {ext}. Allowed: {sorted(allowed_ext)}",
        )

    target_dir = UPLOAD_DIR / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    fname = f"{uuid.uuid4().hex}{ext}"
    target = target_dir / fname

    content = await file.read()
    if len(content) > max_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (>{max_mb} MB)")

    with open(target, "wb") as f:
        f.write(content)

    return f"/uploads/{subdir}/{fname}"
