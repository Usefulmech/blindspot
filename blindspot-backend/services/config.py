"""
Central configuration loader for Blindspot.

Reads environment variables (from .env in local dev) in ONE place so the rest
of the codebase never touches os.environ directly. Missing keys are allowed:
they resolve to empty strings and the relevant client degrades gracefully
rather than crashing on boot. Use the `*_configured` helpers to check
availability before making a live call.
"""
from functools import lru_cache

from dotenv import load_dotenv
import os

# Load .env once at import time. override=False so real shell env wins.
load_dotenv(override=False)


class Settings:
    """Snapshot of all runtime configuration."""

    def __init__(self) -> None:
        # Cencori AI Gateway
        self.cencori_api_key: str = os.getenv("CENCORI_API_KEY", "").strip()
        self.cencori_base_url: str = os.getenv(
            "CENCORI_BASE_URL", "https://api.cencori.com/v1"
        ).strip()

        # Supabase
        self.supabase_url: str = os.getenv("SUPABASE_URL", "").strip()
        self.supabase_key: str = os.getenv("SUPABASE_KEY", "").strip()

        # External data APIs
        self.numbeo_api_key: str = os.getenv("NUMBEO_API_KEY", "").strip()
        self.openexchangerates_key: str = os.getenv("OPENEXCHANGERATES_KEY", "").strip()

    @property
    def cencori_configured(self) -> bool:
        return bool(self.cencori_api_key)

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)

    @property
    def numbeo_configured(self) -> bool:
        return bool(self.numbeo_api_key)

    @property
    def fx_configured(self) -> bool:
        return bool(self.openexchangerates_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached Settings singleton."""
    return Settings()
