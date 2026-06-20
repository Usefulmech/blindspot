"""
Supabase read/write helpers for the `decisions` table.

All functions degrade silently when Supabase is unconfigured — callers get
empty lists or None instead of exceptions, so the API never crashes due to
missing DB credentials.
"""
from db.supabase_client import get_supabase_client, supabase_available


def save_decision(body, done_payload: dict) -> str | None:
    """
    Persist a completed analysis to the decisions table.

    Stores the full original request in `raw_data` so rerun can reconstruct
    the AnalyzeRequest without asking the user to re-submit the form.

    Returns the Supabase-generated share_uuid, or None if unconfigured/failed.
    """
    if not supabase_available():
        return None

    try:
        client = get_supabase_client()
        result = client.table("decisions").insert({
            "session_id": body.session_id,
            "origin_city": body.origin_city,
            "destination_city": body.destination_city,
            "decision_text": body.decision_text,
            "score": done_payload.get("score"),
            "grade": done_payload.get("grade"),
            "axes": done_payload.get("axes"),
            "timeline": done_payload.get("timeline"),
            "blindspots": done_payload.get("blindspots"),
            "components": done_payload.get("components"),
            "advisory_flag": done_payload.get("advisory_action", {}).get("flagged", False),
            "data_health": done_payload.get("data_health"),
            "provider_used": done_payload.get("provider_used"),
            "raw_data": body.model_dump(),
        }).execute()

        if result.data:
            return result.data[0].get("share_uuid")
        return None

    except Exception:
        import traceback
        print("❌ save_decision failed:", traceback.format_exc())
        return None


def get_decisions_for_session(session_id: str) -> list:
    """Return all past analyses for a session, newest first."""
    if not supabase_available():
        return []

    try:
        client = get_supabase_client()
        result = (
            client.table("decisions")
            .select("id, session_id, created_at, origin_city, destination_city, decision_text, score, grade, advisory_flag, share_uuid")
            .eq("session_id", session_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []
    except Exception:
        return []


def get_decision_by_id(decision_id: str) -> dict | None:
    """Fetch a full decision row by its UUID — used by rerun."""
    if not supabase_available():
        return None

    try:
        client = get_supabase_client()
        result = (
            client.table("decisions")
            .select("*")
            .eq("id", decision_id)
            .single()
            .execute()
        )
        return result.data
    except Exception:
        return None


def get_decision_by_share_uuid(share_uuid: str) -> dict | None:
    """Fetch a full decision row by its public share UUID — used by the report endpoint."""
    if not supabase_available():
        return None

    try:
        client = get_supabase_client()
        result = (
            client.table("decisions")
            .select("*")
            .eq("share_uuid", share_uuid)
            .single()
            .execute()
        )
        return result.data
    except Exception:
        return None
