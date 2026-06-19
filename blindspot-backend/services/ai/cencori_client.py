"""
Azure OpenAI client — powers ATLAS, VERA, and AXIS agents.

Replaces the previous Cencori/Gemini client with native async streaming
via the OpenAI SDK pointed at Azure AI Foundry. No thread-bridge needed.

Public interface (unchanged — all agents import these):
  async_stream_chat(messages) → AsyncGenerator[str, None]
  async_collect_chat(messages) → str
  cencori_available()         → bool
"""
from typing import AsyncGenerator

from openai import AsyncAzureOpenAI

from services.config import get_settings

_AZURE_API_VERSION = "2024-12-01-preview"

_client: AsyncAzureOpenAI | None = None


def _get_client() -> AsyncAzureOpenAI:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.azure_openai_configured:
            raise RuntimeError(
                "AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY must be set in .env"
            )
        _client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=_AZURE_API_VERSION,
        )
    return _client


async def async_stream_chat(messages: list) -> AsyncGenerator[str, None]:
    """Stream chat completion chunks from Azure OpenAI."""
    client = _get_client()
    model = get_settings().azure_openai_model

    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )

    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def async_collect_chat(messages: list) -> str:
    """Collect full streaming response into a string."""
    chunks = []
    async for chunk in async_stream_chat(messages):
        chunks.append(chunk)
    return "".join(chunks)


def cencori_available() -> bool:
    """Lightweight check used by /health."""
    return get_settings().azure_openai_configured
