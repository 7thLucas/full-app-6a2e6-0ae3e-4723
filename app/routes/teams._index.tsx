import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getTeams, deleteTeam } from "~/cricket/api.client";
import type { ITeam } from "~/cricket/types";
import { TopBar, Card, TeamColorDot, EmptyState, Spinner, DangerButton } from "~/components/ui";

export default function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getTeams()
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete team "${name}" and all their players?`)) return;
    setDeletingId(id);
    try {
      await deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t._id !== id));
    } catch {
      alert("Failed to delete team.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <TopBar
        title="Teams"
        onBack={() => navigate("/")}
        right={
          <Link
            to="/teams/new"
            className="min-h-[36px] px-4 py-2 rounded-xl bg-[#f59e0b] text-white font-bold text-sm flex items-center gap-1"
          >
            <span className="text-lg leading-none">+</span> New
          </Link>
        }
      />

      <div className="px-4 pt-5">
        {loading ? (
          <Spinner />
        ) : teams.length === 0 ? (
          <EmptyState
            icon="🏏"
            title="No teams yet"
            subtitle="Create your first team to start scoring"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {teams.map((team) => (
              <Card key={team._id} className="overflow-hidden">
                <Link to={`/teams/${team._id}`} className="block p-4">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: team.color }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm"
                    >
                      {team.shortName}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0f172a] text-base truncate">{team.name}</p>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {team.players?.length ?? 0} players
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
                <div className="border-t border-[#e2e8f0] flex">
                  <Link
                    to={`/teams/${team._id}/edit`}
                    className="flex-1 text-center py-3 text-xs font-semibold text-[#166534] hover:bg-[#f0fdf4]"
                  >
                    Edit
                  </Link>
                  <div className="w-px bg-[#e2e8f0]" />
                  <button
                    onClick={() => handleDelete(team._id, team.name)}
                    disabled={deletingId === team._id}
                    className="flex-1 text-center py-3 text-xs font-semibold text-[#ef4444] hover:bg-[#fef2f2] disabled:opacity-40"
                  >
                    {deletingId === team._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
