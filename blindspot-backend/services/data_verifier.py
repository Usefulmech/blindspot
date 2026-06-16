from datetime import datetime, timedelta, timezone

class DataVerifier:
    \"\"\"
    Ensures that data fetched from the cache or APIs is fresh enough to be used.
    If data is stale, it triggers a live refresh or falls back to secondary sources.
    \"\"\"

    STALENESS_THRESHOLD_DAYS = 30

    def __init__(self):
        pass

    def is_data_fresh(self, last_fetched_at: datetime) -> bool:
        \"\"\"
        Checks if the data is within the acceptable staleness threshold.
        \"\"\"
        now = datetime.now(timezone.utc)
        age = now - last_fetched_at
        return age.days <= self.STALENESS_THRESHOLD_DAYS

    def evaluate_data_health(self, last_fetched_at: datetime, fallback_used: bool) -> dict:
        \"\"\"
        Returns a data_health object to be sent to the frontend for the Data Freshness Badge.
        \"\"\"
        is_stale = not self.is_data_fresh(last_fetched_at)
        return {
            "is_stale": is_stale,
            "last_fetched": last_fetched_at.isoformat(),
            "fallback_used": fallback_used,
            "warning": "Data is older than 30 days." if is_stale else None
        }
