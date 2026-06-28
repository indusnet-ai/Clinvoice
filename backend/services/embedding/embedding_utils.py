import numpy as np
import torch
import traceback
from pyannote.audio.pipelines.speaker_verification import PretrainedSpeakerEmbedding
from pyannote.audio import Audio
from pyannote.core import Segment
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

_embedding_model = None
_audio_processor = None

def get_embedding_model():
    """
    Initialize and return the speaker embedding model as a singleton.
    """
    global _embedding_model
    if _embedding_model is None:
        logger.info("Loading speaker embedding model...")
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _embedding_model = PretrainedSpeakerEmbedding("speechbrain/spkrec-ecapa-voxceleb", device=device)
        logger.info("Speaker embedding model loaded successfully")
    return _embedding_model

def get_audio_processor():
    """
    Initialize and return the audio processor as a singleton.
    """
    global _audio_processor
    if _audio_processor is None:
        logger.info("Inititalizing the audio processor...")
        _audio_processor = Audio()
        logger.info("Audio processo initialized")
    return _audio_processor

def compute_embedding(audio_file, start, end):
    """
    Compute speaker embedding for an audio segment.
    """
    try:
        audio = get_audio_processor()
        embedding_model = get_embedding_model()
        clip = Segment(start, end)
        waveform, _ = audio.crop(audio_file, clip)

        if waveform.shape[1] == 0:
            logger.warning(f"Empty audio segment detected from {start} to {end} in {audio_file}.")
            return np.zeros(192)

        return embedding_model(waveform[None]).squeeze()
    
    except Exception as e:
        logger.error(f"Error computing speaker embedding for {audio_file}: {e}")
        traceback.print_exc()
        return np.zeros(192)
