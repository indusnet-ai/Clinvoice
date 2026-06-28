from fastapi import APIRouter, Depends, HTTPException, Security, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import Dict, Any
import json
from pydantic import BaseModel, Field, field_validator
import pycountry

from db import models
from db.database import get_db
from api.utils.api_auth import get_api_key
from services.vertex.gemini_service import generate_gemini_service_async
from api.router.v1.docs import TRANSLATION_EXAMPLE, get_v1_responses

router = APIRouter()
logger = logging.getLogger(__name__)

class TranslationRequest(BaseModel):
    soap_note: Dict[str, Any]
    language_code: str = Field(..., min_length=2, max_length=10, description="ISO 639-1 or 639-2 language code", example="ta")

    @field_validator('language_code')
    @classmethod
    def validate_language_code(cls, v):
        code = v.strip().lower()
        # Check ISO 639-1 (2-letter) or ISO 639-2 (3-letter)
        lang = pycountry.languages.get(alpha_2=code) or pycountry.languages.get(alpha_3=code)
        if not lang:
            raise ValueError(f"Invalid language code: '{v}'. Please use a valid ISO 639-1 or 639-2 code (e.g., 'en', 'ta', 'hi').")
        return code

@router.post(
    "/translate_soap_note",
    tags=["V1"],
    summary="Translate SOAP notes",
    description="Translates SOAP notes into the target language",
    responses=get_v1_responses(TRANSLATION_EXAMPLE)
)
async def translate_soap_note_v1(
    request: Request,
    body: TranslationRequest,
    api_key_record: models.APIKey = Security(get_api_key)
):
    try:
        gemini_client = request.app.state.gemini_client
        if not gemini_client:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Gemini client not initialized")

        soap_note_json_str = json.dumps(body.soap_note)
        language_code = body.language_code.strip()
        
        output, input_tokens, output_tokens = await generate_gemini_service_async(
            soap_note_json_str, 
            gemini_client, 
            service="translation_soap_notes",
            prompt_path="prompts/v1/translation_format_1_prompt.txt",
            language_code=language_code
        )

        try:
            translated_json = json.loads(output)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse Gemini translation output as JSON: {output}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate valid translated JSON")

        # Credit calculation — new formula: credits = total_tokens // 30
        credits_used = (input_tokens + output_tokens) // 30
        logger.info(f"V1 Translation: language={language_code}, total_tokens={input_tokens + output_tokens}, credits_used={credits_used}")

        return {
            "result": translated_json,
            "credits_used": credits_used
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error translating SOAP notes: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
