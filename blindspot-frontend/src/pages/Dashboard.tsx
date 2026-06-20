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
  const [axisText, setAxisText] = useState("");
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
            else if (event === "axis") setAxisText((prev) => prev + data + " ");
            else if (event === "done") {
              setResult(JSON.parse(data));
              setIsProcessing(false);
              setReconcileProgress(100);
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

      {/* Live agent debate stream panel */}
      {(isProcessing || atlasText) && (
        <div className="relative rounded-[24px] overflow-hidden bg-[#0d1526] shadow-2xl border border-[#1e2a44] p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 border-b border-[#1e2a44] pb-4">
             <div className="flex items-center gap-3">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
               <span className="text-white/90 text-xs font-bold tracking-[0.2em] uppercase">Live Neural Debate</span>
             </div>
             <div className="text-white/40 text-[10px] font-mono tracking-widest hidden sm:flex gap-3">
               <span>LATENCY: 14ms</span>
               <span>MODELS: OPT-7B / RM-4B</span>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* VS Badge */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#0d1526] rounded-full border-2 border-[#1e2a44] items-center justify-center z-10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
               <span className="text-white/80 text-[10px] font-black italic">VS</span>
            </div>

            {/* ATLAS */}
            <div className="space-y-4 relative z-0">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2F9E76] to-[#1a6148] flex items-center justify-center shadow-[0_0_15px_rgba(47,158,118,0.4)]">
                   <span className="text-white font-extrabold text-sm">A</span>
                 </div>
                 <div>
                   <div className="text-[#2F9E76] text-sm font-extrabold tracking-wide">ATLAS</div>
                   <div className="text-white/50 text-[10px] font-mono tracking-wider">OPTIMIZATION MODEL</div>
                 </div>
               </div>
               <div className="bg-[#152036] rounded-xl p-5 border border-[#1e2a44] min-h-[160px] relative overflow-hidden transition-all duration-500 hover:border-[#2F9E76]/50">
                 <div className="absolute inset-0 bg-gradient-to-b from-[#2F9E76]/5 to-transparent opacity-50"></div>
                 <p className="text-sm text-slate-200 leading-relaxed font-medium relative z-10">
                   {atlasText ? (
                     <>
                       {atlasText}
                       {isProcessing && <span className="inline-block w-1.5 h-4 bg-[#2F9E76] animate-pulse ml-1 align-middle shadow-[0_0_8px_rgba(47,158,118,1)]" />}
                     </>
                   ) : (
                     <span className="text-slate-500 italic">Synthesizing optimal trajectory...</span>
                   )}
                 </p>
               </div>
            </div>

            {/* VERA */}
            <div className="space-y-4 relative z-0">
               <div className="flex items-center gap-3 md:flex-row-reverse md:text-right">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C97B3D] to-[#8a5226] flex items-center justify-center shadow-[0_0_15px_rgba(201,123,61,0.4)]">
                   <span className="text-white font-extrabold text-sm">V</span>
                 </div>
                 <div>
                   <div className="text-[#C97B3D] text-sm font-extrabold tracking-wide">VERA</div>
                   <div className="text-white/50 text-[10px] font-mono tracking-wider">RISK MITIGATION MODEL</div>
                 </div>
               </div>
               <div className="bg-[#152036] rounded-xl p-5 border border-[#1e2a44] min-h-[160px] relative overflow-hidden transition-all duration-500 hover:border-[#C97B3D]/50">
                 <div className="absolute inset-0 bg-gradient-to-b from-[#C97B3D]/5 to-transparent opacity-50"></div>
                 <p className="text-sm text-slate-200 leading-relaxed font-medium relative z-10">
                   {veraText ? (
                     <>
                       <span className="text-white/90">{veraText}</span>
                       {isProcessing && <span className="inline-block w-1.5 h-4 bg-[#C97B3D] animate-pulse ml-1 align-middle shadow-[0_0_8px_rgba(201,123,61,1)]" />}
                     </>
                   ) : (
                     <span className="text-slate-500 italic">Simulating downside risk...</span>
                   )}
                 </p>
               </div>
            </div>
          </div>

          {/* AXIS JUDGE */}
          <div className="mt-8 pt-6 border-t border-[#1e2a44]">
             <div className="flex flex-col md:flex-row md:items-center gap-6">
               <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9A227] to-[#8a6e16] flex items-center justify-center shadow-[0_0_10px_rgba(201,162,39,0.4)] text-slate-900 font-extrabold text-[10px]">
                      Σ
                    </div>
                    <span className="text-[#C9A227] text-xs font-extrabold tracking-widest uppercase">Axis Reconciliation</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed font-medium">
                    {axisText ? (
                      <>
                        {axisText}
                        {isProcessing && <span className="inline-block w-1.5 h-3 bg-[#C9A227] animate-pulse ml-1 align-middle" />}
                      </>
                    ) : (
                      <span className="text-slate-600 italic">Waiting for agents to conclude arguments...</span>
                    )}
                  </p>
               </div>
               <div className="w-full md:w-48 shrink-0 flex flex-col gap-2 bg-[#152036] p-4 rounded-xl border border-[#1e2a44]">
                  <div className="flex justify-between items-end">
                     <span className="text-[#C9A227] text-[10px] font-bold tracking-widest">CONFIDENCE</span>
                     <span className="text-white font-mono text-xs">{isProcessing ? reconcileProgress : 100}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0d1526] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C9A227]/50 to-[#C9A227] rounded-full transition-all duration-300"
                      style={{ width: `${isProcessing ? reconcileProgress : 100}%` }}
                    />
                  </div>
               </div>
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

