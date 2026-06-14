/**
 * Scorecard Engine — all stats derived dynamically from ball events.
 * No totals are ever stored; everything is computed on read.
 */
import type {
  IBallEvent,
  IMatch,
  IPlayer,
  InningState,
  BattingStats,
  BowlingStats,
} from "../types";

export function computeInningState(
  events: IBallEvent[],
  inning: 1 | 2,
  match: IMatch,
  players: IPlayer[]
): InningState {
  const inningEvents = events
    .filter((e) => e.inning === inning)
    .sort((a, b) => a.globalBallIndex - b.globalBallIndex);

  const battingTeamId =
    inning === 1
      ? match.tossDecision === "bat"
        ? match.teamA.teamId
        : match.teamB.teamId
      : match.tossDecision === "bat"
      ? match.teamB.teamId
      : match.teamA.teamId;

  const bowlingTeamId =
    battingTeamId === match.teamA.teamId ? match.teamB.teamId : match.teamA.teamId;

  const playerById = (id: string) => players.find((p) => p._id === id);
  const playerName = (id: string) => playerById(id)?.name ?? "Unknown";

  // ── Batting stats
  const battingMap = new Map<string, BattingStats>();

  const initBatter = (id: string) => {
    if (!battingMap.has(id)) {
      battingMap.set(id, {
        playerId: id,
        playerName: playerName(id),
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        dismissal: null,
        dismissedBy: null,
        isNotOut: true,
      });
    }
    return battingMap.get(id)!;
  };

  // ── Bowling stats
  const bowlingMap = new Map<string, { runs: number; legalBalls: number; wickets: number; overBalls: Map<number, number[]> }>();

  const initBowler = (id: string) => {
    if (!bowlingMap.has(id)) {
      bowlingMap.set(id, { runs: 0, legalBalls: 0, wickets: 0, overBalls: new Map() });
    }
    return bowlingMap.get(id)!;
  };

  let totalRuns = 0;
  let wickets = 0;
  let extras = 0;
  let legalBalls = 0;
  let currentOverNumber = 0;

  const fallOfWickets: InningState["fallOfWickets"] = [];

  let strikerId: string | null = null;
  let nonStrikerId: string | null = null;
  let currentBowlerId: string | null = null;

  for (const event of inningEvents) {
    // Track who is at crease
    strikerId = event.batsmanId;
    nonStrikerId = event.nonStrikerId;
    currentBowlerId = event.bowlerId;

    const batter = initBatter(event.batsmanId);
    initBatter(event.nonStrikerId);
    const bowler = initBowler(event.bowlerId);

    // Runs scored off bat
    const totalEventRuns = event.runs + event.extraRuns;
    totalRuns += totalEventRuns;

    // Bowling runs (extras go to bowler too except byes/leg-byes)
    const bowlerRuns =
      event.extraType === "bye" || event.extraType === "leg-bye"
        ? event.runs
        : totalEventRuns;
    bowler.runs += bowlerRuns;

    // Batting
    if (!["wide", "no-ball"].includes(event.extraType ?? "")) {
      // Byes and leg-byes don't count to batter
      if (!event.extraType || event.extraType === null) {
        batter.runs += event.runs;
        if (event.runs === 4) batter.fours++;
        if (event.runs === 6) batter.sixes++;
      }
    }
    // Wide: no ball faced for batter
    if (event.isLegalDelivery) {
      batter.balls++;
      bowler.legalBalls++;
      legalBalls++;
    }

    // Track over-level bowling data
    if (!bowler.overBalls.has(event.overNumber)) {
      bowler.overBalls.set(event.overNumber, []);
    }
    bowler.overBalls.get(event.overNumber)!.push(bowlerRuns);

    // Extras
    if (event.extraType) extras += event.extraRuns;

    // Dismissal
    if (event.dismissal && event.dismissal.type) {
      const dismissedId = event.dismissal.batsmanId ?? event.batsmanId;
      const dismissedBatter = initBatter(dismissedId);
      dismissedBatter.dismissal = event.dismissal.type;
      dismissedBatter.isNotOut = false;
      if (event.dismissal.bowlerId) {
        dismissedBatter.dismissedBy = playerName(event.dismissal.bowlerId);
      }
      wickets++;
      bowler.wickets++;
      currentOverNumber = event.overNumber;
      fallOfWickets.push({
        wicket: wickets,
        score: totalRuns,
        playerId: dismissedId,
        playerName: playerName(dismissedId),
      });
    }

    // Over rotation
    if (event.isLegalDelivery) {
      currentOverNumber = event.overNumber;
    }
  }

  // Compute overs
  const fullOvers = Math.floor(legalBalls / 6);
  const remainderBalls = legalBalls % 6;

  // Finalize strike rates
  for (const b of battingMap.values()) {
    b.strikeRate = b.balls > 0 ? Math.round((b.runs / b.balls) * 100 * 10) / 10 : 0;
  }

  // Build bowling stats
  const bowlingStats: BowlingStats[] = [];
  for (const [id, data] of bowlingMap.entries()) {
    const fullBowlerOvers = Math.floor(data.legalBalls / 6);
    const extraBalls = data.legalBalls % 6;
    const totalBowlerOvers = fullBowlerOvers + extraBalls / 10;
    const economy =
      data.legalBalls > 0
        ? Math.round((data.runs / (data.legalBalls / 6)) * 100) / 100
        : 0;

    // Count maidens
    let maidens = 0;
    for (const [, overRuns] of data.overBalls.entries()) {
      const totalOverRuns = overRuns.reduce((a, b) => a + b, 0);
      if (overRuns.length === 6 && totalOverRuns === 0) maidens++;
    }

    bowlingStats.push({
      playerId: id,
      playerName: playerName(id),
      overs: fullBowlerOvers,
      balls: extraBalls,
      runs: data.runs,
      wickets: data.wickets,
      economy,
      maidens,
    });
  }

  // Batting order preserved
  const battingStats: BattingStats[] = [...battingMap.values()];

  // Determine if inning is complete
  const battingTeam =
    battingTeamId === match.teamA.teamId ? match.teamA : match.teamB;
  const maxWickets = battingTeam.playingXI.length - 1;
  const isCompleted =
    wickets >= maxWickets || fullOvers >= match.totalOvers;

  return {
    inning,
    battingTeamId,
    bowlingTeamId,
    totalRuns,
    wickets,
    overs: fullOvers,
    balls: remainderBalls,
    extras,
    strikerId,
    nonStrikerId,
    currentBowlerId,
    isCompleted,
    battingStats,
    bowlingStats,
    fallOfWickets,
  };
}

export function getOversString(overs: number, balls: number): string {
  return `${overs}.${balls}`;
}

export function formatEconomy(economy: number): string {
  return economy.toFixed(2);
}
