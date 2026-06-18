"""
Cencori Python SDK client singleton.

Routes requests through the Cencori gateway to Gemini 2.5 Flash.

async_stream_chat: bridges Cencori's sync chat_stream to an async generator
  so FastAPI/SSE can stream word-by-word without blocking the event loop.
  Pattern: spin up a daemon thread that produces chunks → asyncio.Queue → async for.
"""
import asyncio
import threading
from functools import lru_cache
from typing import AsyncGenerator

from cencori import Cencori

from services.config import get_settings

PRIMARY_MODEL = "gemini-2.5-flash"


@lru_cache(maxsize=1)
def get_cencori_client() -> Cencori:
    """Return the cached Cencori client. Raises if API key is not configured."""
    settings = get_settings()
    if not settings.cencori_configured:
        raise RuntimeError(
            "CENCORI_API_KEY is not set. Add it to your .env to enable agent calls."
        )
    return Cencori(api_key=settings.cencori_api_key)


async def async_stream_chat(messages: list) -> AsyncGenerator[str, None]:
    """
    Bridge Cencori's sync chat_stream to an async generator.

    Spins a daemon thread that iterates the sync stream and pushes each delta
    onto an asyncio.Queue. The async generator consumes the queue on the event
    loop side — no blocking. A None sentinel signals end-of-stream.

    If the stream returns no content (Cencori silences RateLimitError in streaming),
    we probe with a non-streaming call to surface the real error.
    """
    client = get_cencori_client()
    loop = asyncio.get_event_loop()
    queue: asyncio.Queue = asyncio.Queue()

    def _producer():
        content_sent = False
        try:
            stream = client.ai.chat_stream(model=PRIMARY_MODEL, messages=messages)
            for chunk in stream:
                try:
                    if chunk.delta:
                        content_sent = True
                        loop.call_soon_threadsafe(queue.put_nowait, chunk.delta)
                except (KeyError, AttributeError):
                    # Cencori SDK raises KeyError('finish_reason') on the final
                    # stream message — ignore it, all content is already queued.
                    pass
            # If stream ended with zero content, probe to surface the real error
            # (e.g. RateLimitError is silently swallowed by chat_stream).
            if not content_sent:
                try:
                    client.ai.chat(model=PRIMARY_MODEL, messages=messages)
                    print("[cencori_client] empty stream — probe call succeeded (unexpected)")
                except Exception as probe_err:
                    raise probe_err
        except Exception as e:
            print(f"[cencori_client] error: {type(e).__name__}: {e}")
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

    threading.Thread(target=_producer, daemon=True).start()

    while True:
        chunk = await queue.get()
        if chunk is None:
            break
        yield chunk


async def async_collect_chat(messages: list) -> str:
    """Run chat_stream and collect all chunks into one string (non-streaming async)."""
    chunks = []
    async for chunk in async_stream_chat(messages):
        chunks.append(chunk)
    return "".join(chunks)


def cencori_available() -> bool:
    """Lightweight check used by /health."""
    return get_settings().cencori_configured
