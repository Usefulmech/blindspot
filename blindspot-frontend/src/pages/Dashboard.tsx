import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchSSE } from "../utils/sse";
import { Button } from "../components/ui/Button";

export function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const payload = location.state?.analyzePayload;

  const [turns, setTurns] = useState<{ speaker: "atlas" | "vera" | "axis"; text: string }[]>([]);
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
            if (event === "atlas" || event === "vera" || event === "axis") {
              setTurns((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.speaker === event) {
                  // Same speaker — append to current card
                  return [...prev.slice(0, -1), { ...last, text: last.text + data + " " }];
                }
                // New speaker — start a new card
                return [...prev, { speaker: event as "atlas" | "vera" | "axis", text: data + " " }];
              });
            } else if (event === "done") {
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

  // Radar chart removed (axes is null)

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

      {/* Live debate — each turn in its own card */}
      {(isProcessing || turns.length > 0) && (
        <div className="space-y-3">
          {/* Progress bar */}
          {isProcessing && (
            <div className="flex gap-1.5 mb-4">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded transition-all duration-300 ${reconcileProgress > i * 20 ? 'bg-primary' : 'bg-surface-dim'}`} />
              ))}
            </div>
          )}

          {turns.length === 0 && isProcessing && (
            <p className="text-xs text-on-surface-variant italic text-center py-4">Agents are preparing their arguments...</p>
          )}

          {turns.map((turn, idx) => {
            const isAtlas = turn.speaker === "atlas";
            const isAxis  = turn.speaker === "axis";
            const isLast  = idx === turns.length - 1;

            if (isAxis) {
              return (
                <div key={idx} className="bg-axis-navy rounded-xl p-4 text-white space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-[26px] h-[26px] rounded-full bg-axis-gold flex items-center justify-center text-xs font-extrabold text-axis-navy">Σ</div>
                    <span className="font-extrabold text-xs text-axis-gold uppercase tracking-wider">AXIS — The Judge</span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    {turn.text}
                    {isLast && isProcessing && <span className="inline-block w-2 h-3.5 bg-white animate-pulse ml-1 align-middle" />}
                  </p>
                  {isProcessing && (
                    <>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-axis-gold rounded-full transition-all duration-300" style={{ width: `${reconcileProgress}%` }} />
                      </div>
                      <div className="text-[10px] font-semibold text-white/80">{reconcileProgress}% — computing Blindspot Score™</div>
                    </>
                  )}
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`flex ${isAtlas ? "justify-start" : "justify-end"}`}
              >
                <div className={`max-w-[85%] rounded-xl p-4 space-y-2 border shadow-sm ${isAtlas ? "bg-white border-border-mock" : "bg-agent-vera/10 border-agent-vera/20"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-extrabold text-white ${isAtlas ? "bg-agent-atlas" : "bg-agent-vera"}`}>
                      {isAtlas ? "A" : "V"}
                    </div>
                    <span className={`font-extrabold text-xs tracking-wide ${isAtlas ? "text-agent-atlas" : "text-agent-vera"}`}>
                      {isAtlas ? "ATLAS — Optimist" : "VERA — Realist"}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed font-medium">
                    {turn.text}
                    {isLast && isProcessing && <span className="inline-block w-2 h-3.5 bg-on-surface animate-pulse ml-1 align-middle" />}
                  </p>
                </div>
              </div>
            );
          })}
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
            <div className="bg-risk-bg border border-[#F3C5C2] rounded-xl p-4 flex flex-col gap-2 shadow-sm animate-pulse">
              <div className="flex gap-3 items-start">
                <span className="text-risk font-extrabold text-base leading-none shrink-0">⚠</span>
                <p className="text-xs font-bold text-red-900 leading-normal">
                  {result.advisory_action?.message || "Score below 40 in Financial Realism. We recommend speaking with a counselor before acting on this decision."}
                </p>
              </div>
              {result.advisory_action?.office_contact && result.advisory_action.office_contact.length > 0 && (
                <div className="pl-6 pt-2 border-t border-red-200 mt-2 space-y-1">
                  <span className="text-[10px] font-bold text-red-800 uppercase tracking-widest">Recommended Advisors:</span>
                  <div className="flex flex-col gap-1">
                    {result.advisory_action.office_contact.map((contact: any, i: number) => (
                      <a key={i} href={contact.url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-700 underline hover:text-red-900">
                        {contact.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Components Breakdown */}
          {result.components && (
            <div className="bg-white border border-border-mock rounded-xl p-4 space-y-3 shadow-sm">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Score Breakdown</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(result.components).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-border-mock pb-1">
                    <span className="text-on-surface-variant capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-extrabold text-on-surface">{Number(value).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      {result.provider_used ? "AI Simulated" : "Verified Data"}
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
              {(result.timeline?.[activeTimelineTab === "taken" ? "path_taken" : "path_not_taken"]?.milestones || []).map((step: any, idx: number) => {
                return (
                  <div
                    key={idx}
                    className="bg-[#FFF8EF] border border-[#F0E2C9] rounded-xl p-4 space-y-1.5 shadow-sm"
                  >
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-caution uppercase tracking-wider">
                      <span>YEAR {step.year}</span>
                      <span>Trajectory: {step.trajectory_score}</span>
                    </div>
                    <p className="text-xs text-on-surface font-medium leading-relaxed italic">
                      "{step.narrative}"
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
              onClick={() => window.open(`/report/${result.share_uuid || ''}`, '_blank')}
            >
              ↗ Share Report Card
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

