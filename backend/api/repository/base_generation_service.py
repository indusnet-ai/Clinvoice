"""
Base Generation Service

Provides a reusable base class for get-or-generate pattern with:
- Automatic usage logging
- Automatic transcript lookup  
- Automatic cache check
- Automatic cost logging
- Single database commit (instead of 5-6)
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Optional, Any, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
import logging

from db.models import Transcript, UsageLog, APICallLog
from core.config import settings
from api.utils.cost import calculate_claude_cost

logger = logging.getLogger(__name__)

T = TypeVar('T')  # Result type


class BaseGenerationService(ABC, Generic[T]):
    """
    Base service for get-or-generate pattern.
    
    Handles all common operations automatically:
    - Usage logging
    - Transcript lookup
    - Cache check
    - Cost logging
    - Single database commit
    
    Subclasses only need to implement the generate() method.
    """
    
    def __init__(
        self,
        db: AsyncSession,
        api_key_record,
        endpoint: str,
        model_class,           # e.g., FHIRBundle, SnomedCTCode
        result_field: str,     # e.g., "fhir_bundle", "snomed_ct"
    ):
        self.db = db
        self.api_key_record = api_key_record
        self.endpoint = endpoint
        self.model_class = model_class
        self.result_field = result_field
        
        # Track for final commit
        self._usage_log: Optional[UsageLog] = None
        self._api_call_log: Optional[APICallLog] = None
        self._transcript: Optional[Transcript] = None
    
    async def get_or_generate(self, transcript_id: str, **kwargs) -> T:
        """
        Main entry point. Returns cached result or generates new one.
        Uses single transaction for all DB operations.
        
        Args:
            transcript_id: The unique transcript identifier
            **kwargs: Additional arguments passed to generate()
            
        Returns:
            The generated or cached result
            
        Raises:
            HTTPException: 404 if transcript not found, 500 for internal errors
        """
        # Create usage log (don't commit yet)
        self._usage_log = UsageLog(
            user_id=self.api_key_record.user_id,
            api_key_id=self.api_key_record.id,
            endpoint=self.endpoint
        )
        self.db.add(self._usage_log)
        
        try:
            # 1. Get transcript
            self._transcript = await self._get_transcript(transcript_id)
            
            # 2. Check cache
            cached = await self._get_cached(self._transcript.id)
            if cached is not None:
                logger.info(f"Returning cached result for transcript_id: {transcript_id}")
                return await self._finalize_success(cached, from_cache=True)
            
            # 3. Generate new result
            logger.info(f"Generating new result for transcript_id: {transcript_id}")
            result, input_tokens, output_tokens = await self.generate(
                self._transcript.transcript, **kwargs
            )
            
            logger.info(f"Generation complete. Tokens - Input: {input_tokens}, Output: {output_tokens}")
            
            # 4. Save result
            new_entry = self.model_class(
                **{self.result_field: result},
                transcript_id=self._transcript.id
            )
            self.db.add(new_entry)
            
            # 5. Log API cost
            cost = calculate_claude_cost(
                input_tokens, output_tokens, settings.USD_TO_INR_RATE
            )
            self._api_call_log = APICallLog(
                user_id=self.api_key_record.user_id,
                api_key_id=self.api_key_record.id,
                endpoint=self.endpoint,
                model_used=settings.CLAUDE_MODEL_NAME,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost=cost,
                transcript_id=self._transcript.id,
                response_status=200
            )
            self.db.add(self._api_call_log)
            
            logger.info(f"Result saved for transcript_id: {transcript_id}")
            return await self._finalize_success(result, from_cache=False)
            
        except HTTPException as e:
            await self._finalize_error(e)
            raise
            
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            await self._finalize_error(e)
            raise HTTPException(status_code=500, detail="Internal server error")
    
    @abstractmethod
    async def generate(self, transcript_text: str, **kwargs) -> Tuple[T, int, int]:
        """
        Subclasses implement this to generate their specific result.
        
        Args:
            transcript_text: The transcript content
            **kwargs: Additional arguments
            
        Returns:
            Tuple of (result, input_tokens, output_tokens)
        """
        pass
    
    async def _get_transcript(self, transcript_id: str) -> Transcript:
        """Fetch transcript from database."""
        result = await self.db.execute(
            select(Transcript).filter(Transcript.transcript_id == transcript_id)
        )
        transcript = result.scalars().first()
        
        if not transcript:
            logger.error(f"Transcript with id {transcript_id} not found in database.")
            raise HTTPException(
                status_code=404, 
                detail="Transcript not found. The provided transcript_id does not exist"
            )
        
        logger.info(f"Transcript with id {transcript_id} found in database.")
        return transcript
    
    async def _get_cached(self, transcript_db_id: int) -> Optional[T]:
        """Check if result is already cached in database."""
        result = await self.db.execute(
            select(self.model_class).filter(
                self.model_class.transcript_id == transcript_db_id
            )
        )
        cached = result.scalars().first()
        
        if cached:
            return getattr(cached, self.result_field)
        return None
    
    async def _finalize_success(self, result: T, from_cache: bool) -> T:
        """
        Finalize successful request with single commit.
        Updates usage log and commits all pending changes.
        """
        self._usage_log.response_status = 200
        self._usage_log.transcript_id = self._transcript.id
        
        await self.db.commit()  # ✅ SINGLE COMMIT for all operations
        
        return result
    
    async def _finalize_error(self, error: Exception) -> None:
        """
        Log error and commit usage log.
        Ensures error is recorded even on failure.
        """
        status_code = getattr(error, 'status_code', 500)
        error_msg = str(getattr(error, 'detail', str(error)))
        
        self._usage_log.response_status = status_code
        self._usage_log.error_message = error_msg[:500]  # Truncate long messages
        
        if self._transcript:
            self._usage_log.transcript_id = self._transcript.id
        
        await self.db.commit()  # Commit error log
