# Scorenow

A complete ball-by-ball cricket scoring app for local, pickup cricket groups where teams are assembled fresh each match day. Personal passion project — built from the heart, for friends who play cricket together.

## Users
- **Primary — The Scorer**: One of the players who runs the match; needs to build fresh teams fast and score every ball accurately with the ability to fix mistakes instantly
- **Secondary — Fellow Players**: See their own batting/bowling stats and the accurate final scorecard after each game

## Core Features (ALL required — no cuts)

### 1. Custom Teams & Players (CRUD)
- Create/edit/delete teams: Team Name, Short Name (e.g. "Gully XI", "MUM"), custom brand color
- Player profiles: custom name, Role (Batsman / Bowler / All-Rounder / Wicketkeeper), Batting Style (RHB / LHB), Bowling Style (Fast / Medium-Fast / Medium / Off-Spin / Leg-Spin / Slow Left-Arm)
- **Quick-Add**: paste 11 comma-separated names → instant Playing XI roster

### 2. Match Setup & Engine
- Pick 2 saved teams → select Playing XI from roster → assign Captain & Wicketkeeper → set total overs → record toss result
- Runs: +1, +2, +3, +4, +6
- Extras: Wide (+1 run, does NOT consume a legal ball), No-Ball (+1 run, does NOT consume a legal ball), Bye, Leg-Bye, Penalty runs
- Over progression: exactly 6 legal balls per over
- Striker/non-striker auto-rotation after each ball and at over end

### 3. Dismissals
- Types: Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket, Retired Hurt
- Each dismissal maps to: batsman_id, bowler_id (where applicable), fielder_id — all from the custom roster

### 4. Undo / Redo Engine
- Event-sourcing / Command Pattern
- Infinite undo/redo chain over all ball events
- No match restart needed for corrections

### 5. Live Player Statistics
- Batting: runs, balls faced, strike rate, 4s, 6s, dismissal type
- Bowling: overs, runs conceded, wickets, economy rate
- All computed dynamically from ball events — never stored as totals

## Strategic Principles
- Full experience from day one — no MVP feature cuts
- Every stat derived from ball events (event-driven truth)
- Local-first — all data on-device, no cloud dependency
- Undo is first-class architecture, not an afterthought
- Player identity is central to every dismissal and stat

## Brand
- Name: Scorenow
- Tone: Confident, precise, warm — built for real cricket, not corporate