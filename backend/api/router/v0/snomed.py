from fastapi import APIRouter, Depends, HTTPException, Security, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import Session
import logging
from fastapi.responses import PlainTextResponse
from typing import Dict, Any
from db import models

from api.repository.generation_registry import get_snomed_code

from api.utils.api_auth import get_api_key

#from db.database import get_db
#from db.models import User
from db.database import get_db


router = APIRouter()
logger = logging.getLogger(__name__)

tags = ["Terminology"]
summary = "SNOMED API"
description = """
This endpoint generates SNOMED CT codes for a given medical transcript.

**How to use:**
- Provide a `transcript_id` as a query parameter.
- The response will be a JSON object mapping medical terms to their corresponding SNOMED CT codes.
"""

responses = {
    status.HTTP_200_OK: {
        "description": "SNOMED CT codes generated successfully.",
        "content": {
            "text/plain": {
                "example": {
                    "headache": "25064002",
                    "nausea": "422587007",
                    "fatigue": "84229001",
                }
            }
        },
    },
    status.HTTP_401_UNAUTHORIZED: {
        "description": "API Key is missing or invalid. Please provide a valid API key.",
    },
    status.HTTP_404_NOT_FOUND: {
        "description": "Transcript not found. The provided `transcript_id` does not exist.",
    },
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "description": "An unexpected server error occurred.",
    },
}


@router.get(
    "/SNOMED_CT",
    tags=tags,
    summary=summary,
    description=description,
    responses=responses,
    response_class=PlainTextResponse
)
async def get_snomed(
    request : Request,
    transcript_id: str,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key),
):
    """
    Generates SNOMED CT codes for a specific transcript ID.

    :param transcript_id: The unique identifier for the transcript.
    :param db: The asynchronous database session.
    :param api_key_record: The authenticated API key record.
    :return: A dictionary of medical terms mapped to SNOMED CT codes.
    """
    try:
        #snomed_codes = await snomed.get_snomed_code(transcript_id, db, api_key_record)
        #return {"snomed_codes": snomed_codes}
        return await get_snomed_code(request,transcript_id, db, api_key_record)
    except HTTPException as e:
        # Re-raise HTTPException to be handled by FastAPI's exception handler
        raise e
    except Exception as e:
        # Log the unexpected error and return a generic 500 error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the request.",
        )
    
    