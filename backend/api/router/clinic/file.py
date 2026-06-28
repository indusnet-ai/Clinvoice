"""
Generic file upload/download endpoints.

The frontend's <FileInput> component calls these for hospital logo, certificate,
doctor avatar, signature — anything that becomes a URL-string stored in a form
field.

  POST /file/upload     multipart "file" -> { status, message, data: "<url>" }
  POST /file/download   body { value: "<url>" } -> { status, data: "<url>" }
"""
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from api.utils.file_upload import save_upload
from api.utils.jwt_auth import get_current_user
from db.models import User

router = APIRouter(prefix="/file", tags=["File Upload"])


class DownloadBody(BaseModel):
    value: str


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Saves the file to local disk and returns the public URL string."""
    url = await save_upload(file, subdir="misc", allowed_ext=None, max_mb=25)
    return {"status": 200, "message": "Uploaded", "data": url}


@router.post("/download")
async def download_file(payload: DownloadBody, user: User = Depends(get_current_user)):
    """
    The frontend uses this to resolve stored file URLs.
    We load the file from disk and return its base64 representation.
    """
    import base64
    from api.utils.file_upload import UPLOAD_DIR
    
    val = payload.value
    # Strip the leading "/uploads/" path segment to locate the file in the upload directory
    if val.startswith("/uploads/"):
        val = val[len("/uploads/"):]
        
    file_path = UPLOAD_DIR / val
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        encoded = base64.b64encode(file_bytes).decode("utf-8")
        return {"status": 200, "fileBase64": encoded}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")
