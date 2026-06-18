"""
POST /api/analyze

Core route. Accepts user decision inputs and runs the full pipeline:
  1. Build agent context — fetch Numbeo + FX live data, run freshness check
  2. Stream ATLAS (optimist) via Cencori SSE
  3. Stream VERA (realist) via Cencori SSE
  4. Run AXIS (synthesizer) — reads full debate, returns structured JSON
  5. Compute Blindspot Score via score_calculator
  6. Persist to Supabase
  7. Emit final done payload

SSE event format:
  event: atlas   — ATLAS text chunks (streamed live from Cencori)
  event: vera    — VERA text chunks (streamed live from Cencori)
  event: done    — Final JSON payload (score, grade, timeline, blindspots, advisory_action, data_health, share_uuid)
"""
import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from schemas import AnalyzeRequest
from services.ai.context_builder import build_context
from services.scoring.score_calculator import calculate_blindspot_score
from agents.atlas import stream_atlas
from agents.vera import stream_vera
from agents.axis import run_axis
from db.decisions_store import save_decision

router = APIRouter()


async def _analyze_stream(body: AnalyzeRequest):
    context = await build_context(body)

    # Accumulate full text while streaming so AXIS can read the complete debate
    atlas_chunks = []
    async for chunk in stream_atlas(context):
        atlas_chunks.append(chunk)
        yield {"event": "atlas", "data": chunk}

    vera_chunks = []
    async for chunk in stream_vera(context):
        vera_chunks.append(chunk)
        yield {"event": "vera", "data": chunk}

    atlas_text = "".join(atlas_chunks)
    vera_text = "".join(vera_chunks)

    # AXIS synthesizes the debate into structured output
    axis_output = await run_axis(context, atlas_text, vera_text)

    # Compute the Blindspot Score deterministically from AXIS's judged inputs
    actual_rent = context["local_costs"].get("rent_1br_city_centre") if context["local_costs"] else None
    score_block = calculate_blindspot_score(
        axis_output=axis_output,
        assumptions=context["user"]["assumptions"],
        actual_rent=actual_rent,
        values_rank=context["user"]["values_rank"],
        data_health=context["data_health"],
    )

    done_payload = {
        "score": score_block["score"],
        "grade": score_block["grade"],
        "axes": None,
        "timeline": axis_output.get("timeline"),
        "blindspots": axis_output.get("blindspots"),
        "advisory_action": score_block["advisory_action"],
        "data_health": context["data_health"],
        "provider_used": "claude",
    }

    # Persist to Supabase — returns share_uuid if saved, None if DB unconfigured
    share_uuid = save_decision(body, done_payload)
    done_payload["share_uuid"] = share_uuid

    yield {"event": "done", "data": json.dumps(done_payload)}


@router.post("/api/analyze")
async def analyze(body: AnalyzeRequest):
    """
    Stream the ATLAS + VERA debate for a given career decision, then emit
    the Blindspot Score and 5-year timeline once AXIS synthesizes the result.

    Returns a Server-Sent Events stream:
      - event: atlas  → append to ATLAS column
      - event: vera   → append to VERA column
      - event: done   → parse JSON for score, timeline, blindspots, advisory_action, share_uuid
    """
    return EventSourceResponse(_analyze_stream(body))
