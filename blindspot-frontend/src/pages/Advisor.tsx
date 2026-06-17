import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { getUserPersona } from "../utils/session";

// ── Advisor catalogue ──────────────────────────────────────────────────────

type AdvisorId = "education" | "finance" | "relocation";

interface Advisor {
  id: AdvisorId;
  track: string;
  title: string;
  description: string;
  stat?: { label: string; value: string };
  cta: string;
  ctaVariant: "primary" | "secondary";
}

const ADVISORS: Advisor[] = [
  {
    id: "education",
    track: "Education Track",
    title: "University Career Services Router",
    description:
      "Direct access to institutional placement officers. Best for validating tuition ROI and long-term career trajectory mappings based on current alumni data.",
    stat: undefined,
    cta: "Schedule Consultation",
    ctaVariant: "primary",
  },
  {
    id: "finance",
    track: "Career Track",
    title: "Independent Financial Mentor",
    description:
      "Specialized in mid-career pivot economics, equity compensation modelling, and net-worth projections across tax jurisdictions.",
    stat: { label: "Client Success Rate", value: "98%" },
    cta: "Request Quote",
    ctaVariant: "secondary",
  },
  {
    id: "relocation",
    track: "Relocation Track",
    title: "Global Mobility & Visa Specialist",
    description:
      "Quantified cost-of-living adjustments and logistical risk assessments for international transitions, including visa timelines and housing market forecasts.",
    stat: undefined,
    cta: "Connect Now",
    ctaVariant: "primary",
  },
];

// ── Persona → sorted advisor IDs + context message ────────────────────────

const PERSONA_CONFIG: Record<
  "student" | "professional" | "freelancer",
  { order: AdvisorId[]; headline: string; subtext: string }
> = {
  student: {
    order: ["education", "finance", "relocation"],
    headline: "Paths curated for Students",
    subtext:
      "We've prioritised education and early-career advisors based on your profile. Financial mentors can also help you model tuition ROI before you sign.",
  },
  professional: {
    order: ["finance", "relocation", "education"],
    headline: "Paths curated for Professionals",
    subtext:
      "Career pivot and relocation advisors are your highest-leverage contacts. Use the financial mentor to stress-test compensation packages across markets.",
  },
  freelancer: {
    order: ["finance", "relocation", "education"],
    headline: "Paths curated for Freelancers",
    subtext:
      "Financial structure and international mobility matter most for independent operators. An advisor can help you optimise tax residency and contract rates.",
  },
};

// ── Page ───────────────────────────────────────────────────────────────────

export function Advisor() {
  const persona = getUserPersona();
  const config = PERSONA_CONFIG[persona];

  // Sort advisors by persona preference; first in order = "recommended"
  const sorted = [...ADVISORS].sort(
    (a, b) => config.order.indexOf(a.id) - config.order.indexOf(b.id),
  );
  const recommendedId = config.order[0];

  return (
    <div className="px-4 pt-2 pb-10 md:px-8 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="border-b border-outline-variant pb-5">
        <h1 className="text-2xl font-display font-bold text-on-surface tracking-tight">
          Your Human Support Network
        </h1>
        <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
          Connect with specialists to stress-test your projections. BlindSpot
          bridges empirical data with human intuition.
        </p>
      </div>

      {/* Persona callout */}
      <div className="rounded-xl bg-surface-container-low border border-outline-variant px-5 py-4">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
          {config.headline}
        </p>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {config.subtext}
        </p>
      </div>

      {/* Advisor cards */}
      <div className="grid gap-4">
        {sorted.map((a, idx) => {
          const isRecommended = a.id === recommendedId;
          return (
            <Card key={a.id} variant={isRecommended ? "elevated" : "default"}>
              <Card.Body className="flex flex-col sm:flex-row sm:items-start gap-5">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Card.Chip tone={isRecommended ? "primary" : "surface"}>
                      {a.track}
                    </Card.Chip>
                    {isRecommended && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full
                                       bg-primary-fixed/60 text-primary px-2.5 py-0.5
                                       text-[11px] font-bold uppercase tracking-wide"
                      >
                        ★ Recommended
                      </span>
                    )}
                    {!isRecommended && idx === 1 && (
                      <span className="text-xs text-outline font-medium">
                        Also relevant
                      </span>
                    )}
                  </div>

                  <h3
                    className="font-display font-semibold text-on-surface text-base
                                 leading-snug mb-2"
                  >
                    {a.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {a.description}
                  </p>

                  {a.stat && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant">
                      <span className="text-xs text-on-surface-variant">
                        {a.stat.label}
                      </span>
                      <span className="text-xs font-bold text-primary ml-auto">
                        {a.stat.value}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="shrink-0 self-start sm:pt-1">
                  <Button variant={a.ctaVariant} size="sm">
                    {a.cta}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>

      {/* Export CTA */}
      <Card variant="default" className="bg-primary/10 border border-primary/20 relative overflow-hidden">
        <Card.Decor className="w-64 h-64 bg-primary -top-16 -right-16" />
        <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h2 className="font-display font-bold text-xl text-on-surface mb-2">
              Export Decision Matrix
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Synthesise advisor feedback and algorithmic projections into a
              single, board-ready audit document.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="shrink-0"
          >
            Download Report Card
          </Button>
        </div>
      </Card>
    </div>
  );
}
