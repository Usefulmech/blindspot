import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionId, setUserPersona, type Persona } from "../utils/session";
import {
  getCurrencyForLocation,
  DEFAULT_CURRENCY,
  type CurrencyInfo,
} from "../utils/currency";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card } from "../components/ui/Card";

// ── Shared field wrapper ───────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-on-surface">{label}</label>
      {children}
      {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}

// ── Slider field ───────────────────────────────────────────────────────────

// Always prefix: £1,500  ₦425,000  $1,500 etc.
function fmt(symbol: string, n: number) {
  if (symbol === "%") return `${n.toLocaleString()}%`;
  return `${symbol}${n.toLocaleString()}`;
}

function SliderField({
  label,
  hint,
  value,
  min,
  max,
  symbol,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  symbol: string; // renamed from unit — avoids the old "$" special-case
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl font-display font-bold text-on-surface">
          {fmt(symbol, value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full bg-outline-variant
                   accent-primary-container cursor-pointer"
      />
      <div className="flex justify-between text-xs text-outline mt-0.5">
        <span>{fmt(symbol, min)}</span>
        <span>{fmt(symbol, max)}</span>
      </div>
    </Field>
  );
}

// ── Section divider ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
        {children}
      </span>
      <div className="flex-1 h-px bg-outline-variant" />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export function Analyze() {
  const navigate = useNavigate();

  const [decisionText, setDecisionText] = useState("");
  const [persona, setPersona] = useState("professional");
  const [originCity, setOriginCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [expectedRent, setExpectedRent] = useState(1500);
  const [savingsRate, setSavingsRate] = useState(20);
  const [confidence, setConfidence] = useState(85);
  const [currency, setCurrency] = useState<CurrencyInfo>(DEFAULT_CURRENCY);
  const [alternativeText, setAlternativeText] = useState("");
  // useRef holds the last-set currency code — no stale-closure risk
  const currencyCodeRef = useRef(DEFAULT_CURRENCY.code);

  // Detect currency from the destination city (primary) or origin city (fallback)
  useEffect(() => {
    const detected = getCurrencyForLocation(destinationCity || originCity);
    if (detected.code !== currencyCodeRef.current) {
      currencyCodeRef.current = detected.code;
      // Clamp rent to midpoint of new range so the slider is always valid
      setExpectedRent(Math.round((detected.minRent + detected.maxRent) / 2));
      setCurrency(detected);
    }
  }, [destinationCity, originCity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      session_id: getSessionId(),
      decision_text: decisionText,
      user_persona: persona,
      origin_city: originCity || undefined,
      destination_city: destinationCity || undefined,
      currency: currency.code,
      assumptions: {
        expected_rent: expectedRent,
        savings_rate: savingsRate,
        confidence,
      },
      alternative_text: alternativeText,
      values_rank: ["financial", "growth", "balance", "roots"],
    };

    // Persist persona so Advisor Hub can tailor suggestions
    setUserPersona(persona as Persona);
    navigate("/dashboard", { state: { analyzePayload: payload } });
  };

  // Progress: 2 sections, track filled fields
  const filled = [
    decisionText,
    alternativeText,
    originCity || destinationCity,
  ].filter(Boolean).length;
  const progress = Math.round((filled / 3) * 100);

  return (
    <div className="min-h-full bg-surface px-4 pt-2 pb-10 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Page header ── */}
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1">
            Step 1 · Variables Matrix
          </p>
          <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">
            Select your high-stakes move
          </h1>

          {/* Progress bar */}
          <div className="mt-4 h-1 w-full bg-outline-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {progress}% complete
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <Card>
            <Card.Body className="space-y-6">
              {/* Section 1 – Core decision */}
              <SectionLabel>Core Decision</SectionLabel>

              <Field
                label="What decision are you making?"
                hint="Be specific - the engine pulls live data based on what you write."
              >
                <textarea
                  required
                  rows={4}
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  placeholder="e.g., I am considering moving to Austin, TX to join a Series B Fintech startup as Head of…"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest
                             px-4 py-3 text-sm text-on-surface placeholder:text-outline/60
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                             resize-none transition-colors"
                />
              </Field>

              <Field
                label="The Alternative (Status Quo)"
                hint="BlindSpot compares your move against this baseline projection."
              >
                <textarea
                  required
                  rows={2}
                  value={alternativeText}
                  onChange={(e) => setAlternativeText(e.target.value)}
                  placeholder="e.g., Stay in current SF role, 5% annual raise."
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest
                             px-4 py-3 text-sm text-on-surface placeholder:text-outline/60
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                             resize-none transition-colors"
                />
              </Field>

              <Select
                label="Your Persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                options={[
                  { label: "Student", value: "student" },
                  { label: "Professional", value: "professional" },
                  { label: "Freelancer", value: "freelancer" },
                ]}
              />

              {/* Section 2 – Location */}
              <SectionLabel>Location & Assumptions</SectionLabel>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Origin City (optional)"
                  placeholder="e.g., Austin"
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                />
                <Input
                  label="Destination City (optional)"
                  placeholder="e.g., New York"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                />
              </div>

              <SliderField
                label={`Estimated Monthly Rent (${currency.code})`}
                hint={`1-bedroom median in target area · currency auto-detected from city`}
                value={expectedRent}
                min={0}
                max={currency.maxRent}
                symbol={currency.symbol}
                onChange={setExpectedRent}
              />

              <SliderField
                label="Expected Savings Rate"
                hint="Percentage of post-tax income allocated to capital."
                value={savingsRate}
                min={0}
                max={80}
                symbol="%"
                onChange={setSavingsRate}
              />

              <SliderField
                label="Confidence in this Move"
                hint="Your gut certainty - the engine will stress-test this number."
                value={confidence}
                min={0}
                max={100}
                symbol="%"
                onChange={setConfidence}
              />
            </Card.Body>

            {/* ── CTA ── */}
            <div className="px-6 pb-6">
              <Button
                type="submit"
                fullWidth
                size="lg"
                rightIcon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                }
              >
                Stress-Test My Assumptions
              </Button>
              <p className="text-center text-xs text-on-surface-variant mt-3">
                Runs 10,000 Monte Carlo simulations against your inputs
              </p>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
