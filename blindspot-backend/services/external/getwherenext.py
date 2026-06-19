"""
GetWhereNext API client — Cost of Living data source.

Endpoint (free, no API key required):
  GET https://getwherenext.com/api/data/cost-of-living

Returns country-level CoL data. We map city → country, then derive individual
cost components (rent, groceries, transport, dining) from monthly_estimate_usd
using typical budget proportions, adjusted by the API's component indices.
"""
from datetime import datetime, timezone
from typing import Optional

import httpx

from services.external.cache_manager import CacheManager
from services.config import get_settings

GETWHERENEXT_URL = "https://getwherenext.com/api/data/cost-of-living"
CACHE_ENDPOINT = "getwherenext/cost-of-living"
CACHE_KEY = {"version": "2026"}

_cache = CacheManager()

# City → ISO country code. Add more as needed.
_CITY_TO_COUNTRY = {
    # East Africa
    "kigali": "RW", "rwanda": "RW",
    "nairobi": "KE", "kenya": "KE", "mombasa": "KE",
    "kampala": "UG", "uganda": "UG",
    "dar es salaam": "TZ", "tanzania": "TZ", "dodoma": "TZ",
    "addis ababa": "ET", "ethiopia": "ET",
    # West Africa
    "lagos": "NG", "abuja": "NG", "nigeria": "NG",
    "accra": "GH", "ghana": "GH",
    "dakar": "SN", "senegal": "SN",
    # Southern Africa
    "johannesburg": "ZA", "cape town": "ZA", "durban": "ZA", "south africa": "ZA",
    "lusaka": "ZM", "zambia": "ZM",
    # Middle East
    "dubai": "AE", "abu dhabi": "AE", "sharjah": "AE", "uae": "AE",
    "riyadh": "SA", "jeddah": "SA", "saudi arabia": "SA",
    "doha": "QA", "qatar": "QA",
    "kuwait city": "KW", "kuwait": "KW",
    "amman": "JO", "jordan": "JO",
    "beirut": "LB", "lebanon": "LB",
    # Europe
    "london": "GB", "manchester": "GB", "birmingham": "GB", "uk": "GB",
    "berlin": "DE", "munich": "DE", "frankfurt": "DE", "germany": "DE",
    "paris": "FR", "lyon": "FR", "france": "FR",
    "amsterdam": "NL", "netherlands": "NL",
    "zurich": "CH", "geneva": "CH", "switzerland": "CH",
    "stockholm": "SE", "sweden": "SE",
    "oslo": "NO", "norway": "NO",
    "madrid": "ES", "barcelona": "ES", "spain": "ES",
    "rome": "IT", "milan": "IT", "italy": "IT",
    "lisbon": "PT", "portugal": "PT",
    # North America
    "new york": "US", "san francisco": "US", "los angeles": "US",
    "chicago": "US", "houston": "US", "seattle": "US", "usa": "US",
    "toronto": "CA", "vancouver": "CA", "montreal": "CA", "canada": "CA",
    # Asia Pacific
    "singapore": "SG",
    "tokyo": "JP", "osaka": "JP", "japan": "JP",
    "hong kong": "HK",
    "seoul": "KR", "south korea": "KR",
    "sydney": "AU", "melbourne": "AU", "australia": "AU",
    "mumbai": "IN", "bangalore": "IN", "delhi": "IN", "india": "IN",
    "kuala lumpur": "MY", "malaysia": "MY",
    "bangkok": "TH", "thailand": "TH",
    "jakarta": "ID", "indonesia": "ID",
    "shanghai": "CN", "beijing": "CN", "china": "CN",
    # Americas
    "são paulo": "BR", "rio de janeiro": "BR", "brazil": "BR",
    "bogotá": "CO", "colombia": "CO",
    "mexico city": "MX", "mexico": "MX",
    "buenos aires": "AR", "argentina": "AR",
}


def _country_code_for_city(city: str) -> Optional[str]:
    city_lower = city.lower().strip()
    for key, code in _CITY_TO_COUNTRY.items():
        if key in city_lower or city_lower in key:
            return code
    return None


def _derive_costs(row: dict) -> dict:
    """
    Derive individual cost components from the monthly estimate and indices.

    All three indices are inverted affordability scores (higher = cheaper).
    We scale each component's budget share inversely with its index:
      - cheap city (high index) → smaller share of total on that category
      - expensive city (low index) → larger share of total on that category
    """
    total = row.get("monthly_estimate_usd", 1000)
    rent_idx     = row.get("rent_index",      50)
    grocery_idx  = row.get("grocery_index",   50)
    transport_idx = row.get("transport_index", 50)

    # Rent: ranges from 25% (expensive cities, low index) to 45% (cheap cities)
    rent_share      = 0.45 - (rent_idx      / 100) * 0.20
    # Groceries: ranges from 12% (cheap) to 22% (expensive)
    grocery_share   = 0.22 - (grocery_idx   / 100) * 0.10
    # Transport: ranges from 6% (cheap) to 18% (expensive, e.g. Singapore, London)
    transport_share = 0.18 - (transport_idx / 100) * 0.12

    return {
        "monthly_rent_1br_city_centre": round(total * rent_share, 2),
        "monthly_groceries":            round(total * grocery_share, 2),
        "monthly_transport":            round(total * transport_share, 2),
        "restaurant_meal_inexpensive":  round(total * 0.15 / 20, 2),
    }


async def fetch_col_data(city: str) -> Optional[dict]:
    """
    Fetch Cost of Living data for a city via GetWhereNext country lookup.

    Returns a dict with keys:
      - city, country, currency, monthly_rent_1br_city_centre,
        monthly_groceries, monthly_transport, restaurant_meal_inexpensive,
        monthly_estimate_usd, last_fetched_at, source
    Returns None if city's country is not found in the dataset.
    """
    country_code = _country_code_for_city(city)
    if not country_code:
        return None

    # Try to get full dataset from cache first
    all_data = _cache.get_cached_response(CACHE_ENDPOINT, CACHE_KEY)
    if all_data:
        dataset = all_data["response_data"]
        source = "getwherenext_cached"
        fetched_at = all_data["last_fetched_at"]
    else:
        # Fetch fresh from API
        try:
            settings = get_settings()
            base_url = settings.getwherenext_url or GETWHERENEXT_URL
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    base_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
                )
                response.raise_for_status()
                raw = response.json()

            dataset = {row["country_code"]: row for row in raw.get("data", [])}
            fetched_at = datetime.now(timezone.utc).isoformat()
            _cache.set_cached_response(CACHE_ENDPOINT, CACHE_KEY, dataset)
            source = "getwherenext_live"
        except Exception:
            return None

    row = dataset.get(country_code)
    if not row:
        return None

    costs = _derive_costs(row)
    return {
        "city": city,
        "country": row.get("country", ""),
        "currency": "USD",
        **costs,
        "monthly_estimate_usd": row.get("monthly_estimate_usd"),
        "cost_index": row.get("cost_index"),
        "last_fetched_at": fetched_at if isinstance(fetched_at, str) else fetched_at.isoformat(),
        "source": source,
    }
