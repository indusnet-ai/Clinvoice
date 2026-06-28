"""
Job Service

Manages async job lifecycle: creation, status updates, and result retrieval.
Uses Redis for fast state storage and PostgreSQL for persistence.
"""

import json
import uuid
import logging
from datetime import datetime
from typing import Any, Optional
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.job_queue import get_redis_pool
from db.models import Job

logger = logging.getLogger(__name__)


class JobState(str, Enum):
    """Possible job states."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class JobType(str, Enum):
    """Supported job types."""
    UPLOAD = "upload"
    FHIR_BUNDLE = "fhir_bundle"
    SNOMED = "snomed"
    ICD = "icd"
    SOAP_NOTES = "soap_notes"
    MEDICAL_REPORT = "medical_report"
    MEDICAL_REPORT_V1 = "medical_report_v1"
    DENTAL_MEDICAL_REPORT = "dental_medical_report"


def _redis_key(job_id: str) -> str:
    """Generate Redis key for job status."""
    return f"job:{job_id}"


async def create_job(
    job_type: str,
    user_id: int,
    api_key_id: int,
    params: dict,
    db: AsyncSession
) -> str:
    """
    Create a new job and store in both Redis and DB.
    
    Returns:
        job_id: Unique identifier for the job
    """
    job_id = str(uuid.uuid4())
    
    # Store in database for persistence
    db_job = Job(
        id=job_id,
        job_type=job_type,
        status=JobState.PENDING.value,
        progress=0,
        params=params,
        user_id=user_id,
        api_key_id=api_key_id,
    )
    db.add(db_job)
    await db.commit()
    
    # Store in Redis for fast access
    redis = await get_redis_pool()
    job_data = {
        "job_id": job_id,
        "job_type": job_type,
        "state": JobState.PENDING.value,
        "progress": 0,
        "message": "Job queued",
        "created_at": datetime.utcnow().isoformat(),
    }
    await redis.set(_redis_key(job_id), json.dumps(job_data), ex=86400)  # 24h TTL
    
    logger.info(f"Created job {job_id} of type {job_type}")
    return job_id


async def get_job_status(job_id: str) -> Optional[dict]:
    """Get current job status from Redis."""
    redis = await get_redis_pool()
    data = await redis.get(_redis_key(job_id))
    if data:
        return json.loads(data)
    return None


async def update_job_progress(
    job_id: str,
    progress: int,
    message: str,
    state: JobState = JobState.PROCESSING
):
    """Update job progress in Redis (for SSE streaming)."""
    redis = await get_redis_pool()
    current = await get_job_status(job_id)
    
    if current:
        current["progress"] = progress
        current["message"] = message
        current["state"] = state.value
        current["updated_at"] = datetime.utcnow().isoformat()
        await redis.set(_redis_key(job_id), json.dumps(current), ex=86400)
        
        # Publish for SSE subscribers
        await redis.publish(f"job_updates:{job_id}", json.dumps({
            "progress": progress,
            "message": message,
            "state": state.value,
        }))


async def complete_job(
    job_id: str,
    result: Any,
    db: AsyncSession
):
    """Mark job as complete and store result."""
    redis = await get_redis_pool()
    current = await get_job_status(job_id)
    
    if current:
        current["state"] = JobState.COMPLETE.value
        current["progress"] = 100
        current["message"] = "Complete"
        current["completed_at"] = datetime.utcnow().isoformat()
        await redis.set(_redis_key(job_id), json.dumps(current), ex=86400)
        
        # Store result separately (may be large)
        await redis.set(f"job_result:{job_id}", json.dumps(result), ex=86400)
        
        # Publish completion
        await redis.publish(f"job_updates:{job_id}", json.dumps({
            "state": JobState.COMPLETE.value,
            "progress": 100,
            "message": "Complete",
        }))
    
    # Update database
    stmt = select(Job).where(Job.id == job_id)
    db_result = await db.execute(stmt)
    db_job = db_result.scalar_one_or_none()
    if db_job:
        db_job.status = JobState.COMPLETE.value
        db_job.progress = 100
        db_job.result = result if isinstance(result, dict) else {"data": result}
        db_job.completed_at = datetime.utcnow()
        await db.commit()
    
    logger.info(f"Job {job_id} completed")


async def fail_job(
    job_id: str,
    error: str,
    db: AsyncSession
):
    """Mark job as failed."""
    # Log detailed error internally
    logger.error(f"Job {job_id} failed: {error}")
    
    redis = await get_redis_pool()
    current = await get_job_status(job_id)
    
    if current:
        current["state"] = JobState.FAILED.value
        current["message"] = "Job failed"  # Generic message for client
        current["completed_at"] = datetime.utcnow().isoformat()
        await redis.set(_redis_key(job_id), json.dumps(current), ex=86400)
        
        # Publish failure
        await redis.publish(f"job_updates:{job_id}", json.dumps({
            "state": JobState.FAILED.value,
            "message": error,
        }))
    
    # Update database
    stmt = select(Job).where(Job.id == job_id)
    db_result = await db.execute(stmt)
    db_job = db_result.scalar_one_or_none()
    if db_job:
        db_job.status = JobState.FAILED.value
        db_job.error = error
        db_job.completed_at = datetime.utcnow()
        await db.commit()
    
    logger.error(f"Job {job_id} failed: {error}")


async def get_job_result(job_id: str) -> Optional[Any]:
    """Get job result from Redis."""
    redis = await get_redis_pool()
    data = await redis.get(f"job_result:{job_id}")
    if data:
        return json.loads(data)
    return None
