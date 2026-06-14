import { Router, type Request, type Response } from "express";
import { CricketTeamModel, CricketPlayerModel } from "../models/team.model";
import type { BattingStyle, BowlingStyle, PlayerRole } from "../types";

const router = Router();

// GET /api/cricket/teams — list all teams with their players
router.get("/api/cricket/teams", async (_req: Request, res: Response) => {
  try {
    const teams = await CricketTeamModel.find().sort({ createdAt: -1 }).lean();
    const players = await CricketPlayerModel.find().lean();

    const result = teams.map((team) => ({
      ...team,
      _id: team._id.toString(),
      players: players
        .filter((p) => p.teamId === team._id.toString())
        .map((p) => ({ ...p, _id: p._id.toString() })),
    }));

    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch teams" });
  }
});

// POST /api/cricket/teams — create team
router.post("/api/cricket/teams", async (req: Request, res: Response) => {
  try {
    const { name, shortName, color } = req.body;
    if (!name || !shortName) {
      return res.status(400).json({ success: false, error: "name and shortName are required" });
    }
    const team = await CricketTeamModel.create({ name, shortName: shortName.toUpperCase().slice(0, 4), color: color || "#166534" });
    return res.json({ success: true, data: { ...team.toObject(), _id: team._id.toString() } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to create team" });
  }
});

// PUT /api/cricket/teams/:id — update team
router.put("/api/cricket/teams/:id", async (req: Request, res: Response) => {
  try {
    const { name, shortName, color } = req.body;
    const team = await CricketTeamModel.findByIdAndUpdate(
      req.params.id,
      { name, shortName: shortName?.toUpperCase().slice(0, 4), color },
      { new: true }
    ).lean();
    if (!team) return res.status(404).json({ success: false, error: "Team not found" });
    return res.json({ success: true, data: { ...team, _id: team._id.toString() } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to update team" });
  }
});

// DELETE /api/cricket/teams/:id
router.delete("/api/cricket/teams/:id", async (req: Request, res: Response) => {
  try {
    await CricketTeamModel.findByIdAndDelete(req.params.id);
    await CricketPlayerModel.deleteMany({ teamId: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete team" });
  }
});

// GET /api/cricket/teams/:id/players
router.get("/api/cricket/teams/:id/players", async (req: Request, res: Response) => {
  try {
    const players = await CricketPlayerModel.find({ teamId: req.params.id }).lean();
    return res.json({ success: true, data: players.map((p) => ({ ...p, _id: p._id.toString() })) });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch players" });
  }
});

// POST /api/cricket/teams/:id/players — add player
router.post("/api/cricket/teams/:id/players", async (req: Request, res: Response) => {
  try {
    const { name, role, battingStyle, bowlingStyle } = req.body;
    if (!name || !role) {
      return res.status(400).json({ success: false, error: "name and role are required" });
    }
    const player = await CricketPlayerModel.create({
      name,
      role: role as PlayerRole,
      battingStyle: (battingStyle as BattingStyle) || "RHB",
      bowlingStyle: (bowlingStyle as BowlingStyle) || "None",
      teamId: req.params.id,
    });
    return res.json({ success: true, data: { ...player.toObject(), _id: player._id.toString() } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to add player" });
  }
});

// POST /api/cricket/teams/:id/players/quick-add — paste 11 comma-separated names
router.post("/api/cricket/teams/:id/players/quick-add", async (req: Request, res: Response) => {
  try {
    const { names } = req.body; // array or comma-separated string
    let nameList: string[] = [];
    if (typeof names === "string") {
      nameList = names.split(",").map((n: string) => n.trim()).filter(Boolean);
    } else if (Array.isArray(names)) {
      nameList = names.map((n: string) => n.trim()).filter(Boolean);
    }
    if (nameList.length === 0) {
      return res.status(400).json({ success: false, error: "No names provided" });
    }
    const players = await CricketPlayerModel.insertMany(
      nameList.map((name) => ({
        name,
        role: "Batsman" as PlayerRole,
        battingStyle: "RHB" as BattingStyle,
        bowlingStyle: "None" as BowlingStyle,
        teamId: req.params.id,
      }))
    );
    return res.json({
      success: true,
      data: players.map((p) => ({ ...p.toObject(), _id: p._id.toString() })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to quick-add players" });
  }
});

// PUT /api/cricket/players/:id — update player
router.put("/api/cricket/players/:id", async (req: Request, res: Response) => {
  try {
    const { name, role, battingStyle, bowlingStyle } = req.body;
    const player = await CricketPlayerModel.findByIdAndUpdate(
      req.params.id,
      { name, role, battingStyle, bowlingStyle },
      { new: true }
    ).lean();
    if (!player) return res.status(404).json({ success: false, error: "Player not found" });
    return res.json({ success: true, data: { ...player, _id: player._id.toString() } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to update player" });
  }
});

// DELETE /api/cricket/players/:id
router.delete("/api/cricket/players/:id", async (req: Request, res: Response) => {
  try {
    await CricketPlayerModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete player" });
  }
});

export default router;
