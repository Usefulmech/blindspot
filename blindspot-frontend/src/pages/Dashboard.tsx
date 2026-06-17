import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchSSE } from "../utils/sse";
import { Button } from "../components/ui/Button";

export function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const payload = location.state?.analyzePayload;

  const [atlasText, setAtlasText] = useState("");
  const [veraText, setVeraText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconcileProgress, setReconcileProgress] = useState(15);
  const [activeTimelineTab, setActiveTimelineTab] = useState<"taken" | "not_taken">("taken");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!payload) return; // show empty state below, no redirect
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function startAnalysis() {
      try {
        await fetchSSE(
          "/api/analyze",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          (event, data) => {
            if (event === "atlas") setAtlasText((prev) => prev + data + " ");
            else if (event === "vera") setVeraText((prev) => prev + data + " ");
            else if (event === "done") {
              setResult(JSON.parse(data));
              setIsProcessing(false);
            }
          },
        );
      } catch (err: any) {
        setError(err.message);
        setIsProcessing(false);
      }
    }
    startAnalysis();
  }, [payload, navigate]);

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setReconcileProgress((prev) => {
        if (prev >= 98) return 98;
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // ── Empty state when no analysis has been submitted yet ──────────────────
  if (!payload) {
    return (
      <div className="px-4 py-8 md:px-8 md:py-10 max-w-5xl mx-auto space-y-6">
        <div className="border-b border-outline-variant pb-5 text-center">
          <h1 className="text-2xl font-display font-bold text-on-surface tracking-tight">
            Analysis Dashboard
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Your results will appear here after running an analysis.
          </p>
        </div>
        <div className="flex flex-col items-center text-center py-12 gap-4 bg-surface-container border border-border-mock rounded-[24px] p-6 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center border border-border-mock mb-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-on-surface-variant"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-on-surface">
            No active analysis
          </h2>
          <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">
            Submit your decision scenario in the Analyze tab to see your live
            agent debate and final projection here.
          </p>
          <button
            onClick={() => navigate("/analyze")}
            className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-full
                       bg-primary-container text-white text-sm font-semibold
                       shadow-sm transition-all hover:bg-primary active:scale-[0.97]"
          >
            Go to Analyze
          </button>
        </div>
      </div>
    );
  }

  // Calculate coordinates for dynamic SVG radar chart
  const financial = result?.axes?.financial_realism ?? 50;
  const optimism = result?.axes?.optimism_bias ?? 50;
  const planning = result?.axes?.planning_fallacy_risk ?? 50;
  const regret = result?.axes?.regret_alignment ?? 50;

  // Center is 90, 90. Max radius from center to grid edge is 75 (15 to 90)
  const yFin = 90 - 75 * (financial / 100);
  const xOpt = 90 + 75 * (optimism / 100);
  const yPlan = 90 + 75 * (planning / 100);
  const xReg = 90 - 75 * (regret / 100);

  const showAdvisory = result && (result.score < 40 || result.advisory_action?.flagged || result.data_health?.status === "RED");

  return (
    <div className="px-4 py-8 md:px-8 md:py-10 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4 border-b border-outline-variant pb-5">
        <button
          onClick={() => navigate("/analyze")}
          className="w-10 h-10 rounded-full border border-border-mock bg-white flex items-center justify-center font-bold text-on-surface shadow-sm hover:bg-surface-container transition-colors shrink-0"
        >
          ←
        </button>
        <div>
          <h1 className="text-lg font-display font-extrabold text-on-surface leading-tight">
            {payload.decision_text ? payload.decision_text.slice(0, 30) + (payload.decision_text.length > 30 ? "..." : "") : "New Scenario Analysis"}
          </h1>
          <p className="text-[11px] text-on-surface-variant mt-0.5 font-medium">
            Analyzed {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-risk-bg border border-red-200 rounded-xl p-4 text-sm text-red-900 font-medium shadow-sm">
          <h3 className="font-extrabold">Analysis Error</h3>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Live agent debate stream panel */}
      {isProcessing && (
        <div className="space-y-5">
          <div className="flex gap-1.5">
            <div className="h-1 flex-1 rounded bg-primary"></div>
            <div className="h-1 flex-1 rounded bg-primary"></div>
            <div className="h-1 flex-1 rounded bg-primary"></div>
            <div className={`h-1 flex-1 rounded transition-all duration-300 ${reconcileProgress > 50 ? 'bg-primary' : 'bg-surface-dim'}`}></div>
            <div className={`h-1 flex-1 rounded transition-all duration-300 ${reconcileProgress > 80 ? 'bg-primary' : 'bg-surface-dim'}`}></div>
          </div>

          <div className="border border-border-mock bg-white rounded-xl p-4 space-y-4">
            {/* Agent Atlas */}
            <div className="space-y-2 border-b border-border-mock pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <div className="w-[26px] h-[26px] rounded-full bg-agent-atlas flex items-center justify-center text-[11px] font-extrabold text-white">
                  A
                </div>
                <span className="font-extrabold text-xs text-agent-atlas tracking-wide">ATLAS — Optimist</span>
              </div>
              <p className="text-xs text-on-surface leading-relaxed font-medium">
                {atlasText ? (
                  <>
                    {atlasText}
                    <span className="inline-block w-2 h-3.5 bg-on-surface animate-pulse ml-1 align-middle" />
                  </>
                ) : (
                  <span className="text-on-surface-variant italic">Waiting for Atlas to structure analysis...</span>
                )}
              </p>
            </div>

            {/* Agent Vera */}
            <div className="space-y-2 border-b border-border-mock pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <div className="w-[26px] h-[26px] rounded-full bg-agent-vera flex items-center justify-center text-[11px] font-extrabold text-white">
                  V
                </div>
                <span className="font-extrabold text-xs text-agent-vera tracking-wide">VERA — Realist</span>
              </div>
              <p className="text-xs text-on-surface leading-relaxed font-medium">
                {veraText ? (
                  <>
                    {veraText}
                    <span className="inline-block w-2 h-3.5 bg-on-surface animate-pulse ml-1 align-middle" />
                  </>
                ) : (
                  <span className="text-on-surface-variant italic">Waiting for Vera to reconcile rent index...</span>
                )}
              </p>
            </div>
          </div>

          {/* Reconciler panel */}
          <div className="bg-axis-navy rounded-xl p-4 text-white space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-[26px] h-[26px] rounded-full bg-axis-gold flex items-center justify-center text-xs font-extrabold text-axis-navy">
                Σ
              </div>
              <span className="font-extrabold text-xs text-axis-gold uppercase tracking-wider">AXIS Reconciling...</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-axis-gold rounded-full transition-all duration-300"
                style={{ width: `${reconcileProgress}%` }}
              />
            </div>
            <div className="text-[10px] font-semibold text-white/80">
              {reconcileProgress}% — computing Blindspot Score™
            </div>
          </div>
        </div>
      )}

      {/* Final results dashboard */}
      {!isProcessing && result && (
        <div className="space-y-6 animate-[fadein_0.25s_ease-out]">
          {/* Score card hero */}
          <div className="bg-white border border-border-mock rounded-[24px] p-6 text-center space-y-1 shadow-sm">
            <div className="text-6xl font-display font-extrabold text-caution leading-none">
              {result.score}
            </div>
            <div className="text-lg font-extrabold text-caution">
              {result.grade}
            </div>
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
              Blindspot Score™
            </div>
          </div>

          {/* Advisory banner warning */}
          {showAdvisory && (
            <div className="bg-risk-bg border border-[#F3C5C2] rounded-xl p-4 flex gap-3 items-start shadow-sm animate-pulse">
              <span className="text-risk font-extrabold text-base leading-none shrink-0">⚠</span>
              <p className="text-xs font-bold text-red-900 leading-normal">
                {result.advisory_action?.message || "Score below 40 in Financial Realism. We recommend speaking with a counselor before acting on this decision."}
              </p>
            </div>
          )}

          {/* Dynamic SVG Radar Chart */}
          <div className="bg-white border border-border-mock rounded-[24px] p-5 flex flex-col items-center justify-center shadow-sm">
            <svg width="180" height="180" viewBox="0 0 180 180" className="select-none">
              {/* Outer grid */}
              <polygon points="90,15 165,90 90,165 15,90" fill="none" stroke="#E1E7F5" strokeWidth="1"/>
              {/* Inner grid */}
              <polygon points="90,52.5 127.5,90 90,127.5 52.5,90" fill="none" stroke="#E1E7F5" strokeWidth="1"/>
              {/* Axis lines */}
              <line x1="90" y1="15" x2="90" y2="165" stroke="#E1E7F5" strokeWidth="1"/>
              <line x1="15" y1="90" x2="165" y2="90" stroke="#E1E7F5" strokeWidth="1"/>
              {/* Value plot area */}
              <polygon
                points={`90,${yFin} ${xOpt},90 90,${yPlan} ${xReg},90`}
                fill="#0F766E"
                fillOpacity="0.22"
                stroke="#0F766E"
                strokeWidth="2"
              />
              {/* Label labels */}
              <text x="90" y="9" fontSize="9" fontWeight="800" fill="#5B6B85" textAnchor="middle">Financial</text>
              <text x="170" y="93" fontSize="9" fontWeight="800" fill="#5B6B85" textAnchor="start">Optimism</text>
              <text x="90" y="177" fontSize="9" fontWeight="800" fill="#5B6B85" textAnchor="middle">Planning</text>
              <text x="10" y="93" fontSize="9" fontWeight="800" fill="#5B6B85" textAnchor="end">Regret</text>
            </svg>
          </div>

          {/* Top Blindspot Card */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Identified Blind Spots
            </p>
            <div className="space-y-3">
              {(result.blindspots || []).map((bs: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white border border-border-mock rounded-xl p-4 space-y-2.5 shadow-sm"
                >
                  <h5 className="font-extrabold text-on-surface text-[13px] leading-snug">
                    {bs.title}
                  </h5>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {bs.detail}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-50 text-caution border border-orange-100">
                      Unmitigated Gap
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-50 text-on-surface-variant border border-slate-100">
                      {result.provider_used ? `simulated via ${result.provider_used}` : "verified data"}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-outline font-semibold">
                    Source: {bs.source}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parallel Reality Milestones */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              5-Year Parallel Reality
            </p>
            <div className="flex bg-surface-container-highest/85 rounded-xl p-1 gap-1 border border-border-mock">
              <button
                onClick={() => setActiveTimelineTab("taken")}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${activeTimelineTab === "taken" ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Path Taken
              </button>
              <button
                onClick={() => setActiveTimelineTab("not_taken")}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${activeTimelineTab === "not_taken" ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Path Not Taken
              </button>
            </div>

            <div className="space-y-3">
              {(result.timeline || []).map((step: any, idx: number) => {
                const pathText = activeTimelineTab === "taken" ? step.path_taken : step.path_not_taken;
                return (
                  <div
                    key={idx}
                    className="bg-[#FFF8EF] border border-[#F0E2C9] rounded-xl p-4 space-y-1.5 shadow-sm"
                  >
                    <div className="text-[10px] font-extrabold text-caution uppercase tracking-wider">
                      YEAR {step.year} — {payload.destination_city || "Target Move"}
                    </div>
                    <p className="text-xs text-on-surface font-medium leading-relaxed italic">
                      "{pathText}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Share CTA button */}
          <div className="pt-2">
            <Button
              fullWidth
              size="lg"
              onClick={() => navigate("/decisions")}
            >
              ↗ Share Report Card
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

