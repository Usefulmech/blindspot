"""
ATLAS — the Optimist agent.

Finds genuine, data-grounded upsides in a career decision. ATLAS is not a
cheerleader: it must cite only the live figures provided in context and is
allowed to acknowledge when the data doesn't support optimism.

Participates in a multi-turn debate:
  Turn 1 (opening)  — makes the initial optimist case
  Turn 2 (counter)  — directly responds to VERA's rebuttal
"""
from typing import AsyncGenerator

from services.ai.cencori_client import async_stream_chat

_SYSTEM = """You are ATLAS, the Optimist agent in Blindspot — a decision intelligence tool \
for high-stakes CAREER decisions.

Your job: find the genuine, defensible upsides in the user's career decision. You are NOT a \
cheerleader. Build your case ONLY from the live data provided — never invent a number.

Rules:
1. Cite every figure you use (e.g. "GetWhereNext shows..." or "your stated savings rate of X%...").
2. Focus on career trajectory: skill growth, compensation upside, title/scope, market positioning.
3. If data does not support optimism on a specific point, say so plainly.
4. Address the user's "Alternative" scenario directly using their values ranking.
5. Write as if you are speaking in a live debate — punchy, direct, no bullet lists or headers.
6. Never give direct financial advice — frame as "the data suggests" or "this points toward."
"""


def _format_history(debate_history: list[tuple[str, str]]) -> str:
    lines = ["\n=== DEBATE SO FAR ==="]
    for speaker, text in debate_history:
        lines.append(f"\n[{speaker}]:\n{text}")
    lines.append("=== END DEBATE ===")
    return "\n".join(lines)


def _build_message(context: dict, debate_history: list[tuple[str, str]]) -> str:
    user = context["user"]
    memory = context.get("memory_summary", "")
    base = f"""DECISION: {user['decision_text']}
PERSONA: {user['user_persona']}
ALTERNATIVE: {user['alternative_text']}
VALUES RANKING: {', '.join(user['values_rank'])}
USER ASSUMPTIONS: expected rent {user['assumptions']['expected_rent']}, \
savings rate {user['assumptions']['savings_rate']}%, confidence {user['assumptions']['confidence']}%

{context['sources_summary']}
{memory}"""

    if not debate_history:
        return (
            base
            + "\n\nMake the optimist's opening case in 2-3 tight paragraphs."
            + ("\n\nIf the user's history above is relevant, reference it — e.g. whether this "
               "decision builds on past ones or represents a pattern worth noting." if memory else "")
        )

    return (
        base
        + _format_history(debate_history)
        + "\n\nVERA just challenged you. Counter her SPECIFIC points using the data above. "
        "Don't repeat your opening — address exactly what she said. 1-2 paragraphs."
    )


async def stream_atlas(
    context: dict, debate_history: list[tuple[str, str]] | None = None
) -> AsyncGenerator[str, None]:
    """Stream ATLAS. Pass debate_history for counter-argument turn, omit for opening."""
    message = _build_message(context, debate_history or [])
    async for chunk in async_stream_chat([
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": message},
    ]):
        yield chunk
