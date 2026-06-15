"""
Supabase connection singleton.

Created lazily so the server boots even before Supabase credentials are set.
Callers should use `supabase_available()` to check configuration, or be ready
to handle a RuntimeError from `get_supabase_client()` when it's not configured.
"""
from functools import lru_cache
from typing import TYPE_CHECKING

from supabase import create_client

from services.config import get_settings

if TYPE_CHECKING:
    from supabase import Client


@lru_cache(maxsize=1)
def get_supabase_client() -> "Client":
    """Return the cached Supabase client.

    Raises RuntimeError if SUPABASE_URL / SUPABASE_KEY are not configured.
    """
    settings = get_settings()
    if not settings.supabase_configured:
        raise RuntimeError(
            "Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY in your .env."
        )

    return create_client(settings.supabase_url, settings.supabase_key)


def supabase_available() -> bool:
    """Lightweight check used by /health — true if Supabase is configured."""
    return get_settings().supabase_configured
