import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useConfigurables } from "~/modules/configurables";
import { getTeams } from "~/cricket/api.client";
import type { ITeam } from "~/cricket/types";
import { Card, TeamColorDot, EmptyState, Spinner } from "~/components/ui";

export default function HomePage() {
  const { config, loading: cfgLoading } = useConfigurables();
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const appName = cfgLoading ? "Scorenow" : (config?.appName ?? "Scorenow");
  const tagline = cfgLoading ? "Ball-by-ball cricket scoring" : (config?.tagline ?? "Ball-by-ball cricket scoring");
  const welcome = cfgLoading ? "Ready to score?" : (config?.homeWelcomeMessage ?? "Ready to score?");
  const subtitle = cfgLoading ? "Build teams, set up your match, and track every ball." : (config?.homeSubtitle ?? "Build teams, set up your match, and track every ball.");

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Hero header */}
      <div className="bg-[#166534] px-5 pt-12 pb-10 text-white">
        <div className="flex items-center gap-3 mb-1">
          {config?.logoUrl && config.logoUrl !== "FILL_LOGO_URL_HERE" && (
            <img src={config.logoUrl} alt={appName} className="w-9 h-9 rounded-xl object-contain bg-white/10 p-1" />
          )}
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-green-300">{tagline}</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight leading-none mt-2">{appName}</h1>
        <p className="text-green-100 text-sm mt-3 font-medium">{welcome}</p>
        <p className="text-green-200 text-xs mt-1">{subtitle}</p>
      </div>

      {/* Quick actions */}
      <div className="px-4 -mt-5 flex gap-3">
        <Link
          to="/matches/new"
          className="flex-1 min-h-[56px] bg-[#f59e0b] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
          </svg>
          New Match
        </Link>
        <Link
          to="/teams"
          className="flex-1 min-h-[56px] bg-white border-2 border-[#166534] text-[#166534] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Teams
        </Link>
      </div>

      {/* Teams overview */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#64748b]">Your Teams</p>
          <Link to="/teams" className="text-xs font-semibold text-[#166534]">See all</Link>
        </div>

        {loading ? (
          <Spinner />
        ) : teams.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon="🏏"
              title="No teams yet"
              subtitle="Create your first team to get started"
            />
            <div className="mt-4 flex justify-center">
              <Link
                to="/teams/new"
                className="px-5 py-2 rounded-xl bg-[#166534] text-white text-sm font-bold"
              >
                Create a Team
              </Link>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {teams.slice(0, 5).map((team) => (
              <Link key={team._id} to={`/teams/${team._id}`}>
                <Card className="p-4 flex items-center gap-3 active:bg-[#f1f5f9] transition-colors">
                  <TeamColorDot color={team.color} size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0f172a] text-sm truncate">{team.name}</p>
                    <p className="text-xs text-[#64748b]">{team.players?.length ?? 0} players</p>
                  </div>
                  <span className="text-xs font-bold text-[#94a3b8] border border-[#e2e8f0] rounded-lg px-2 py-1">{team.shortName}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent matches link */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#64748b]">Recent Matches</p>
        </div>
        <Link to="/matches">
          <Card className="p-4 flex items-center gap-3 active:bg-[#f1f5f9] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#166534]/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
                <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
                <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
                <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
                <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
                <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z" />
                <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#0f172a] text-sm">View All Matches</p>
              <p className="text-xs text-[#64748b]">Scorecards, stats, history</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Card>
        </Link>
      </div>
    </div>
  );
}
