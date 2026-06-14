# Cricket Scorer Pro — Product Overview
*(Working name — pending user confirmation)*

## What It Is
Cricket Scorer Pro is a production-grade, mobile-first cricket scoring application for local, amateur, and community cricket teams. It enables any group to define custom teams and players, run professional ball-by-ball match scoring, and generate accurate real player statistics — all persisted locally on-device with zero cloud dependency.

## The Core Problem
Local and amateur cricket teams play serious cricket but have no serious, flexible scoring tool. Existing apps either:
- Target professional leagues only — rigid, pre-set team databases, no custom rosters
- Are too lightweight — missing correct extras accounting, no player stats, no undo
- Force a full restart when the scorer makes a single mistake

The result: scorecards are inaccurate, player stats are unreliable, and the scoring experience is frustrating for every team manager, scorer, and captain.

## Who Uses It
This is a personal passion project — built from the heart, for the builder's own local cricket group. The people who use it are friends who play pickup cricket together, not a commercial audience.

- **Primary user — the builder / scorer**: One of the players in the group who runs the matches and keeps score; needs to spin up fresh teams quickly each match day and capture every ball accurately
- **Secondary user — fellow players in the group**: Benefit from seeing their own stats and an accurate scorecard after the game; no specialist knowledge assumed

## Core Capabilities

### 1. Custom Teams & Players (CRUD)
- Create and persist teams with: Team Name, Short Name (e.g., "Gully XI", "MUM"), and custom brand colors
- Add players with full profiles: custom name, Role (Batsman / Bowler / All-Rounder / Wicketkeeper), Batting Style (RHB / LHB), Bowling Style (Fast / Medium-Fast / Medium / Off-Spin / Leg-Spin / Slow Left-Arm)
- **Quick-Add**: paste or type 11 comma-separated names to instantly generate a full playing XI roster before a match
- All team and player data persists locally via SQLite (sqflite package) or Hive

### 2. Advanced Match Engine
- **Match Setup**: Select two saved custom teams → pick Playing XI from roster → assign Captain and Wicketkeeper → define total overs → record toss result
- **Ball-by-Ball Accounting**: Runs (+1, +2, +3, +4, +6) and all Extras — Wide (+1 run, does NOT consume a legal ball), No-Ball (+1 run, does NOT consume a legal ball), Bye, Leg-Bye, Penalty
- **Dynamic Dismissals**: Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket, Retired Hurt — each mapped to `batsman_id`, `bowler_id` (where applicable), and `fielder_id` from the custom roster
- **Undo / Redo Engine**: Event-sourcing / Command Pattern — infinite undo/redo chain over all ball events; corrects any mistake at any point without restarting the match

### 3. Relational Database Schema (SQL)
Normalized schema: `Custom_Teams → Custom_Players → Matches → Innings → Ball_By_Ball_Events`
Every batting and bowling statistic (runs scored, balls faced, strike rate, wickets taken, economy rate) is derived dynamically from individual ball events linked to unique player IDs — never stored as denormalized totals.

### 4. Type-Safe State Management
State reducer (Dart / TypeScript) handling `BALL_BOWLED` and `WICKET` action types:
- Correct striker / non-striker rotation after each ball
- Over progression: 6 legal balls = over complete → requires new bowler selection
- Live per-player stat accumulation directly from the event stream

## Technology Stack
- **App**: Flutter (Dart) — mobile-first (iOS & Android)
- **Local Persistence**: SQLite via `sqflite` package, or Hive for object-level storage
- **State Management**: Riverpod or Bloc (type-safe reducer pattern)
- **Architecture**: Event Sourcing / Command Pattern for the match engine

## Strategic Principles
- **Event-driven truth**: every stat derives from ball events — no denormalization, no drift between display and reality
- **Local-first**: all data lives on-device; no cloud dependency for core scoring
- **Undo is first-class**: the command pattern is the core architecture, not a feature bolted on
- **Player identity is central**: every dismissal, every ball, every stat ties back to a named custom player with a unique ID

## Positioning
The professional-grade ball-by-ball cricket scorer for local and community cricket — bridging the gap between informal gully scoring on paper and the precision of broadcast-quality scorecards.

## Brand & Tone
- Precise, community-focused, trustworthy
- Primary color: cricket green (deep, ~#166534)
- Accent color: amber/cricket ball (~#f59e0b)
- Primary audience feel: the serious gully cricket organizer who wants pro-quality records for their own teams

## Weekly Verified Operation
**Match Scored** — a complete cricket match tracked ball-by-ball from toss to final result, submitted by a real scorer in the deployed app.
*Volume and frequency facts not yet provided by the user — see North Star slide for the formula template with labeled assumptions.*
