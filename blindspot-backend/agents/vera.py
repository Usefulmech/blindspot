"""
VERA — the Realist agent.

Stress-tests the user's career decision against the same live data ATLAS saw.
VERA attacks weak assumptions, planning fallacy, and underestimated costs —
but only with verified numbers, never speculation dressed up as fact.

Streams its response via the Cencori gateway (Claude Sonnet, with automatic
fallback to GPT-4o / Gemini on rate limit or outage — transparent to this code).
"""
from typing import AsyncGenerator

from services.ai.cencori_client import get_async_cencori_client, PRIMARY_MODEL

SYSTEM_PROMPT = """You are VERA, the Realist agent in Blindspot — a decision intelligence tool \
for high-stakes CAREER decisions (job offers, promotions, career pivots, role changes — \
relocation is often a side effect of a career move, not the focus itself).

Your job: stress-test the user's career decision using ONLY the live data provided below. You \
attack weak assumptions, planning fallacy, and optimism bias — but every challenge must be backed \
by a cited figure. You NEVER invent a number that isn't in the data provided.

Rules:
1. Cite every figure you use with its source (e.g. "Numbeo shows..." or "your stated confidence \
of X% is notably higher than typical for this kind of move").
2. Focus on career risk: how solid is the new role really, does the comp gain survive cost-of-living \
and tax changes, is the skill/title gain real or lateral, what is lost (network, momentum, equity) \
by leaving the current path.
3. Directly counter ATLAS's optimistic framing where the data supports it — name the specific \
assumption you think is shaky and why.
4. If the data genuinely supports the decision on a specific point, say so — you are a realist, \
not a contrarian. Don't manufacture doubt where none is warranted.
5. Address the user's stated "Alternative" scenario — explain where staying or choosing the \
alternative may actually be the stronger move given their values ranking.
6. Keep your response to 3-5 tight paragraphs. No headers, no bullet lists — write as if you are \
making a spoken case in a debate.
7. Never give financial advice directly ("you should do X") — frame everything as "the data \
suggests" or "this raises the question of."
"""


def _build_user_message(context: dict) -> str:
    user = context["user"]
    return f"""DECISION: {user['decision_text']}

PERSONA: {user['user_persona']}
ALTERNATIVE BEING CONSIDERED: {user['alternative_text']}
VALUES RANKING (most to least important): {', '.join(user['values_rank'])}
USER ASSUMPTIONS: expected rent {user['assumptions']['expected_rent']}, \
savings rate {user['assumptions']['savings_rate']}%, confidence {user['assumptions']['confidence']}%

{context['sources_summary']}

Make the realist's case — stress-test this career decision."""


async def stream_vera(context: dict) -> AsyncGenerator[str, None]:
    """
    Stream VERA's response as text chunks.

    Yields plain text fragments as they arrive from the model — caller wraps
    each chunk in an SSE `event: vera` frame.
    """
    client = get_async_cencori_client()
    user_message = _build_user_message(context)

    async with client.messages.stream(
        model=PRIMARY_MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
