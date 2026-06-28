from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status, Security, Request
from sqlalchemy.ext.asyncio import AsyncSession
import os
import logging
import tempfile
import shutil
import aiofiles
import time
import httpx
import asyncio
from typing import Dict, Any

from db import models
from db.database import get_db
from db.models import Transcript, UsageLog, APICallLog
from api.dependencies.upload_audio import validate_date_format, validate_audio_file
from api.utils.api_auth import get_api_key
from api.utils.cost import calculate_audio_cost, calculate_claude_cost
from core.config import settings
from services.utils.transcript_id import generate_transcript_id
from api.utils.schemas import MessageResponse
from api.utils.fix_audio import normalize_audio_format, FFmpegError

from services.vertex.claude_service import generate_service_async
from api.router.v1.docs import UPLOAD_AUDIO_EXAMPLE, get_v1_responses

router = APIRouter()
logger = logging.getLogger(__name__)

tags=["V1"]
summary = "Audio upload"
description = """
This endpoint allows you to upload a medical doctor-patient conversation audio file for transcription and processing.
"""

@router.post(
    "/upload_audio",
    tags=tags,
    summary=summary,
    description=description,
    responses=get_v1_responses(UPLOAD_AUDIO_EXAMPLE, is_flat=True)
)
async def upload_audio_v1(
    request: Request,
    conversation_file: UploadFile = Depends(validate_audio_file),
    date: str = Depends(validate_date_format),
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key)
) -> Dict[str, Any]:
    
    start_time = time.time()
    logger.info("--- V1 Request received ---")

    usage_log = UsageLog(
        user_id=api_key_record.user_id,
        api_key_id=api_key_record.id,
        endpoint="/v1/upload_audio"
    )
    db.add(usage_log)
    await db.commit()
    await db.refresh(usage_log)

    temp_dir = tempfile.mkdtemp()
    try:
        # Step 1: Save file
        original_audio_path = os.path.join(temp_dir, conversation_file.filename)
        async with aiofiles.open(original_audio_path, "wb") as out_file:
            content = await conversation_file.read()
            await out_file.write(content)

        # Step 2: Normalize audio
        processed_audio_path = await normalize_audio_format(original_audio_path)
        
        # Step 3: Transcription via OpenAI Whisper API
        duration_seconds, cost = await calculate_audio_cost(processed_audio_path, settings.USD_TO_INR_RATE)

        openai_client = request.app.state.openai_client
        if openai_client is None:
            raise HTTPException(status_code=500, detail="OpenAI client not initialized.")

        max_retries = 3
        segments = ""
        for attempt in range(1, max_retries + 1):
            try:
                with open(processed_audio_path, "rb") as f:
                    transcription = await openai_client.audio.transcriptions.create(
                        model=settings.OPENAI_WHISPER_MODEL,
                        file=f,
                        response_format="verbose_json",
                    )
                segments = transcription.text or ""
                break
            except Exception as e:
                if attempt == max_retries:
                    raise HTTPException(status_code=500, detail="Transcription failed.")
                await asyncio.sleep(2 * attempt)

        # Whisper token estimate: character-based approximation
        whisper_tokens = len(segments) // 4

        if not segments:
            raise HTTPException(status_code=400, detail="Transcription failed.")

        transcript_id = generate_transcript_id()
        api_call_log = APICallLog(
            user_id=api_key_record.user_id,
            api_key_id=api_key_record.id,
            endpoint="/v1/upload_audio",
            model_used=settings.OPENAI_WHISPER_MODEL,
            audio_duration=duration_seconds,
            cost=cost
        )
        db.add(api_call_log)

        # Step 4: Diarization with Claude
        claude_client = request.app.state.claude_client
        conversation_with_date = f"Conversation Date: {date}\n\n Conversation: {segments}"
        
        # Explicitly use the diarization prompt path
        conversation_text, input_tokens, output_tokens = await generate_service_async(
            conversation_with_date, 
            claude_client, 
            service="diarization",
            prompt_path="prompts/general/diarization_prompt.txt"
        )

        cost_claude = calculate_claude_cost(input_tokens, output_tokens, settings.USD_TO_INR_RATE)
        api_call_log_2 = APICallLog(
            user_id=api_key_record.user_id,
            api_key_id=api_key_record.id,
            endpoint="/v1/upload_audio",
            model_used=settings.OPENAI_MODEL,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost_claude
        )
        db.add(api_call_log_2)

        db_record = Transcript(
            transcript=conversation_text,
            transcript_id=transcript_id            
        )
        db.add(db_record)
        await db.commit()
        await db.refresh(db_record)

        usage_log.response_status = status.HTTP_200_OK
        usage_log.transcript_id = db_record.id
        api_call_log.transcript_id = db_record.id
        api_call_log_2.transcript_id = db_record.id
        await db.commit()

        # Credit calculation:
        #   - Whisper (transcription): len(text) // 4  (character-based token estimate)
        #   - Claude (diarization):    (input_tokens + output_tokens) // 30
        whisper_credits = whisper_tokens // 30
        claude_credits = (input_tokens + output_tokens) // 30
        credits_used = whisper_credits + claude_credits
        logger.info(
            f"V1 Upload: transcript_id={transcript_id}, whisper_tokens={whisper_tokens} ({whisper_credits} credits), "
            f"claude_tokens={input_tokens + output_tokens} ({claude_credits} credits), "
            f"total={credits_used}"
        )

        return {
            "message": "Processing completed successfully.",
            "Transcript_Id": transcript_id,
            "credits_used": credits_used
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in V1 upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir)
