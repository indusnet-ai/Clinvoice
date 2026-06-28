import numpy as np
import logging
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_similarity
from services.embedding_utils import compute_embedding  
import librosa
from sklearn.metrics import silhouette_score

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def estimate_optimal_speakers(embeddings, max_speakers=10):
    """Estimate the optimal number of speakers using silhouette score."""
    if len(embeddings) < 2:
        logger.warning("Not enough embeddings to estimate speakers. Defaulting to 2.")
        return 2

    scores = []
    embeddings = np.atleast_2d(embeddings)

    for num_speakers in range(2, max_speakers + 1):
        clustering = AgglomerativeClustering(n_clusters=num_speakers)
        labels = clustering.fit_predict(embeddings)
        score = silhouette_score(embeddings, labels) if len(set(labels)) > 1 else -1
        scores.append(score)

    optimal_speakers = range(2, max_speakers + 1)[np.argmax(scores)]
    logger.info(f"Estimated optimal speakers: {optimal_speakers}")
    return optimal_speakers

def identify_doctor(audio_file, doctor_audio, segments):
    """Identify the doctor’s voice from the conversation."""
    try:
        if not segments:
            logger.error("No segments found for speaker identification.")
            return []

        # Log segments to debug missing keys
        logger.debug(f"Segments received for speaker identification: {segments}")

        # Validate segment format before processing
        valid_segments = []
        for seg in segments:
            if not isinstance(seg, dict):
                logger.error(f"Invalid segment format (not a dict): {seg}")
                continue
            if "start" not in seg or "end" not in seg:
                logger.error(f"Malformed segment (missing 'start' or 'end'): {seg}")
                continue
            valid_segments.append(seg)

        if not valid_segments:
            logger.error("No valid segments after filtering.")
            return []

        logger.info("Computing doctor’s voice embedding...")
        doctor_embedding = compute_embedding(doctor_audio, 0, librosa.get_duration(path=doctor_audio))

        logger.info("Computing embeddings for conversation segments...")
        embeddings = np.array([
            compute_embedding(audio_file, seg["start"], seg["end"]) for seg in valid_segments
        ])

        if len(embeddings) == 0:
            logger.error("No valid embeddings computed.")
            return []

        # Estimate number of speakers dynamically
        best_num_speakers = estimate_optimal_speakers(embeddings)

        # Perform clustering
        clustering = AgglomerativeClustering(n_clusters=best_num_speakers)
        labels = clustering.fit_predict(embeddings)

        # Compute cluster centers
        cluster_means = np.array([np.mean(embeddings[np.where(labels == i)[0]], axis=0) for i in range(best_num_speakers)])

        # Identify doctor’s cluster
        doctor_cluster = np.argmax(cosine_similarity([doctor_embedding], cluster_means)[0])
        logger.info(f"Doctor's voice identified in cluster: {doctor_cluster}")

        # Assign speaker labels
        speaker_map = {}
        patient_counter = 1
        for label in np.unique(labels):
            if label == doctor_cluster:
                speaker_map[label] = "DOCTOR : "
            else:
                speaker_map[label] = f"PATIENT {patient_counter} : "
                patient_counter += 1

        # Apply labels to segments
        for i, segment in enumerate(valid_segments):
            if i < len(labels):
                segment["speaker"] = speaker_map.get(labels[i], "UNKNOWN")

        return valid_segments

    except Exception as e:
        logger.exception(f"Error in speaker identification: {e}")
        return []
