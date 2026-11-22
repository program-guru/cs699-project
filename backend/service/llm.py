import asyncio
import logging
import time

from core.config import settings
from openrouter import OpenRouter

logger = logging.getLogger(__name__)



class LLMError(Exception):
    """Raised when the LLM provider fails or returns unusable output."""


async def generate_text(instructions: str, prompt: str) -> tuple[str, str]:
    """Return (text, model_used). Each call lets the free router pick a model."""
    if not settings.OPENROUTER_API_KEY:
        logger.error("LLM request failed: reason=api_key_not_configured")
        raise LLMError("OPENROUTER_API_KEY is not configured")

    started_at = time.monotonic()
    logger.info(
        "LLM request started: model=%s timeout_seconds=%d",
        settings.OPENROUTER_MODEL,
        settings.LLM_TIMEOUT_SECONDS,
    )
    try:
        async with asyncio.timeout(settings.LLM_TIMEOUT_SECONDS):
            async with OpenRouter(api_key=settings.OPENROUTER_API_KEY) as client:
                response = await client.responses.send_async(
                    model=settings.OPENROUTER_MODEL,
                    instructions=instructions,
                    input=prompt,
                    temperature=0.2,
                    max_output_tokens=1500,
                )
    except TimeoutError as error:
        elapsed_ms = round((time.monotonic() - started_at) * 1000)
        logger.error(
            "LLM request failed: status=timeout elapsed_ms=%d",
            elapsed_ms,
        )
        raise LLMError("LLM request timed out") from error
    except Exception as error:
        elapsed_ms = round((time.monotonic() - started_at) * 1000)
        logger.error(
            "LLM request failed: status=exception elapsed_ms=%d error=%s",
            elapsed_ms,
            error,
        )
        raise LLMError(f"LLM request failed: {error}") from error

    elapsed_ms = round((time.monotonic() - started_at) * 1000)
    if response.status != "completed":
        message = response.error.message if response.error else response.status
        logger.error(
            "LLM response failed: provider_status=%s model=%s elapsed_ms=%d "
            "error=%s",
            response.status,
            getattr(response, "model", None),
            elapsed_ms,
            message,
        )
        raise LLMError(f"LLM response did not complete: {message}")

    message = next(
        (item for item in reversed(response.output) if item.type == "message"),
        None,
    )
    text = next(
        (
            part.text
            for part in (message.content if message else [])
            if part.type == "output_text"
        ),
        None,
    )
    if not text:
        logger.error(
            "LLM response failed: provider_status=completed model=%s "
            "elapsed_ms=%d reason=no_text_output",
            getattr(response, "model", None),
            elapsed_ms,
        )
        raise LLMError("LLM returned no text output")

    logger.info(
        "LLM response succeeded: provider_status=completed model=%s "
        "elapsed_ms=%d",
        getattr(response, "model", None),
        elapsed_ms,
    )
    return text, response.model
