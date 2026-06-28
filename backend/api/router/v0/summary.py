from fastapi import APIRouter, Depends, HTTPException, Security, status,Request
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import Session
import logging
from fastapi.responses import PlainTextResponse
from typing import Dict, Any
from db import models

from api.repository.generation_registry import view_summary

from api.utils.api_auth import get_api_key

#from db.database import get_db
#from db.models import User
from db.database import get_db


router = APIRouter()
logger = logging.getLogger(__name__)

tags=["SOAP notes (for all practices)"]
sumary="SOAP notes API"
description = """
This endpoint generates SOAP notes for a given medical transcript.

**How to use:**
- Provide a `transcript_id` as a query parameter.
- The response will be a JSON object containing SOAP notes.
"""

#response_model=SummaryResponse
responses={
            status.HTTP_200_OK: {
                "description": "SOAP notes generated successfully.",
                "content": {
                    "text/plain": {
                        "example": {
  "Subjective": [
    "Chief complaint of constant headache with nausea and fatigue",
    "Symptoms started 6 days ago and progressively worsening",
    "Previous treatment with over-the-counter pain medications provided minimal relief"
  ],
  
  "Objective": [
    "Patient presents with ongoing headache",
    "Associated symptoms include nausea and fatigue",
    "No documented vital signs or physical examination findings in the conversation"
  ],
  
  "Assessment": [
    "Persistent headache with associated symptoms",
    "Possible underlying vitamin deficiency or infection to be ruled out"
  ],
  
  "Plan": [
    "Prescribed medications:",
    "- Paracetamol 500mg twice daily after meals for 3 days (6 tablets)",
    "- Dolo 500mg twice daily after meals for 3 days (6 tablets)",
    "Complete blood count test ordered",
    "Lifestyle modifications:",
    "- Rest",
    "- Adequate hydration",
    "- Reduced screen time",
    "- Balanced diet with emphasis on greens, vegetables, fruits, and lean proteins",
    "Follow-up in 3 days",
    "Return sooner if symptoms worsen or don't improve"
  ]
}
                    }
                }
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

# from pydantic import BaseModel
# class SOAPNotesresponse(BaseModel):
#     soap_note: str

@router.get(
        '/SOAP_notes',
        response_class=PlainTextResponse,
        tags = tags,
        summary = sumary,
        description = description,
        responses = responses
        )
async def get_summary(
  request : Request,
  transcript_id : str, 
  db: AsyncSession = Depends(get_db),
  api_key_record: models.APIKey = Security(get_api_key)
  ) :
  """
    Generates SOAP notes for a specific transcript ID.

    :param transcript_id: The unique identifier for the transcript.
    :param db: The asynchronous database session.
    :param api_key_record: The authenticated API key record.
    :return: A dictionary mapped to SOAP notes.
    """
  return await view_summary(request,transcript_id,db,api_key_record)
  # try:

  #   #soap_summary = await s_summary.view_summary(transcript_id, db, api_key_record)
  #   #return {"summary":soap_summary}
  #   return await s_summary.view_summary(transcript_id,db,api_key_record)
  # except HTTPException as e:


  #     # Re-raise HTTPException to be handled by FastAPI's exception handler
  #   raise e
  # except Exception as e:
  #   print(4)

  #     # Log the unexpected error and return a generic 500 error
  #   raise HTTPException(
  #       status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
  #       detail="An unexpected error occurred while processing the request.",
  #   )


    
    
    