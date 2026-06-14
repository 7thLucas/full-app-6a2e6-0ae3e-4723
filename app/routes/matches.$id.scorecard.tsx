import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getScorecard } from "~/cricket/api.client";
import type { InningState, IMatch } from "~/cricket/types";
import { TopBar, Spinner, Card, SectionLabel, TeamColorDot } from "~/components/ui";

interface ScorecardData {
  match: IMatch;
  inning1: InningState;
  inning2: InningState | null;
}

export default function ScorecardPage() {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeInning, setActiveInning] = useState<1 | 2>(1);

  useEffect(() => {
    if (!matchId) return;
    getScorecard(matchId)
      .then((d) => {
        setData(d as ScorecardData);
        if ((d as ScorecardData).match.currentInning === 2) setActiveInning(2);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return <div className="min-h-screen bg-white"><Spinner /></div>;
  if (!data) return null;

  const { match, inning1, inning2 } = data;
  const inning = activeInning === 1 ? inning1 : inning2;
  if (!inning) return null;

  const battingTeam = inning.battingTeamId === match.teamA.teamId ? match.teamA : match.teamB;
  const bowlingTeam = inning.battingTeamId === match.teamA.teamId ? match.teamB : match.teamA;

  // Match result
  let resultText = "";
  if (match.status === "completed" && inning2) {
    const runsA = inning1.battingTeamId === match.teamA.teamId ? inning1.totalRuns : inning2.totalRuns;
    const runsB = inning1.battingTeamId === match.teamA.teamId ? inning2.totalRuns : inning1.totalRuns;
    const wicketsB = inning1.battingTeamId === match.teamA.teamId ? inning2.wickets : inning1.wickets;
    const maxWickets = battingTeam.playingXI.length - 1;
    if (runsA > runsB) {
      const winner = inning1.battingTeamId === match.teamA.teamId ? match.teamA : match.teamB;
      resultText = `${winner.teamName} won by ${runsA - runsB} runs`;
    } else if (runsB > runsA) {
      const winner = inning2.battingTeamId;
      const winnerTeam = winner === match.teamA.teamId ? match.teamA : match.teamB;
      resultText = `${winnerTeam.teamName} won by ${maxWickets - wicketsB} wickets`;
    } else {
      resultText = "Match tied!";
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <TopBar
        title="Scorecard"
        onBack={() => navigate(`/matches/${matchId}/score`)}
        right={
          <Link to="/matches" className="text-white/80 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10">
            All Matches
          </Link>
        }
      />

      {/* Match header */}
      <div className="bg-[#166534] px-4 pt-4 pb-5 text-white">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="text-center">
            <p className="text-2xl font-black">{match.teamA.teamShortName}</p>
            <p className="text-xs text-green-200">{match.teamA.teamName}</p>
          </div>
          <span className="text-green-300 text-lg font-light">vs</span>
          <div className="text-center">
            <p className="text-2xl font-black">{match.teamB.teamShortName}</p>
            <p className="text-xs text-green-200">{match.teamB.teamName}</p>
          </div>
        </div>
        <div className="flex justify-center gap-6 text-sm">
          <div className="text-center">
            <p className="font-black text-xl">
              {inning1.totalRuns}/{inning1.wickets}
            </p>
            <p className="text-xs text-green-200">
              {inning1.battingTeamId === match.teamA.teamId ? match.teamA.teamShortName : match.teamB.teamShortName} · {inning1.overs}.{inning1.balls} ov
            </p>
          </div>
          {inning2 && (
            <>
              <div className="text-green-300 text-xl self-center">·</div>
              <div className="text-center">
                <p className="font-black text-xl">
                  {inning2.totalRuns}/{inning2.wickets}
                </p>
                <p className="text-xs text-green-200">
                  {inning2.battingTeamId === match.teamA.teamId ? match.teamA.teamShortName : match.teamB.teamShortName} · {inning2.overs}.{inning2.balls} ov
                </p>
              </div>
            </>
          )}
        </div>
        {resultText && (
          <p className="text-center font-bold text-[#f59e0b] mt-2 text-sm">{resultText}</p>
        )}
      </div>

      {/* Inning tabs */}
      {inning2 && (
        <div className="flex border-b border-[#e2e8f0]">
          <button
            onClick={() => setActiveInning(1)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeInning === 1 ? "text-[#166534] border-b-2 border-[#166534]" : "text-[#64748b]"}`}
          >
            1st Innings
          </button>
          <button
            onClick={() => setActiveInning(2)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeInning === 2 ? "text-[#166534] border-b-2 border-[#166534]" : "text-[#64748b]"}`}
          >
            2nd Innings
          </button>
        </div>
      )}

      <div className="px-4 pt-5 flex flex-col gap-5">
        {/* Batting scorecard */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TeamColorDot color={battingTeam.teamColor} size={10} />
            <SectionLabel>{battingTeam.teamName} Batting</SectionLabel>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] pr-4">Batsman</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] px-2">R</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] px-2">B</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] px-2">4s</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] px-2">6s</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] pl-2">SR</th>
                </tr>
              </thead>
              <tbody>
                {inning.battingStats.map((b) => (
                  <tr key={b.playerId} className="border-b border-[#f1f5f9]">
                    <td className="py-2.5 pr-4">
                      <p className="font-semibold text-[#0f172a]">{b.playerName}</p>
                      <p className="text-xs text-[#94a3b8]">
                        {b.isNotOut ? "not out" : b.dismissal ? b.dismissal + (b.dismissedBy ? ` b ${b.dismissedBy}` : "") : "—"}
                      </p>
                    </td>
                    <td className={`text-right py-2.5 px-2 font-bold ${b.isNotOut ? "text-[#166534]" : "text-[#0f172a]"}`}>{b.runs}</td>
                    <td className="text-right py-2.5 px-2 text-[#64748b]">{b.balls}</td>
                    <td className="text-right py-2.5 px-2 text-[#64748b]">{b.fours}</td>
                    <td className="text-right py-2.5 px-2 text-[#64748b]">{b.sixes}</td>
                    <td className="text-right py-2.5 pl-2 text-[#64748b]">{b.strikeRate.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Extras & total */}
          <div className="mt-3 flex justify-between text-sm border-t border-[#e2e8f0] pt-2">
            <span className="text-[#64748b]">Extras: {inning.extras}</span>
            <span className="font-bold text-[#0f172a]">
              Total: {inning.totalRuns}/{inning.wickets} ({inning.overs}.{inning.balls} ov)
            </span>
          </div>

          {/* FOW */}
          {inning.fallOfWickets.length > 0 && (
            <div className="mt-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Fall of Wickets</p>
              <p className="text-xs text-[#64748b] leading-relaxed">
                {inning.fallOfWickets.map((f) => `${f.wicket}-${f.score} (${f.playerName})`).join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* Bowling scorecard */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TeamColorDot color={bowlingTeam.teamColor} size={10} />
            <SectionLabel>{bowlingTeam.teamName} Bowling</SectionLabel>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] pr-4">Bowler</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] px-2">O</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] px-2">M</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] px-2">R</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] px-2">W</th>
                  <th className="text-right py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] pl-2">Econ</th>
                </tr>
              </thead>
              <tbody>
                {inning.bowlingStats.map((b) => (
                  <tr key={b.playerId} className="border-b border-[#f1f5f9]">
                    <td className="py-2.5 pr-4 font-semibold text-[#0f172a]">{b.playerName}</td>
                    <td className="text-right py-2.5 px-2 text-[#64748b]">{b.overs}.{b.balls}</td>
                    <td className="text-right py-2.5 px-2 text-[#64748b]">{b.maidens}</td>
                    <td className="text-right py-2.5 px-2 text-[#64748b]">{b.runs}</td>
                    <td className={`text-right py-2.5 px-2 font-bold ${b.wickets > 0 ? "text-[#166534]" : "text-[#0f172a]"}`}>{b.wickets}</td>
                    <td className="text-right py-2.5 pl-2 text-[#64748b]">{b.economy.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 mt-6 flex gap-3">
        {match.status !== "completed" && (
          <Link
            to={`/matches/${matchId}/score`}
            className="flex-1 min-h-[52px] rounded-2xl bg-[#166534] text-white font-bold text-sm flex items-center justify-center"
          >
            Continue Scoring
          </Link>
        )}
        <Link
          to="/matches"
          className="flex-1 min-h-[52px] rounded-2xl border-2 border-[#166534] text-[#166534] font-bold text-sm flex items-center justify-center"
        >
          All Matches
        </Link>
      </div>
    </div>
  );
}
