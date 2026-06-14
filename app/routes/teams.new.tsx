import { useState } from "react";
import { useNavigate } from "react-router";
import { createTeam } from "~/cricket/api.client";
import { TopBar, Input, PrimaryButton, Card } from "~/components/ui";

const PRESET_COLORS = [
  "#166534", "#1d4ed8", "#7c3aed", "#b91c1c", "#c2410c", "#0f766e", "#0369a1", "#4d7c0f",
  "#92400e", "#6b21a8", "#be185d", "#0e7490",
];

export default function NewTeamPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [color, setColor] = useState("#166534");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim()) {
      setError("Team name and short name are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const team = await createTeam({ name: name.trim(), shortName: shortName.trim(), color });
      navigate(`/teams/${team._id}`);
    } catch (err) {
      setError("Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <TopBar title="New Team" onBack={() => navigate("/teams")} />

      <form onSubmit={handleSubmit} className="px-4 pt-6 flex flex-col gap-5">
        <Input
          label="Team Name"
          value={name}
          onChange={(v) => { setName(v); setShortName(v.slice(0, 4).toUpperCase()); }}
          placeholder="e.g. Gully XI"
          required
        />

        <Input
          label="Short Name (max 4 chars)"
          value={shortName}
          onChange={(v) => setShortName(v.toUpperCase().slice(0, 4))}
          placeholder="e.g. MUM"
          required
        />

        {/* Color picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
            Team Color
          </label>
          <div className="flex flex-wrap gap-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-10 h-10 rounded-full transition-transform active:scale-90 ${color === c ? "ring-4 ring-offset-2 ring-[#166534] scale-110" : ""}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-11 h-11 rounded-xl border border-[#e2e8f0] cursor-pointer p-1 bg-white"
            />
            <span className="text-sm text-[#64748b] font-mono">{color}</span>
          </div>
        </div>

        {/* Preview */}
        <Card className="p-4 flex items-center gap-3">
          <div
            style={{ backgroundColor: color }}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow"
          >
            {shortName || "??"}
          </div>
          <div>
            <p className="font-bold text-[#0f172a]">{name || "Team Name"}</p>
            <p className="text-xs text-[#64748b]">0 players</p>
          </div>
        </Card>

        {error && <p className="text-sm text-[#ef4444] font-medium">{error}</p>}

        <PrimaryButton type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Team"}
        </PrimaryButton>
      </form>
    </div>
  );
}
