from fastapi import APIRouter, Depends, HTTPException, Security, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import Dict, Any

from db import models
from db.database import get_db
from api.utils.api_auth import get_api_key
from api.repository.generation_registry import extract_medical_report_v1_with_tokens
from api.router.v1.docs import MEDICAL_REPORT_EXAMPLE, get_v1_responses

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get(
    "/medical_report",
    tags=["V1"],
    summary="Generate medical report",
    description="Extracts structured medical report data from a transcript.",
    responses=get_v1_responses(MEDICAL_REPORT_EXAMPLE)
)
async def generate_medical_report_v1(
    request: Request,
    transcript_id: str,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key)
):
    """
    Generates medical report for a specific transcript ID.
    """
    try:
        result, total_tokens = await extract_medical_report_v1_with_tokens(
            request, transcript_id, db, api_key_record
        )

        # Credit calculation — new formula: credits = total_tokens // 30
        credits_used = total_tokens // 30
        logger.info(f"V1 Medical Report: transcript_id={transcript_id}, total_tokens={total_tokens}, credits_used={credits_used}")

        return {
            "result": result,
            "credits_used": credits_used
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating medical report v1: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
