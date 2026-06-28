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
from typing import Dict

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

router = APIRouter()
logger = logging.getLogger(__name__)

tags=["Contextualization"]
summary = "Audio upload"
description = """
This endpoint allows you to upload a medical doctor-patient conversation audio file for transcription and processing.

**File Requirements:**
- **Format:** The file must be in `.wav` format.
- **Size:** Maximum file size is 25MB.
- **Content:** The audio should contain a clear doctor-patient conversation.

**Workflow:**
1.  Upload the `.wav` file.
2.  The system will process the audio, perform speaker diarization, and generate a transcript.
3.  A unique `transcript_id` is returned, which can be used to retrieve the transcript and other reports (e.g., SOAP notes, ICD codes).
"""

responses = {
    status.HTTP_200_OK: {
        "description": "File uploaded and processed successfully. Returns the unique transcript ID.",
        "content": {
            "application/json": {
                "example": {
                    "message": "Processing completed successfully.",
                    "Transcript_Id": "T-12345ABCDEFG"
                }
            }
        }
    },
    status.HTTP_400_BAD_REQUEST: {
        "description": "Invalid request due to file format, size, or content.",
        "content": {
            "application/json": {
                "examples": {
                    "File too large": {
                        "value": {"detail": "File too large. Maximum allowed size is 25MB."}
                    },
                    "Invalid file format": {
                        "value": {"detail": "Invalid file format. Only '.wav' files are supported."}
                    },
                    "Improper audio content": {
                        "value": {"detail": "Please upload a proper audio conversation file."}
                    }
                }
            }
        }
    },
    status.HTTP_401_UNAUTHORIZED: {
        "description": "API Key is missing or invalid. Please provide a valid API key.",
    },
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "description": "An unexpected server error occurred during processing.",
    }
}

@router.post(
    "/upload_audio",
    tags=tags,
    summary=summary,
    description=description,
    responses=responses
)
async def upload_audio(
    request: Request, # Add Request to access app state
    conversation_file: UploadFile = Depends(validate_audio_file),
    date: str = Depends(validate_date_format),
    db: AsyncSession = Depends(get_db),
    api_key_record: models.APIKey = Security(get_api_key)
) -> Dict[str, str]:
    
    start_time = time.time()
    logger.info("--- Request received ---")

    usage_log = UsageLog(
        user_id=api_key_record.user_id,
        api_key_id=api_key_record.id,
        endpoint="/upload_audio"
    )
    db.add(usage_log)
    await db.commit()
    await db.refresh(usage_log)

    temp_dir = tempfile.mkdtemp()
    try:
        # Step 1: Save file
        t1 = time.time()
        original_audio_path = os.path.join(temp_dir, conversation_file.filename)
        async with aiofiles.open(original_audio_path, "wb") as out_file:
            content = await conversation_file.read()
            await out_file.write(content)
        logger.info(f"--- File saved in {time.time() - t1:.4f} seconds ---")

        # Step 2: Normalize audio
        t2 = time.time()
        try:
            processed_audio_path = await normalize_audio_format(original_audio_path)
        except FFmpegError as e:
            logger.error(f"Audio normalization failed: {e}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Audio processing failed.")
        logger.info(f"--- Audio normalized in {time.time() - t2:.4f} seconds ---")
        
        # Step 3: Transcription via OpenAI Whisper API
        t3 = time.time()
        duration_seconds, cost = await calculate_audio_cost(processed_audio_path, settings.USD_TO_INR_RATE)

        openai_client = request.app.state.openai_client
        if openai_client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI client not initialized."
            )

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
                seg_count = len(getattr(transcription, "segments", []) or [])
                logger.info(f"OpenAI Whisper returned {seg_count} segments (attempt {attempt})")
                break
            except Exception as e:
                logger.warning(f"Whisper attempt {attempt}/{max_retries} failed: {e}")
                if attempt == max_retries:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Transcription service unavailable. Please try again."
                    )
                await asyncio.sleep(5 * attempt)
        logger.info(f"--- Transcription finished in {time.time() - t3:.4f} seconds ---")

        if not segments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio transcription failed. The audio might be silent or invalid."
            )

        transcript_id = generate_transcript_id()
        api_call_log = APICallLog(
            user_id=api_key_record.user_id,
            api_key_id=api_key_record.id,
            endpoint="/upload_audio",
            model_used=settings.OPENAI_WHISPER_MODEL,
            audio_duration=duration_seconds,
            cost=cost
        )
        db.add(api_call_log)
        await db.commit()
        await db.refresh(api_call_log)

        # Step 4: Diarization with Claude
        t4 = time.time()
        claude_client = request.app.state.claude_client
        conversation = str(segments)
        conversation_with_date = f"Conversation Date: {date}\n\n Conversation: {conversation}"
        
        conversation_text, input_tokens, output_tokens = await generate_service_async(
            conversation_with_date,
            claude_client,
            service="diarization",
            prompt_path="prompts/general/diarization_prompt.txt"
        )
        logger.info(f"--- Claude diarization finished in {time.time() - t4:.4f} seconds ---")

        if "Error:" in conversation_text or output_tokens == 0:
            logger.error(f"Claude service failed or returned no output. Response: {conversation_text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred during AI processing."
            )

        cost = calculate_claude_cost(input_tokens, output_tokens, settings.USD_TO_INR_RATE)
        api_call_log_2 = APICallLog(
            user_id=api_key_record.user_id,
            api_key_id=api_key_record.id,
            endpoint="/upload_audio",
            model_used=settings.OPENAI_MODEL,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost
        )
        db.add(api_call_log_2)
        await db.commit()
        await db.refresh(api_call_log_2)

        logger.info("Transcription and diarization completed successfully.")

        db_record = Transcript(
            transcript=conversation_text,
            transcript_id=transcript_id            
        )
        db.add(db_record)
        await db.commit()
        await db.refresh(db_record)

        usage_log.response_status = status.HTTP_200_OK
        usage_log.transcript_id = db_record.id
        api_call_log.response_status = status.HTTP_200_OK
        api_call_log.transcript_id = db_record.id
        api_call_log_2.response_status = status.HTTP_200_OK
        api_call_log_2.transcript_id = db_record.id
        await db.commit()

        return {
            "message": "Processing completed successfully.",
            "Transcript_Id": transcript_id
        }

    except HTTPException as http_exc:
        usage_log.response_status = http_exc.status_code
        usage_log.error_message = http_exc.detail
        await db.commit()
        raise http_exc
        
    except Exception as e:
        usage_log.response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        usage_log.error_message = str(e)
        if 'db_record' in locals():
            usage_log.transcript_id = db_record.id
        await db.commit()
        logger.error(f"Error processing audio: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")
    finally:
        shutil.rmtree(temp_dir)
        logger.info(f"--- Total request time: {time.time() - start_time:.4f} seconds ---")
