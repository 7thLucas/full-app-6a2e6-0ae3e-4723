import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  getMatch,
  getBallEvents,
  addBallEvent,
  undoLastEvent,
  updateMatchStatus,
  getTeams,
} from "~/cricket/api.client";
import { computeInningState } from "~/cricket/engine/scorecard";
import type {
  IMatch, IBallEvent, IPlayer, InningState,
  ExtraType, DismissalType
} from "~/cricket/types";
import {
  TopBar, ScoreDisplay, BallDot, Card, Modal, SectionLabel, Spinner
} from "~/components/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScoringState {
  match: IMatch;
  events: IBallEvent[];
  players: IPlayer[];
  inningState: InningState;
}

const DISMISSAL_TYPES: DismissalType[] = [
  "Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired Hurt",
];

// Dismissals that DO credit the bowler
const BOWLER_CREDITED: DismissalType[] = ["Bowled", "Caught", "LBW", "Stumped", "Hit Wicket"];
// Dismissals that require a fielder
const FIELDER_REQUIRED: DismissalType[] = ["Caught", "Run Out", "Stumped"];

export default function ScoringPage() {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<ScoringState | null>(null);
  const [loading, setLoading] = useState(true);

  // Dismissal modal state
  const [showDismissal, setShowDismissal] = useState(false);
  const [pendingRuns, setPendingRuns] = useState(0);
  const [dismissalType, setDismissalType] = useState<DismissalType>("Bowled");
  const [dismissedBatsmanId, setDismissedBatsmanId] = useState<string>("");
  const [dismissalFielderId, setDismissalFielderId] = useState<string>("");

  // New batsman modal
  const [showNewBatsman, setShowNewBatsman] = useState(false);
  const [newBatsmanId, setNewBatsmanId] = useState("");

  // New bowler modal
  const [showNewBowler, setShowNewBowler] = useState(false);
  const [newBowlerId, setNewBowlerId] = useState("");

  // Over end modal
  const [showOverEnd, setShowOverEnd] = useState(false);

  // Inning end modal
  const [showInningEnd, setShowInningEnd] = useState(false);

  // Processing lock to prevent double-taps
  const processingRef = useRef(false);

  const load = useCallback(async () => {
    if (!matchId) return;
    try {
      const [match, events, teams] = await Promise.all([
        getMatch(matchId),
        getBallEvents(matchId),
        getTeams(),
      ]);

      const allPlayerIds = [...match.teamA.playingXI, ...match.teamB.playingXI];
      const allPlayers: IPlayer[] = teams.flatMap((t) =>
        (t.players ?? []).filter((p) => allPlayerIds.includes(p._id))
      );

      const inningState = computeInningState(events, match.currentInning, match, allPlayers);

      setState({ match, events, players: allPlayers, inningState });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { load(); }, [load]);

  if (loading || !state) {
    return <div className="min-h-screen bg-white"><Spinner /></div>;
  }

  const { match, events, players, inningState } = state;
  const currentInning = match.currentInning;

  // Current batting team's playing XI
  const battingTeam = inningState.battingTeamId === match.teamA.teamId ? match.teamA : match.teamB;
  const bowlingTeam = inningState.battingTeamId === match.teamA.teamId ? match.teamB : match.teamA;

  // Who has batted this inning (appeared in events)
  const battedIds = new Set(
    events
      .filter((e) => e.inning === currentInning)
      .flatMap((e) => [e.batsmanId, e.nonStrikerId])
  );

  const availableBatsmen = battingTeam.playingXI
    .map((pid) => players.find((p) => p._id === pid))
    .filter(Boolean)
    .filter((p) => {
      // Not out (not dismissed)
      const dismissed = inningState.battingStats.find((b) => b.playerId === p!._id && !b.isNotOut);
      return !dismissed;
    }) as IPlayer[];

  const availableBowlers = bowlingTeam.playingXI
    .map((pid) => players.find((p) => p._id === pid))
    .filter(Boolean) as IPlayer[];

  // Players not yet at crease (for new batsman)
  const unBattedAvailable = availableBatsmen.filter(
    (p) => p._id !== inningState.strikerId && p._id !== inningState.nonStrikerId
  );

  const playerName = (id: string | null) => {
    if (!id) return "—";
    return players.find((p) => p._id === id)?.name ?? "—";
  };

  // Current over events
  const currentOverEvents = events.filter(
    (e) => e.inning === currentInning && e.overNumber === inningState.overs
  );

  // ── Core ball recording ──────────────────────────────────────────────────

  const recordBall = async (
    runs: number,
    extraType: ExtraType = null,
    extraRuns = 0,
    dismissal: IBallEvent["dismissal"] = null
  ) => {
    if (!matchId || !inningState.strikerId || !inningState.currentBowlerId) return;
    if (processingRef.current) return;
    processingRef.current = true;

    const isLegal = extraType !== "wide" && extraType !== "no-ball";
    const legalBallsThisOver = currentOverEvents.filter((e) => e.isLegalDelivery).length;
    const ballNumber = isLegal ? legalBallsThisOver : legalBallsThisOver;
    const overNumber = inningState.overs;

    // Striker rotation:
    // - Odd runs → batsmen cross (strike changes)
    // - At over end (6th legal ball) → strike changes for non-wide/nb
    const runsTotal = runs + extraRuns;
    const strikeRotatesOnBall = runsTotal % 2 === 1;
    const isOverEnd = isLegal && legalBallsThisOver + 1 === 6;

    const newEvent: Omit<IBallEvent, "_id" | "matchId" | "globalBallIndex"> = {
      inning: currentInning,
      overNumber,
      ballNumber: isLegal ? legalBallsThisOver : legalBallsThisOver,
      batsmanId: inningState.strikerId,
      nonStrikerId: inningState.nonStrikerId ?? "",
      bowlerId: inningState.currentBowlerId,
      runs,
      extraType,
      extraRuns,
      isLegalDelivery: isLegal,
      dismissal,
    };

    try {
      const saved = await addBallEvent(matchId, newEvent);
      const newEvents = [...events, saved];
      const newInningState = computeInningState(newEvents, currentInning, match, players);

      setState((prev) => prev ? { ...prev, events: newEvents, inningState: newInningState } : prev);

      // Check inning end
      if (newInningState.isCompleted) {
        if (currentInning === 1) {
          setShowInningEnd(true);
        } else {
          await updateMatchStatus(matchId, { status: "completed" });
          navigate(`/matches/${matchId}/scorecard`);
        }
        processingRef.current = false;
        return;
      }

      // Check over end
      if (isOverEnd) {
        setShowOverEnd(true);
        processingRef.current = false;
        return;
      }

      // Check if wicket fell — need new batsman
      if (dismissal?.type) {
        setShowNewBatsman(true);
        processingRef.current = false;
        return;
      }

    } catch (err) {
      console.error(err);
      alert("Failed to record ball. Please try again.");
    } finally {
      processingRef.current = false;
    }
  };

  const handleUndo = async () => {
    if (!matchId || processingRef.current) return;
    processingRef.current = true;
    try {
      await undoLastEvent(matchId, currentInning);
      const newEvents = events.slice(0, -1);
      const newInningState = computeInningState(newEvents, currentInning, match, players);
      setState((prev) => prev ? { ...prev, events: newEvents, inningState: newInningState } : prev);
    } catch {
      alert("Nothing to undo.");
    } finally {
      processingRef.current = false;
    }
  };

  // ── Run buttons ───────────────────────────────────────────────────────────
  const handleRun = (runs: number) => recordBall(runs);

  // ── Extra buttons ─────────────────────────────────────────────────────────
  const handleWide = () => recordBall(0, "wide", 1);
  const handleNoBall = () => recordBall(0, "no-ball", 1);
  const handleBye = (runs: number) => recordBall(0, "bye", runs);
  const handleLegBye = (runs: number) => recordBall(0, "leg-bye", runs);

  // ── Wicket ────────────────────────────────────────────────────────────────
  const handleWicket = (runs = 0) => {
    setPendingRuns(runs);
    setDismissedBatsmanId(inningState.strikerId ?? "");
    setDismissalType("Bowled");
    setDismissalFielderId("");
    setShowDismissal(true);
  };

  const confirmDismissal = () => {
    const needsBowler = BOWLER_CREDITED.includes(dismissalType);
    const needsFielder = FIELDER_REQUIRED.includes(dismissalType);

    recordBall(pendingRuns, null, 0, {
      type: dismissalType,
      batsmanId: dismissedBatsmanId,
      bowlerId: needsBowler ? (inningState.currentBowlerId ?? null) : null,
      fielderId: needsFielder && dismissalFielderId ? dismissalFielderId : null,
    });
    setShowDismissal(false);
    if (unBattedAvailable.length > 0) setShowNewBatsman(true);
  };

  const confirmNewBatsman = () => {
    if (!newBatsmanId) return;
    // Update striker in the next event — just close modal
    // The engine will pick up the new batsman from the events
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        inningState: {
          ...prev.inningState,
          strikerId: newBatsmanId,
        },
      };
    });
    setNewBatsmanId("");
    setShowNewBatsman(false);
  };

  const confirmNewBowler = () => {
    if (!newBowlerId) return;
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        inningState: {
          ...prev.inningState,
          currentBowlerId: newBowlerId,
          // Rotate strike at over end
          strikerId: prev.inningState.nonStrikerId,
          nonStrikerId: prev.inningState.strikerId,
        },
      };
    });
    setNewBowlerId("");
    setShowOverEnd(false);
    setShowNewBowler(false);
  };

  const handleStartSecondInning = async () => {
    await updateMatchStatus(matchId!, { status: "second_innings", currentInning: 2 });
    // Reload full state for inning 2
    const updatedMatch = { ...match, currentInning: 2 as const, status: "second_innings" as const };
    const newInningState = computeInningState(events, 2, updatedMatch, players);
    setState((prev) => prev ? { ...prev, match: updatedMatch, inningState: newInningState } : prev);
    setShowInningEnd(false);
    // Need to set up strike and bowler for inning 2
    setShowNewBatsman(true);
  };

  const isMatchCompleted = match.status === "completed";

  // ── Target chase display ──────────────────────────────────────────────────
  const inning1State = currentInning === 2
    ? computeInningState(events, 1, match, players)
    : null;
  const target = inning1State ? inning1State.totalRuns + 1 : null;
  const needed = target ? target - inningState.totalRuns : null;

  return (
    <div className="min-h-screen bg-white pb-24">
      <TopBar
        title={`${match.teamA.teamShortName} vs ${match.teamB.teamShortName}`}
        onBack={() => navigate("/matches")}
        right={
          <Link
            to={`/matches/${matchId}/scorecard`}
            className="text-white/80 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10"
          >
            Card
          </Link>
        }
      />

      {/* Inning indicator */}
      <div className="bg-[#166534]/5 border-b border-[#e2e8f0] px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-[#166534] uppercase tracking-wider">
          {currentInning === 1 ? "1st" : "2nd"} Innings — {battingTeam.teamName} batting
        </span>
        {currentInning === 2 && target !== null && (
          <span className="text-xs font-semibold text-[#f59e0b]">
            Target: {target} · Need {needed} more
          </span>
        )}
      </div>

      {/* Score hero */}
      <div className="bg-white px-4 py-6 border-b border-[#e2e8f0]">
        <ScoreDisplay
          runs={inningState.totalRuns}
          wickets={inningState.wickets}
          overs={inningState.overs}
          balls={inningState.balls}
          totalOvers={match.totalOvers}
        />

        {/* Current batsmen */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#166534] mb-1">
              Striker *
            </p>
            <p className="font-bold text-[#0f172a] text-sm truncate">
              {playerName(inningState.strikerId)}
            </p>
            {inningState.battingStats.find((b) => b.playerId === inningState.strikerId) && (
              <p className="text-xs text-[#64748b]">
                {inningState.battingStats.find((b) => b.playerId === inningState.strikerId)?.runs ?? 0}
                ({inningState.battingStats.find((b) => b.playerId === inningState.strikerId)?.balls ?? 0})
              </p>
            )}
          </div>
          <div className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#64748b] mb-1">
              Non-Striker
            </p>
            <p className="font-semibold text-[#0f172a] text-sm truncate">
              {playerName(inningState.nonStrikerId)}
            </p>
            {inningState.battingStats.find((b) => b.playerId === inningState.nonStrikerId) && (
              <p className="text-xs text-[#64748b]">
                {inningState.battingStats.find((b) => b.playerId === inningState.nonStrikerId)?.runs ?? 0}
                ({inningState.battingStats.find((b) => b.playerId === inningState.nonStrikerId)?.balls ?? 0})
              </p>
            )}
          </div>
        </div>

        {/* Current bowler */}
        <div className="mt-3 bg-[#fff8ed] border border-[#fed7aa] rounded-xl p-3 flex items-center gap-2">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#c2410c]">Bowling</p>
          <p className="flex-1 font-semibold text-[#0f172a] text-sm truncate">
            {playerName(inningState.currentBowlerId)}
          </p>
          {inningState.bowlingStats.find((b) => b.playerId === inningState.currentBowlerId) && (() => {
            const bs = inningState.bowlingStats.find((b) => b.playerId === inningState.currentBowlerId)!;
            return (
              <p className="text-xs text-[#64748b]">{bs.overs}.{bs.balls} ov · {bs.runs} runs · {bs.wickets}W</p>
            );
          })()}
        </div>

        {/* This over */}
        <div className="mt-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
            This Over ({inningState.overs}.{inningState.balls})
          </p>
          <div className="flex gap-2 flex-wrap">
            {currentOverEvents.length === 0 ? (
              <span className="text-xs text-[#94a3b8]">No balls yet</span>
            ) : (
              currentOverEvents.map((e) => (
                <BallDot key={e._id} event={e} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Scoring buttons */}
      {!isMatchCompleted && (
        <div className="px-4 pt-5">
          {/* Need to set striker/bowler first */}
          {(!inningState.strikerId || !inningState.nonStrikerId || !inningState.currentBowlerId) && (
            <div className="mb-4 p-4 bg-[#fff8ed] border border-[#fed7aa] rounded-2xl">
              {!inningState.strikerId || !inningState.nonStrikerId ? (
                <div>
                  <p className="font-semibold text-[#c2410c] text-sm mb-3">Select opening batsmen</p>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-[#64748b] font-medium">Striker</p>
                    <div className="flex flex-wrap gap-2">
                      {availableBatsmen.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => setState((prev) => prev ? { ...prev, inningState: { ...prev.inningState, strikerId: p._id } } : prev)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 ${inningState.strikerId === p._id ? "border-[#166534] bg-[#166534] text-white" : "border-[#e2e8f0] bg-white"}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#64748b] font-medium mt-2">Non-Striker</p>
                    <div className="flex flex-wrap gap-2">
                      {availableBatsmen.filter((p) => p._id !== inningState.strikerId).map((p) => (
                        <button
                          key={p._id}
                          onClick={() => setState((prev) => prev ? { ...prev, inningState: { ...prev.inningState, nonStrikerId: p._id } } : prev)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 ${inningState.nonStrikerId === p._id ? "border-[#166534] bg-[#166534] text-white" : "border-[#e2e8f0] bg-white"}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {!inningState.currentBowlerId && inningState.strikerId && inningState.nonStrikerId && (
                <div>
                  <p className="font-semibold text-[#c2410c] text-sm mb-3">Select opening bowler</p>
                  <div className="flex flex-wrap gap-2">
                    {availableBowlers.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => setState((prev) => prev ? { ...prev, inningState: { ...prev.inningState, currentBowlerId: p._id } } : prev)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 ${inningState.currentBowlerId === p._id ? "border-[#f59e0b] bg-[#f59e0b] text-white" : "border-[#e2e8f0] bg-white"}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {inningState.strikerId && inningState.nonStrikerId && inningState.currentBowlerId && (
            <>
              {/* Run buttons */}
              <SectionLabel>Runs</SectionLabel>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[0, 1, 2, 3, 4, 6].slice(0, 5).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRun(r)}
                    className="min-h-[56px] rounded-2xl bg-[#f8fafc] border-2 border-[#e2e8f0] text-xl font-black text-[#0f172a] active:scale-95 active:bg-[#e2e8f0] transition-transform"
                  >
                    {r}
                  </button>
                ))}
                <button
                  onClick={() => handleRun(6)}
                  className="min-h-[56px] rounded-2xl bg-[#166534] border-2 border-[#166534] text-xl font-black text-white active:scale-95 transition-transform"
                >
                  6
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => handleRun(4)}
                  className="min-h-[52px] rounded-2xl bg-blue-500 border-2 border-blue-500 text-lg font-black text-white active:scale-95 transition-transform"
                >
                  FOUR
                </button>
                <button
                  onClick={() => handleWicket()}
                  className="min-h-[52px] rounded-2xl bg-[#ef4444] border-2 border-[#ef4444] text-lg font-black text-white active:scale-95 transition-transform"
                >
                  WICKET
                </button>
              </div>

              {/* Extras */}
              <SectionLabel>Extras</SectionLabel>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                  onClick={handleWide}
                  className="min-h-[48px] rounded-xl bg-amber-50 border-2 border-amber-200 text-sm font-bold text-amber-800 active:scale-95 transition-transform"
                >
                  Wide
                </button>
                <button
                  onClick={handleNoBall}
                  className="min-h-[48px] rounded-xl bg-amber-50 border-2 border-amber-200 text-sm font-bold text-amber-800 active:scale-95 transition-transform"
                >
                  No Ball
                </button>
                <button
                  onClick={() => handleBye(1)}
                  className="min-h-[48px] rounded-xl bg-[#f8fafc] border-2 border-[#e2e8f0] text-sm font-bold text-[#64748b] active:scale-95 transition-transform"
                >
                  Bye
                </button>
                <button
                  onClick={() => handleLegBye(1)}
                  className="min-h-[48px] rounded-xl bg-[#f8fafc] border-2 border-[#e2e8f0] text-sm font-bold text-[#64748b] active:scale-95 transition-transform"
                >
                  Leg Bye
                </button>
              </div>
            </>
          )}

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={events.filter((e) => e.inning === currentInning).length === 0}
            className="w-full min-h-[52px] rounded-2xl border-2 border-[#ef4444] text-[#ef4444] font-bold text-sm bg-white active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            Undo Last Ball
          </button>
        </div>
      )}

      {/* Match completed banner */}
      {isMatchCompleted && (
        <div className="px-4 pt-6 text-center">
          <Card className="p-6">
            <p className="text-2xl font-black text-[#166534] mb-2">Match Complete!</p>
            <Link
              to={`/matches/${matchId}/scorecard`}
              className="inline-block min-h-[52px] px-8 py-3 rounded-2xl bg-[#166534] text-white font-bold text-sm"
            >
              View Full Scorecard
            </Link>
          </Card>
        </div>
      )}

      {/* Dismissal Modal */}
      <Modal open={showDismissal} onClose={() => setShowDismissal(false)} title="How out?">
        <div className="flex flex-col gap-4">
          <div>
            <SectionLabel>Dismissal Type</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {DISMISSAL_TYPES.map((dt) => (
                <button
                  key={dt}
                  onClick={() => setDismissalType(dt)}
                  className={`min-h-[44px] rounded-xl px-3 text-sm font-semibold border-2 transition-all ${dismissalType === dt ? "border-[#ef4444] bg-[#fef2f2] text-[#ef4444]" : "border-[#e2e8f0] bg-white text-[#0f172a]"}`}
                >
                  {dt}
                </button>
              ))}
            </div>
          </div>

          {/* Who got out (if run out — either batsman) */}
          {dismissalType === "Run Out" && (
            <div>
              <SectionLabel>Batsman Out</SectionLabel>
              <div className="flex gap-2">
                {[inningState.strikerId, inningState.nonStrikerId].filter(Boolean).map((pid) => (
                  <button
                    key={pid}
                    onClick={() => setDismissedBatsmanId(pid!)}
                    className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold border-2 ${dismissedBatsmanId === pid ? "border-[#ef4444] bg-[#fef2f2] text-[#ef4444]" : "border-[#e2e8f0] bg-white"}`}
                  >
                    {playerName(pid!)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fielder for Caught / Run Out / Stumped */}
          {FIELDER_REQUIRED.includes(dismissalType) && (
            <div>
              <SectionLabel>Fielder / Wicketkeeper</SectionLabel>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {availableBowlers.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => setDismissalFielderId(p._id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 ${dismissalFielderId === p._id ? "border-[#166534] bg-[#166534] text-white" : "border-[#e2e8f0] bg-white"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={confirmDismissal}
            className="w-full min-h-[52px] rounded-2xl bg-[#ef4444] text-white font-bold text-sm"
          >
            Confirm Wicket
          </button>
        </div>
      </Modal>

      {/* New Batsman Modal */}
      <Modal open={showNewBatsman} onClose={() => {}} title="Select Next Batsman">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[#64748b]">Wicket fell! Who comes in next?</p>
          {unBattedAvailable.length === 0 ? (
            <p className="text-sm text-[#ef4444] font-medium">No batsmen remaining — inning over!</p>
          ) : (
            unBattedAvailable.map((p) => (
              <button
                key={p._id}
                onClick={() => setNewBatsmanId(p._id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${newBatsmanId === p._id ? "border-[#166534] bg-[#f0fdf4]" : "border-[#e2e8f0] bg-white"}`}
              >
                <p className="font-semibold text-[#0f172a]">{p.name}</p>
              </button>
            ))
          )}
          <button
            onClick={confirmNewBatsman}
            disabled={!newBatsmanId && unBattedAvailable.length > 0}
            className="w-full min-h-[52px] rounded-2xl bg-[#166534] text-white font-bold text-sm disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </Modal>

      {/* Over End Modal */}
      <Modal open={showOverEnd} onClose={() => {}} title="Over Complete!">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[#64748b]">
            Over {inningState.overs} complete. Select the next bowler.
          </p>
          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
            {availableBowlers.filter((p) => p._id !== inningState.currentBowlerId).map((p) => (
              <button
                key={p._id}
                onClick={() => setNewBowlerId(p._id)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 ${newBowlerId === p._id ? "border-[#f59e0b] bg-[#f59e0b] text-white" : "border-[#e2e8f0] bg-white"}`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button
            onClick={confirmNewBowler}
            disabled={!newBowlerId}
            className="w-full min-h-[52px] rounded-2xl bg-[#166534] text-white font-bold text-sm disabled:opacity-40"
          >
            Start Next Over
          </button>
        </div>
      </Modal>

      {/* Inning End Modal */}
      <Modal open={showInningEnd} onClose={() => {}} title="First Innings Complete!">
        <div className="flex flex-col gap-4 text-center">
          <p className="text-3xl font-black text-[#166534]">
            {match.teamA.tossDecision === "bat" || match.tossWonByTeamId === match.teamA.teamId && match.tossDecision === "bat"
              ? match.teamA.teamShortName
              : match.teamB.teamShortName} scored {inningState.totalRuns}/{inningState.wickets}
          </p>
          <p className="text-sm text-[#64748b]">
            {inningState.overs}.{inningState.balls} overs
          </p>
          <p className="text-base font-bold text-[#0f172a]">
            Target: {inningState.totalRuns + 1}
          </p>
          <button
            onClick={handleStartSecondInning}
            className="w-full min-h-[52px] rounded-2xl bg-[#f59e0b] text-white font-bold"
          >
            Start 2nd Innings
          </button>
          <Link
            to={`/matches/${matchId}/scorecard`}
            className="text-sm text-[#64748b] underline"
          >
            View Scorecard
          </Link>
        </div>
      </Modal>
    </div>
  );
}
