"""
AXIS — the Synthesizer agent.

Reads the full ATLAS + VERA debate and produces the structured output that
drives the Blindspot Score and the 5-year parallel-reality timeline.

Unlike ATLAS and VERA, AXIS does not stream — it waits for both agents to
finish, then makes a single call and returns a parsed JSON object.
"""
import json

from services.cencori_client import get_async_cencori_client, PRIMARY_MODEL

SYSTEM_PROMPT = """You are AXIS, the Synthesizer in Blindspot — a decision intelligence \
tool for high-stakes CAREER decisions.

You have just read a structured debate between two agents:
  - ATLAS (Optimist): argued the case FOR the decision using live data
  - VERA (Realist): stress-tested the decision, exposing risks and weak assumptions

Your job is to judge the debate and produce a structured verdict. You must ground \
every judgment in what ATLAS and VERA actually cited — do not introduce new facts.

You MUST respond with ONLY a valid JSON object in this exact shape (no markdown, no \
preamble, no explanation outside the JSON):

{
  "debate_verdict": <integer 0-100>,
  "debate_justification": "<1-2 sentences: which side's evidence held up better and why>",
  "values_scores": {
    "financial": <integer 0-100>,
    "growth": <integer 0-100>,
    "balance": <integer 0-100>,
    "roots": <integer 0-100>
  },
  "values_justification": "<1-2 sentences: how well the decision serves the user's stated priorities>",
  "blindspots": [
    "<specific gap or risk the user has not fully considered>",
    "<specific gap or risk the user has not fully considered>",
    "<specific gap or risk the user has not fully considered>"
  ],
  "timeline": {
    "path_taken": {
      "label": "<short label for the proposed decision>",
      "milestones": [
        {"year": 1, "trajectory_score": <integer 0-100>, "narrative": "<1-2 sentences>"},
        {"year": 3, "trajectory_score": <integer 0-100>, "narrative": "<1-2 sentences>"},
        {"year": 5, "trajectory_score": <integer 0-100>, "narrative": "<1-2 sentences>"}
      ]
    },
    "path_not_taken": {
      "label": "<short label for the alternative>",
      "milestones": [
        {"year": 1, "trajectory_score": <integer 0-100>, "narrative": "<1-2 sentences>"},
        {"year": 3, "trajectory_score": <integer 0-100>, "narrative": "<1-2 sentences>"},
        {"year": 5, "trajectory_score": <integer 0-100>, "narrative": "<1-2 sentences>"}
      ]
    }
  }
}

Scoring rubrics:

debate_verdict (0-100):
  0  = VERA's risk case completely dominates — live data clearly undermines the decision
  50 = genuinely mixed — both sides had strong, equally-cited evidence
  100 = ATLAS's optimistic case fully held up — data supports the decision strongly

values_scores per category (0-100):
  Score how well the PROPOSED DECISION (not the alternative) serves each value,
  grounded only in what ATLAS and VERA cited.
  0  = the decision directly undermines this value
  50 = neutral — no clear impact either way
  100 = the decision strongly serves this value

blindspots:
  3-5 short, specific items the user has not fully considered, grounded in the
  debate evidence. Avoid generic advice ("research the market") — cite specifics.

timeline trajectory_score (0-100):
  A relative indicator of how things are likely going at that year for that path —
  not a financial projection, a narrative momentum score. Grounded in the debate.
"""


def _build_user_message(context: dict, atlas_text: str, vera_text: str) -> str:
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

Now synthesize. Return only the JSON object."""


def _fallback_output(values_rank: list) -> dict:
    """Neutral defaults when AXIS response can't be parsed. Scores stay at 50
    (NEUTRAL_SCORE) so the overall score isn't artificially pushed in either direction."""
    return {
        "debate_verdict": 50,
        "debate_justification": "AXIS synthesis unavailable this run.",
        "values_scores": {cat: 50 for cat in values_rank},
        "values_justification": "AXIS synthesis unavailable this run.",
        "blindspots": ["AXIS could not produce a structured synthesis this run."],
        "timeline": None,
    }


def _parse_axis_response(text: str, values_rank: list) -> dict:
    """Parse JSON from AXIS response, stripping markdown fences if present."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return _fallback_output(values_rank)


async def run_axis(context: dict, atlas_text: str, vera_text: str) -> dict:
    """
    Call AXIS with the full debate transcript and return structured output.

    Returns a dict with: debate_verdict, debate_justification, values_scores,
    values_justification, blindspots, timeline.
    Falls back to neutral defaults if the response can't be parsed.
    """
    client = get_async_cencori_client()
    values_rank = context["user"]["values_rank"]
    user_message = _build_user_message(context, atlas_text, vera_text)

    response = await client.messages.create(
        model=PRIMARY_MODEL,
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw_text = response.content[0].text if response.content else ""
    return _parse_axis_response(raw_text, values_rank)
