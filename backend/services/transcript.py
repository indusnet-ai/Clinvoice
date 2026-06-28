from services.ast.transcription import speech_to_text
#from services.speaker_identification import identify_doctor
from services.vertex.claude_init import init_anthropic_vertex
from services.vertex.service import generate_service

import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

async def transcript(conversation_audio,date):
    segments = await speech_to_text(conversation_audio)

    if not segments:
        logger.warning("No segments obtained from speech_to_text. Cannot generate conversation text.")
        return None

    #speaker_segments = identify_doctor(conversation_audio, doctor_audio, segments)

    #conversation_text = "\n".join([f"{row['speaker']}: {row['text']}" for row in speaker_segments])

    #return conversation_text
    logger.info("Segments obtained")
    conversation = str(segments)

    conversation_with_date = f"Conversation Date: {date}\n\n Conversation: {conversation}"    

    client = init_anthropic_vertex()
    conversation_text,input_tokens,output_tokens = await generate_service(conversation_with_date,client,service = "diarization")
    
    return conversation_text,input_tokens,output_tokens
