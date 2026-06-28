"""
Legacy synchronous-style service wrapper. Now backed by OpenAI.

The original implementation read prompts from `prompts/general/{service}_prompt.txt`
and called Anthropic. This module preserves the same signature for any caller
that still imports it (e.g. services/transcript.py).
"""

import logging
from pathlib import Path

import aiofiles
from core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


async def generate_service(conversation_text, client, service):
    """
    Generate text from a doctor-patient conversation via OpenAI.

    Returns:
        tuple: (output_text, input_tokens, output_tokens)
    """
    if not conversation_text.strip():
        logger.warning("Empty conversation text received for service extraction.")
        raise ValueError("No conversation text provided.")

    filepath = PROJECT_ROOT / "prompts" / "general" / f"{service}_prompt.txt"

    async with aiofiles.open(filepath, "r", encoding="utf-8") as f:
        prompt = await f.read()

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=4096,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": conversation_text},
            ],
        )

        output = response.choices[0].message.content or ""
        input_tokens = response.usage.prompt_tokens if response.usage else 0
        output_tokens = response.usage.completion_tokens if response.usage else 0

        return output, input_tokens, output_tokens

    except Exception as e:
        logger.error(f"Error in generate_service for {service}: {e}", exc_info=True)
        raise
