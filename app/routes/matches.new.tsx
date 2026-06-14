import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getTeams, createMatch } from "~/cricket/api.client";
import { useConfigurables } from "~/modules/configurables";
import type { ITeam, IPlayer, TossResult } from "~/cricket/types";
import { TopBar, Card, TeamColorDot, RoleBadge, PrimaryButton, SecondaryButton, Spinner, SectionLabel } from "~/components/ui";

type Step = "teams" | "xi_a" | "xi_b" | "captains" | "toss";

export default function NewMatchPage() {
  const navigate = useNavigate();
  const { config } = useConfigurables();
  const [step, setStep] = useState<Step>("teams");
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [totalOvers, setTotalOvers] = useState(config?.defaultOvers ?? 20);
  const [xiA, setXiA] = useState<string[]>([]);
  const [xiB, setXiB] = useState<string[]>([]);
  const [captainA, setCaptainA] = useState("");
  const [wkA, setWkA] = useState("");
  const [captainB, setCaptainB] = useState("");
  const [wkB, setWkB] = useState("");
  const [tossWinner, setTossWinner] = useState("");
  const [tossDecision, setTossDecision] = useState<TossResult>("bat");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (config?.defaultOvers) setTotalOvers(config.defaultOvers);
  }, [config]);

  const teamA = teams.find((t) => t._id === teamAId);
  const teamB = teams.find((t) => t._id === teamBId);

  const toggleXI = (id: string, current: string[], setter: (v: string[]) => void) => {
    if (current.includes(id)) setter(current.filter((x) => x !== id));
    else if (current.length < 11) setter([...current, id]);
  };

  const handleCreate = async () => {
    if (!teamA || !teamB) return;
    setCreating(true);
    try {
      const match = await createMatch({
        teamA: {
          teamId: teamA._id,
          teamName: teamA.name,
          teamShortName: teamA.shortName,
          teamColor: teamA.color,
          playingXI: xiA,
          captainId: captainA,
          wicketkeeperId: wkA,
        },
        teamB: {
          teamId: teamB._id,
          teamName: teamB.name,
          teamShortName: teamB.shortName,
          teamColor: teamB.color,
          playingXI: xiB,
          captainId: captainB,
          wicketkeeperId: wkB,
        },
        tossWonByTeamId: tossWinner,
        tossDecision,
        totalOvers,
      });
      navigate(`/matches/${match._id}/score`);
    } catch {
      alert("Failed to create match.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white"><Spinner /></div>;

  const STEPS: { key: Step; label: string }[] = [
    { key: "teams", label: "Teams" },
    { key: "xi_a", label: `XI: ${teamA?.shortName ?? "A"}` },
    { key: "xi_b", label: `XI: ${teamB?.shortName ?? "B"}` },
    { key: "captains", label: "Captains" },
    { key: "toss", label: "Toss" },
  ];

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-white pb-24">
      <TopBar title="New Match" onBack={() => navigate("/matches")} />

      {/* Step indicator */}
      <div className="px-4 py-3 flex gap-1.5 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`flex-shrink-0 h-1.5 rounded-full transition-all ${i <= stepIndex ? "bg-[#166534]" : "bg-[#e2e8f0]"}`}
            style={{ flex: 1, minWidth: 24 }}
          />
        ))}
      </div>
      <p className="px-4 text-xs text-[#64748b] font-semibold uppercase tracking-wider mb-4">
        Step {stepIndex + 1} / {STEPS.length} — {STEPS[stepIndex].label}
      </p>

      <div className="px-4">
        {/* STEP 1: Pick Teams & Overs */}
        {step === "teams" && (
          <div className="flex flex-col gap-4">
            <SectionLabel>Select Team A</SectionLabel>
            {teams.map((t) => (
              <button
                key={t._id}
                onClick={() => { setTeamAId(t._id); setXiA([]); setCaptainA(""); setWkA(""); }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${teamAId === t._id ? "border-[#166534] bg-[#f0fdf4]" : "border-[#e2e8f0] bg-white"}`}
              >
                <TeamColorDot color={t.color} size={14} />
                <div className="flex-1 text-left">
                  <p className="font-bold text-[#0f172a]">{t.name}</p>
                  <p className="text-xs text-[#64748b]">{t.players?.length ?? 0} players</p>
                </div>
                {teamAId === t._id && <span className="text-[#166534]">✓</span>}
              </button>
            ))}

            {teamAId && (
              <>
                <SectionLabel>Select Team B</SectionLabel>
                {teams.filter((t) => t._id !== teamAId).map((t) => (
                  <button
                    key={t._id}
                    onClick={() => { setTeamBId(t._id); setXiB([]); setCaptainB(""); setWkB(""); }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${teamBId === t._id ? "border-[#166534] bg-[#f0fdf4]" : "border-[#e2e8f0] bg-white"}`}
                  >
                    <TeamColorDot color={t.color} size={14} />
                    <div className="flex-1 text-left">
                      <p className="font-bold text-[#0f172a]">{t.name}</p>
                      <p className="text-xs text-[#64748b]">{t.players?.length ?? 0} players</p>
                    </div>
                    {teamBId === t._id && <span className="text-[#166534]">✓</span>}
                  </button>
                ))}
              </>
            )}

            {teamAId && teamBId && (
              <div className="flex flex-col gap-2 mt-2">
                <SectionLabel>Total Overs</SectionLabel>
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 15, 20, 25, 30, 40, 50].map((o) => (
                    <button
                      key={o}
                      onClick={() => setTotalOvers(o)}
                      className={`min-w-[52px] min-h-[48px] rounded-xl font-bold text-sm border-2 transition-all ${totalOvers === o ? "border-[#166534] bg-[#166534] text-white" : "border-[#e2e8f0] bg-white text-[#0f172a]"}`}
                    >
                      {o}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={totalOvers}
                    onChange={(e) => setTotalOvers(Number(e.target.value))}
                    className="w-20 h-12 px-3 rounded-xl border-2 border-[#e2e8f0] text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#166534]"
                  />
                </div>
              </div>
            )}

            <PrimaryButton
              disabled={!teamAId || !teamBId}
              onClick={() => setStep("xi_a")}
              className="w-full mt-2"
            >
              Next: Select Playing XI
            </PrimaryButton>
          </div>
        )}

        {/* STEP 2: XI for Team A */}
        {step === "xi_a" && teamA && (
          <XISelector
            team={teamA}
            selected={xiA}
            onToggle={(id) => toggleXI(id, xiA, setXiA)}
            onBack={() => setStep("teams")}
            onNext={() => setStep("xi_b")}
          />
        )}

        {/* STEP 3: XI for Team B */}
        {step === "xi_b" && teamB && (
          <XISelector
            team={teamB}
            selected={xiB}
            onToggle={(id) => toggleXI(id, xiB, setXiB)}
            onBack={() => setStep("xi_a")}
            onNext={() => setStep("captains")}
          />
        )}

        {/* STEP 4: Captains & Wicketkeepers */}
        {step === "captains" && teamA && teamB && (
          <CaptainSelector
            teamA={teamA}
            teamB={teamB}
            xiA={xiA}
            xiB={xiB}
            captainA={captainA}
            setCaptainA={setCaptainA}
            wkA={wkA}
            setWkA={setWkA}
            captainB={captainB}
            setCaptainB={setCaptainB}
            wkB={wkB}
            setWkB={setWkB}
            onBack={() => setStep("xi_b")}
            onNext={() => setStep("toss")}
          />
        )}

        {/* STEP 5: Toss */}
        {step === "toss" && teamA && teamB && (
          <div className="flex flex-col gap-4">
            <SectionLabel>Who won the toss?</SectionLabel>
            {[teamA, teamB].map((t) => (
              <button
                key={t._id}
                onClick={() => setTossWinner(t._id)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${tossWinner === t._id ? "border-[#166534] bg-[#f0fdf4]" : "border-[#e2e8f0] bg-white"}`}
              >
                <TeamColorDot color={t.color} size={14} />
                <p className="flex-1 text-left font-bold text-[#0f172a]">{t.name}</p>
                {tossWinner === t._id && <span className="text-[#166534]">✓</span>}
              </button>
            ))}

            {tossWinner && (
              <>
                <SectionLabel>They chose to...</SectionLabel>
                <div className="flex gap-3">
                  {(["bat", "bowl"] as TossResult[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setTossDecision(d)}
                      className={`flex-1 min-h-[56px] rounded-2xl font-bold capitalize border-2 transition-all ${tossDecision === d ? "border-[#166534] bg-[#166534] text-white" : "border-[#e2e8f0] bg-white text-[#0f172a]"}`}
                    >
                      {d === "bat" ? "Bat First" : "Bowl First"}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3 mt-2">
              <SecondaryButton onClick={() => setStep("captains")} className="flex-1">Back</SecondaryButton>
              <PrimaryButton
                disabled={!tossWinner || creating}
                onClick={handleCreate}
                className="flex-1"
              >
                {creating ? "Starting..." : "Start Match!"}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function XISelector({
  team,
  selected,
  onToggle,
  onBack,
  onNext,
}: {
  team: ITeam;
  selected: string[];
  onToggle: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <SectionLabel>Playing XI — {team.name}</SectionLabel>
        <span className={`text-sm font-bold ${selected.length === 11 ? "text-[#166534]" : "text-[#f59e0b]"}`}>
          {selected.length}/11
        </span>
      </div>
      {(team.players ?? []).map((player) => {
        const sel = selected.includes(player._id);
        return (
          <button
            key={player._id}
            onClick={() => onToggle(player._id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${sel ? "border-[#166534] bg-[#f0fdf4]" : "border-[#e2e8f0] bg-white"}`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? "border-[#166534] bg-[#166534]" : "border-[#cbd5e1]"}`}>
              {sel && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#0f172a] text-sm">{player.name}</p>
              <p className="text-xs text-[#94a3b8]">{player.battingStyle}</p>
            </div>
            <RoleBadge role={player.role} />
          </button>
        );
      })}
      <div className="flex gap-3 mt-2">
        <SecondaryButton onClick={onBack} className="flex-1">Back</SecondaryButton>
        <PrimaryButton disabled={selected.length !== 11} onClick={onNext} className="flex-1">
          Next
        </PrimaryButton>
      </div>
      {selected.length !== 11 && (
        <p className="text-center text-xs text-[#94a3b8]">Select exactly 11 players</p>
      )}
    </div>
  );
}

function CaptainSelector({
  teamA, teamB, xiA, xiB,
  captainA, setCaptainA, wkA, setWkA,
  captainB, setCaptainB, wkB, setWkB,
  onBack, onNext,
}: {
  teamA: ITeam; teamB: ITeam;
  xiA: string[]; xiB: string[];
  captainA: string; setCaptainA: (v: string) => void;
  wkA: string; setWkA: (v: string) => void;
  captainB: string; setCaptainB: (v: string) => void;
  wkB: string; setWkB: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  const playersA = (teamA.players ?? []).filter((p) => xiA.includes(p._id));
  const playersB = (teamB.players ?? []).filter((p) => xiB.includes(p._id));

  const PlayerPicker = ({
    players,
    selected,
    onSelect,
    label,
  }: { players: IPlayer[]; selected: string; onSelect: (id: string) => void; label: string }) => (
    <div>
      <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <button
            key={p._id}
            onClick={() => onSelect(p._id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${selected === p._id ? "border-[#166534] bg-[#166534] text-white" : "border-[#e2e8f0] bg-white text-[#0f172a]"}`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
        <p className="font-bold text-[#0f172a] mb-3">{teamA.name}</p>
        <PlayerPicker players={playersA} selected={captainA} onSelect={setCaptainA} label="Captain" />
        <div className="mt-3">
          <PlayerPicker players={playersA} selected={wkA} onSelect={setWkA} label="Wicketkeeper" />
        </div>
      </div>
      <div className="p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
        <p className="font-bold text-[#0f172a] mb-3">{teamB.name}</p>
        <PlayerPicker players={playersB} selected={captainB} onSelect={setCaptainB} label="Captain" />
        <div className="mt-3">
          <PlayerPicker players={playersB} selected={wkB} onSelect={setWkB} label="Wicketkeeper" />
        </div>
      </div>
      <div className="flex gap-3">
        <SecondaryButton onClick={onBack} className="flex-1">Back</SecondaryButton>
        <PrimaryButton
          disabled={!captainA || !wkA || !captainB || !wkB}
          onClick={onNext}
          className="flex-1"
        >
          Next: Toss
        </PrimaryButton>
      </div>
    </div>
  );
}
