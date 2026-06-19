import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function Report() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTimelineTab, setActiveTimelineTab] = useState<"taken" | "not_taken">("taken");

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/${uuid}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Report not found");
          throw new Error("Failed to load report");
        }
        const data = await res.json();
        setResult(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (uuid) fetchReport();
  }, [uuid]);

  if (isLoading) {
    return <div className="text-center py-16 text-sm text-on-surface-variant">Loading report...</div>;
  }

  if (error || !result) {
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-red-900">Error</h2>
        <p className="text-sm text-on-surface-variant">{error || "Could not load report."}</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const showAdvisory = result.score < 40 || result.advisory_action?.flagged || result.data_health?.status === "RED";

  return (
    <div className="px-4 py-8 md:px-8 md:py-10 max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-display font-bold text-on-surface tracking-tight">
          Blindspot Report Card
        </h1>
        <p className="text-sm text-on-surface-variant">
          Shared Decision Analysis
        </p>
      </div>

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

      {showAdvisory && (
        <div className="bg-risk-bg border border-[#F3C5C2] rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <div className="flex gap-3 items-start">
            <span className="text-risk font-extrabold text-base leading-none shrink-0">⚠</span>
            <p className="text-xs font-bold text-red-900 leading-normal">
              {result.advisory_action?.message || "Score below 40 in Financial Realism. We recommend speaking with a counselor before acting on this decision."}
            </p>
          </div>
        </div>
      )}

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

      <div className="space-y-3">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Identified Blind Spots</p>
        <div className="space-y-3">
          {(result.blindspots || []).map((bs: any, idx: number) => (
            <div key={idx} className="bg-white border border-border-mock rounded-xl p-4 space-y-2.5 shadow-sm">
              <h5 className="font-extrabold text-on-surface text-[13px] leading-snug">{bs.title || bs}</h5>
              {bs.detail && <p className="text-xs text-on-surface-variant leading-relaxed">{bs.detail}</p>}
              {bs.source && <div className="text-[9.5px] text-outline font-semibold">Source: {bs.source}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">5-Year Parallel Reality</p>
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
          {(result.timeline?.[activeTimelineTab === "taken" ? "path_taken" : "path_not_taken"]?.milestones || []).map((step: any, idx: number) => (
            <div key={idx} className="bg-[#FFF8EF] border border-[#F0E2C9] rounded-xl p-4 space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-caution uppercase tracking-wider">
                <span>YEAR {step.year}</span>
                <span>Trajectory: {step.trajectory_score}</span>
              </div>
              <p className="text-xs text-on-surface font-medium leading-relaxed italic">
                "{step.narrative}"
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="pt-8 text-center space-y-4">
        <Button onClick={() => navigate("/")}>Create Your Own Analysis</Button>
      </div>
    </div>
  );
}
