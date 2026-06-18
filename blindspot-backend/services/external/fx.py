"""
Open Exchange Rates client — real-time FX conversion.

Endpoint:
  GET https://openexchangerates.org/api/latest.json?app_id=<key>

Fetches all rates relative to USD in one call, then converts locally.
Results are cached in Supabase — FX rates are fetched once per session and
reused, since they update hourly and our 30-day staleness window is generous.

Returns None if both live fetch and cache fail (no key + no cache).
"""
from datetime import datetime, timezone
from typing import Optional

import httpx

from services.external.cache_manager import CacheManager
from services.config import get_settings

FX_BASE_URL = "https://openexchangerates.org/api/latest.json"
CACHE_ENDPOINT = "openexchangerates/latest"
CACHE_KEY = {"base": "USD"}

_cache = CacheManager()


async def fetch_rates() -> Optional[dict]:
    """
    Return all exchange rates relative to USD.

    Returns a dict:
      - base: "USD"
      - rates: { "KES": 129.5, "NGN": 1580.0, ... }
      - last_fetched_at: ISO8601 str
      - source: "fx_live" | "fx_cached"

    Returns None if unavailable.
    """
    settings = get_settings()

    if settings.fx_configured:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    FX_BASE_URL,
                    params={"app_id": settings.openexchangerates_key},
                )
                response.raise_for_status()
                raw = response.json()

            data = {
                "base": raw.get("base", "USD"),
                "rates": raw.get("rates", {}),
                "last_fetched_at": datetime.now(timezone.utc).isoformat(),
                "source": "fx_live",
            }
            _cache.set_cached_response(CACHE_ENDPOINT, CACHE_KEY, data)
            return data

        except Exception:
            pass  # fall through to cache

    # --- Fallback: last cached rates ---
    cached = _cache.get_cached_response(CACHE_ENDPOINT, CACHE_KEY)
    if cached:
        payload = cached["response_data"]
        payload["source"] = "fx_cached"
        payload["last_fetched_at"] = cached["last_fetched_at"]
        return payload

    return None


def convert(amount: float, from_currency: str, to_currency: str, rates: dict) -> Optional[float]:
    """
    Convert an amount between two currencies using a rates dict from fetch_rates().

    All rates are relative to USD, so we convert via USD as the pivot:
      amount_in_to = amount_in_from / rate_from * rate_to
    """
    if from_currency == to_currency:
        return round(amount, 2)

    rate_from = rates.get(from_currency)
    rate_to = rates.get(to_currency)

    if not rate_from or not rate_to:
        return None

    return round(amount / rate_from * rate_to, 2)
