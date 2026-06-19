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
        # Azure OpenAI
        # The .env may contain the full AI Foundry project path (.../api/projects/...)
        # which is the management API, not the OpenAI completions API.
        # We normalise to just the base origin so the OpenAI SDK builds the right URL.
        _raw_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()
        if _raw_endpoint:
            from urllib.parse import urlparse
            _parsed = urlparse(_raw_endpoint)
            self.azure_openai_endpoint: str = f"{_parsed.scheme}://{_parsed.netloc}/"
        else:
            self.azure_openai_endpoint: str = ""
        self.azure_openai_api_key: str = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
        self.azure_openai_model: str = os.getenv("Model_Deployed", "gpt-4o").strip()

        # Supabase
        self.supabase_url: str = os.getenv("SUPABASE_URL", "").strip()
        self.supabase_key: str = os.getenv("SUPABASE_KEY", "").strip()

        # External data APIs
        self.openexchangerates_key: str = os.getenv("OPENEXCHANGERATES_KEY", "").strip()
        self.getwherenext_url: str = os.getenv("GETWHERENEXT_URL", "").strip()

        # Frontend URL — added to CORS allow list (set this in prod .env)
        self.frontend_url: str = os.getenv("FRONTEND_URL", "").strip()

    @property
    def azure_openai_configured(self) -> bool:
        return bool(self.azure_openai_endpoint and self.azure_openai_api_key)

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)

    @property
    def getwherenext_configured(self) -> bool:
        return True  # free API, no key required — always available

    @property
    def fx_configured(self) -> bool:
        return bool(self.openexchangerates_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached Settings singleton."""
    return Settings()
