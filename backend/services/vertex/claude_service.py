"""
LLM service layer (OpenAI chat completions).

Function names and signatures are preserved from the original Anthropic Vertex
implementation so the rest of the codebase (routers, generation registry,
FHIR bundle service, etc.) keeps working unchanged. Internally everything now
calls OpenAI's chat completions API.
"""

import os
import logging
from pathlib import Path

import aiofiles
from core.config import settings

logger = logging.getLogger(__name__)

# Project root: app/
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


async def get_response_with_tokens(client, prompt_filepath, conversation, PROJECT_ROOT_ARG=None, **kwargs):
    """
    Single OpenAI chat-completion call. Returns (response_text, input_tokens, output_tokens).

    Accepts `PROJECT_ROOT_ARG` (canonical) or legacy `PROJECT_ROOT` kwarg.
    """
    try:
        logger.info(f"Calling OpenAI with prompt: {prompt_filepath}")

        # Back-compat: callers historically passed `PROJECT_ROOT=...`
        root = PROJECT_ROOT_ARG or kwargs.get("PROJECT_ROOT") or PROJECT_ROOT
        prompt_path = os.path.join(root, prompt_filepath)

        async with aiofiles.open(prompt_path, "r", encoding="utf-8") as f:
            prompt = await f.read()

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=4096,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": conversation},
            ],
        )

        response_text = response.choices[0].message.content or ""
        input_tokens = response.usage.prompt_tokens if response.usage else 0
        output_tokens = response.usage.completion_tokens if response.usage else 0

        logger.info(f"OpenAI call successful for prompt: {prompt_filepath}")
        return response_text, input_tokens, output_tokens
    except Exception as e:
        logger.error(f"OpenAI call failed for prompt: {prompt_filepath}", exc_info=True)
        raise


async def generate_service_async(conversation_text, client, service, prompt_path=None):
    """
    Extracts structured information from a doctor-patient conversation via OpenAI.

    Args:
        conversation_text: The transcript / payload to process.
        client: AsyncOpenAI client (kept positional for back-compat).
        service: Service name (used only in logs / error messages).
        prompt_path: Relative path to the prompt file inside app/.
    """
    if not conversation_text.strip():
        logger.warning(f"Empty conversation text received for {service} extraction.")
        raise ValueError("No conversation text provided.")

    if not prompt_path:
        raise ValueError(
            f"prompt_path is required for service '{service}'. "
            f"Register it in SERVICE_REGISTRY or pass it explicitly."
        )
    filepath = PROJECT_ROOT / prompt_path

    try:
        async with aiofiles.open(filepath, "r", encoding="utf-8") as f:
            prompt = await f.read()
    except FileNotFoundError:
        logger.error(f"Prompt file not found at: {filepath}")
        raise FileNotFoundError(f"Prompt file not found for service: {service} at {filepath}")

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
        logger.error(f"Error during OpenAI call for service {service}: {e}", exc_info=True)
        raise
