"""
GET  /api/decisions           — fetch all past analyses for a session
POST /api/rerun/{decision_id} — re-fetch live data and re-run agents on a saved decision
"""
from fastapi import APIRouter, HTTPException, Header
from sse_starlette.sse import EventSourceResponse

from schemas import AnalyzeRequest
from db.decisions_store import get_decisions_for_session, get_decision_by_id
from routers.analyze import _analyze_stream
from services.auth import resolve_user_id

router = APIRouter()


@router.get("/api/decisions")
async def get_decisions(session_id: str = "", authorization: str | None = Header(default=None)):
    """
    Return all past analyses for a user, newest first.
    Prefers the authenticated user_id from the JWT over the session_id query param.
    """
    user_id = await resolve_user_id(authorization, session_id)
    return get_decisions_for_session(user_id)


@router.post("/api/rerun/{decision_id}")
async def rerun_decision(decision_id: str):
    """
    Re-fetch fresh GetWhereNext + FX data for a saved decision and re-run all agents.

    Loads the original request from `raw_data` in the decisions table, then
    runs the exact same SSE pipeline as POST /api/analyze with fresh live data.
    Returns the same SSE stream — frontend can consume it identically.
    """
    row = get_decision_by_id(decision_id)

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Decision {decision_id} not found.",
        )

    raw_data = row.get("raw_data")
    if not raw_data:
        raise HTTPException(
            status_code=422,
            detail=f"Decision {decision_id} has no stored request data — cannot rerun.",
        )

    body = AnalyzeRequest(**raw_data)
    return EventSourceResponse(_analyze_stream(body))
