import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getTeams, deletePlayer, createPlayer } from "~/cricket/api.client";
import type { ITeam, IPlayer, PlayerRole, BattingStyle, BowlingStyle } from "~/cricket/types";
import { TopBar, Card, RoleBadge, EmptyState, Spinner, DangerButton, Modal, Input, Select, PrimaryButton, SectionLabel } from "~/components/ui";

const ROLE_OPTIONS = [
  { value: "Batsman", label: "Batsman" },
  { value: "Bowler", label: "Bowler" },
  { value: "All-Rounder", label: "All-Rounder" },
  { value: "Wicketkeeper", label: "Wicketkeeper" },
];

const BATTING_OPTIONS = [
  { value: "RHB", label: "Right-Hand Bat" },
  { value: "LHB", label: "Left-Hand Bat" },
];

const BOWLING_OPTIONS = [
  { value: "None", label: "None" },
  { value: "Fast", label: "Fast" },
  { value: "Medium-Fast", label: "Medium-Fast" },
  { value: "Medium", label: "Medium" },
  { value: "Off-Spin", label: "Off-Spin" },
  { value: "Leg-Spin", label: "Leg-Spin" },
  { value: "Slow Left-Arm", label: "Slow Left-Arm" },
];

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<ITeam | null>(null);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  // Add player form
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState<string>("Batsman");
  const [playerBat, setPlayerBat] = useState<string>("RHB");
  const [playerBowl, setPlayerBowl] = useState<string>("None");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const load = async () => {
    if (!id) return;
    try {
      const teams = await getTeams();
      const found = teams.find((t) => t._id === id);
      if (!found) { navigate("/teams"); return; }
      setTeam(found);
      setPlayers(found.players ?? []);
    } catch {
      navigate("/teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleDeletePlayer = async (playerId: string, name: string) => {
    if (!confirm(`Remove "${name}" from the roster?`)) return;
    await deletePlayer(playerId);
    setPlayers((prev) => prev.filter((p) => p._id !== playerId));
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !id) return;
    setAddLoading(true);
    setAddError("");
    try {
      const p = await createPlayer(id, {
        name: playerName.trim(),
        role: playerRole,
        battingStyle: playerBat,
        bowlingStyle: playerBowl,
      });
      setPlayers((prev) => [...prev, p]);
      setPlayerName("");
      setShowAddModal(false);
    } catch {
      setAddError("Failed to add player.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim() || !id) return;
    setQuickAddLoading(true);
    try {
      const names = quickAddText.split(",").map((n) => n.trim()).filter(Boolean);
      const newPlayers = await (await import("~/cricket/api.client")).quickAddPlayers(id, names);
      setPlayers((prev) => [...prev, ...newPlayers]);
      setQuickAddText("");
      setShowQuickAdd(false);
    } catch {
      alert("Failed to quick-add players.");
    } finally {
      setQuickAddLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white"><Spinner /></div>;
  if (!team) return null;

  return (
    <div className="min-h-screen bg-white pb-24">
      <TopBar
        title={team.name}
        onBack={() => navigate("/teams")}
        right={
          <Link to={`/teams/${id}/edit`} className="text-white/80 text-sm font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
            Edit
          </Link>
        }
      />

      {/* Team banner */}
      <div style={{ backgroundColor: team.color + "18" }} className="px-4 py-4 flex items-center gap-3 border-b border-[#e2e8f0]">
        <div
          style={{ backgroundColor: team.color }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-base shadow"
        >
          {team.shortName}
        </div>
        <div>
          <p className="font-black text-[#0f172a] text-xl">{team.name}</p>
          <p className="text-sm text-[#64748b]">{players.length} players in roster</p>
        </div>
      </div>

      {/* Roster */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Roster ({players.length})</SectionLabel>
          <div className="flex gap-2">
            <button
              onClick={() => setShowQuickAdd(true)}
              className="text-xs font-semibold text-[#64748b] border border-[#e2e8f0] px-3 py-1.5 rounded-lg hover:bg-[#f8fafc]"
            >
              Quick-Add
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-semibold text-[#166534] border border-[#166534] px-3 py-1.5 rounded-lg hover:bg-[#f0fdf4]"
            >
              + Add Player
            </button>
          </div>
        </div>

        {players.length === 0 ? (
          <EmptyState
            icon="👤"
            title="No players yet"
            subtitle="Add players or use Quick-Add to paste 11 names at once"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((player) => (
              <Card key={player._id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#0f172a] text-sm truncate">{player.name}</p>
                    <RoleBadge role={player.role} />
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    {player.battingStyle}
                    {player.bowlingStyle !== "None" ? ` · ${player.bowlingStyle}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePlayer(player._id, player.name)}
                  className="w-8 h-8 flex items-center justify-center text-[#ef4444] hover:bg-[#fef2f2] rounded-lg text-lg"
                >
                  ×
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Player Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Player">
        <form onSubmit={handleAddPlayer} className="flex flex-col gap-4">
          <Input label="Name" value={playerName} onChange={setPlayerName} placeholder="Player name" required />
          <Select label="Role" value={playerRole} onChange={setPlayerRole} options={ROLE_OPTIONS} />
          <Select label="Batting Style" value={playerBat} onChange={setPlayerBat} options={BATTING_OPTIONS} />
          <Select label="Bowling Style" value={playerBowl} onChange={setPlayerBowl} options={BOWLING_OPTIONS} />
          {addError && <p className="text-sm text-[#ef4444]">{addError}</p>}
          <PrimaryButton type="submit" disabled={addLoading} className="w-full">
            {addLoading ? "Adding..." : "Add Player"}
          </PrimaryButton>
        </form>
      </Modal>

      {/* Quick Add Modal */}
      <Modal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="Quick-Add Players">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[#64748b]">Paste up to 11 comma-separated names to add them instantly as Batsmen (you can edit roles after).</p>
          <textarea
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            placeholder="Virat, Rohit, Dhoni, Bumrah, Jadeja, ..."
            className="w-full h-28 px-3 py-3 rounded-xl border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#166534] resize-none"
          />
          <p className="text-xs text-[#94a3b8]">
            {quickAddText.split(",").filter((n) => n.trim()).length} names detected
          </p>
          <PrimaryButton onClick={handleQuickAdd} disabled={quickAddLoading || !quickAddText.trim()} className="w-full">
            {quickAddLoading ? "Adding..." : "Add Players"}
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
