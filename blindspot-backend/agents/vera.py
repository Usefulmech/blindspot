"""
VERA — the Realist agent.

Stress-tests the user's career decision against live data.
VERA attacks weak assumptions, planning fallacy, and optimism bias —
but only with verified numbers, never speculation dressed up as fact.

Participates in a multi-turn debate:
  Turn 1 (rebuttal) — reads ATLAS's opening and counters it directly
  Turn 2 (closing)  — responds to ATLAS's counter, delivers final argument
"""
from typing import AsyncGenerator

from services.ai.cencori_client import async_stream_chat

_SYSTEM = """You are VERA, the Realist agent in Blindspot — a decision intelligence tool \
for high-stakes CAREER decisions.

Your job: stress-test the user's career decision using ONLY the live data provided. Attack \
weak assumptions, planning fallacy, and optimism bias — but every challenge must be backed by \
a cited figure. Never invent a number.

Rules:
1. Cite every figure (e.g. "GetWhereNext shows..." or "your stated confidence of X% is high given...").
2. Focus on career risk: how solid is the new role, does the comp gain survive CoL and tax, \
what is lost (network, momentum) by leaving.
3. Directly rebut ATLAS's specific claims — name them, then show what the data actually says.
4. If data genuinely supports a point ATLAS made, concede it briefly and move on.
5. Write as if speaking in a live debate — punchy, direct, no bullet lists or headers.
6. Never give direct financial advice — frame as "the data suggests" or "this raises the question of."
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

    if len(debate_history) <= 1:
        atlas_text = debate_history[0][1] if debate_history else ""
        memory_instruction = (
            "\nIf the user's decision history shows a repeating pattern (e.g. consistently "
            "overconfident, repeatedly considering international moves), call it out explicitly."
            if memory else ""
        )
        return (
            base
            + (f"\n\nATLAS just made this opening case:\n[ATLAS]:\n{atlas_text}\n" if atlas_text else "")
            + "\nRebut ATLAS's SPECIFIC claims using the data above. "
            "Name the exact points you disagree with. 2-3 tight paragraphs."
            + memory_instruction
        )

    return (
        base
        + _format_history(debate_history)
        + "\n\nATLAS just countered your rebuttal. Make your closing argument. "
        "Add one final insight ATLAS hasn't addressed. Don't repeat yourself. 1-2 paragraphs."
    )


async def stream_vera(
    context: dict, debate_history: list[tuple[str, str]] | None = None
) -> AsyncGenerator[str, None]:
    """Stream VERA. Pass debate_history (must include at least ATLAS's opening)."""
    message = _build_message(context, debate_history or [])
    async for chunk in async_stream_chat([
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": message},
    ]):
        yield chunk
