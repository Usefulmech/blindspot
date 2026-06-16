"""
Cencori-configured Anthropic client singleton.

Cencori is a unified AI gateway: we keep using the standard `anthropic` SDK,
just pointed at Cencori's base_url with a single CENCORI_API_KEY. Cencori then
routes requests across providers (Claude Sonnet -> GPT-4o -> Gemini 1.5 Pro)
with automatic fallback. Agent code (ATLAS/VERA/AXIS) stays provider-agnostic
and unchanged.

The client is created lazily so a missing key never breaks server boot; it only
raises when an agent actually tries to make a call without configuration.
"""
from functools import lru_cache

import anthropic

from services.config import get_settings

# Primary model used for all agent calls. Cencori handles fallback to other
# providers transparently when Claude is rate-limited or down.
PRIMARY_MODEL = "claude-sonnet-4-6"


@lru_cache(maxsize=1)
def get_cencori_client() -> anthropic.Anthropic:
    """Return the cached Anthropic client pointed at the Cencori gateway.

    Raises RuntimeError if CENCORI_API_KEY is not configured.
    """
    settings = get_settings()
    if not settings.cencori_configured:
        raise RuntimeError(
            "CENCORI_API_KEY is not set. Add it to your .env to enable agent calls."
        )

    return anthropic.Anthropic(
        api_key=settings.cencori_api_key,
        base_url=settings.cencori_base_url,
    )


def cencori_available() -> bool:
    """Lightweight check used by /health — true if the gateway is configured."""
    return get_settings().cencori_configured
