"""
Data Integrity Layer — checks whether external API data is fresh.

If data from Numbeo or Open Exchange Rates is older than 30 days, we flag it
and degrade gracefully: cached values are still used but the frontend is warned
and the Blindspot Score is penalised.

Three statuses:
  GREEN  — all sources fresh (fetched within 30 days)
  YELLOW — one or more sources stale (>30 days old)
  RED    — one or more sources completely unreachable (no data at all)
"""
from datetime import datetime, timezone

STALENESS_DAYS = 30
SCORE_PENALTY_YELLOW = 5   # per stale source
SCORE_PENALTY_RED = 15     # when a source is entirely unavailable


def verify_freshness(sources: dict[str, str | None]) -> dict:
    """
    Check the freshness of each data source by its last_fetched_at timestamp.

    Args:
      sources: { "numbeo": "<ISO8601>" | None, "fx": "<ISO8601>" | None }
               Pass None for a source that could not be fetched at all (RED).

    Returns:
      {
        "overall": "GREEN" | "YELLOW" | "RED",
        "sources": {
          "numbeo": { "status": "GREEN", "last_fetched": "...", "age_days": 2 },
          "fx":     { "status": "RED",   "last_fetched": None,  "age_days": None }
        }
      }
    """
    now = datetime.now(timezone.utc)
    source_statuses = {}
    worst = "GREEN"

    for name, last_fetched_iso in sources.items():
        if last_fetched_iso is None:
            source_statuses[name] = {"status": "RED", "last_fetched": None, "age_days": None}
            worst = "RED"
            continue

        last_fetched = datetime.fromisoformat(last_fetched_iso)
        age_days = (now - last_fetched).days
        status = "YELLOW" if age_days > STALENESS_DAYS else "GREEN"

        if status == "YELLOW" and worst == "GREEN":
            worst = "YELLOW"

        source_statuses[name] = {
            "status": status,
            "last_fetched": last_fetched_iso,
            "age_days": age_days,
        }

    return {"overall": worst, "sources": source_statuses}


def handle_stale_source(freshness_result: dict, current_score: int | None = None) -> dict:
    """
    Build the data_health payload and apply score penalties for stale/missing data.

    Args:
      freshness_result: output of verify_freshness()
      current_score: raw Blindspot Score before penalties (None pre-scoring)

    Returns:
      {
        "status": "GREEN" | "YELLOW" | "RED",
        "warning": str | None,
        "score_penalty": int,
        "adjusted_score": int | None,
        "is_estimated": bool,
        "sources": { ... }
      }
    """
    overall = freshness_result["overall"]
    stale = [n for n, s in freshness_result["sources"].items() if s["status"] == "YELLOW"]
    missing = [n for n, s in freshness_result["sources"].items() if s["status"] == "RED"]

    penalty = 0
    warning = None
    is_estimated = False

    if overall == "YELLOW":
        penalty = SCORE_PENALTY_YELLOW * len(stale)
        warning = (
            f"Data from {', '.join(stale)} is older than 30 days. "
            "Score adjusted downward. Analysis still valid."
        )

    elif overall == "RED":
        penalty = SCORE_PENALTY_RED
        is_estimated = True
        warning = (
            f"Live data unavailable for {', '.join(missing)}. "
            "Last cached values used. Score is estimated — treat with caution."
        )

    adjusted_score = max(0, current_score - penalty) if current_score is not None else None

    return {
        "status": overall,
        "warning": warning,
        "score_penalty": penalty,
        "adjusted_score": adjusted_score,
        "is_estimated": is_estimated,
        "sources": freshness_result["sources"],
    }
