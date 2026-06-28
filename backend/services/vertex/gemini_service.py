"""
Translation / generation service — now backed by OpenAI.

Original implementation used Vertex Gemini. The function signature is unchanged
so the translation router (`api/router/v1/translation_soap_notes.py`) continues
to work without edits.
"""

import logging
from pathlib import Path

import aiofiles
from core.config import settings

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


async def generate_gemini_service_async(content_text, client, service, prompt_path=None, **kwargs):
    """
    Generate content via OpenAI. For `translation_soap_notes`, prompt placeholders
    ({{language_code}}, {{soap_note_json}}) are filled the same way the original
    Gemini path did. JSON-mode is requested for translation and soap_notes_v1.
    """
    if not content_text.strip():
        logger.warning(f"Empty content text received for {service}.")
        raise ValueError("No content text provided.")

    if not prompt_path:
        raise ValueError(
            f"prompt_path is required for service '{service}'. "
            f"Register it in SERVICE_REGISTRY or pass it explicitly."
        )
    filepath = PROJECT_ROOT / prompt_path

    try:
        async with aiofiles.open(filepath, "r", encoding="utf-8") as f:
            prompt_template = await f.read()
    except FileNotFoundError:
        logger.error(f"Prompt file not found at: {filepath}")
        raise FileNotFoundError(f"Prompt file not found for service: {service}")

    # Match original behavior: translation does template substitution in the system prompt.
    if service == "translation_soap_notes":
        language_code = kwargs.get("language_code", "en")
        system_instruction = (
            prompt_template
            .replace("{{language_code}}", language_code)
            .replace("{{soap_note_json}}", content_text)
        )
        user_content = "Please provide the translated JSON."
    else:
        system_instruction = prompt_template
        user_content = content_text

    json_mode = service in ("translation_soap_notes", "soap_notes_v1")

    try:
        kwargs_call = dict(
            model=settings.OPENAI_MODEL,
            max_tokens=4096,
            temperature=0.0,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_content},
            ],
        )
        if json_mode:
            kwargs_call["response_format"] = {"type": "json_object"}

        response = await client.chat.completions.create(**kwargs_call)

        output = response.choices[0].message.content or ""
        input_tokens = response.usage.prompt_tokens if response.usage else 0
        output_tokens = response.usage.completion_tokens if response.usage else 0

        return output, input_tokens, output_tokens

    except Exception as e:
        logger.error(f"Error during OpenAI call for service {service}: {e}", exc_info=True)
        raise
