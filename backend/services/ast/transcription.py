import logging
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

async def speech_to_text_from_model(model: WhisperModel, audio_path: str):
    """
    Transcribes audio using a pre-loaded Faster Whisper model.

    Args:
        model: The pre-loaded WhisperModel object.
        audio_path: Path to the audio file.

    Returns:
        A list of transcribed segments or None if an error occurs.
    """
    if not model:
        logger.error("Whisper model is not available. Cannot perform transcription.")
        return None

    try:
        logger.info(f"Starting transcription for: {audio_path}")
        segments, _ = model.transcribe(audio_path,beam_size=5,language="en")
        segment_list = list(segments)
        logger.info(f"Transcription completed for: {audio_path}")
        return segment_list
    except Exception as e:
        logger.error(f"An error occurred during transcription: {e}", exc_info=True)
        return None