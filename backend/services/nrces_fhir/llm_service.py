"""
LLM Service for NRCES FHIR Bundle Generation (OpenAI backend).
"""
import logging
import time

import aiofiles
from pathlib import Path

from core.config import settings
from services.vertex.claude_init import init_async_anthropic_vertex

logger = logging.getLogger(__name__)


def init_llm_client():
    """Return an AsyncOpenAI client (name kept for back-compat)."""
    return init_async_anthropic_vertex()


async def generate_response(conversation_text: str, client, prompt_file: str) -> tuple[str, int, int]:
    """
    Generate a response from OpenAI.

    Args:
        conversation_text: Doctor-patient conversation text.
        client: AsyncOpenAI client.
        prompt_file: Absolute or relative path to the prompt file.

    Returns:
        (cleaned JSON string, input_tokens, output_tokens)
    """
    start_time = time.perf_counter()

    if not conversation_text or not conversation_text.strip():
        logger.warning("Empty conversation text received")
        raise ValueError("Conversation text cannot be empty.")

    try:
        prompt_path = Path(prompt_file)
        async with aiofiles.open(prompt_path, "r", encoding="utf-8") as f:
            prompt = await f.read()
        logger.debug(f"Loaded prompt from {prompt_file}")
    except FileNotFoundError:
        logger.error(f"Prompt file not found: {prompt_file}")
        raise ValueError(f"Prompt file not found: {prompt_file}")

    full_prompt = f"{prompt}\n\nConversation:\n{conversation_text}"

    try:
        logger.info(f"Sending request to OpenAI using prompt: {prompt_file}")

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=8000,
            response_format={"type": "json_object"},
            messages=[
                {"role": "user", "content": full_prompt},
            ],
        )

        output = response.choices[0].message.content or ""
        input_tokens = response.usage.prompt_tokens if response.usage else 0
        output_tokens = response.usage.completion_tokens if response.usage else 0

        if not output:
            logger.warning("OpenAI returned empty content")
            raise ValueError("LLM did not generate a response.")

        cleaned_output = clean_llm_output(output)

        duration = time.perf_counter() - start_time
        logger.info(
            f"OpenAI response received in {duration:.2f}s. "
            f"Tokens — Input: {input_tokens}, Output: {output_tokens}"
        )

        return cleaned_output, input_tokens, output_tokens

    except Exception as e:
        logger.error(f"Error generating response from OpenAI: {e}", exc_info=True)
        raise


def clean_llm_output(text: str) -> str:
    """Strip optional markdown code-block markers."""
    text = text.strip()
    if text.startswith('```json'):
        text = text[7:]
    if text.startswith('```'):
        text = text[3:]
    if text.endswith('```'):
        text = text[:-3]
    return text.strip()


# Alias kept for legacy callers
init_async_medgemma_client = init_llm_client
