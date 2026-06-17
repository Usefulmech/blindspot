import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getSessionId, getUserName, setUserName } from "../utils/session";
import { Button } from "../components/ui/Button";

const ArrowRight = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const MOCK_DECISIONS = [
  { id: "mock-1", decision_text: "Lagos → London Jump", score: 48, grade: "C−", origin_city: "Lagos", destination_city: "London" },
  { id: "mock-2", decision_text: "Corporate Escape", score: 53, grade: "C+", origin_city: "Lagos", destination_city: "New York" },
  { id: "mock-3", decision_text: "Manila → Singapore", score: 61, grade: "B−", origin_city: "Manila", destination_city: "Singapore" }
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Home() {
  const navigate = useNavigate();
  const savedName = getUserName();

  const [showDrop, setShowDrop] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [decisions, setDecisions] = useState<any[]>([]);

  const isReturning = !!savedName;

  useEffect(() => {
    async function fetchDecisions() {
      try {
        const sid = getSessionId();
        const res = await fetch(`/api/decisions?session_id=${sid}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setDecisions(data);
          } else {
            setDecisions(MOCK_DECISIONS);
          }
        } else {
          setDecisions(MOCK_DECISIONS);
        }
      } catch (err) {
        console.error("Failed to fetch decisions", err);
        setDecisions(MOCK_DECISIONS);
      }
    }
    fetchDecisions();
  }, []);

  function handleGetStarted() {
    if (isReturning) {
      navigate("/analyze");
      return;
    }
    setShowDrop((prev) => !prev);
    setError("");
  }

  function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) {
      setError("Please enter your name to continue.");
      return;
    }
    setUserName(nameInput.trim());
    navigate("/analyze");
  }

  const latestDecision = decisions[0];

  return (
    <div className="px-4 md:px-8 pt-4 pb-2 max-w-5xl mx-auto space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start w-full">
        {/* ── Left Column: Welcome & Info ── */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <div className="space-y-2">
            <p className="text-xs font-black text-primary-container uppercase tracking-[0.22em]">
              {isReturning ? getGreeting() : "Welcome to BlindSpot"}
            </p>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold leading-tight tracking-tight text-on-surface">
              {isReturning ? (
                <>
                  <span className="block font-extrabold text-primary-container uppercase tracking-wide mb-3">
                    {savedName} 👋
                  </span>
                  Ready to stress-test <span className="text-primary-container">your next move?</span>
                </>
              ) : (
                <>
                  Decision Intelligence for the <span className="text-primary-container">Critical Thinker.</span>
                </>
              )}
            </h1>
          </div>

          <p className="text-sm md:text-base leading-relaxed text-on-surface-variant max-w-[50ch] font-sans">
            {isReturning
              ? "Pick up where you left off or start a brand-new scenario. BlindSpot runs 10,000 Monte Carlo simulations against your assumptions before you commit."
              : "Remove the speculation from your biggest decisions. BlindSpot stress-tests your plans with empirical data and multi-agent simulation before you commit."}
          </p>

          {/* CTA row */}
          <div className="flex flex-col gap-3 max-w-sm w-full pt-1">
            <Button
              size="lg"
              fullWidth
              onClick={handleGetStarted}
              rightIcon={<ArrowRight />}
            >
              {isReturning ? "Start New Analysis" : "Get Started"}
            </Button>

            {isReturning && (
              <Link to="/decisions" className="w-full">
                <Button variant="secondary" size="lg" fullWidth>
                  View Past Decisions
                </Button>
              </Link>
            )}
          </div>

          {/* Name-capture form (React conditional render to prevent height overflow) */}
          {showDrop && (
            <div className="max-w-sm w-full animate-[fadein_0.2s_ease-out] pt-2">
              <form onSubmit={handleNameSubmit}>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <label
                      htmlFor="welcome-name"
                      className="block text-sm font-semibold text-on-surface mb-1"
                    >
                      What should we call you?
                    </label>
                    <p className="text-xs text-on-surface-variant">
                      Saved locally - appears on your results and reports.
                    </p>
                  </div>

                  <input
                    id="welcome-name"
                    type="text"
                    autoFocus
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setError("");
                    }}
                    placeholder="e.g. Alex"
                    className="w-full rounded-xl border border-outline-variant
                               bg-surface px-4 py-3 text-sm text-on-surface
                               placeholder:text-outline/60
                               focus:outline-none focus:ring-2 focus:ring-primary/30
                               focus:border-primary transition-colors"
                  />
                  {error && <p className="text-xs text-error">{error}</p>}

                  <Button
                    type="submit"
                    fullWidth
                    rightIcon={<ArrowRight />}
                  >
                    Let's Go
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Right Column: Interactive Mockup Stats (From Design Mockup) ── */}
        <div className="lg:col-span-5 flex flex-col justify-start space-y-6 min-w-0">
          {latestDecision && (
            <div className="bg-white border border-border-mock rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-3">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Latest Decision Score
              </p>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 shadow-sm"
                  style={{
                    background: `conic-gradient(var(--color-caution, #D99A3D) 0% ${latestDecision.score}%, var(--color-surface-dim, #CCDBF2) ${latestDecision.score}% 100%)`
                  }}
                >
                  <div className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center font-extrabold text-on-surface text-sm">
                    {latestDecision.score}
                  </div>
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-on-surface text-sm leading-snug truncate">
                    {latestDecision.decision_text}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                    Grade {latestDecision.grade} · Active Scenario
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Decisions scroll section */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Recent Scenarios
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              {decisions.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  className="bg-white border border-border-mock rounded-xl p-4 flex items-center justify-between hover:border-primary transition-all duration-200 shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-extrabold text-on-surface text-sm truncate">
                      {d.decision_text}
                    </div>
                    <div className="text-[10px] text-on-surface-variant mt-0.5 uppercase tracking-wider font-semibold">
                      {d.origin_city && d.destination_city ? `${d.origin_city} → ${d.destination_city}` : "General Decision"}
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-lg bg-orange-50 text-caution border border-orange-100 shrink-0">
                    {d.score} · {d.grade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Trademark ── */}
      <div className="pt-4 mt-12 border-t border-border-mock text-center w-full space-y-1">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          © 2026 BlindSpot™
        </p>
        <p className="text-[9px] font-bold text-outline uppercase tracking-wider">
          USAII Hackhaton
        </p>
      </div>
    </div>
  );
}
