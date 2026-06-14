import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getMatches, deleteMatch } from "~/cricket/api.client";
import type { IMatch } from "~/cricket/types";
import { TopBar, Card, EmptyState, Spinner } from "~/components/ui";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  first_innings: { label: "1st Innings", color: "#22c55e" },
  second_innings: { label: "2nd Innings", color: "#f59e0b" },
  completed: { label: "Completed", color: "#64748b" },
  setup: { label: "Setup", color: "#94a3b8" },
};

export default function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMatches()
      .then(setMatches)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this match and all its events?")) return;
    await deleteMatch(id);
    setMatches((prev) => prev.filter((m) => m._id !== id));
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <TopBar
        title="Matches"
        onBack={() => navigate("/")}
        right={
          <Link to="/matches/new" className="min-h-[36px] px-4 py-2 rounded-xl bg-[#f59e0b] text-white font-bold text-sm flex items-center gap-1">
            <span className="text-lg leading-none">+</span> New
          </Link>
        }
      />
      <div className="px-4 pt-5">
        {loading ? (
          <Spinner />
        ) : matches.length === 0 ? (
          <EmptyState icon="🏏" title="No matches yet" subtitle="Set up a new match to start scoring" />
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((match) => {
              const status = STATUS_LABELS[match.status] ?? { label: match.status, color: "#64748b" };
              return (
                <Card key={match._id} className="overflow-hidden">
                  <Link to={`/matches/${match._id}/score`} className="block p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                        <p className="font-bold text-[#0f172a] text-base">
                          {match.teamA.teamShortName} vs {match.teamB.teamShortName}
                        </p>
                        <p className="text-xs text-[#64748b] mt-0.5">
                          {match.teamA.teamName} vs {match.teamB.teamName} · {match.totalOvers} ov
                        </p>
                        <p className="text-xs text-[#94a3b8] mt-0.5">
                          Toss: {match.tossWonByTeamId === match.teamA.teamId ? match.teamA.teamShortName : match.teamB.teamShortName} chose to {match.tossDecision}
                        </p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                  <div className="border-t border-[#e2e8f0] flex">
                    <Link
                      to={`/matches/${match._id}/scorecard`}
                      className="flex-1 text-center py-3 text-xs font-semibold text-[#166534] hover:bg-[#f0fdf4]"
                    >
                      Scorecard
                    </Link>
                    <div className="w-px bg-[#e2e8f0]" />
                    <button
                      onClick={() => handleDelete(match._id)}
                      className="flex-1 text-center py-3 text-xs font-semibold text-[#ef4444] hover:bg-[#fef2f2]"
                    >
                      Delete
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
