// ─── Player / Team domain types ────────────────────────────────────────────

export type PlayerRole = "Batsman" | "Bowler" | "All-Rounder" | "Wicketkeeper";
export type BattingStyle = "RHB" | "LHB";
export type BowlingStyle =
  | "Fast"
  | "Medium-Fast"
  | "Medium"
  | "Off-Spin"
  | "Leg-Spin"
  | "Slow Left-Arm"
  | "None";

export interface IPlayer {
  _id: string;
  name: string;
  role: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  teamId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITeam {
  _id: string;
  name: string;
  shortName: string;
  color: string;
  players: IPlayer[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Match types ────────────────────────────────────────────────────────────

export type TossResult = "bat" | "bowl";
export type InningStatus = "not_started" | "in_progress" | "completed";
export type MatchStatus = "setup" | "first_innings" | "second_innings" | "completed";

export interface IMatchTeamSetup {
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamColor: string;
  playingXI: string[]; // player IDs
  captainId: string;
  wicketkeeperId: string;
}

export interface IMatch {
  _id: string;
  teamA: IMatchTeamSetup;
  teamB: IMatchTeamSetup;
  tossWonByTeamId: string;
  tossDecision: TossResult;
  totalOvers: number;
  status: MatchStatus;
  currentInning: 1 | 2;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Ball event types (event-sourcing) ─────────────────────────────────────

export type ExtraType = "wide" | "no-ball" | "bye" | "leg-bye" | "penalty" | null;
export type DismissalType =
  | "Bowled"
  | "Caught"
  | "LBW"
  | "Run Out"
  | "Stumped"
  | "Hit Wicket"
  | "Retired Hurt"
  | null;

export interface IBallEvent {
  _id: string;
  matchId: string;
  inning: 1 | 2;
  overNumber: number;       // 0-indexed
  ballNumber: number;       // 0-indexed legal ball in over (0-5)
  globalBallIndex: number;  // total event index (for ordering / undo)
  batsmanId: string;        // striker
  nonStrikerId: string;
  bowlerId: string;
  runs: number;             // runs off the bat
  extraType: ExtraType;
  extraRuns: number;        // extra runs (1 for wide/no-ball, penalty amount, etc.)
  isLegalDelivery: boolean; // false for wide / no-ball
  dismissal: {
    type: DismissalType;
    batsmanId: string | null;
    bowlerId: string | null;
    fielderId: string | null;
  } | null;
  createdAt?: string;
}

// ─── Computed stat types (derived from events) ──────────────────────────────

export interface BattingStats {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal: DismissalType;
  dismissedBy: string | null;  // bowler name
  isNotOut: boolean;
}

export interface BowlingStats {
  playerId: string;
  playerName: string;
  overs: number;        // full overs
  balls: number;        // extra balls beyond full overs
  runs: number;
  wickets: number;
  economy: number;
  maidens: number;
}

export interface InningState {
  inning: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: number;
  strikerId: string | null;
  nonStrikerId: string | null;
  currentBowlerId: string | null;
  isCompleted: boolean;
  battingStats: BattingStats[];
  bowlingStats: BowlingStats[];
  fallOfWickets: { wicket: number; score: number; playerId: string; playerName: string }[];
}
