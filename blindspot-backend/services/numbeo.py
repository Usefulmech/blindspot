"""
Numbeo API client — fetches live Cost of Living data for a city.

Standard Numbeo endpoint:
  GET https://www.numbeo.com/api/city_prices?api_key=<key>&query=<city>

Returns structured CoL fields (rent, groceries, transport, restaurants) with a
fetch timestamp. On failure (missing key, timeout, API error) falls back to the
last cached Supabase value. Returns None if no data is available at all.
"""
from datetime import datetime, timezone
from typing import Optional

import httpx

from services.cache_manager import CacheManager
from services.config import get_settings

NUMBEO_BASE_URL = "https://www.numbeo.com/api/city_prices"
CACHE_ENDPOINT = "numbeo/city_prices"

_cache = CacheManager()


async def fetch_col_data(city: str) -> Optional[dict]:
    """
    Fetch Cost of Living data for a city from Numbeo.

    Returns a dict with keys:
      - city: str
      - currency: str
      - monthly_rent_1br_city_centre: float
      - monthly_groceries: float
      - monthly_transport: float
      - restaurant_meal_inexpensive: float
      - last_fetched_at: ISO8601 str
      - source: "numbeo_live" | "numbeo_cached"

    Returns None if both live fetch and cache fail.
    """
    settings = get_settings()
    query_params = {"city": city}

    # --- Try live API first ---
    if settings.numbeo_configured:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    NUMBEO_BASE_URL,
                    params={"api_key": settings.numbeo_api_key, "query": city},
                )
                response.raise_for_status()
                raw = response.json()

            data = _parse_numbeo_response(raw, city)
            _cache.set_cached_response(CACHE_ENDPOINT, query_params, data)
            return data

        except Exception:
            pass  # fall through to cache

    # --- Fallback: last cached value ---
    cached = _cache.get_cached_response(CACHE_ENDPOINT, query_params)
    if cached:
        payload = cached["response_data"]
        payload["source"] = "numbeo_cached"
        payload["last_fetched_at"] = cached["last_fetched_at"]
        return payload

    return None


def _parse_numbeo_response(raw: dict, city: str) -> dict:
    """
    Extract the fields we care about from the Numbeo API response.

    Numbeo returns prices as a list of items, each with an `item_id`.
    Key item IDs used here:
      1  — Meal, Inexpensive Restaurant
      27 — Apartment (1 bedroom) in City Centre, monthly rent
      9  — Monthly Pass (public transport)
      11 — Basic groceries basket (approximate)
    """
    prices = {item["item_id"]: item["average_price"] for item in raw.get("prices", [])}

    return {
        "city": city,
        "currency": raw.get("currency", "USD"),
        "monthly_rent_1br_city_centre": prices.get(27, 0.0),
        "monthly_groceries": prices.get(11, 0.0),
        "monthly_transport": prices.get(9, 0.0),
        "restaurant_meal_inexpensive": prices.get(1, 0.0),
        "last_fetched_at": datetime.now(timezone.utc).isoformat(),
        "source": "numbeo_live",
    }
