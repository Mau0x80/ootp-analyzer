# OOTP Roster Analyzer

A web-based roster analysis tool for **Out of the Park Baseball 27**. Import your team's CSV exports and get instant player scoring, lineup optimization, and visual analytics.

🔗 **Live demo:** [mau0x80.github.io/ootp-analyzer](https://mau0x80.github.io/ootp-analyzer/)

---

## Features

### Player Analysis
- **Composite scores** (0–100) for offense, defense, pitching, lineup fit, platoon splits, and overall value
- **Hitter archetypes**: Patient Slugger, Contact Hitter, Power Masher, OBP Machine, Run Producer, Speed Threat, and more
- **Pitcher archetypes**: Ace, No. 2/3, Innings Eater, Back-End, Setup/Closer, Fireman, Middle Reliever
- **Percentile rankings** vs. your roster for 10+ batting and pitching metrics
- **Radar/spider charts** per player showing hitting or pitching profile
- **Platoon split detection** and strength/weakness badges

### Lineup Optimizer
- 5 lineup modes: General, vs RHP, vs LHP, Best Defense, Balanced
- Batting order optimization (leadoff OBP, cleanup power, etc.)
- Pitching staff builder (rotation, closer, setup, long relief)
- **Diamond field visualization** — see your lineup on an SVG baseball field
- **Manual drag-and-drop builder** — override the optimizer by dragging players to positions

### Export
- **Copy as text** — formatted lineup ready for Discord/forums
- **Save as image** — PNG download of your lineup card

### Trend Tracking
- Save up to 2 roster snapshots (e.g., "2024 Opening Day", "2024 Post-Trade")
- Compare player progression with delta arrows across all composite scores

### Settings
- Support for all OOTP ratings scales: 1–5, 2–8, 1–10, 1–20, **20–80** (default), 1–100, 1–200
- Adjustable scoring weights (offense vs defense, ratings vs real stats)
- Toggle DH, out-of-position, dark mode

---

## CSV Files Supported

Export these from OOTP via **Reports → Export**:

| File | Contents |
|------|----------|
| `batting_ratings.csv` | CON, POW, EYE, GAP, SPE, STE, BABIP |
| `pitching_ratings.csv` | STU, MOV, CON, STM, HRA, HLD, VELO |
| `fielding_ratings.csv` | C ABI/ARM, IF/OF ratings |
| `position_ratings.csv` | Per-position DEF ratings |
| `batting_stats.csv` | AVG, OBP, SLG, HR, RBI, SB, WAR, etc. |
| `pitching_stats.csv` | ERA, FIP, WHIP, K/9, K-BB%, SIERA, WAR, etc. |
| `batting_super_stats.csv` | Advanced: wOBA, wRC+, wRAA, UBR, WPA |
| `pitching_super_stats.csv` | Advanced: FIP–, rWAR, pLi, IRS%, QS |

You can load any combination — the app works with as many or as few files as you have.

---

## Running Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

```bash
npm run build   # production build
```

---

## Tech Stack

- **React 18** + TypeScript + Vite 6
- **Tailwind CSS 3**
- **Zustand** — state management
- **Recharts** — bar charts, pie charts, radar charts
- **html2canvas** — image export
- **Lucide React** — icons
