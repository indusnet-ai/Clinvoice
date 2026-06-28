"""
Real-time streaming transcription WebSocket.

Frontend protocol (see useStreamingTranscription.ts):
  Client opens  ws://.../ws/stream_transcription?api_key=<key>
  Client sends:
    - Binary frames: ~1-second WebM/Opus chunks from MediaRecorder
    - JSON text: {"action": "stop", "date": "YYYY-MM-DD"} to finalize
  Server sends JSON:
    - {"type": "partial", "accumulated": "<full text so far>"}
    - {"type": "done", "transcript_id": "...", "transcript": "<diarized text>"}
    - {"type": "error", "message": "..."}

Implementation:
  1. Validate api_key against api_keys table.
  2. Buffer incoming WebM blobs to a temp file.
  3. Every BATCH_INTERVAL seconds, hand the rolling file to OpenAI Whisper
     and stream the partial transcript back to the client.
  4. On "stop", run a final Whisper pass + a Claude/GPT diarization pass,
     save a Transcript row, return the transcript_id.
"""
import asyncio
import logging
import os
import tempfile
import time
from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from db.database import AsyncSessionLocal
from db.models import APIKey, Transcript
from services.utils.transcript_id import generate_transcript_id
from services.vertex.claude_service import generate_service_async

router = APIRouter()
logger = logging.getLogger(__name__)

BATCH_INTERVAL_SECONDS = 5  # how often to send buffered audio to Whisper


async def _validate_api_key(api_key: str) -> Optional[APIKey]:
    async with AsyncSessionLocal() as db:  # type: AsyncSession
        result = await db.execute(select(APIKey).where(APIKey.key == api_key))
        return result.scalars().first()


async def _transcribe_with_openai(client, audio_path: str) -> str:
    """Run a single Whisper transcription, returning the text (best-effort)."""
    if client is None or not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
        return ""
    try:
        with open(audio_path, "rb") as f:
            tx = await client.audio.transcriptions.create(
                model=settings.OPENAI_WHISPER_MODEL,
                file=f,
                response_format="text",
            )
        return tx if isinstance(tx, str) else (getattr(tx, "text", "") or "")
    except Exception as e:
        logger.warning(f"Streaming Whisper call failed (non-fatal): {e}")
        return ""


@router.websocket("/ws/stream_transcription")
async def stream_transcription(
    websocket: WebSocket,
    api_key: str = Query(...),
):
    # Validate API key BEFORE accepting — close politely if invalid.
    key_row = await _validate_api_key(api_key)
    if not key_row:
        await websocket.close(code=4401, reason="Invalid API key")
        return

    await websocket.accept()
    logger.info(f"WS stream started for api_key_id={key_row.id}")

    openai_client = websocket.app.state.openai_client
    claude_client = websocket.app.state.claude_client  # same OpenAI client (back-compat alias)

    temp_dir = tempfile.mkdtemp(prefix="ws_stream_")
    rolling_path = os.path.join(temp_dir, "rolling.webm")
    accumulated = ""
    last_flush = time.monotonic()
    stop_payload: Optional[dict] = None

    try:
        while True:
            try:
                message = await websocket.receive()
            except WebSocketDisconnect:
                break

            if "bytes" in message and message["bytes"]:
                # Append the new chunk to the rolling file.
                with open(rolling_path, "ab") as f:
                    f.write(message["bytes"])

                # Time to send a partial?
                if time.monotonic() - last_flush >= BATCH_INTERVAL_SECONDS:
                    last_flush = time.monotonic()
                    text = await _transcribe_with_openai(openai_client, rolling_path)
                    if text:
                        accumulated = text  # whole-file transcription, replace
                        await websocket.send_json({"type": "partial", "accumulated": accumulated})

            elif "text" in message and message["text"]:
                # Control frame — only "stop" expected
                try:
                    import json
                    stop_payload = json.loads(message["text"])
                except Exception:
                    stop_payload = {"action": "stop"}
                if stop_payload.get("action") == "stop":
                    break

        # Final pass: full file → Whisper → Claude/GPT diarization → save Transcript
        final_text = await _transcribe_with_openai(openai_client, rolling_path)
        if not final_text:
            final_text = accumulated

        if not final_text.strip():
            await websocket.send_json({"type": "error", "message": "No speech detected."})
            return

        # Run diarization through the same OpenAI client (legacy name kept).
        date_str = (stop_payload or {}).get("date")
        conv = f"Conversation Date: {date_str}\n\n Conversation: {final_text}" if date_str else final_text
        try:
            diarized, _in_tokens, _out_tokens = await generate_service_async(
                conv,
                claude_client,
                service="diarization",
                prompt_path="prompts/general/diarization_prompt.txt",
            )
        except Exception as e:
            logger.warning(f"Diarization failed, returning raw transcript: {e}")
            diarized = final_text

        # Persist transcript so downstream /SOAP_notes, /v1/medical_report etc. work.
        transcript_id = generate_transcript_id()
        async with AsyncSessionLocal() as db:
            db.add(Transcript(transcript_id=transcript_id, transcript=diarized))
            await db.commit()

        await websocket.send_json({
            "type": "done",
            "transcript_id": transcript_id,
            "transcript": diarized,
        })

    except Exception as e:
        logger.exception(f"WS stream error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        try:
            if os.path.exists(rolling_path):
                os.remove(rolling_path)
            os.rmdir(temp_dir)
        except Exception:
            pass
        try:
            await websocket.close()
        except Exception:
            pass
