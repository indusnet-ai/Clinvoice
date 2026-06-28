from fastapi import APIRouter, Depends, HTTPException, Security, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from db import models
from db.database import get_db
from api.utils.api_auth import get_api_key
from api.repository.generation_registry import generate_clinical_summary_with_tokens
from api.router.v1.docs import CLINICAL_SUMMARY_EXAMPLE, get_v1_responses

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic Schemas ---

class ConsultationRecord(BaseModel):
    date: str
    soap_note: Dict[str, Any]

class SummaryRequest(BaseModel):
    history: List[ConsultationRecord]

# --- Documentation Example ---
# (Moved to docs.py)

@router.post(
    "/clinical_summary",
    tags=["V1"],
    summary="Generate clinical summary",
    description="Generates a longitudinal clinical summary from a provided history of SOAP notes.",
    responses=get_v1_responses(CLINICAL_SUMMARY_EXAMPLE, is_flat=True)
)
async def get_clinical_summary(
    request: Request,
    payload: SummaryRequest,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key)
):
    """
    Stateless endpoint to generate a clinical summary across multiple consultations.
    The history must be provided in the request body.
    """
    try:
        # 1. Format the history into a string context for the LLM
        formatted_history = ""
        for record in payload.history:
            formatted_history += f"Date: {record.date}\n"
            formatted_history += f"SOAP Note: {json.dumps(record.soap_note)}\n"
            formatted_history += "-" * 20 + "\n"

        # 2. Generate summary using LLM
        result, total_tokens = await generate_clinical_summary_with_tokens(
            request, formatted_history, api_key_record
        )

        # 3. Credit calculation (total_tokens // 30)
        credits_used = total_tokens // 30
        logger.info(f"V1 Clinical Summary: history_length={len(payload.history)}, total_tokens={total_tokens}, credits_used={credits_used}")

        # 4. Parse result if it's a string (LLM usually returns a string)
        if isinstance(result, str):
            try:
                # Clean up potential markdown wrappers
                clean_result = result.strip()
                if clean_result.startswith("```json"):
                    clean_result = clean_result[7:]
                if clean_result.endswith("```"):
                    clean_result = clean_result[:-3]
                result = json.loads(clean_result)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse AI response as JSON: {result}")
                # Fallback or error
                pass

        return {
            "result": result,
            "credits_used": credits_used
        }

    except Exception as e:
        logger.error(f"Error generating clinical summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
