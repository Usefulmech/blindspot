"""
AXIS — the Synthesizer agent.

Two separate calls:
  1. stream_axis_summary — streams a short debate verdict (SSE event: axis)
  2. run_axis_json       — collects the structured JSON verdict for score calculation

Splitting into two calls keeps each response short and reliable.
"""
import json
import re
from typing import AsyncGenerator, Any

from services.ai.cencori_client import async_stream_chat, async_collect_chat


# ─────────────────────────────────────────────────────────────
# Shared context builder
# ─────────────────────────────────────────────────────────────

def _debate_block(context: dict, atlas_text: str, vera_text: str) -> str:
    user = context["user"]

    return f"""DECISION: {user['decision_text']}
PERSONA: {user['user_persona']}
ALTERNATIVE: {user['alternative_text']}
VALUES RANKING (most to least important): {', '.join(user['values_rank'])}
USER ASSUMPTIONS: expected rent {user['assumptions']['expected_rent']}, \
savings rate {user['assumptions']['savings_rate']}%, confidence {user['assumptions']['confidence']}%

{context['sources_summary']}

--- ATLAS argued ---
{atlas_text}

--- VERA argued ---
{vera_text}
"""


# ─────────────────────────────────────────────────────────────
# SUMMARY SYSTEM PROMPT
# ─────────────────────────────────────────────────────────────

_SUMMARY_SYSTEM = """You are AXIS, the Synthesizer in Blindspot — a decision intelligence tool for career decisions.

Summarize the debate between ATLAS (Optimist) and VERA (Realist) in 3–5 sentences.
State who won, why, and end with a clear verdict. No bullets, no headers."""


async def stream_axis_summary(
    context: dict,
    atlas_text: str,
    vera_text: str
) -> AsyncGenerator[str, None]:

    user_message = _debate_block(context, atlas_text, vera_text) + "\n\nSummarize the debate."

    async for chunk in async_stream_chat([
        {"role": "system", "content": _SUMMARY_SYSTEM},
        {"role": "user", "content": user_message},
    ]):
        yield chunk


# ─────────────────────────────────────────────────────────────
# JSON SYSTEM PROMPT
# ─────────────────────────────────────────────────────────────

_JSON_SYSTEM = """You are AXIS, a decision intelligence engine for high-stakes career decisions.

Analyze the debate between ATLAS (Optimist) and VERA (Realist) and return ONLY a raw JSON object.
No markdown. No backticks. No commentary. Start with { and end with }.
All values must come strictly from the debate.

OUTPUT THIS EXACT STRUCTURE:
{
  "debate_verdict": <integer 0-100, 0=VERA dominated, 50=mixed, 100=ATLAS dominated>,
  "debate_justification": "<1-2 sentences on which side's evidence held up better>",
  "values_scores": {
    "financial": <integer 0-100>,
    "growth": <integer 0-100>,
    "balance": <integer 0-100>,
    "roots": <integer 0-100>
  },
  "values_justification": "<1-2 sentences on how the decision serves the user's priorities>",
  "blindspots": [
    "<specific risk from the debate, not generic advice>",
    "<specific risk from the debate>",
    "<specific risk from the debate>"
  ],
  "timeline": {
    "path_taken": {
      "label": "<short label for the proposed decision>",
      "milestones": [
        {"year": 1, "trajectory_score": <integer 0-100>, "narrative": "<what happens at year 1>"},
        {"year": 3, "trajectory_score": <integer 0-100>, "narrative": "<what happens at year 3>"},
        {"year": 5, "trajectory_score": <integer 0-100>, "narrative": "<what happens at year 5>"}
      ]
    },
    "path_not_taken": {
      "label": "<short label for the alternative>",
      "milestones": [
        {"year": 1, "trajectory_score": <integer 0-100>, "narrative": "<what happens at year 1>"},
        {"year": 3, "trajectory_score": <integer 0-100>, "narrative": "<what happens at year 3>"},
        {"year": 5, "trajectory_score": <integer 0-100>, "narrative": "<what happens at year 5>"}
      ]
    }
  }
}"""


# ─────────────────────────────────────────────────────────────
# JSON EXTRACTION (SAFE)
# ─────────────────────────────────────────────────────────────

def _extract_json_str(text: str) -> str:
    """
    Robust JSON extraction:
    - removes ```json fences
    - strips surrounding noise
    - extracts first valid JSON object block
    """

    text = text.strip()

    # remove code fences if present
    text = re.sub(r"^```json", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"^```", "", text).strip()
    text = re.sub(r"```$", "", text).strip()

    # try direct parse first
    try:
        json.loads(text)
        return text
    except Exception:
        pass

    # fallback: extract first {...last...}
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError("No valid JSON object found in model output")

    return text[start:end + 1]


def _safe_json_parse(text: str) -> dict:
    """
    Strict JSON parsing with clear failure behavior.
    """
    cleaned = _extract_json_str(text)
    return json.loads(cleaned)


# ─────────────────────────────────────────────────────────────
# SMART FALLBACK — uses real context when AXIS JSON fails
# ─────────────────────────────────────────────────────────────

def _smart_fallback(context: dict, atlas_text: str, vera_text: str) -> dict:
    """
    Build a context-aware fallback when the JSON call fails.
    Uses the user's confidence, values ranking, and VERA's argument
    so the frontend always has real structure to render.
    Scores are heuristic — clearly labelled as estimated.
    """
    user = context["user"]
    values_rank = user["values_rank"]
    confidence = user["assumptions"].get("confidence", 50)
    destination = user.get("destination_city", "the new role")
    alternative = (user.get("alternative_text") or "staying in current role")[:50]

    # Lean toward ATLAS if user is confident, toward VERA if not
    debate_verdict = min(72, max(30, 38 + int(confidence * 0.38)))

    # Top value benefits most from a bold career move; bottom value (usually roots) least
    score_map = [65, 58, 48, 38]
    values_scores = {v: score_map[i] for i, v in enumerate(values_rank)}

    # Pull VERA's first paragraph as the sharpest real blindspot
    blindspots = []
    if vera_text:
        first_para = (vera_text.split("\n\n")[0] if "\n\n" in vera_text else vera_text)
        snippet = first_para.strip()[:220].rsplit(" ", 1)[0]
        if snippet:
            blindspots.append(snippet + " [VERA's primary concern]")
    blindspots += [
        "Tax and social security implications in the destination have not been fully modelled.",
        "Professional network and momentum built in the origin city may not transfer easily.",
    ]

    timeline = {
        "path_taken": {
            "label": f"Move to {destination}",
            "milestones": [
                {
                    "year": 1,
                    "trajectory_score": 54,
                    "narrative": (
                        f"Transition year in {destination}. Relocation costs, onboarding, "
                        "and adjustment eat into the early financial upside."
                    ),
                },
                {
                    "year": 3,
                    "trajectory_score": 67,
                    "narrative": (
                        f"Settled and productive. The gains in {values_rank[0]} start to "
                        "compound as the initial friction fades."
                    ),
                },
                {
                    "year": 5,
                    "trajectory_score": 73,
                    "narrative": (
                        "Career trajectory has clearly diverged. The move pays off on the "
                        "dimensions that mattered most at the time of the decision."
                    ),
                },
            ],
        },
        "path_not_taken": {
            "label": alternative,
            "milestones": [
                {
                    "year": 1,
                    "trajectory_score": 66,
                    "narrative": "Familiar and stable. Short-term comfort and continuity intact.",
                },
                {
                    "year": 3,
                    "trajectory_score": 57,
                    "narrative": (
                        "Growth plateau becomes visible. The opportunity cost of not moving "
                        "starts to compound quietly."
                    ),
                },
                {
                    "year": 5,
                    "trajectory_score": 50,
                    "narrative": (
                        "The question of whether the alternative was the right call is harder "
                        "to answer — but also harder to revisit."
                    ),
                },
            ],
        },
    }

    return {
        "debate_verdict": debate_verdict,
        "debate_justification": (
            "Estimated verdict — AXIS could not produce a full structured analysis this run. "
            "Scores reflect your stated confidence and values priority."
        ),
        "values_scores": values_scores,
        "values_justification": (
            f"Estimated based on your values ranking ({', '.join(values_rank)}) "
            "and the debate arguments. Run again for a precise synthesis."
        ),
        "blindspots": blindspots[:3],
        "timeline": timeline,
    }


# ─────────────────────────────────────────────────────────────
# MAIN JSON CALL
# ─────────────────────────────────────────────────────────────

async def run_axis_json(
    context: dict,
    atlas_text: str,
    vera_text: str
) -> dict:

    values_rank = context["user"]["values_rank"]

    user_message = (
        _debate_block(context, atlas_text, vera_text)
        + "\n\nReturn ONLY the JSON verdict."
    )

    raw_text = await async_collect_chat([
        {"role": "system", "content": _JSON_SYSTEM},
        {"role": "user", "content": user_message},
    ])

    print(f"[AXIS JSON] received {len(raw_text)} chars")

    try:
        return _safe_json_parse(raw_text)
    except Exception as e:
        print(f"[AXIS JSON ERROR] {str(e)}")
        print(f"[AXIS RAW OUTPUT PREVIEW] {raw_text[:300]!r}")
        return _smart_fallback(context, atlas_text, vera_text)