# Design Guidelines — Scorenow

## Brand Colors
- Primary: Cricket green #166534 (deep, authoritative)
- Accent: Amber #f59e0b (cricket ball warmth — use on key actions, highlights, badges)
- Background: White #ffffff
- Surface/card: #f8fafc with border #e2e8f0
- Text primary: #0f172a
- Text secondary: #64748b
- Live/active indicator: #22c55e
- Dismissal/error: #ef4444

## Typography
- App name & score display: Extra-bold (900), large, primary green
- Section headings: Bold (700), dark slate
- Stats figures: Bold, high-contrast, sized for instant scanning
- Labels & meta: Uppercase, letter-spaced, small (0.7rem)

## Components
- Cards: border-radius 14px, subtle shadow, white/light surface
- Score display: Prominent large numerals — the hero element on the scoring screen
- Ball input buttons: Large, well-spaced tap targets (min 48px), clear pressed/active states
- Undo button: Always visible and prominent during active match
- Extras buttons: Visually distinct from run buttons
- Player rows: Compact, easy to scan, role badge (Bat/Bowl/AR/WK)
- Team color swatch: Small pill/dot to identify each team

## Screens (minimum)
1. Home / Team List
2. Create/Edit Team + Roster
3. Quick-Add Roster (paste 11 names)
4. Match Setup (team picker, XI selector, toss)
5. Live Scoring Screen (current batsmen, current bowler, over tracker, score, ball buttons, undo)
6. Dismissal Modal (type selector, fielder picker)
7. Scorecard / Stats View (batting + bowling scorecards)

## Aesthetic
- Clean, precision-focused, mobile-first layout
- Cricket scoreboard feel — professional but personal and warm
- High-contrast text and controls for outdoor readability
- Airy spacing — not cluttered; each screen does one job well
- Green + amber as consistent brand accent throughout the UI