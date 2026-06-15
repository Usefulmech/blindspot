"""
GET  /api/decisions          — fetch all past analyses for a session
POST /api/rerun/{decision_id} — re-fetch live data and re-run agents on a saved decision

Both routes will read from / write to the Supabase `decisions` table.
For now (Day 1): returns stub JSON so the frontend My Decisions page can render.
Real Supabase integration lands on Day 5 (June 18).
"""
import json
from typing import Optional

from fastapi import APIRouter, HTTPException

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /api/decisions
# ---------------------------------------------------------------------------

@router.get("/api/decisions")
async def get_decisions(session_id: str):
    """
    Return all past analyses for a user session.

    Query parameter: ?session_id=<string>

    Response: array of decision objects from the Supabase `decisions` table.
    Each item shape matches the `done` event payload from POST /api/analyze.
    """
    # TODO (Day 5): query Supabase `decisions` table filtered by session_id
    # from db.supabase_client import get_supabase_client
    # client = get_supabase_client()
    # rows = client.table("decisions").select("*").eq("session_id", session_id).execute()
    # return rows.data

    # --- STUB ---
    return [
        {
            "id": "00000000-0000-0000-0000-000000000001",
            "session_id": session_id,
            "created_at": "2026-06-14T12:00:00Z",
            "origin_city": "Kigali",
            "destination_city": "Nairobi",
            "decision_text": "Accept the senior engineer role in Nairobi.",
            "score": 62,
            "grade": "B-",
            "advisory_flag": False,
            "share_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        }
    ]


# ---------------------------------------------------------------------------
# POST /api/rerun/{decision_id}
# ---------------------------------------------------------------------------

@router.post("/api/rerun/{decision_id}")
async def rerun_decision(decision_id: str):
    """
    Re-fetch fresh Numbeo + FX data for a saved decision and re-run agents.

    Path parameter: decision_id (UUID string from the `decisions` table)

    Response: same Server-Sent Events stream as POST /api/analyze.
    TODO (Day 5): load decision from Supabase, build fresh context, re-stream.
    """
    # TODO (Day 5): implement re-run with fresh live data + SSE stream
    raise HTTPException(
        status_code=501,
        detail=f"Re-run for decision {decision_id} not yet implemented. Coming Day 5.",
    )
