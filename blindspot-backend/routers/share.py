"""
GET /api/report/{share_uuid} — fetch a shareable one-page report card

Returns a single decision object by its share UUID so anyone with the link
can view the analysis without needing a session ID.
Real Supabase integration lands on Day 6 (June 19).
"""
from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/api/report/{share_uuid}")
async def get_report(share_uuid: str):
    """
    Return a single decision report by its public share UUID.

    Path parameter: share_uuid (UUID string from the `decisions.share_uuid` column)

    Response: single decision object — same shape as an item from GET /api/decisions,
    plus full axes / timeline / blindspots / data_health fields.
    """
    # TODO (Day 6): query Supabase `decisions` table by share_uuid
    # from db.supabase_client import get_supabase_client
    # client = get_supabase_client()
    # row = client.table("decisions").select("*").eq("share_uuid", share_uuid).single().execute()
    # if not row.data:
    #     raise HTTPException(status_code=404, detail="Report not found.")
    # return row.data

    # --- STUB ---
    if share_uuid != "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee":
        raise HTTPException(status_code=404, detail="Report not found.")

    return {
        "id": "00000000-0000-0000-0000-000000000001",
        "session_id": "demo-session",
        "created_at": "2026-06-14T12:00:00Z",
        "origin_city": "Kigali",
        "destination_city": "Nairobi",
        "decision_text": "Accept the senior engineer role in Nairobi.",
        "score": 62,
        "grade": "B-",
        "axes": {
            "financial_realism": 58,
            "optimism_bias": 65,
            "planning_fallacy_risk": 55,
            "regret_alignment": 70,
        },
        "timeline": [
            {
                "year": 1,
                "path_taken": "Settling in, rent shock absorbed, building local network.",
                "path_not_taken": "Stable but stagnant — same role, limited upside.",
            },
            {
                "year": 3,
                "path_taken": "Salary 22% above baseline; professional network established.",
                "path_not_taken": "Incremental 8% raise; no new market exposure.",
            },
            {
                "year": 5,
                "path_taken": "Full break-even on relocation costs; compounding network effect.",
                "path_not_taken": "Regret probability elevated — missed window closes.",
            },
        ],
        "blindspots": [
            {
                "title": "Rent underestimation",
                "detail": "First-year rental costs typically run 15–20% above user estimates.",
                "source": "Numbeo Rental Index Q2 2026",
            },
            {
                "title": "Tax bracket shift",
                "detail": "Higher gross salary may push you into a new tax bracket, compressing net gains.",
                "source": "ILO STAT 2025",
            },
            {
                "title": "Social capital loss",
                "detail": "Relocation severs existing professional networks — rebuild time averages 18 months.",
                "source": "World Bank Social Capital Report 2024",
            },
        ],
        "advisory_flag": False,
        "advisory_action": {
            "flagged": False,
            "message": None,
            "office_contact": None,
        },
        "data_health": {
            "status": "GREEN",
            "is_stale": False,
            "last_fetched": "2026-06-15T10:00:00Z",
            "fallback_used": False,
            "warning": None,
        },
        "provider_used": "stub",
        "share_uuid": share_uuid,
    }
