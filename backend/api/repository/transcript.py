from sqlalchemy.orm import Session
from db import models
from api.utils import schemas
from api.utils.hashing import Hash
from fastapi import HTTPException, status
import logging
from db.models import Transcript, UsageLog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


logger = logging.getLogger(__name__)

async def get_transcript(transcript_id: str, db: AsyncSession, api_key_record):
    
    # 1. Create a UsageLog entry at the beginning of the function
    usage_log = UsageLog(
        user_id=api_key_record.user_id,
        api_key_id=api_key_record.id,
        endpoint="/get_transcript"
    )
    db.add(usage_log)
    await db.commit()
    await db.refresh(usage_log)
    
    try:
        # Get the transcript from the database
        result = await db.execute(
            select(models.Transcript).filter(models.Transcript.transcript_id == transcript_id)
        )
        db_transcript = result.scalars().first()

        # Check if the transcript exists
        if db_transcript is None:
            logger.warning(f"Transcript not found for ID: {transcript_id}")
            raise HTTPException(status_code=404, detail="Transcript not found. The provided transcript_id does not exist.")

        # 2. Update the UsageLog with a success status and the transcript ID
        usage_log.response_status = status.HTTP_200_OK
        usage_log.transcript_id = db_transcript.id
        await db.commit()

        # 3. Return the transcript text using the new column name `transcript_text`
        # as per the updated schema.
        return {"transcript": db_transcript.transcript}

    except HTTPException as e:
        # 4. Catch the HTTPException and update the UsageLog with the error status
        usage_log.response_status = e.status_code
        usage_log.error_message = e.detail
        await db.commit()
        raise e  # Re-raise the exception to be handled by FastAPI

    except Exception as e:
        # 5. Catch any other unexpected errors and log a 500 status
        usage_log.response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        usage_log.error_message = str(e)
        # Attempt to link the log to the transcript if it was found before the error
        usage_log.transcript_id = db_transcript.id if 'db_transcript' in locals() else None
        await db.commit()
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# async def get_transcript(transcript_id: str, db: AsyncSession, api_key_record):
    
#     # 1. Create a UsageLog entry at the beginning of the function
#     usage_log = UsageLog(
#         user_id=api_key_record.user_id,
#         api_key_id=api_key_record.id,
#         endpoint="/transcript"
#     )
#     db.add(usage_log)
#     await db.commit()
#     await db.refresh(usage_log)

#     db_transcript = None  
    
#     try:
#         # Get the transcript from the database
#         result = await db.execute(
#             select(models.Transcript).filter(models.Transcript.transcript_id == transcript_id)
#         )
#         db_transcript = result.scalars().first()
#         print(type(db_transcript.transcript))

#         # Check if the transcript exists
#         if db_transcript is None:
#             raise HTTPException(status_code=404, detail=f"Transcript not found. The provided transcript_id does not exist.")

#         db.expunge(db_transcript) 

#         # 2. Update the UsageLog with a success status and the transcript ID
#         usage_log.response_status = status.HTTP_200_OK
#         usage_log.transcript_id = db_transcript.id
#         await db.commit()

#         # 3. Return the transcript text using  `transcript`        
#         #return {"transcript": db_transcript.transcript}
#         return db_transcript.transcript
#         #return "working"

#     except HTTPException as e:
#         # 4. Catch the HTTPException and update the UsageLog with the error status
#         try:
#             usage_log.response_status = e.status_code
#             usage_log.error_message = e.detail
#             await db.commit()
#         except Exception:
#             pass
#         raise e  # Re-raise the exception to be handled by FastAPI

#     except Exception as e:
#         # 5. Catch any other unexpected errors and log a 500 status
#         try:
#             usage_log.response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
#             usage_log.error_message = str(e)
#             # Attempt to link the log to the transcript if it was found before the error
#             usage_log.transcript_id = db_transcript.id if 'db_transcript' in locals() else None
#             await db.commit()
#             #print(f"DEBUG: An unexpected error occurred: {e}")
#             logger.error(f"An unexpected error occurred: {e}", exc_info=True)
#         except Exception:
#             pass
        
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Internal server error"
#         )