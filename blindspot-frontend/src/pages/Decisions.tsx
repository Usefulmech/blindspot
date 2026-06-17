import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSessionId } from "../utils/session";
import { Card } from "../components/ui/Card";
import { StatusChip } from "../components/ui/StatusChip";
import { Button } from "../components/ui/Button";

export function Decisions() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDecisions() {
      try {
        const sid = getSessionId();
        const res = await fetch(`/api/decisions?session_id=${sid}`);
        if (!res.ok) throw new Error("Failed to fetch decisions");
        const data = await res.json();
        setDecisions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDecisions();
  }, []);

  return (
    <div className="px-4 pt-2 pb-10 md:px-8 max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface tracking-tight">
            My Decisions
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Review your past analyses and stress-tests.
          </p>
        </div>
        <Link to="/analyze">
          <Button size="sm">New Analysis</Button>
        </Link>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="text-center py-16 text-sm text-on-surface-variant">
          Loading your history…
        </div>
      ) : error ? (
        <Card>
          <Card.Body>
            <p className="text-sm text-on-error-container">{error}</p>
          </Card.Body>
        </Card>
      ) : decisions.length === 0 ? (
        <Card>
          <Card.Body className="flex flex-col items-center text-center py-14 gap-4">
            <h3 className="text-lg font-semibold text-on-surface">
              No decisions yet
            </h3>
            <p className="text-sm text-on-surface-variant max-w-xs">
              You haven't run any scenarios through the engine yet.
            </p>
            <Link to="/analyze">
              <Button>Start Your First Analysis</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid gap-4">
          {decisions.map((d: any) => (
            <Card key={d.id} variant="elevated">
              <Card.Body className="flex flex-col md:flex-row md:items-center gap-5">
                {/* Left — decision info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <StatusChip
                      status={
                        d.score < 50
                          ? "error"
                          : d.score < 75
                            ? "warning"
                            : "success"
                      }
                      label={`Grade ${d.grade}`}
                    />
                    <span className="text-xs text-outline font-medium">
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                    {d.advisory_flag && (
                      <StatusChip status="error" label="Flagged" />
                    )}
                  </div>
                  <h3 className="font-semibold text-on-surface line-clamp-2 text-sm leading-snug">
                    {d.decision_text}
                  </h3>
                  {(d.origin_city || d.destination_city) && (
                    <p className="text-xs text-on-surface-variant mt-1">
                      {d.origin_city} → {d.destination_city}
                    </p>
                  )}
                </div>

                {/* Right — score + action */}
                <div
                  className="flex items-center gap-5 shrink-0
                                border-t border-outline-variant pt-4
                                md:border-t-0 md:pt-0 md:border-l md:pl-5"
                >
                  <div className="text-center">
                    <div className="text-xs text-outline uppercase tracking-wider mb-1">
                      Score
                    </div>
                    <div className="text-3xl font-display font-bold text-primary">
                      {d.score}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    View Report
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
