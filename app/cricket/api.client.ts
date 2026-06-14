/**
 * Cricket API client — all fetch calls from the browser to our Express routes.
 */
import type { IBallEvent, IMatch, IPlayer, ITeam } from "./types";

const BASE = "/api/cricket";

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "API error");
  return json.data as T;
}

// ── Teams ────────────────────────────────────────────────────────────────────

export const getTeams = () => req<ITeam[]>(`${BASE}/teams`);

export const createTeam = (body: { name: string; shortName: string; color: string }) =>
  req<ITeam>(`${BASE}/teams`, { method: "POST", body: JSON.stringify(body) });

export const updateTeam = (id: string, body: Partial<{ name: string; shortName: string; color: string }>) =>
  req<ITeam>(`${BASE}/teams/${id}`, { method: "PUT", body: JSON.stringify(body) });

export const deleteTeam = (id: string) =>
  req<void>(`${BASE}/teams/${id}`, { method: "DELETE" });

// ── Players ─────────────────────────────────────────────────────────────────

export const getPlayers = (teamId: string) =>
  req<IPlayer[]>(`${BASE}/teams/${teamId}/players`);

export const createPlayer = (
  teamId: string,
  body: { name: string; role: string; battingStyle: string; bowlingStyle: string }
) => req<IPlayer>(`${BASE}/teams/${teamId}/players`, { method: "POST", body: JSON.stringify(body) });

export const quickAddPlayers = (teamId: string, names: string[]) =>
  req<IPlayer[]>(`${BASE}/teams/${teamId}/players/quick-add`, {
    method: "POST",
    body: JSON.stringify({ names }),
  });

export const updatePlayer = (
  playerId: string,
  body: Partial<{ name: string; role: string; battingStyle: string; bowlingStyle: string }>
) => req<IPlayer>(`${BASE}/players/${playerId}`, { method: "PUT", body: JSON.stringify(body) });

export const deletePlayer = (playerId: string) =>
  req<void>(`${BASE}/players/${playerId}`, { method: "DELETE" });

// ── Matches ──────────────────────────────────────────────────────────────────

export const getMatches = () => req<IMatch[]>(`${BASE}/matches`);

export const createMatch = (body: Omit<IMatch, "_id" | "status" | "currentInning" | "createdAt" | "updatedAt">) =>
  req<IMatch>(`${BASE}/matches`, { method: "POST", body: JSON.stringify(body) });

export const getMatch = (id: string) => req<IMatch>(`${BASE}/matches/${id}`);

export const updateMatchStatus = (
  id: string,
  body: { status: string; currentInning?: number }
) =>
  req<IMatch>(`${BASE}/matches/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteMatch = (id: string) =>
  req<void>(`${BASE}/matches/${id}`, { method: "DELETE" });

// ── Ball Events ───────────────────────────────────────────────────────────────

export const getBallEvents = (matchId: string) =>
  req<IBallEvent[]>(`${BASE}/matches/${matchId}/events`);

export const addBallEvent = (matchId: string, event: Omit<IBallEvent, "_id" | "matchId" | "globalBallIndex">) =>
  req<IBallEvent>(`${BASE}/matches/${matchId}/events`, {
    method: "POST",
    body: JSON.stringify(event),
  });

export const undoLastEvent = (matchId: string, inning: number) =>
  req<IBallEvent>(`${BASE}/matches/${matchId}/events/last?inning=${inning}`, {
    method: "DELETE",
  });

// ── Scorecard ─────────────────────────────────────────────────────────────────

export const getScorecard = (matchId: string) =>
  req<{ match: IMatch; inning1: unknown; inning2: unknown | null }>(
    `${BASE}/matches/${matchId}/scorecard`
  );
