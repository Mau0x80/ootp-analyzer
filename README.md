# OOTP Roster Analyzer

A comprehensive web-based roster analysis tool for **Out of the Park Baseball 27**. Two game modes — **Franchise** and **Perfect Team** — with advanced player scoring, lineup optimization, farm system tracking, strategy recommendations, and visual analytics.

**Live demo:** [mau0x80.github.io/ootp-analyzer](https://mau0x80.github.io/ootp-analyzer/)

---

## Franchise Mode

### Dashboard
- Player counts (total / batters / pitchers) and WAR leader
- WAR leaders bar chart, age distribution pie chart
- Top batters by OPS+, top pitchers by ERA+, top offensive scores
- Hitter & pitcher archetype distribution breakdowns
- **Payroll summary** (when dump data is loaded): total payroll, players on IL, pending free agents, average OVR

### Batters
- Searchable, filterable table with position buttons (C, 1B, 2B, 3B, SS, LF, CF, RF, DH)
- Columns: Name, Pos, Age, B/T, OVR, CON, POW, EYE, SPE, OPS, OPS+, wOBA, wRC+, WAR, Archetype, Percentile, OFF score, DEF score
- **Grouped by affiliate level** when dump data is loaded (MLB → AAA → AA → A+ → A → Rookie), with team name and player count per section

### Pitchers
- Sortable table with role filter (SP / RP / CL)
- Columns: Name, Role, Age, STU, MOV, CON, STM, VELO, ERA, FIP, WHIP, K/9, ERA+, K-BB%, SIERA, WAR, Archetype, Percentile, Score
- **Grouped by affiliate level** when dump data is loaded

### Defense
- Position-by-position defensive rankings
- Fielding ratings breakdown: C Ability, C Arm, IF Range, IF Error, IF Arm, Turn DP, OF Range, OF Error, OF Arm

### Organization
- Players grouped by affiliate: **MLB → AAA → AA → A+ → A → Rookie**
- Roster summary bar with player count and average OVR per team
- **MLB-Ready Prospects** — minor leaguers with OVR ≥ 55 or POT ≥ 70, with suggested promotion level
- **Needs Development** — MLB players with low OVR or young players with high untapped potential, with suggested demotion level
- **Promotion Candidates** — players outperforming their level average by +10, with suggested target level (e.g., AA → AAA)
- **Demotion Candidates** — players underperforming their level average by -10, with suggested target level (e.g., AAA → AA)

### Prospects & Scouting
Three tabs with personality trait columns (Work Ethic, Leadership, Greed, Loyalty, Win Desire):
- **Prospects** — Top 30 organization prospects ranked by score (60% Potential + 40% OVR), with ETA estimates and elite badges for POT ≥ 80
- **Draft Pool** — Top 50 draft-eligible players sorted by potential, highlighting hidden gems with large POT-OVR gaps
- **Free Agents** — Top 50 available free agents sorted by OVR, with WAR and role info

### Lineups
- 5 lineup modes: General, vs RHP, vs LHP, Best Defense, Balanced
- Batting order optimization (leadoff OBP, cleanup power, etc.)
- Pitching staff builder (rotation, closer, setup, long relief)
- **Diamond field visualization** — SVG baseball field with players at positions
- **Manual drag-and-drop builder** — override the optimizer
- **Export**: copy as text (Discord/forums) or save as PNG image

### Rotation & Bullpen
- Visual pitcher cards with STU / MOV / CON / STM rating bars, velocity, and stats
- **Grouped by affiliate level** when dump data is loaded — each level section shows its own Starting Rotation, Closer, Setup Men, and Relievers
- Flat role-based view (Rotation → Closer → Setup → Long Reliever → Middle Relievers) when using CSV import

### Trends
- Save roster snapshots (e.g., "Opening Day", "Post-Trade Deadline")
- Compare player progression with delta arrows across Overall, Offense, Defense, and Pitching scores

### Strategy Engine
Auto-generated optimal strategy slider recommendations (0–10) based on roster analysis:
- **Offensive** (6 sliders): Stealing, Base Running, Hit & Run, Sacrifice Bunt, Squeeze Bunt, Bunt for Hit
- **Pitching & Defense** (8 sliders): Pitch Around, Intentional Walk, Hold Runners, Infield In, Corners In, Guard Lines, Infield Shifts, Outfield Shifts
- **Substitution** (6 sliders): Hook Starters, Hook Relievers, L/R Pitching Matchups, L/R Batting Matchups, Pinch Hit, Pinch Runners

Each slider shows the recommended value, a confidence level (high / medium / low), and a rationale explaining the reasoning.

### Analysis (6 tabs)

#### Trade Value Calculator
- Composite trade value score for every player: OVR + POT − age penalty − salary burden + scarcity bonus + personality bonus
- Color-coded table sortable by value, age, or position

#### Depth Chart
- Per-position depth ranking: Starter / Backup / Emergency
- Highlights gaps and position scarcity across the roster

#### Injury Risk
- Risk score derived from age, DL/IL status, and workload
- Identifies high-risk players and recommends depth coverage

#### Aging Curves
- Four categories with 1 / 2 / 3-year projections:
  - **Rising Stars** (age < 27, talent gap > 10)
  - **Peak Window** (age 27–30, near max potential)
  - **Aging Gracefully** (age 31–34, still productive)
  - **Decline Phase** (age 35+ or negative talent trend)

#### Platoon Optimizer
- L/R split ratings per position
- Identifies ideal platoon pairings and matchup advantages

#### Slam Dunks
Low-cost / high-value acquisition targets sorted by opportunity score:
- **Bargain FAs** — free agents with high OVR but low salary expectations (low greed, high work ethic)
- **Hidden Gems** — players with a large gap between talent OVR and current OVR, breakout candidates
- **Underutilized** — organization players with high potential sitting at a level below their ability

Filter by category; each card shows the reason, key ratings, and personality traits.

### Player Detail Modal
Click any player to open a full profile with:
- Dump data header: OVR, POT, team, morale
- **Contract & Service**: salary per year, total value, service time, options, status badges (DL, Rule 5 eligible, etc.)
- **Personality**: 6 color-coded bars — Work Ethic, Leadership, Greed (inverted), Loyalty, Win Desire, Intelligence
- **Statcast**: exit velocity, barrel %, hard-hit %, sprint speed
- **Pitch Repertoire**: bar chart per pitch type with velocity and arm slot
- **Talent vs Current**: side-by-side comparison of raw talent vs current ratings with gap coloring
- Batting/pitching/fielding ratings, eligible positions, career stats, strengths & weaknesses

### Settings
- All OOTP ratings scales: 1–5, 2–8, 1–10, 1–20, **20–80** (default), 1–100, 1–200
- Adjustable scoring weights (offense vs defense, ratings vs real stats)
- DH toggle, out-of-position penalties, dark mode

---

## Perfect Team Mode

### PT Dashboard
- Card tier distribution (Bronze / Silver / Gold / Diamond / Perfect) with counts and percentages
- Top 10 sleeper cards ranked by hidden potential gap

### Collection
- Browseable card inventory with tier and position filters
- Sortable by: Name, OVR, Overall Value, Offensive Score, Defensive Score, Pitching Score, Potential Gap

### Tournament
- 7 preset tier caps: Bronze Only, Silver Only, Gold Only, Diamond Only, Silver+Bronze, Gold+Below, No Limit
- Optimized lineup generation under tournament constraints

### Sleepers & Artifacts
- Artifact boost simulator with 11 boost types:
  - Batting: Contact, Power, Eye, Gap, Speed
  - Pitching: Stuff, Movement, Control
  - Fielding: C Ability, IF Range, OF Range
- Apply / clear boosts per player to simulate card improvements

### PT Settings
- Two scoring profiles: PT27 Meta vs Classic
- Weight visualization for Offensive / Defensive / Pitching / Reliever categories

---

## Data Import

### Manual CSV Import
Import individual CSV files exported from OOTP via **Reports → Export**:

| File | Contents |
|------|----------|
| `batting_ratings.csv` | CON, POW, EYE, GAP, SPE, STE, BABIP |
| `pitching_ratings.csv` | STU, MOV, CON, STM, HRA, HLD, VELO |
| `fielding_ratings.csv` | C ABI/ARM, IF/OF ratings |
| `position_ratings.csv` | Per-position DEF ratings |
| `batting_stats.csv` | AVG, OBP, SLG, HR, RBI, SB, WAR |
| `pitching_stats.csv` | ERA, FIP, WHIP, K/9, K-BB%, WAR |
| `batting_super_stats.csv` | wOBA, wRC+, wRAA, UBR, WPA |
| `pitching_super_stats.csv` | FIP–, rWAR, pLi, IRS%, QS |

### OOTP Dump Folder Import
Import directly from an OOTP database dump folder (**Commissioner → Data Dump → Export to CSV**):

- **Two-phase import**: scans the folder instantly, then loads data only after you select your team — no freezing
- Loads the full organization including all minor league affiliates (detected via `parentTeamId`)
- Also loads free agents (top 300 by OVR) and draft-eligible players (top 200 by potential)
- **Tier 1 files** (essential): players, batting/pitching/fielding ratings, player values, career stats
- **Tier 2 files** (high value): roster status, contracts, teams, parks, team roster, at-bat Statcast data
- Extra data unlocked by dump: personality traits, talent ratings, pitch repertoire, velocity, zone rating, catcher framing, park factors, contract details, service time

---

## Player Analysis Features

- **Composite scores** (0–100) for offense, defense, pitching, lineup fit, platoon splits, and overall value
- **Hitter archetypes**: Patient Slugger, Contact Hitter, Power Masher, OBP Machine, Run Producer, Speed Threat, Empty Average, Bench Bat
- **Pitcher archetypes**: Ace, No. 2/3 Starter, Innings Eater, Back-End Starter, Setup/Closer, Fireman, Middle Reliever, Mop-Up
- **Percentile rankings** vs. your roster for 10+ batting and pitching metrics
- **Radar/spider charts** per player showing hitting or pitching profile
- **Platoon split detection** and strength/weakness badges
- **Derived stats computed from raw data**: AVG, OBP, SLG, OPS, OPS+, ISO, BABIP, wOBA, wRC+, K%, BB%, FIP, WHIP, K-BB%, SIERA, ERA+, and more

---

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

```bash
npm run build   # production build → dist/
```

---

## Tech Stack

- **React 18** + TypeScript + Vite 6
- **Tailwind CSS 3** — dark theme UI
- **Zustand** — state management
- **Recharts** — bar charts, pie charts, radar charts
- **PapaParse** — CSV parsing
- **html2canvas** — image export
- **Lucide React** — icons
