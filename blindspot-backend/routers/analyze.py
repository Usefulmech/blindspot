"""
POST /api/analyze

Core route. Accepts user decision inputs and runs the full pipeline:
  1. Build agent context — fetch Numbeo + FX live data, run freshness check
  2. Stream ATLAS (optimist) via Cencori SSE
  3. Stream VERA (realist) via Cencori SSE
  4. Run AXIS (synthesizer) — structured JSON: debate verdict, values scores,
     blindspots, 5-year parallel-reality timeline
  5. Compute Blindspot Score from AXIS output + deterministic estimation accuracy
  6. Persist to Supabase and emit final done payload

SSE event format:
  event: atlas   — ATLAS text chunks (streamed live from Cencori)
  event: vera    — VERA text chunks (streamed live from Cencori)
  event: done    — Final JSON payload (score, grade, timeline, blindspots, data_health)
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

    # Stream ATLAS — accumulate full text so AXIS can read the whole debate
    atlas_chunks = []
    async for chunk in stream_atlas(context):
        atlas_chunks.append(chunk)
        yield {"event": "atlas", "data": chunk}

    # Stream VERA — same accumulation pattern
    vera_chunks = []
    async for chunk in stream_vera(context):
        vera_chunks.append(chunk)
        yield {"event": "vera", "data": chunk}

    atlas_text = "".join(atlas_chunks)
    vera_text = "".join(vera_chunks)

    # AXIS reads the full debate and produces structured output
    axis_output = await run_axis(context, atlas_text, vera_text)

    # Estimation accuracy is deterministic — compare user's stated rent to real data
    actual_rent = (context.get("local_costs") or {}).get("rent_1br_city_centre")

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
        "components": score_block["components"],
        "data_health": context["data_health"],
        "provider_used": "claude",
    }

    # Persist and attach share_uuid so frontend can link to the report immediately
    share_uuid = save_decision(body, done_payload)
    if share_uuid:
        done_payload["share_uuid"] = share_uuid

    yield {"event": "done", "data": json.dumps(done_payload)}


@router.post("/api/analyze")
async def analyze(body: AnalyzeRequest):
    """
    Stream the ATLAS + VERA debate for a given career decision, then emit a
    scored done payload once AXIS synthesizes the result.

    Frontend must use fetch() + ReadableStream (POST body required — EventSource
    is GET-only and won't work here).
    """
    return EventSourceResponse(_analyze_stream(body))
