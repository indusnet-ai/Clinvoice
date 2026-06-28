"""
Background Task Definitions

ARQ worker tasks for processing uploads and LLM generation jobs.
These tasks run in a separate worker process.
"""

import os
import logging
from typing import Any

from arq import ArqRedis
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from core.config import settings
from services.job_service import (
    update_job_progress, 
    complete_job, 
    fail_job,
    JobState
)

logger = logging.getLogger(__name__)


# Create async engine for worker (separate from main app)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    # Connection pool settings to prevent stale connection errors
    pool_pre_ping=True,    # Test connection before using
    pool_recycle=300,      # Recycle connections every 5 minutes
    pool_size=5,
    max_overflow=10,
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db_session() -> AsyncSession:
    """Create a new database session for worker tasks."""
    return AsyncSessionLocal()


async def process_generation_task(
    ctx: dict,
    job_id: str,
    service_type: str,
    transcript_id: str,
    user_id: int,
    api_key_id: int
):
    """
    Background task for LLM-based generation (FHIR, SNOMED, ICD, etc.).
    
    Args:
        ctx: ARQ context with Redis connection
        job_id: Unique job identifier
        service_type: Type of generation (fhir_bundle, snomed, icd, etc.)
        transcript_id: ID of the transcript to process
        user_id: User who initiated the job
        api_key_id: API key used for the request
    """
    db = await get_db_session()
    
    try:
        await update_job_progress(job_id, 10, f"Starting {service_type} generation...")
        
        # Import here to avoid circular imports
        from api.repository.generation_registry import SERVICE_REGISTRY, GenericGenerationService
        from sqlalchemy import select
        from db.models import Transcript, APIKey
        
        # Get transcript
        await update_job_progress(job_id, 20, "Fetching transcript...")
        result = await db.execute(select(Transcript).filter(Transcript.transcript_id == transcript_id))
        transcript = result.scalars().first()
        
        if not transcript:
            await fail_job(job_id, f"Transcript {transcript_id} not found", db)
            return
        
        # Get API key record
        result = await db.execute(select(APIKey).filter(APIKey.id == api_key_id))
        api_key_record = result.scalars().first()
        
        await update_job_progress(job_id, 40, f"Processing with {service_type}...")
        
        # Get service config
        config = SERVICE_REGISTRY.get(service_type)
        if not config:
            await fail_job(job_id, f"Unknown service type: {service_type}", db)
            return
        
        # Get Claude client from worker context (loaded in on_startup)
        claude_client = ctx.get('claude_client')
        if not claude_client and config.get('generator') != 'fhir_bundle':
            await fail_job(job_id, "Claude client not initialized in worker", db)
            return
        
        # Create service and generate
        service = GenericGenerationService(
            db=db,
            api_key_record=api_key_record,
            claude_client=claude_client,
            **config
        )
        
        await update_job_progress(job_id, 60, "Generating output...")
        
        # Call the generation
        result = await service.get_or_generate(transcript_id)
        
        await update_job_progress(job_id, 90, "Saving result...")
        
        # Complete the job
        await complete_job(job_id, result, db)
        
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.exception(f"Job {job_id} failed: {e}")
        await fail_job(job_id, str(e), db)
    finally:
        await db.close()


async def process_upload_task(
    ctx: dict,
    job_id: str,
    audio_path: str,
    user_id: int,
    api_key_id: int,
    date: str = None
):
    """
    Background task for audio upload and transcription.
    
    Args:
        ctx: ARQ context with Redis connection
        job_id: Unique job identifier
        audio_path: Path to the uploaded audio file
        user_id: User who initiated the job
        api_key_id: API key used for the request
        date: Optional date parameter
    """
    db = await get_db_session()
    
    try:
        await update_job_progress(job_id, 10, "Preparing transcription...")

        # Imports
        from services.utils.transcript_id import generate_transcript_id
        from services.vertex.service import generate_service
        from db.models import Transcript

        client = ctx.get('claude_client')  # AsyncOpenAI instance
        if client is None:
            await fail_job(job_id, "OpenAI client not initialized in worker", db)
            return

        await update_job_progress(job_id, 30, "Transcribing audio via OpenAI Whisper...")

        try:
            with open(audio_path, "rb") as f:
                transcription = await client.audio.transcriptions.create(
                    model=settings.OPENAI_WHISPER_MODEL,
                    file=f,
                    response_format="verbose_json",
                )
            segments = transcription.text or ""
        except Exception as e:
            await fail_job(job_id, f"OpenAI Whisper transcription failed: {e}", db)
            return

        if not segments:
            await fail_job(job_id, "No segments obtained from transcription", db)
            return
        
        await update_job_progress(job_id, 50, "Processing diarization...")

        # Process with OpenAI for diarization
        conversation_with_date = f"Conversation Date: {date}\n\n Conversation: {segments}" if date else segments

        transcript_text, input_tokens, output_tokens = await generate_service(
            conversation_with_date, client, service="diarization"
        )
        
        await update_job_progress(job_id, 70, "Saving transcript...")
        
        # Generate transcript ID and save
        transcript_id = generate_transcript_id()
        db_transcript = Transcript(
            transcript_id=transcript_id,
            transcript=transcript_text
        )
        db.add(db_transcript)
        await db.commit()
        await db.refresh(db_transcript)
        
        await update_job_progress(job_id, 90, "Finalizing...")
        
        # Complete the job
        result = {
            "transcript_id": transcript_id,
            "transcript": transcript_text
        }
        await complete_job(job_id, result, db)
        
        logger.info(f"Upload job {job_id} completed: {transcript_id}")
        
    except Exception as e:
        logger.exception(f"Upload job {job_id} failed: {e}")
        await fail_job(job_id, str(e), db)
    finally:
        await db.close()
        
        # Cleanup: Delete the temp audio file
        import os
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
                logger.info(f"Cleaned up temp file: {audio_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {audio_path}: {e}")


async def get_transcript_text(transcript_id: str, db) -> tuple[str, int]:
    """Fetch transcript text from database by transcript_id."""
    from sqlalchemy import select
    from db.models import Transcript
    
    result = await db.execute(
        select(Transcript).where(Transcript.transcript_id == transcript_id)
    )
    transcript = result.scalar_one_or_none()
    if not transcript:
        raise ValueError(f"Transcript with ID '{transcript_id}' not found.")
    return transcript.transcript, transcript.id


async def process_bundle_task(
    ctx: dict,
    job_id: str,
    bundle_type: str,
    transcript_id: str,
    user_id: int,
    api_key_id: int
):
    """
    Background task for FHIR V2 bundle generation from transcript ID.
    
    Args:
        ctx: ARQ context with Redis connection
        job_id: Unique job identifier
        bundle_type: Type of bundle (wellness, prescription, op_consult, immunization)
        transcript_id: ID of the transcript in the database
        user_id: User who initiated the job
        api_key_id: API key used for the request
    """
    db = await get_db_session()
    
    try:
        await update_job_progress(job_id, 10, f"Starting {bundle_type} bundle generation...")
        
        # Fetch conversation from database using transcript_id
        await update_job_progress(job_id, 20, "Fetching transcript...")
        conversation, transcript_db_id = await get_transcript_text(transcript_id, db)
        
        # Map bundle types to service functions
        BUNDLE_SERVICES = {
            "wellness": "services.nrces_fhir.wellness_bundle_service.create_wellness_bundle",
            "prescription": "services.nrces_fhir.prescription_bundle_service.create_prescription_bundle",
            "op_consult": "services.nrces_fhir.op_consult_bundle_service.create_op_consult_bundle",
            "immunization": "services.nrces_fhir.immunization_bundle_service.create_immunization_bundle",
        }
        
        if bundle_type not in BUNDLE_SERVICES:
            await fail_job(job_id, f"Unknown bundle type: {bundle_type}", db)
            return
        
        await update_job_progress(job_id, 30, "Loading service...")
        
        # Dynamically import the service function
        import importlib
        module_path, func_name = BUNDLE_SERVICES[bundle_type].rsplit(".", 1)
        module = importlib.import_module(module_path)
        create_bundle_func = getattr(module, func_name)
        
        await update_job_progress(job_id, 50, f"Generating {bundle_type} bundle...")
        
        # Call the bundle creation service - returns (bundle, input_tokens, output_tokens)
        result = await create_bundle_func(conversation_text=conversation)
        
        # Handle tuple return (bundle, input_tokens, output_tokens)
        input_tokens = 0
        output_tokens = 0
        if isinstance(result, tuple):
            bundle = result[0]
            input_tokens = result[1] if len(result) > 1 else 0
            output_tokens = result[2] if len(result) > 2 else 0
        else:
            bundle = result
        
        if isinstance(bundle, dict) and "error" in bundle:
            await fail_job(job_id, bundle["error"], db)
            return
        
        await update_job_progress(job_id, 90, "Finalizing...")
        
        # Log token usage for cost calculation
        if input_tokens or output_tokens:
            try:
                from db.models import APICallLog
                from core.config import settings
                api_call_log = APICallLog(
                    user_id=user_id,
                    transcript_id=transcript_db_id,
                    endpoint=f"/v1/{bundle_type}-record",
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    model_used=settings.OPENAI_MODEL,
                )
                db.add(api_call_log)
                await db.commit()
                logger.info(f"Bundle task {job_id} - Tokens: {input_tokens} in, {output_tokens} out")
            except Exception as e:
                logger.warning(f"Failed to log token usage: {e}")
        
        # Complete the job with ONLY the bundle (no tokens in response)
        await complete_job(job_id, bundle, db)
        logger.info(f"Bundle task {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Bundle task {job_id} failed: {e}", exc_info=True)
        await fail_job(job_id, str(e), db)
    finally:
        await db.close()


# ARQ Worker Configuration
class WorkerSettings:
    """ARQ worker settings."""
    
    # Import redis settings at class level
    from core.job_queue import get_redis_settings
    redis_settings = get_redis_settings()
    
    # Register task functions
    functions = [process_generation_task, process_upload_task, process_bundle_task]
    
    # Worker options
    max_jobs = 10
    job_timeout = 600  # 10 minutes max per job
    keep_result = 3600  # Keep results for 1 hour
    
    @staticmethod
    async def on_startup(ctx):
        """Called when worker starts. Initialize the OpenAI client."""
        logger.info("Worker starting...")
        from services.vertex.claude_init import init_async_anthropic_vertex

        # Single AsyncOpenAI client handles both Whisper and chat completions.
        # The key stays 'claude_client' for back-compat with existing task code.
        ctx['claude_client'] = init_async_anthropic_vertex()

        logger.info("Worker startup complete.")
    
    @staticmethod
    async def on_shutdown(ctx):
        """Called when worker shuts down."""
        logger.info("Worker shutting down...")

