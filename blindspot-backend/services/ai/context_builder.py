"""
Context Builder — assembles the full prompt context for ATLAS, VERA, and AXIS.

Fetches live data from GetWhereNext and Open Exchange Rates concurrently, runs the
data integrity check, then returns a single context dict every agent receives.

Every financial figure includes its source and fetch timestamp — agents must
only cite numbers present here, never generate their own (Responsible AI rule).
"""
import asyncio
from typing import Optional

from schemas import AnalyzeRequest
from services.external.getwherenext import fetch_col_data
from services.external.fx import fetch_rates, convert
from services.scoring.data_integrity import verify_freshness, handle_stale_source
from db.decisions_store import get_decisions_for_session


async def build_context(request: AnalyzeRequest) -> dict:
    """
    Fetch all live data and assemble the agent context dict.

    Returns:
      {
        "user": { ...request fields... },
        "col": { "destination": {...}, "origin": {...} },
        "col_comparison": { factor-by-factor delta origin vs destination },
        "fx": { rates dict },
        "local_costs": { all CoL figures in destination local currency },
        "data_health": { status, warning, score_penalty, is_estimated, sources },
        "sources_summary": "string injected into every agent system prompt"
      }
    """
    destination = request.destination_city
    origin = request.origin_city

    col_dest, col_origin, fx_data = await asyncio.gather(
        fetch_col_data(destination) if destination else asyncio.sleep(0, result=None),
        fetch_col_data(origin) if origin else asyncio.sleep(0, result=None),
        fetch_rates(),
    )

    # Fetch up to 3 past decisions for this user — used by agents for memory-grounded debate
    past_decisions = get_decisions_for_session(request.session_id)
    # Exclude decisions with no score (incomplete runs) and cap at 3
    past_decisions = [d for d in past_decisions if d.get("score") is not None][:3]

    freshness = verify_freshness({
        "getwherenext": col_dest["last_fetched_at"] if col_dest else None,
        "fx": fx_data["last_fetched_at"] if fx_data else None,
    })
    data_health = handle_stale_source(freshness)

    local_costs = _convert_col_to_local(col_dest, fx_data)
    col_comparison = _build_col_comparison(col_origin, col_dest)

    return {
        "user": {
            "session_id": request.session_id,
            "decision_text": request.decision_text,
            "user_persona": request.user_persona,
            "origin_city": origin,
            "destination_city": destination,
            "assumptions": request.assumptions.model_dump(),
            "alternative_text": request.alternative_text,
            "values_rank": request.values_rank,
        },
        "col": {
            "destination": col_dest,
            "origin": col_origin,
        },
        "col_comparison": col_comparison,
        "fx": fx_data,
        "local_costs": local_costs,
        "data_health": data_health,
        "sources_summary": _build_sources_summary(col_dest, col_origin, fx_data, local_costs),
        "past_decisions": past_decisions,
        "memory_summary": _build_memory_summary(past_decisions),
    }


def _convert_col_to_local(col_dest: Optional[dict], fx_data: Optional[dict]) -> dict:
    """Convert every CoL factor to the destination city's local currency."""
    if not col_dest or not fx_data:
        return {}

    currency = col_dest.get("currency", "USD")
    rates = fx_data.get("rates", {})

    def to_local(usd: float) -> Optional[float]:
        return convert(usd, "USD", currency, rates)

    return {
        "currency": currency,
        "rent_1br_city_centre": to_local(col_dest.get("monthly_rent_1br_city_centre", 0)),
        "monthly_groceries": to_local(col_dest.get("monthly_groceries", 0)),
        "monthly_transport": to_local(col_dest.get("monthly_transport", 0)),
        "restaurant_meal_inexpensive": to_local(col_dest.get("restaurant_meal_inexpensive", 0)),
        "total_estimated_monthly": to_local(
            col_dest.get("monthly_rent_1br_city_centre", 0)
            + col_dest.get("monthly_groceries", 0)
            + col_dest.get("monthly_transport", 0)
            + col_dest.get("restaurant_meal_inexpensive", 0) * 20
        ),
    }


def _build_col_comparison(col_origin: Optional[dict], col_dest: Optional[dict]) -> dict:
    """Factor-by-factor delta (destination minus origin, in USD) for agent arguments."""
    if not col_origin or not col_dest:
        return {}

    factors = [
        "monthly_rent_1br_city_centre",
        "monthly_groceries",
        "monthly_transport",
        "restaurant_meal_inexpensive",
    ]

    comparison = {}
    for f in factors:
        origin_val = col_origin.get(f, 0)
        dest_val = col_dest.get(f, 0)
        delta = dest_val - origin_val
        pct_change = round(delta / origin_val * 100, 1) if origin_val else None
        comparison[f] = {
            "origin": origin_val,
            "destination": dest_val,
            "delta_usd": round(delta, 2),
            "pct_change": pct_change,
        }

    return comparison


def _build_sources_summary(col_dest, col_origin, fx_data, local_costs) -> str:
    """String injected into every agent prompt. Agents cite only these figures."""
    lines = ["=== LIVE DATA — cite these figures only, do not invent numbers ==="]

    if col_dest:
        c = col_dest["currency"]
        lc = local_costs
        lines.append(
            f"\nGetWhereNext [{col_dest['source']} · {col_dest['last_fetched_at'][:10]}] — {col_dest['city']} ({col_dest.get('country', '')}):"
            f"\n  Rent (1BR city centre): {col_dest['monthly_rent_1br_city_centre']} USD = {lc.get('rent_1br_city_centre')} {c}"
            f"\n  Monthly groceries:      {col_dest['monthly_groceries']} USD = {lc.get('monthly_groceries')} {c}"
            f"\n  Monthly transport:      {col_dest['monthly_transport']} USD = {lc.get('monthly_transport')} {c}"
            f"\n  Restaurant meal (inexp): {col_dest['restaurant_meal_inexpensive']} USD = {lc.get('restaurant_meal_inexpensive')} {c}"
            f"\n  Est. total monthly CoL: {lc.get('total_estimated_monthly')} {c}"
        )
    else:
        lines.append("\nGetWhereNext (destination): unavailable — agents must not quote CoL figures.")

    if col_origin:
        lines.append(
            f"\nGetWhereNext [{col_origin['source']}] — {col_origin['city']} ({col_origin.get('country', '')}, origin):"
            f"\n  Rent (1BR): {col_origin['monthly_rent_1br_city_centre']} {col_origin['currency']}"
            f"\n  Groceries:  {col_origin['monthly_groceries']} {col_origin['currency']}"
            f"\n  Transport:  {col_origin['monthly_transport']} {col_origin['currency']}"
        )

    if fx_data:
        lines.append(
            f"\nOpen Exchange Rates [{fx_data['source']} · {fx_data['last_fetched_at'][:10]}]: "
            "rates loaded for local currency conversion."
        )

    lines.append("\n=== END DATA ===")
    return "\n".join(lines)


def _build_memory_summary(past_decisions: list) -> str:
    """Format past decisions as a memory block injected into every agent prompt."""
    if not past_decisions:
        return ""

    lines = ["=== USER'S DECISION HISTORY (most recent first) ==="]
    for i, d in enumerate(past_decisions, 1):
        date = (d.get("created_at") or "")[:10]
        route = ""
        if d.get("origin_city") and d.get("destination_city"):
            route = f" | Route: {d['origin_city']} → {d['destination_city']}"
        blindspots = d.get("blindspots") or []
        bs_str = "; ".join(blindspots[:2]) if blindspots else "none recorded"
        lines.append(
            f"\n{i}. [{date}] \"{d.get('decision_text', '')}\""
            f"\n   Score: {d.get('score')}/100 ({d.get('grade')}){route}"
            f"\n   Key blindspots: {bs_str}"
        )
    lines.append("\n=== END HISTORY ===")
    return "\n".join(lines)
