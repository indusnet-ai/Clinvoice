from fastapi import FastAPI, Security, HTTPException, status, Depends
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.database import get_db  
from db.models import APIKey  
from db import models

import logging

logger = logging.getLogger(__name__)

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True) # Set to True

async def get_api_key(
    api_key: str = Security(api_key_header),
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates and validates the API key provided in the request header.
    """
    try:
        result = await db.execute(
            select(models.APIKey).filter(models.APIKey.key == api_key)
        )
        key_record = result.scalars().first()
    except Exception as e:
        logger.error(f"Database error during API key validation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while validating the API key."
        )

    if key_record is None:
        # Raise 401 Unauthorized for an invalid key
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key is invalid. Please provide a valid API key"
        )

    return key_record


