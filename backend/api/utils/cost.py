import os
from mutagen.wave import WAVE
from typing import Tuple


async def calculate_audio_cost(audio_file_path: str, usd_to_inr_rate: float) -> Tuple[float, float]:
    """
    Calculates the duration of a .wav file and its OpenAI Whisper transcription cost.

    Pricing reference: OpenAI whisper-1 is billed at $0.006 / minute.

    Returns:
        (duration_seconds, cost_inr) — both rounded to 2 decimals.
    """
    if not os.path.exists(audio_file_path):
        print(f"Error: The file '{audio_file_path}' was not found.")
        return 0.0, 0.0

    try:
        audio = WAVE(audio_file_path)
        duration_seconds = audio.info.length

        duration_minutes = duration_seconds / 60
        cost_usd = duration_minutes * 0.006

        cost_inr = cost_usd * usd_to_inr_rate
        return round(duration_seconds, 2), round(cost_inr, 2)
    except Exception as e:
        print(f"An error occurred: {e}")
        return 0.0, 0.0


def calculate_claude_cost(input_tokens, output_tokens, usd_to_inr_rate):
    """
    Calculate the OpenAI chat-completion cost in INR.

    Default pricing is GPT-4.1 ($2.00 per 1M input tokens, $8.00 per 1M output tokens).
    Update INPUT_COST_PER_M_TOKENS_USD / OUTPUT_COST_PER_M_TOKENS_USD if you switch models.

    The function name is kept for back-compat with existing callers.
    """
    # GPT-4.1 pricing (USD per 1M tokens)
    INPUT_COST_PER_M_TOKENS_USD = 2.00
    OUTPUT_COST_PER_M_TOKENS_USD = 8.00

    input_cost_usd = (input_tokens / 1_000_000) * INPUT_COST_PER_M_TOKENS_USD
    output_cost_usd = (output_tokens / 1_000_000) * OUTPUT_COST_PER_M_TOKENS_USD
    total_cost_usd = input_cost_usd + output_cost_usd

    return total_cost_usd * usd_to_inr_rate
