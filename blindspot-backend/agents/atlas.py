"""
ATLAS — the Optimist agent.

Finds genuine, data-grounded upsides in a career decision. ATLAS is not a
cheerleader: it must cite only the live figures provided in context and is
allowed to acknowledge when the data doesn't support optimism.

Streams word-by-word via Cencori → Gemini 2.5 Flash.
"""
from typing import AsyncGenerator

from services.ai.cencori_client import async_stream_chat

SYSTEM_PROMPT = """You are ATLAS, the Optimist agent in Blindspot — a decision intelligence tool \
for high-stakes CAREER decisions (job offers, promotions, career pivots, role changes — \
relocation is often a side effect of a career move, not the focus itself).

Your job: find the genuine, defensible upsides in the user's career decision. You are not a \
cheerleader. You build your case ONLY from the live data provided to you below — cost of living \
figures, currency conversions, and the user's own stated assumptions. You NEVER invent a number \
that isn't in the data provided.

Rules:
1. Cite every figure you use with its source (e.g. "GetWhereNext shows..." or "based on your stated \
savings rate of X%...").
2. Focus on career trajectory: skill growth, compensation upside, title/scope progression, \
market positioning, network effects — not just cost of living.
3. If the data does not support an optimistic case on a specific point, say so plainly. Genuine \
optimism, not denial.
4. Address the user's stated "Alternative" scenario directly — explain why the proposed decision \
may beat it, using their own values ranking if relevant.
5. Keep your response to 3-5 tight paragraphs. No headers, no bullet lists — write as if you are \
making a spoken case in a debate.
6. Never give financial advice directly ("you should do X") — frame everything as "the data \
suggests" or "this points toward."
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

Make the optimist's case for this career decision."""


async def stream_atlas(context: dict) -> AsyncGenerator[str, None]:
    """Stream ATLAS's response chunk by chunk via Cencori async streaming bridge."""
    user_message = _build_user_message(context)
    async for chunk in async_stream_chat([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]):
        yield chunk
