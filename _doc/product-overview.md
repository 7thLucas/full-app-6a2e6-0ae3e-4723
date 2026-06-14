Act as a Principal Software Architect and Senior Full-Stack Engineer. I want to build a production-grade, highly scalable Advanced Cricket Scoreboard App that features full Custom Team & Player Creation alongside professional match-tracking logic. Provide a comprehensive system design, database schema, state management architecture, and core code for the following requirements:

1. Custom Teams & Players Creation Module (CRUD):
- Custom Teams: Users must be able to create, save, and edit custom teams with personalized Team Names, Short Names (e.g., "Gully XI", "MUM"), and custom colors. These must persist in local storage (SQLite/Hive).
- Custom Player Roster: Within each team, users can add players with any custom name. For each player, capture their profile metadata: Role (Batsman, Bowler, All-Rounder, Wicketkeeper), Batting Style (RHB/LHB), and Bowling Style (Fast, Spin, etc.).
- Quick-Add UI: Include a fast-input feature where a user can paste/type 11 names separated by commas to instantly generate a team roster before a match.

2. Advanced Match Engine & Rules:
- Multi-Format & Setup: Match setup must allow selecting two pre-saved custom teams, picking the active Playing XI, assigning Captain/Wicketkeeper, defining total overs, and setting the toss result.
- Ball-by-Ball Accounting: Precise handling of runs (+1, +2, +3, +4, +6) and Extras (Wide, No-Ball, Bye, Leg-Bye, Penalty runs). Wides and No-Balls must add 1 run to the total and NOT count as legal balls.
- Dynamic Dismissals: Handle all major dismissal types (Bowled, Caught, LBW, Run Out, Stumped, etc.) mapping directly to the specific `batsman_id`, `bowler_id`, and `fielder_id` from the custom rosters.
- Undo/Redo Engine: Implement an Event Sourcing or Command Pattern allowing the scorer to undo/redo an infinite chain of ball events to fix scoring mistakes.

3. Relational Database Schema (SQL):
- Provide a normalized SQL schema linking: Custom_Teams -> Custom_Players -> Matches -> Innings -> Ball_by_Ball_Events.
- Ensure every stat (runs faced, balls bowled, economy, strike rate) is dynamically computed from individual ball events linked to unique player IDs.

4. State Management Implementation:
- Write a type-safe State Reducer (TypeScript or Dart/Flutter) that demonstrates how a 'BALL_BOWLED' event or a 'WICKET' event mutates the global match state, seamlessly transitions the striker/non-striker, tracks over progression (6 legal balls), and updates individual custom player statistics.