from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session
import logging
from fastapi.responses import PlainTextResponse
from db import models

from api.repository import icd

from api.utils.api_auth import get_api_key

#from db.database import get_db
#from db.models import User
from db.database import get_db


router = APIRouter()
logger = logging.getLogger(__name__)

tags=["Home"]



@router.get(
        '/',
        tags=tags
        )
async def home():
    return "ClinVoice AI"
    
    