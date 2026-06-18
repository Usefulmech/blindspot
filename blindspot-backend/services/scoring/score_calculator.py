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

# Curated career advisory resources by region.
# Keyed by lowercase city/country substrings — first match wins.
_REGIONAL_ADVISORS = {
    # East Africa
    "kigali":   [{"name": "Rwanda Development Board Career Centre", "url": "https://rdb.rw"},
                 {"name": "ALX Africa", "url": "https://alxafrica.com"}],
    "nairobi":  [{"name": "Fuzu Career Coaching", "url": "https://fuzu.com"},
                 {"name": "ALX Africa", "url": "https://alxafrica.com"}],
    "kampala":  [{"name": "ALX Africa", "url": "https://alxafrica.com"}],
    "accra":    [{"name": "Jobberman Career Advice", "url": "https://jobberman.com.gh"},
                 {"name": "ALX Africa", "url": "https://alxafrica.com"}],
    "lagos":    [{"name": "Jobberman Career Advice", "url": "https://jobberman.com.ng"},
                 {"name": "ALX Africa", "url": "https://alxafrica.com"}],
    # Middle East
    "dubai":    [{"name": "GulfTalent Career Advice", "url": "https://gulftalent.com"},
                 {"name": "Bayt.com Career Resources", "url": "https://bayt.com"}],
    "abu dhabi":[{"name": "GulfTalent Career Advice", "url": "https://gulftalent.com"}],
    "riyadh":   [{"name": "GulfTalent Career Advice", "url": "https://gulftalent.com"}],
    "doha":     [{"name": "GulfTalent Career Advice", "url": "https://gulftalent.com"}],
    # Europe
    "london":   [{"name": "National Careers Service (UK)", "url": "https://nationalcareers.service.gov.uk"}],
    "berlin":   [{"name": "Make it in Germany", "url": "https://make-it-in-germany.com"}],
    "paris":    [{"name": "Pôle Emploi Career Guidance", "url": "https://www.pole-emploi.fr"}],
    # North America
    "toronto":  [{"name": "Employment Ontario", "url": "https://www.ontario.ca/page/employment-ontario"}],
    "new york": [{"name": "NYC Career Services", "url": "https://www1.nyc.gov/site/dca/workers/workers.page"}],
}

# Always appended regardless of location
_GLOBAL_ADVISORS = [
    {"name": "TopMate — 1:1 Career Mentors", "url": "https://topmate.io"},
    {"name": "LinkedIn Career Coaches", "url": "https://www.linkedin.com/services/career-development"},
]


def get_advisor_contacts(destination_city: str | None, origin_city: str | None) -> list:
    """Return a curated list of career advisory resources for the user's context."""
    contacts = []
    for city in [destination_city, origin_city]:
        if not city:
            continue
        city_lower = city.lower()
        for key, advisors in _REGIONAL_ADVISORS.items():
            if key in city_lower:
                for a in advisors:
                    if a not in contacts:
                        contacts.append(a)
                break
    contacts += _GLOBAL_ADVISORS
    return contacts

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
    destination_city: str | None = None,
    origin_city: str | None = None,
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
            "office_contact": get_advisor_contacts(destination_city, origin_city) if flagged else None,
        },
    }
