import asyncio
import logging

from core.config import settings
from openrouter import OpenRouter

logger = logging.getLogger(__name__)



class LLMError(Exception):
    """Raised when the LLM provider fails or returns unusable output."""


async def generate_text(instructions: str, prompt: str) -> tuple[str, str]:
    """Return (text, model_used). Each call lets the free router pick a model."""
    if not settings.OPENROUTER_API_KEY:
        raise LLMError("OPENROUTER_API_KEY is not configured")

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
        raise LLMError("LLM request timed out") from error
    except Exception as error:
        raise LLMError(f"LLM request failed: {error}") from error

    if response.status != "completed":
        message = response.error.message if response.error else response.status
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
        raise LLMError("LLM returned no text output")

    return text, response.model
