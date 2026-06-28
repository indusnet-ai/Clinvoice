"""
FHIR Bundles Router

Endpoints for FHIR bundle generation from transcripts.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Security, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.database import get_db
from db import models
from db.models import (
    Transcript, 
    WellnessBundle, 
    PrescriptionBundle, 
    OPConsultBundle, 
    ImmunizationBundle,
    UsageLog,
    APICallLog
)
from api.utils.api_auth import get_api_key
from api.repository.generation_registry import get_fhir_bundle
from api.utils.cost import calculate_claude_cost
from core.config import settings
from services.nrces_fhir.wellness_bundle_service import create_wellness_bundle
from services.nrces_fhir.prescription_bundle_service import create_prescription_bundle
from services.nrces_fhir.op_consult_bundle_service import create_op_consult_bundle
from services.nrces_fhir.immunization_bundle_service import create_immunization_bundle

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_transcript_text(transcript_id: str, db: AsyncSession) -> tuple[str, int]:
    """Fetch transcript text and DB id from database by transcript_id."""
    result = await db.execute(
        select(Transcript).where(Transcript.transcript_id == transcript_id)
    )
    transcript = result.scalar_one_or_none()
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transcript with ID '{transcript_id}' not found."
        )
    return transcript.transcript, transcript.id


# ============================================================================
# Legacy FHIR Bundle (from transcript)
# ============================================================================

@router.get(
    "/fhir-bundle",
    response_class=JSONResponse,
    tags=["FHIR Bundle"],
    summary="Get FHIR Bundle from Transcript",
    description="Generates FHIR Bundle for a given medical transcript ID.",
    responses={
        200: {"description": "FHIR Bundle generated successfully"},
        401: {"description": "API Key is missing or invalid"},
        404: {"description": "Transcript not found"},
        500: {"description": "Internal server error"},
    }
)
async def get_fhir(
    request: Request,
    transcript_id: str,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key)
):
    """Generate FHIR bundle for a specific transcript ID."""
    try:
        return await get_fhir_bundle(request, transcript_id, db, api_key_record)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating FHIR bundle: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the request.",
        )


# ============================================================================
# NRCES FHIR Bundle Generation from Transcripts
# ============================================================================

@router.get(
    "/wellness-record",
    tags=["NRCES Bundles"],
    summary="Create Wellness Record Bundle",
    description="Creates a FHIR Wellness Record Bundle from a transcript. Extracts vital signs, body measurements, and lifestyle observations.",
    responses={
        200: {"description": "Successfully created FHIR Wellness Record Bundle"},
        404: {"description": "Transcript not found"},
        500: {"description": "Internal Server Error"},
    },
)
async def create_wellness_record(
    transcript_id: str,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key),
):
    # Create usage log
    usage_log = UsageLog(
        user_id=api_key_record.user_id,
        api_key_id=api_key_record.id,
        endpoint="/wellness-record"
    )
    db.add(usage_log)
    
    try:
        logger.info(f"Processing wellness record for transcript: {transcript_id}")
        conversation_text, transcript_db_id = await get_transcript_text(transcript_id, db)
        bundle, input_tokens, output_tokens = await create_wellness_bundle(conversation_text=conversation_text)
        
        if isinstance(bundle, dict) and "error" in bundle:
            logger.warning(f"Bundle creation returned error: {bundle['error']}")
            raise HTTPException(status_code=400, detail=bundle["error"])
        
        # Calculate cost and log API call
        cost = calculate_claude_cost(input_tokens, output_tokens, settings.USD_TO_INR_RATE)
        api_call_log = APICallLog(
            user_id=api_key_record.user_id,
            api_key_id=api_key_record.id,
            endpoint="/wellness-record",
            model_used=settings.CLAUDE_MODEL_NAME,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            transcript_id=transcript_db_id,
            response_status=200
        )
        db.add(api_call_log)
        
        # Save bundle to database
        bundle_record = WellnessBundle(
            bundle_id=bundle.get("id"),
            bundle_data=bundle,
            api_key_id=api_key_record.id if api_key_record else None,
            transcript_id=transcript_db_id
        )
        db.add(bundle_record)
        
        # Update usage log
        usage_log.response_status = 200
        usage_log.transcript_id = transcript_db_id
        
        await db.commit()
        
        logger.info(f"Wellness record bundle created. Tokens - Input: {input_tokens}, Output: {output_tokens}, Cost: {cost}")
        return bundle
        
    except HTTPException as e:
        usage_log.response_status = e.status_code
        usage_log.error_message = str(e.detail)[:500]
        await db.commit()
        raise
    except Exception as e:
        logger.error(f"Error creating wellness record: {e}", exc_info=True)
        usage_log.response_status = 500
        usage_log.error_message = str(e)[:500]
        await db.commit()
        raise HTTPException(status_code=500, detail="Failed to create wellness record")


@router.get(
    "/prescription-record",
    tags=["NRCES Bundles"],
    summary="Create Prescription Record Bundle",
    description="Creates a FHIR Prescription Record Bundle from a transcript. Extracts medications, dosage instructions, and conditions.",
    responses={
        200: {"description": "Successfully created FHIR Prescription Record Bundle"},
        404: {"description": "Transcript not found"},
        500: {"description": "Internal Server Error"},
    },
)
async def create_prescription_record(
    transcript_id: str,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key),
):
    # Create usage log
    usage_log = UsageLog(
        user_id=api_key_record.user_id,
        api_key_id=api_key_record.id,
        endpoint="/prescription-record"
    )
    db.add(usage_log)
    
    try:
        logger.info(f"Processing prescription record for transcript: {transcript_id}")
        conversation_text, transcript_db_id = await get_transcript_text(transcript_id, db)
        bundle, input_tokens, output_tokens = await create_prescription_bundle(conversation_text=conversation_text)
        
        if isinstance(bundle, dict) and "error" in bundle:
            logger.warning(f"Bundle creation returned error: {bundle['error']}")
            raise HTTPException(status_code=400, detail=bundle["error"])
        
        # Calculate cost and log API call
        cost = calculate_claude_cost(input_tokens, output_tokens, settings.USD_TO_INR_RATE)
        api_call_log = APICallLog(
            user_id=api_key_record.user_id,
            api_key_id=api_key_record.id,
            endpoint="/prescription-record",
            model_used=settings.CLAUDE_MODEL_NAME,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            transcript_id=transcript_db_id,
            response_status=200
        )
        db.add(api_call_log)
        
        # Save bundle to database
        bundle_record = PrescriptionBundle(
            bundle_id=bundle.get("id"),
            bundle_data=bundle,
            api_key_id=api_key_record.id if api_key_record else None,
            transcript_id=transcript_db_id
        )
        db.add(bundle_record)
        
        # Update usage log
        usage_log.response_status = 200
        usage_log.transcript_id = transcript_db_id
        
        await db.commit()
        
        logger.info(f"Prescription record bundle created. Tokens - Input: {input_tokens}, Output: {output_tokens}, Cost: {cost}")
        return bundle
        
    except HTTPException as e:
        usage_log.response_status = e.status_code
        usage_log.error_message = str(e.detail)[:500]
        await db.commit()
        raise
    except Exception as e:
        logger.error(f"Error creating prescription record: {e}", exc_info=True)
        usage_log.response_status = 500
        usage_log.error_message = str(e)[:500]
        await db.commit()
        raise HTTPException(status_code=500, detail="Failed to create prescription record")


@router.get(
    "/op-consult-record",
    tags=["NRCES Bundles"],
    summary="Create OP Consult Record Bundle",
    description="Creates a FHIR OP Consult Record Bundle from a transcript. Extracts allergies, conditions, procedures, medications, and more.",
    responses={
        200: {"description": "Successfully created FHIR OP Consult Record Bundle"},
        404: {"description": "Transcript not found"},
        500: {"description": "Internal Server Error"},
    },
)
async def create_op_consult_record(
    transcript_id: str,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key),
):
    # Create usage log
    usage_log = UsageLog(
        user_id=api_key_record.user_id,
        api_key_id=api_key_record.id,
        endpoint="/op-consult-record"
    )
    db.add(usage_log)
    
    try:
        logger.info(f"Processing OP consult record for transcript: {transcript_id}")
        conversation_text, transcript_db_id = await get_transcript_text(transcript_id, db)
        bundle, input_tokens, output_tokens = await create_op_consult_bundle(conversation_text=conversation_text)
        
        if isinstance(bundle, dict) and "error" in bundle:
            logger.warning(f"Bundle creation returned error: {bundle['error']}")
            raise HTTPException(status_code=400, detail=bundle["error"])
        
        # Calculate cost and log API call
        cost = calculate_claude_cost(input_tokens, output_tokens, settings.USD_TO_INR_RATE)
        api_call_log = APICallLog(
            user_id=api_key_record.user_id,
            api_key_id=api_key_record.id,
            endpoint="/op-consult-record",
            model_used=settings.CLAUDE_MODEL_NAME,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            transcript_id=transcript_db_id,
            response_status=200
        )
        db.add(api_call_log)
        
        # Save bundle to database
        bundle_record = OPConsultBundle(
            bundle_id=bundle.get("id"),
            bundle_data=bundle,
            api_key_id=api_key_record.id if api_key_record else None,
            transcript_id=transcript_db_id
        )
        db.add(bundle_record)
        
        # Update usage log
        usage_log.response_status = 200
        usage_log.transcript_id = transcript_db_id
        
        await db.commit()
        
        logger.info(f"OP consult record bundle created. Tokens - Input: {input_tokens}, Output: {output_tokens}, Cost: {cost}")
        return bundle
        
    except HTTPException as e:
        usage_log.response_status = e.status_code
        usage_log.error_message = str(e.detail)[:500]
        await db.commit()
        raise
    except Exception as e:
        logger.error(f"Error creating OP consult record: {e}", exc_info=True)
        usage_log.response_status = 500
        usage_log.error_message = str(e)[:500]
        await db.commit()
        raise HTTPException(status_code=500, detail="Failed to create OP consult record")


@router.get(
    "/immunization-record",
    tags=["NRCES Bundles"],
    summary="Create Immunization Record Bundle",
    description="Creates a FHIR Immunization Record Bundle from a transcript. Extracts vaccine details and recommendations.",
    responses={
        200: {"description": "Successfully created FHIR Immunization Record Bundle"},
        404: {"description": "Transcript not found"},
        500: {"description": "Internal Server Error"},
    },
)
async def create_immunization_record(
    transcript_id: str,
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key),
):
    # Create usage log
    usage_log = UsageLog(
        user_id=api_key_record.user_id,
        api_key_id=api_key_record.id,
        endpoint="/immunization-record"
    )
    db.add(usage_log)
    
    try:
        logger.info(f"Processing immunization record for transcript: {transcript_id}")
        conversation_text, transcript_db_id = await get_transcript_text(transcript_id, db)
        bundle, input_tokens, output_tokens = await create_immunization_bundle(conversation_text=conversation_text)
        
        if isinstance(bundle, dict) and "error" in bundle:
            logger.warning(f"Bundle creation returned error: {bundle['error']}")
            raise HTTPException(status_code=400, detail=bundle["error"])
        
        # Calculate cost and log API call
        cost = calculate_claude_cost(input_tokens, output_tokens, settings.USD_TO_INR_RATE)
        api_call_log = APICallLog(
            user_id=api_key_record.user_id,
            api_key_id=api_key_record.id,
            endpoint="/immunization-record",
            model_used=settings.CLAUDE_MODEL_NAME,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            transcript_id=transcript_db_id,
            response_status=200
        )
        db.add(api_call_log)
        
        # Save bundle to database
        bundle_record = ImmunizationBundle(
            bundle_id=bundle.get("id"),
            bundle_data=bundle,
            api_key_id=api_key_record.id if api_key_record else None,
            transcript_id=transcript_db_id
        )
        db.add(bundle_record)
        
        # Update usage log
        usage_log.response_status = 200
        usage_log.transcript_id = transcript_db_id
        
        await db.commit()
        
        logger.info(f"Immunization record bundle created. Tokens - Input: {input_tokens}, Output: {output_tokens}, Cost: {cost}")
        return bundle
        
    except HTTPException as e:
        usage_log.response_status = e.status_code
        usage_log.error_message = str(e.detail)[:500]
        await db.commit()
        raise
    except Exception as e:
        logger.error(f"Error creating immunization record: {e}", exc_info=True)
        usage_log.response_status = 500
        usage_log.error_message = str(e)[:500]
        await db.commit()
        raise HTTPException(status_code=500, detail="Failed to create immunization record")
