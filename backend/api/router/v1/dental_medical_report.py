from fastapi import APIRouter, Depends, HTTPException, Security, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import Dict, Any

from db import models
from db.database import get_db
from api.utils.api_auth import get_api_key
from api.repository.generation_registry import extract_dental_medical_report_v1_1_with_tokens
from api.router.v1.docs import DENTAL_REPORT_EXAMPLE, get_v1_responses

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get(
    "/dental_medical_report",
    tags=["V1"],
    summary="Generate dental medical report",
    description="Extracts structured dental medical report data from a transcript.",
    responses=get_v1_responses(DENTAL_REPORT_EXAMPLE)
)
async def generate_dental_medical_report_v1_1(
    request: Request,
    transcript_id: str,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key)
):
    """
    Generates dental medical report for a specific transcript ID.
    """
    try:
        result, total_tokens = await extract_dental_medical_report_v1_1_with_tokens(
            request, transcript_id, db, api_key_record
        )

        # Credit calculation — new formula: credits = total_tokens // 30
        credits_used = total_tokens // 30
        logger.info(f"V1 Dental Report: transcript_id={transcript_id}, total_tokens={total_tokens}, credits_used={credits_used}")

        return {
            "result": result,
            "credits_used": credits_used
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating dental medical report v1.1: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
