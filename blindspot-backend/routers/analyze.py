"""
POST /api/analyze

Core route. Accepts user decision inputs, will eventually:
  1. Validate data integrity
  2. Fetch Numbeo + FX live data
  3. Build agent context
  4. Stream ATLAS (optimist) and VERA (realist) debate via Cencori SSE
  5. Run AXIS synthesis + scoring
  6. Persist result to Supabase
  7. Close the SSE stream with the final JSON payload

For now (Day 1): streams a realistic stub response so the frontend can build
and test DebateStream.jsx against a live SSE endpoint immediately.

SSE event format:
  event: atlas   — ATLAS text chunks (streamed word-by-word)
  event: vera    — VERA text chunks (streamed word-by-word)
  event: done    — Final JSON payload (score, axes, timeline, blindspots, etc.)
"""
import asyncio
import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from schemas import AnalyzeRequest

router = APIRouter()


async def _stub_stream(body: AnalyzeRequest):
    """Yields a canned debate so the frontend has a real SSE stream to consume."""

    atlas_chunks = [
        "Moving to a new city is one of the highest-ROI career moves available. ",
        "The destination's tech sector salary premium typically offsets the cost-of-living ",
        "increase within 8–14 months. ",
        "Early movers capture network advantages that compound over a 5-year horizon. ",
        "Your savings rate assumption of ",
        f"{body.assumptions.savings_rate}% ",
        "is realistic given the local median for your sector. ",
        "Source: Numbeo CoL Index Q2 2026.",
    ]

    vera_chunks = [
        "Let's stress-test those assumptions. ",
        f"Expected rent of {body.assumptions.expected_rent} is likely 15–20% below market ",
        "for your target city — first-year renters consistently underestimate this. ",
        "The salary premium cited by ATLAS applies to senior roles; ",
        "entry and mid-level roles show a smaller 12–18% gap net of taxes. ",
        f"Your stated confidence of {body.assumptions.confidence}% ",
        "may be inflated — planning fallacy risk is high for cross-city moves. ",
        "Source: ILO STAT wage distribution 2025.",
    ]

    # Stream ATLAS chunks
    for chunk in atlas_chunks:
        yield {"event": "atlas", "data": chunk}
        await asyncio.sleep(0.08)

    # Brief pause between agents, as the UI expects
    await asyncio.sleep(0.3)

    # Stream VERA chunks
    for chunk in vera_chunks:
        yield {"event": "vera", "data": chunk}
        await asyncio.sleep(0.08)

    await asyncio.sleep(0.4)

    # Final AXIS payload — matches the exact shape the frontend contract specifies
    done_payload = {
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
    }

    import uuid
    from db.supabase_client import get_supabase_client
    
    share_uuid = str(uuid.uuid4())
    done_payload["share_uuid"] = share_uuid
    
    try:
        db = get_supabase_client()
        record = {
            "session_id": body.session_id,
            "share_uuid": share_uuid,
            "decision_text": body.decision_text,
            "origin_city": body.origin_city,
            "destination_city": body.destination_city,
            "score": done_payload["score"],
            "grade": done_payload["grade"],
            "advisory_flag": done_payload["advisory_action"]["flagged"],
            "full_payload": done_payload
        }
        db.table("decisions").insert(record).execute()
    except Exception as e:
        print(f"Failed to save decision to Supabase: {e}")

    yield {"event": "done", "data": json.dumps(done_payload)}


@router.post("/api/analyze")
async def analyze(body: AnalyzeRequest):
    """
    Stream the ATLAS + VERA debate and AXIS final verdict for a given decision.

    Returns a Server-Sent Events stream. Frontend should use EventSource or
    fetch() with ReadableStream to consume events:
      - event: atlas  → append to ATLAS column
      - event: vera   → append to VERA column
      - event: done   → parse JSON for score, timeline, blindspots, data_health
    """
    return EventSourceResponse(_stub_stream(body))
