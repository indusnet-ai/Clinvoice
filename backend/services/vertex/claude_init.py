"""
LLM client initializer (OpenAI).

Historically this module exposed Anthropic Vertex initializers. The whole stack
now uses OpenAI; the original function names are kept so callers don't need to
change their imports.
"""

import logging
import os

from openai import OpenAI, AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")


def init_anthropic_vertex(*_args, **_kwargs):
    """Return a sync OpenAI client. Name kept for back-compat."""
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI sync client initialized successfully.")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI sync client: {e}")
        return None


def init_async_anthropic_vertex(*_args, **_kwargs):
    """Return an async OpenAI client. Name kept for back-compat."""
    try:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI async client initialized successfully.")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI async client: {e}")
        return None
