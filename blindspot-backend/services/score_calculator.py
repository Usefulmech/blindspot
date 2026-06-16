"""
Blindspot Score Calculator — combines three independently-scored components
into the final overall score, then applies the data-health penalty.

  Overall Score = avg(Values Alignment, Debate Verdict, Estimation Score) - Penalty

  - Values Alignment : AXIS scores each values_rank category 0-100; weighted by
                        rank order (1st = 0.40, 2nd = 0.30, 3rd = 0.20, 4th = 0.10)
  - Debate Verdict    : AXIS judges which side the live data actually supported
  - Estimation Score  : fully deterministic — how accurate/well-calibrated the
                        user's own stated assumptions are against real CoL data
  - Penalty           : data_health.score_penalty (stale/missing source deduction)

Equal weighting (1/3 each) across Values Alignment, Debate Verdict, and
Estimation Score — no component is treated as more important than another.
"""

ADVISORY_THRESHOLD = 40

RANK_WEIGHTS = [0.40, 0.30, 0.20, 0.10]  # 1st through 4th place in values_rank

GRADE_BANDS = [
    (90, "A"),
    (80, "B+"),
    (70, "B"),
    (60, "B-"),
    (50, "C+"),
    (40, "C"),
    (0, "F"),
]

# Used when a component can't be verified against real data (e.g. a career
# decision with no destination_city, so there's no rent to check against).
# Neutral means "don't know" — never penalize what we can't verify.
NEUTRAL_SCORE = 50


def calculate_assumption_accuracy(expected_rent: float, actual_rent: float | None) -> float:
    """How close the user's stated rent assumption is to the real local rent."""
    if not actual_rent:
        return NEUTRAL_SCORE
    deviation = abs(expected_rent - actual_rent) / actual_rent
    return round(max(0, 100 * (1 - deviation)), 1)


def calculate_confidence_calibration(confidence: int, accuracy: float) -> float:
    """Does the user's stated confidence match how accurate they actually are?

    Confident + accurate scores high. Confident + wrong (overconfidence /
    planning fallacy) scores low, regardless of which direction they were wrong.
    """
    gap = abs(confidence - accuracy) / 100
    return round(max(0, 100 * (1 - gap)), 1)


def calculate_estimation_score(accuracy: float, calibration: float) -> float:
    """Accuracy weighted higher — it's the concrete signal. Calibration is the
    secondary self-awareness check on top of it."""
    return round(0.7 * accuracy + 0.3 * calibration, 1)


def calculate_values_alignment(category_scores: dict, values_rank: list[str]) -> float:
    """Weighted sum of AXIS's per-category scores, ordered by values_rank.

    First-ranked category counts most (0.40), last counts least (0.10).
    """
    total = 0.0
    for rank, category in enumerate(values_rank):
        if rank >= len(RANK_WEIGHTS):
            break
        total += category_scores.get(category, NEUTRAL_SCORE) * RANK_WEIGHTS[rank]
    return round(total, 1)


def grade_for_score(score: int) -> str:
    for threshold, grade in GRADE_BANDS:
        if score >= threshold:
            return grade
    return "F"


def calculate_advisory_flag(score: int, data_health_status: str) -> bool:
    return score < ADVISORY_THRESHOLD or data_health_status == "RED"


def calculate_blindspot_score(
    *,
    axis_output: dict,
    assumptions: dict,
    actual_rent: float | None,
    values_rank: list[str],
    data_health: dict,
) -> dict:
    """Top-level entry point — combine AXIS's judged components with the
    deterministic estimation score and the data-health penalty.

    axis_output must contain "debate_verdict" (0-100) and "values_scores" (dict).
    """
    accuracy = calculate_assumption_accuracy(assumptions["expected_rent"], actual_rent)
    calibration = calculate_confidence_calibration(assumptions["confidence"], accuracy)
    estimation_score = calculate_estimation_score(accuracy, calibration)
    values_alignment = calculate_values_alignment(axis_output.get("values_scores", {}), values_rank)
    debate_verdict = axis_output.get("debate_verdict", NEUTRAL_SCORE)
    penalty = data_health.get("score_penalty", 0)

    raw = (values_alignment + debate_verdict + estimation_score) / 3
    final_score = round(max(0, min(100, raw - penalty)))
    grade = grade_for_score(final_score)
    flagged = calculate_advisory_flag(final_score, data_health.get("status", "GREEN"))

    return {
        "score": final_score,
        "grade": grade,
        "components": {
            "values_alignment": values_alignment,
            "debate_verdict": debate_verdict,
            "estimation_score": estimation_score,
            "assumption_accuracy": accuracy,
            "confidence_calibration": calibration,
        },
        "advisory_action": {
            "flagged": flagged,
            "message": (
                "This decision's score is low, or relies on data uncertain enough, "
                "that we recommend speaking with a human advisor before proceeding."
                if flagged else None
            ),
            "office_contact": None,
        },
    }
