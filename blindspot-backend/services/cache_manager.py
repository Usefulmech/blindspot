"""
Supabase-backed cache for external API responses (Numbeo, FX).

Reads/writes to the `api_cache` table. Callers supply an endpoint string and
a query_params dict as the cache key; the response is stored as JSONB alongside
a fetch timestamp so data_integrity.py can verify freshness.

Falls back gracefully when Supabase is not configured — callers treat None
as a cache miss and proceed to the live API.
"""
from datetime import datetime, timezone
from typing import Optional

from db.supabase_client import get_supabase_client, supabase_available


class CacheManager:
    """Handles caching of external API responses in Supabase."""

    def get_cached_response(self, endpoint: str, query_params: dict) -> Optional[dict]:
        """
        Return cached API response if one exists, else None.

        Returns a dict with keys:
          - response_data: the original API payload
          - last_fetched_at: ISO8601 string of when it was stored
        """
        if not supabase_available():
            return None

        try:
            client = get_supabase_client()
            result = (
                client.table("api_cache")
                .select("response_data, last_fetched_at")
                .eq("endpoint", endpoint)
                .eq("query_params", query_params)
                .single()
                .execute()
            )
            return result.data if result.data else None
        except Exception:
            return None

    def set_cached_response(self, endpoint: str, query_params: dict, data: dict) -> None:
        """
        Upsert an API response into the cache, keyed by endpoint + query_params.

        Uses Supabase upsert on the UNIQUE(endpoint, query_params) constraint
        defined in schema.sql.
        """
        if not supabase_available():
            return

        try:
            client = get_supabase_client()
            client.table("api_cache").upsert(
                {
                    "endpoint": endpoint,
                    "query_params": query_params,
                    "response_data": data,
                    "last_fetched_at": datetime.now(timezone.utc).isoformat(),
                },
                on_conflict="endpoint,query_params",
            ).execute()
        except Exception:
            pass  # cache write failure is non-fatal — live data was already returned
