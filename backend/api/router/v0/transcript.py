from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from typing import Dict, Any
from fastapi.responses import PlainTextResponse

#from db.database import get_db
#from db.models import User
from db.database import get_db
from db import models

from api.repository import transcript
from api.utils.api_auth import get_api_key

router = APIRouter()
logger = logging.getLogger(__name__)

tags=["Contextualization"]
summary = "Transcription"
description = """
This endpoint allows you to retrieve the full text of a medical transcript using its transcript ID.

**How to use:**
- Provide a `transcript_id` as a query parameter in your request.
- The response will be a JSON object containing the full transcript text.
"""

responses = {
    status.HTTP_200_OK: {
        "description": "Transcript retrieved successfully.",
        "content": {
            "application/json": {
                "example": {
                    "transcript": {
                        "DOCTOR": "Can you tell me about your main problem?",
                        "PATIENT 1": "I have a constant headache, feel nauseous, and very tired.",
                    }
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

# models.py or schemas.py
from pydantic import BaseModel
class TranscriptResponse(BaseModel):
    transcript: str

@router.get(
    "/transcript",
    tags=tags,
    summary=summary,
    description=description,
    responses=responses,
    response_model=TranscriptResponse
)
async def get_transcript_by_id(
    transcript_id: str,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key),
) :
    """
    Retrieves the transcript for a given transcript ID.

    :param transcript_id: The unique identifier for the transcript.
    :param db: The asynchronous database session.
    :param api_key_record: The authenticated API key record.
    :return: A dictionary containing the transcript text.
    """
    try:
        #transcript_data = await transcript.get_transcript(transcript_id, db, api_key_record)
        return await transcript.get_transcript(transcript_id, db, api_key_record)
        #return {"transcript": transcript_data}
    except HTTPException as e:
        # Re-raise HTTPException to be handled by FastAPI's exception handler
        raise e
    except Exception as e:
        # Log the unexpected error and return a generic 500 error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the request.",
        )