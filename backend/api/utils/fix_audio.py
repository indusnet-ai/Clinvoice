import asyncio
import logging
import subprocess

logger = logging.getLogger(__name__)

class FFmpegError(Exception):
    """Custom exception for errors during ffmpeg processing."""
    pass

async def normalize_audio_format(input_path: str) -> str:
    """
    Converts an audio file to a standard format (16kHz, mono WAV) using ffmpeg.
    Falls back to the original audio file if ffmpeg is not installed or fails.
    """
    output_path = input_path.rsplit('.', 1)[0] + '_fixed.wav'
    logger.info(f"Starting audio normalization for {input_path}...")
    
    try:
        def run_ffmpeg():
            return subprocess.run(
                ["ffmpeg", "-y", "-i", input_path, "-ac", "1", "-ar", "16000", output_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
        
        result = await asyncio.to_thread(run_ffmpeg)
        
        if result.returncode != 0:
            error_message = result.stderr.decode().strip()
            logger.warning(f"ffmpeg returned non-zero code: {error_message}. Falling back to original audio.")
            return input_path
            
        logger.info(f"Successfully normalized audio to {output_path}")
        return output_path
        
    except FileNotFoundError:
        logger.warning("ffmpeg is not installed or not in PATH. Bypassing normalization and using original audio file.")
        return input_path
    except Exception as e:
        logger.warning(f"Failed to normalize audio via ffmpeg ({e}). Falling back to original audio.")
        return input_path


