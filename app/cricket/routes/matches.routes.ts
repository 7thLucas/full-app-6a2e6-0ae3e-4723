import { Router, type Request, type Response } from "express";
import { CricketMatchModel } from "../models/match.model";
import { CricketBallEventModel } from "../models/ball-event.model";
import { CricketPlayerModel } from "../models/team.model";
import { computeInningState } from "../engine/scorecard";
import type { IBallEvent, IMatch, IPlayer } from "../types";

const router = Router();

// GET /api/cricket/matches
router.get("/api/cricket/matches", async (_req: Request, res: Response) => {
  try {
    const matches = await CricketMatchModel.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: matches.map(m => ({ ...m, _id: m._id.toString() })) });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch matches" });
  }
});

// POST /api/cricket/matches — create match
router.post("/api/cricket/matches", async (req: Request, res: Response) => {
  try {
    const { teamA, teamB, tossWonByTeamId, tossDecision, totalOvers } = req.body;
    const match = await CricketMatchModel.create({
      teamA,
      teamB,
      tossWonByTeamId,
      tossDecision,
      totalOvers: totalOvers || 20,
      status: "first_innings",
      currentInning: 1,
    });
    return res.json({ success: true, data: { ...match.toObject(), _id: match._id.toString() } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to create match" });
  }
});

// GET /api/cricket/matches/:id
router.get("/api/cricket/matches/:id", async (req: Request, res: Response) => {
  try {
    const match = await CricketMatchModel.findById(req.params.id).lean();
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });
    return res.json({ success: true, data: { ...match, _id: match._id.toString() } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch match" });
  }
});

// PATCH /api/cricket/matches/:id/status
router.patch("/api/cricket/matches/:id/status", async (req: Request, res: Response) => {
  try {
    const { status, currentInning } = req.body;
    const match = await CricketMatchModel.findByIdAndUpdate(
      req.params.id,
      { status, ...(currentInning !== undefined ? { currentInning } : {}) },
      { new: true }
    ).lean();
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });
    return res.json({ success: true, data: { ...match, _id: match._id.toString() } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to update match status" });
  }
});

// DELETE /api/cricket/matches/:id
router.delete("/api/cricket/matches/:id", async (req: Request, res: Response) => {
  try {
    await CricketMatchModel.findByIdAndDelete(req.params.id);
    await CricketBallEventModel.deleteMany({ matchId: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete match" });
  }
});

// GET /api/cricket/matches/:id/events — get all ball events for a match
router.get("/api/cricket/matches/:id/events", async (req: Request, res: Response) => {
  try {
    const events = await CricketBallEventModel.find({ matchId: req.params.id })
      .sort({ globalBallIndex: 1 })
      .lean();
    return res.json({ success: true, data: events.map(e => ({ ...e, _id: e._id.toString() })) });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
});

// POST /api/cricket/matches/:id/events — add a ball event
router.post("/api/cricket/matches/:id/events", async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const eventData = req.body;

    // Get next globalBallIndex
    const lastEvent = await CricketBallEventModel.findOne({ matchId })
      .sort({ globalBallIndex: -1 })
      .lean();
    const globalBallIndex = lastEvent ? lastEvent.globalBallIndex + 1 : 0;

    const event = await CricketBallEventModel.create({
      ...eventData,
      matchId,
      globalBallIndex,
    });

    return res.json({ success: true, data: { ...event.toObject(), _id: event._id.toString() } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to add event" });
  }
});

// DELETE /api/cricket/matches/:id/events/last — undo last event
router.delete("/api/cricket/matches/:id/events/last", async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const inning = req.query.inning ? Number(req.query.inning) : undefined;

    const query: Record<string, unknown> = { matchId };
    if (inning !== undefined) query.inning = inning;

    const lastEvent = await CricketBallEventModel.findOne(query)
      .sort({ globalBallIndex: -1 })
      .lean();

    if (!lastEvent) {
      return res.status(404).json({ success: false, error: "No events to undo" });
    }

    await CricketBallEventModel.findByIdAndDelete(lastEvent._id);

    return res.json({ success: true, data: { ...lastEvent, _id: lastEvent._id.toString() } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to undo event" });
  }
});

// GET /api/cricket/matches/:id/scorecard — computed scorecard for all innings
router.get("/api/cricket/matches/:id/scorecard", async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const match = await CricketMatchModel.findById(matchId).lean();
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });

    const events = await CricketBallEventModel.find({ matchId })
      .sort({ globalBallIndex: 1 })
      .lean();

    // Gather all player IDs from both teams
    const allPlayerIds = [
      ...match.teamA.playingXI,
      ...match.teamB.playingXI,
    ];
    const players = await CricketPlayerModel.find({
      _id: { $in: allPlayerIds },
    }).lean();

    const playerDTOs: IPlayer[] = players.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      role: p.role,
      battingStyle: p.battingStyle,
      bowlingStyle: p.bowlingStyle,
      teamId: p.teamId,
    }));

    const matchDTO: IMatch = {
      _id: match._id.toString(),
      teamA: match.teamA,
      teamB: match.teamB,
      tossWonByTeamId: match.tossWonByTeamId,
      tossDecision: match.tossDecision,
      totalOvers: match.totalOvers,
      status: match.status,
      currentInning: match.currentInning,
    };

    const eventDTOs: IBallEvent[] = events.map((e) => ({
      _id: e._id.toString(),
      matchId: e.matchId,
      inning: e.inning as 1 | 2,
      overNumber: e.overNumber,
      ballNumber: e.ballNumber,
      globalBallIndex: e.globalBallIndex,
      batsmanId: e.batsmanId,
      nonStrikerId: e.nonStrikerId,
      bowlerId: e.bowlerId,
      runs: e.runs,
      extraType: e.extraType,
      extraRuns: e.extraRuns,
      isLegalDelivery: e.isLegalDelivery,
      dismissal: e.dismissal as IBallEvent["dismissal"],
    }));

    const inning1 = computeInningState(eventDTOs, 1, matchDTO, playerDTOs);
    const inning2 = match.currentInning === 2 || match.status === "completed"
      ? computeInningState(eventDTOs, 2, matchDTO, playerDTOs)
      : null;

    return res.json({
      success: true,
      data: {
        match: matchDTO,
        inning1,
        inning2,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Failed to compute scorecard" });
  }
});

export default router;
