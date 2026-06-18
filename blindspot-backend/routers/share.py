"""
GET /api/report/{share_uuid} — fetch a shareable one-page report card

Returns a single decision object by its share UUID so anyone with the link
can view the analysis without needing a session ID.
"""
from fastapi import APIRouter, HTTPException

from db.decisions_store import get_decision_by_share_uuid

router = APIRouter()


@router.get("/api/report/{share_uuid}")
async def get_report(share_uuid: str):
    """
    Return a single decision report by its public share UUID.

    Path parameter: share_uuid (UUID from decisions.share_uuid column)
    Returns 404 if not found or Supabase is unconfigured.
    """
    row = get_decision_by_share_uuid(share_uuid)

    if not row:
        raise HTTPException(status_code=404, detail="Report not found.")

    return row
