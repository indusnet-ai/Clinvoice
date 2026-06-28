import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from openai import AsyncOpenAI

from core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.

    All LLM + transcription work is done through a single AsyncOpenAI client.
    The legacy attribute names `claude_client` and `gemini_client` are kept so
    existing routers and the generation registry continue to work unchanged —
    both point to the same OpenAI client.
    """
    logger.info("--- Application starting up ---")

    try:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY must be set in environment / .env")

        openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        app.state.openai_client = openai_client

        # Instrument OpenAI client with OpenTelemetry for Arize/Phoenix if configured
        try:
            import os
            from openinference.instrumentation.openai import OpenAIInstrumentor

            arize_api_key = os.getenv("ARIZE_API_KEY")
            arize_space_id = os.getenv("ARIZE_SPACE_ID")
            phoenix_collector_url = os.getenv("PHOENIX_COLLECTOR_URL")

            if arize_api_key and arize_space_id:
                from arize.otel import register
                tracer_provider = register(
                    space_id=arize_space_id,
                    api_key=arize_api_key,
                    project_name="clin-voice"
                )
                OpenAIInstrumentor().instrument(tracer_provider=tracer_provider)
                logger.info("Arize Cloud telemetry instrumentation active (via arize-otel)")
            elif phoenix_collector_url:
                from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
                from opentelemetry.sdk import trace as trace_sdk
                from opentelemetry.sdk.trace.export import SimpleSpanProcessor

                tracer_provider = trace_sdk.TracerProvider()
                span_processor = SimpleSpanProcessor(OTLPSpanExporter(endpoint=phoenix_collector_url))
                tracer_provider.add_span_processor(span_processor)
                OpenAIInstrumentor().instrument(tracer_provider=tracer_provider)
                logger.info(f"Phoenix local telemetry instrumentation active (endpoint={phoenix_collector_url})")
        except Exception as otel_err:
            logger.warning(f"Failed to initialize OpenTelemetry/Arize instrumentation: {otel_err}", exc_info=True)

        # Back-compat aliases — same client, two names
        app.state.claude_client = openai_client
        app.state.gemini_client = openai_client

        logger.info(
            f"OpenAI client initialized (model={settings.OPENAI_MODEL}, whisper={settings.OPENAI_WHISPER_MODEL})"
        )
    except Exception as e:
        logger.critical(f"Failed to initialize OpenAI client: {e}", exc_info=True)
        app.state.openai_client = None
        app.state.claude_client = None
        app.state.gemini_client = None

    yield

    # --- Application shutting down ---
    logger.info("--- Application shutting down ---")
    app.state.openai_client = None
    app.state.claude_client = None
    app.state.gemini_client = None
    logger.info("Clients cleaned up.")
