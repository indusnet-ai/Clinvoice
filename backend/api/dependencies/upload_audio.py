from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status, Security
from datetime import datetime
import os
from typing import Optional
from api.utils.unix_to_date import convert_unix_to_date

async def validate_date_format(
    date: Optional[str] = Form(None, description="The date when the transcript is recorded.(Unix Timestamp)")
) -> str:
    """
    Validates that the provided string is a valid Unix timestamp and
    returns a human-readable date string.
    If no date is provided, returns the current system date as a string.
    """
    # If the user didn't provide a date, use the current system date's Unix timestamp
    if date is None:
        return convert_unix_to_date(int(datetime.now().timestamp()))

    # If a date was provided, validate it as a Unix timestamp
    try:
        # Attempt to convert the string to an integer
        timestamp_int = int(date)
        # Check if the integer represents a valid date within a reasonable range
        if timestamp_int > datetime.now().timestamp() + 86400:  # 1 day into the future
            raise ValueError
        
        # If valid, convert the integer timestamp to a human-readable format
        return convert_unix_to_date(timestamp_int)
    
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid date format. Please provide a valid Unix timestamp (e.g., a number)."
        )
async def validate_audio_file(conversation_file: UploadFile = File(..., description="The medical conversation audio file (.wav, max 25MB).")) -> UploadFile:
    """
    Validates the format and size of the uploaded audio file.
    """
    # Validate file format
    # The `os.path.splitext` function is used to get the file extension reliably.
    file_extension = os.path.splitext(conversation_file.filename)[1]
    if file_extension.lower() != ".wav":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only '.wav' files are supported."
        )

    # Validate file size (25 MB = 25 * 1024 * 1024 bytes)
    # The `await conversation_file.read()` reads the entire file content into memory.
    file_content = await conversation_file.read()
    if len(file_content) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum allowed size is 25MB."
        )

    # Reset the file pointer to the beginning so that it can be read again later in the endpoint.
    await conversation_file.seek(0)
    
    # Return the validated file
    return conversation_file