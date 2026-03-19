import type { Player, RatingsScaleInfo } from '../types';
import { normRating } from './scoringEngine';

// ============================================================
// Strategy Recommendation Engine
// Analyzes roster stats/ratings and recommends OOTP strategy
// slider values (0–10) for all three strategy categories.
// ============================================================

export interface StrategyRecommendation {
  value: number; // 0-10
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface StrategyReport {
  offensive: {
    stealingBases: StrategyRecommendation;
    baseRunning: StrategyRecommendation;
    hitAndRun: StrategyRecommendation;
    sacrificeBunt: StrategyRecommendation;
    squeezeBunt: StrategyRecommendation;
    buntForHit: StrategyRecommendation;
  };
  pitchingDefense: {
    pitchAround: StrategyRecommendation;
    intentionalWalk: StrategyRecommendation;
    holdRunners: StrategyRecommendation;
    playInfieldIn: StrategyRecommendation;
    playCornersIn: StrategyRecommendation;
    guardLines: StrategyRecommendation;
    useInfieldShifts: StrategyRecommendation;
    useOutfieldShifts: StrategyRecommendation;
    shiftOFDepth: StrategyRecommendation;
  };
  substitution: {
    hookStartingPitchers: StrategyRecommendation;
    hookRelievers: StrategyRecommendation;
    lrPitchingMatchups: StrategyRecommendation;
    lrBattingMatchups: StrategyRecommendation;
    pinchHitForPositionPlayers: StrategyRecommendation;
    usePinchRunners: StrategyRecommendation;
  };
}

// ============================================================
// Helpers
// ============================================================

function clamp010(v: number): number {
  return Math.round(Math.max(0, Math.min(10, v)));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function rec(
  value: number,
  rationale: string,
  confidence: 'high' | 'medium' | 'low'
): StrategyRecommendation {
  return { value: clamp010(value), rationale, confidence };
}

function emptyRec(label: string): StrategyRecommendation {
  return { value: 5, rationale: `No roster data. ${label} set to neutral (5).`, confidence: 'low' };
}

// ============================================================
// Main: Generate Strategy Report
// ============================================================

export function generateStrategyReport(
  players: Player[],
  scale: RatingsScaleInfo
): StrategyReport {
  const posPlayers = players.filter((p) => !p.isPitcher || p.isTwoWay);
  const starters = players.filter((p) => p.isPitcher && p.pos === 'SP');
  const relievers = players.filter((p) => p.isPitcher && p.pos !== 'SP');
  const allPitchers = players.filter((p) => p.isPitcher);

  const noData = posPlayers.length === 0 && allPitchers.length === 0;

  // ============================================================
  // Position Player Metrics (0-100 normalized)
  // ============================================================
  const speedValues = posPlayers
    .map((p) => (p.battingRatings ? normRating(p.battingRatings.spe, scale) : -1))
    .filter((v) => v >= 0);
  const stealValues = posPlayers
    .map((p) => (p.battingRatings ? normRating(p.battingRatings.ste, scale) : -1))
    .filter((v) => v >= 0);
  const conValues = posPlayers
    .map((p) => (p.battingRatings ? normRating(p.battingRatings.con, scale) : -1))
    .filter((v) => v >= 0);
  const powValues = posPlayers
    .map((p) => (p.battingRatings ? normRating(p.battingRatings.pow, scale) : -1))
    .filter((v) => v >= 0);
  const bunValues = posPlayers
    .map((p) => (p.battingRatings ? normRating(p.battingRatings.bun, scale) : -1))
    .filter((v) => v >= 0);
  const bfhValues = posPlayers
    .map((p) => (p.battingRatings ? normRating(p.battingRatings.bfh, scale) : -1))
    .filter((v) => v >= 0);

  const avgSpeed = avg(speedValues);
  const avgSteal = avg(stealValues);
  const avgCon = avg(conValues);
  const avgPow = avg(powValues);
  const avgBun = avg(bunValues) || 40;
  const avgBfh = avg(bfhValues) || 30;

  const speedThreats = posPlayers.filter((p) => p.hitterArchetype === 'Speed Threat').length;
  const powerMashers = posPlayers.filter((p) => p.hitterArchetype === 'Power Masher').length;

  const hittersSB = posPlayers.filter((p) => p.battingStats && p.battingStats.pa >= 20);
  const totalSB = hittersSB.reduce((sum, p) => sum + (p.battingStats?.sb ?? 0), 0);

  const avgOffScore = avg(posPlayers.map((p) => p.scores.offensiveScore));

  // Platoon splits of position players
  const platVLValues = posPlayers.map((p) => p.scores.platoonVsLHP).filter((v) => v > 0);
  const platVRValues = posPlayers.map((p) => p.scores.platoonVsRHP).filter((v) => v > 0);
  const avgPlatL = avg(platVLValues);
  const avgPlatR = avg(platVRValues);
  const platoonSpreadHitters = Math.abs(avgPlatL - avgPlatR);

  // ============================================================
  // Pitcher Metrics
  // ============================================================
  const avgStarterScore = avg(starters.map((p) => p.scores.starterScore));
  const avgRelieverScore = avg(relievers.map((p) => p.scores.relieverScore));
  const avgPitchScore = avg(allPitchers.map((p) => p.scores.pitchingScore));

  const hldValues = allPitchers
    .map((p) => (p.pitchingRatings ? normRating(p.pitchingRatings.hld, scale) : -1))
    .filter((v) => v >= 0);
  const avgHld = avg(hldValues);

  // Pitcher platoon splits
  const stuVLValues = allPitchers
    .map((p) => (p.pitchingRatings ? normRating(p.pitchingRatings.stuVL, scale) : -1))
    .filter((v) => v >= 0);
  const stuVRValues = allPitchers
    .map((p) => (p.pitchingRatings ? normRating(p.pitchingRatings.stuVR, scale) : -1))
    .filter((v) => v >= 0);
  const avgStuVL = avg(stuVLValues);
  const avgStuVR = avg(stuVRValues);
  const platoonSpreadPitchers = Math.abs(avgStuVL - avgStuVR);

  // Ground-ball tendencies
  const pitchersWithStats = allPitchers.filter(
    (p) => p.pitchingStats && p.pitchingStats.ip >= 5
  );
  const avgGoPct = avg(pitchersWithStats.map((p) => p.pitchingStats!.goPct));

  // ============================================================
  // Infield/Corner Defense
  // ============================================================
  const ifPlayers = posPlayers.filter((p) => ['1B', '2B', '3B', 'SS'].includes(p.pos));
  const cornerPlayers = posPlayers.filter((p) => ['1B', '3B'].includes(p.pos));
  const leftSidePlayers = posPlayers.filter((p) => ['3B', 'SS'].includes(p.pos));
  const avgIfDef = avg(ifPlayers.map((p) => p.scores.defensiveScore));
  const avgCornerDef = avg(cornerPlayers.map((p) => p.scores.defensiveScore));
  const avgLeftSideDef = avg(leftSidePlayers.map((p) => p.scores.defensiveScore));

  // ============================================================
  // Bench Analysis
  // ============================================================
  const allPosSorted = [...posPlayers].sort(
    (a, b) => b.scores.lineupFitScore - a.scores.lineupFitScore
  );
  const benchPlayers = allPosSorted.slice(9);
  const benchDepth = benchPlayers.filter((p) => p.scores.offensiveScore >= 40).length;
  const benchSpeedCount = benchPlayers.filter(
    (p) => p.battingRatings && normRating(p.battingRatings.spe, scale) >= 65
  ).length;

  const hasStats = hittersSB.length >= 5;
  const hasPitchStats = pitchersWithStats.length >= 3;

  if (noData) {
    const neutral = () => emptyRec;
    void neutral;
    return {
      offensive: {
        stealingBases: emptyRec('Stealing Bases'),
        baseRunning: emptyRec('Base-Running'),
        hitAndRun: emptyRec('Use Hit & Run'),
        sacrificeBunt: emptyRec('Sacrifice Bunt'),
        squeezeBunt: emptyRec('Use Squeeze Bunt'),
        buntForHit: emptyRec('Bunt for Hit'),
      },
      pitchingDefense: {
        pitchAround: emptyRec('Pitch Around'),
        intentionalWalk: emptyRec('Intentional Walk'),
        holdRunners: emptyRec('Hold Runners'),
        playInfieldIn: emptyRec('Play Infield In'),
        playCornersIn: emptyRec('Play Corners In'),
        guardLines: emptyRec('Guard Lines'),
        useInfieldShifts: emptyRec('Use Infield Shifts'),
        useOutfieldShifts: emptyRec('Use Outfield Shifts'),
        shiftOFDepth: emptyRec('Shift OF Depth'),
      },
      substitution: {
        hookStartingPitchers: emptyRec('Hook Starting Pitchers'),
        hookRelievers: emptyRec('Hook Relievers'),
        lrPitchingMatchups: emptyRec('L/R Pitching Matchups'),
        lrBattingMatchups: emptyRec('L/R Batting Matchups'),
        pinchHitForPositionPlayers: emptyRec('Pinch-Hit for Position Players'),
        usePinchRunners: emptyRec('Use Pinch Runners'),
      },
    };
  }

  // ============================================================
  // Offensive Strategy
  // ============================================================

  // 1. Stealing Bases
  const speedStealIdx = (avgSpeed + avgSteal) / 2;
  const sbBonus = totalSB >= 60 ? 1.5 : totalSB >= 30 ? 0.8 : 0;
  const stealValue = (speedStealIdx / 100) * 8 + sbBonus + speedThreats * 0.4;
  const stealingBases = rec(
    stealValue,
    speedStealIdx > 60
      ? `Fast team (speed/steal avg ${Math.round(speedStealIdx)}/100) with ${speedThreats} speed threats${totalSB > 0 ? ` and ${totalSB} steals` : ''}. Aggressive running game.`
      : speedStealIdx > 40
      ? `Average team speed (${Math.round(speedStealIdx)}/100). Selective steal usage.`
      : `Slow roster (${Math.round(speedStealIdx)}/100). Minimize stolen-base attempts.`,
    hasStats ? 'high' : speedValues.length > 5 ? 'medium' : 'low'
  );

  // 2. Base Running
  const baseRunValue = (avgSpeed / 100) * 9;
  const baseRunning = rec(
    baseRunValue,
    avgSpeed > 60
      ? `Team avg speed ${Math.round(avgSpeed)}/100. Aggressive base running creates pressure.`
      : avgSpeed > 40
      ? `Average speed (${Math.round(avgSpeed)}/100). Take extra bases selectively.`
      : `Below-average speed (${Math.round(avgSpeed)}/100). Conservative base running.`,
    speedValues.length > 5 ? 'medium' : 'low'
  );

  // 3. Hit & Run
  const hitRunIdx = avgCon * 0.6 + avgSpeed * 0.4;
  const hitRunValue = (hitRunIdx / 100) * 8.5;
  const hitAndRun = rec(
    hitRunValue,
    hitRunIdx > 60
      ? `Good contact (${Math.round(avgCon)}/100) + speed combo. H&R is an effective weapon.`
      : hitRunIdx > 40
      ? `Moderate contact/speed. Use H&R selectively.`
      : `Low contact or speed. H&R creates more risk than reward.`,
    conValues.length > 5 ? 'medium' : 'low'
  );

  // 4. Sacrifice Bunt
  const sacBuntValue = ((100 - avgPow) / 100) * 5 + (avgBun / 100) * 3.5;
  const sacrificeBunt = rec(
    sacBuntValue,
    avgPow > 65
      ? `Power-heavy lineup (avg pow ${Math.round(avgPow)}/100). Sacrifice bunt trades outs for little gain.`
      : avgPow < 40
      ? `Weak power (${Math.round(avgPow)}/100). Bunting helps manufacture runs.`
      : `Moderate power lineup. Situational sacrifice bunting.`,
    powValues.length > 5 ? 'medium' : 'low'
  );

  // 5. Squeeze Bunt
  const squeezeValue = (avgBun * 0.65 + avgSpeed * 0.35) / 100 * 8;
  const squeezeBunt = rec(
    squeezeValue,
    avgBun > 55
      ? `Good bunting skill (${Math.round(avgBun)}/100) + speed. Squeeze play is viable.`
      : avgBun > 35
      ? `Average bunt skills. Use squeeze only in favorable counts.`
      : `Poor bunt ratings (${Math.round(avgBun)}/100). Squeeze too risky.`,
    bunValues.length > 5 ? 'medium' : 'low'
  );

  // 6. Bunt for Hit
  const bfhValue = (avgBfh * 0.7 + avgSpeed * 0.3) / 100 * 8;
  const buntForHit = rec(
    bfhValue,
    avgBfh > 55
      ? `Strong bunt-for-hit ability (${Math.round(avgBfh)}/100). Worth attempting against shifted defenses.`
      : avgBfh > 35
      ? `Average bfh skill. Attempt occasionally.`
      : `Low bunt-for-hit ratings (${Math.round(avgBfh)}/100). Not recommended.`,
    bfhValues.length > 5 ? 'medium' : 'low'
  );

  // ============================================================
  // Pitching & Defensive Strategy
  // ============================================================

  // 7. Pitch Around
  const pitchAroundBase = avgPitchScore > 0 ? Math.max(0, (80 - avgPitchScore) / 80) * 7 + 1 : 5;
  const pitchAround = rec(
    pitchAroundBase,
    avgPitchScore > 70
      ? `Elite pitching staff (${Math.round(avgPitchScore)}/100). Attack hitters — minimal need to pitch around.`
      : avgPitchScore > 50
      ? `Average staff (${Math.round(avgPitchScore)}/100). Selectively avoid dangerous hitters.`
      : `Below-average pitching (${Math.round(avgPitchScore)}/100). Caution around high-leverage hitters.`,
    hasPitchStats ? 'high' : allPitchers.length > 3 ? 'medium' : 'low'
  );

  // 8. Intentional Walk
  const ibbValue =
    powerMashers >= 3 ? 6 :
    powerMashers >= 1 ? 4 :
    avgPow > 60 ? 4 :
    avgPow > 40 ? 2 : 1;
  const intentionalWalk = rec(
    ibbValue,
    powerMashers >= 2
      ? `Facing ${powerMashers} power masher archetypes in opposing lineups. Strategic IBBs protect against big innings.`
      : avgPow > 55
      ? `Moderate lineup power. Occasional IBBs in high-leverage spots.`
      : `Low-power roster profile. Rarely worth issuing intentional walks.`,
    hasPitchStats ? 'medium' : 'low'
  );

  // 9. Hold Runners
  const holdValue = avgHld > 0
    ? (avgHld / 100) * 7 + (avgSpeed > 55 ? 2 : 1)
    : avgSpeed > 55 ? 6 : 4;
  const holdRunners = rec(
    holdValue,
    avgHld > 55
      ? `Strong hold ratings (${Math.round(avgHld)}/100). Pitchers are effective at keeping runners close.`
      : avgHld > 35
      ? `Average hold ratings. Focus on runners who are likely to steal.`
      : `Weak hold ratings (${Math.round(avgHld)}/100). Hard to limit running game.`,
    hldValues.length > 3 ? 'medium' : 'low'
  );

  // 10. Play Infield In
  const playIfInValue = ifPlayers.length > 0
    ? (avgIfDef / 100) * 6 + 1.5
    : 4;
  const playInfieldIn = rec(
    playIfInValue,
    avgIfDef > 60
      ? `Strong infield defense (${Math.round(avgIfDef)}/100). Playing in is viable — range covers the risk.`
      : avgIfDef > 40
      ? `Average infield defense. Use infield-in only in critical situations.`
      : `Weak infield defense (${Math.round(avgIfDef)}/100). Playing in significantly increases risk.`,
    ifPlayers.length >= 3 ? 'medium' : 'low'
  );

  // 11. Play Corners In
  const playCornersInValue = cornerPlayers.length > 0
    ? (avgCornerDef / 100) * 6 + 1.5
    : 4;
  const playCornersIn = rec(
    playCornersInValue,
    avgCornerDef > 55
      ? `Solid corner defense (${Math.round(avgCornerDef)}/100). Playing corners in is effective.`
      : `Weak corner defense (${Math.round(avgCornerDef)}/100). Playing in increases error risk.`,
    cornerPlayers.length >= 2 ? 'medium' : 'low'
  );

  // 12. Guard Lines
  const guardLinesValue = leftSidePlayers.length > 0
    ? (avgLeftSideDef / 100) * 7 + 1
    : 4;
  const guardLines = rec(
    guardLinesValue,
    avgLeftSideDef > 60
      ? `Strong left side of infield (${Math.round(avgLeftSideDef)}/100). Guarding lines protects extra-base hits.`
      : `Weaker left-side defense. Guarding lines limits range on normal plays.`,
    leftSidePlayers.length >= 2 ? 'medium' : 'low'
  );

  // 13. Use Infield Shifts
  const gbIdx = avgGoPct > 0 ? ((avgGoPct - 40) / 20) * 4 : 0;
  const ifShiftValue = 3 + Math.max(-2, Math.min(5, gbIdx));
  const useInfieldShifts = rec(
    ifShiftValue,
    avgGoPct > 0
      ? `Staff GO%: ${Math.round(avgGoPct)}%. ${avgGoPct > 50 ? 'Heavy ground-ball staff — infield shifts add significant value.' : avgGoPct > 44 ? 'Moderate ground-ball tendency.' : 'Fly-ball staff — infield shifts less effective.'}`
      : `No pitching stats available. Moderate default shift usage.`,
    hasPitchStats ? 'medium' : 'low'
  );

  // 14. Use Outfield Shifts
  const estFbPct = avgGoPct > 0 ? 100 - avgGoPct : 50;
  const fbIdx = ((estFbPct - 40) / 20) * 4;
  const ofShiftValue = 3 + Math.max(-2, Math.min(5, fbIdx));
  const useOutfieldShifts = rec(
    ofShiftValue,
    avgGoPct > 0
      ? `Est. FB%: ${Math.round(estFbPct)}%. ${estFbPct > 50 ? 'Fly-ball staff benefits from outfield positioning shifts.' : 'Ground-ball staff — OF shifts less impactful.'}`
      : `No pitching stats. Moderate default OF shift usage.`,
    hasPitchStats ? 'medium' : 'low'
  );

  // 15. Shift OF Depth
  const shiftOFDepth = rec(
    ofShiftValue,
    avgGoPct > 0
      ? `Matched to outfield shift recommendation based on staff FB tendency (${Math.round(estFbPct)}%).`
      : `No pitching stats. Set to neutral.`,
    hasPitchStats ? 'medium' : 'low'
  );

  // ============================================================
  // Substitution Strategy
  // ============================================================

  // 16. Hook Starting Pitchers
  const starterVsBullpen =
    avgStarterScore > 0 && avgRelieverScore > 0
      ? avgRelieverScore / avgStarterScore
      : 0.85;
  const hookStartValue = Math.max(2, Math.min(9, starterVsBullpen * 5.5));
  const hookStartingPitchers = rec(
    hookStartValue,
    avgStarterScore > 0
      ? `Rotation ${Math.round(avgStarterScore)}/100 vs Bullpen ${Math.round(avgRelieverScore)}/100. ${starterVsBullpen > 1.1 ? 'Bullpen is notably stronger — hook starters sooner.' : starterVsBullpen > 0.9 ? 'Balanced staff — hook based on performance.' : 'Rotation is the strength — give starters more leash.'}`
      : `No pitching ratings available.`,
    hasPitchStats ? 'high' : allPitchers.length > 5 ? 'medium' : 'low'
  );

  // 17. Hook Relievers
  const relieverCount = relievers.length;
  const hookRelValue =
    relieverCount >= 7 ? 8 :
    relieverCount >= 5 ? 6 :
    relieverCount >= 3 ? 4 : 2;
  const hookRelievers = rec(
    hookRelValue,
    `${relieverCount} relievers on roster. ${relieverCount >= 6 ? 'Deep bullpen — aggressive matchup management is feasible.' : relieverCount >= 4 ? 'Average depth — use hooks selectively.' : 'Thin bullpen — conserve arms.'}`,
    'medium'
  );

  // 18. L/R Pitching Matchups
  const lrPitchValue = stuVLValues.length > 0 && stuVRValues.length > 0
    ? Math.min(10, (platoonSpreadPitchers / 25) * 7 + 2)
    : 4;
  const lrPitchingMatchups = rec(
    lrPitchValue,
    platoonSpreadPitchers > 15
      ? `Large L/R pitcher split (${Math.round(platoonSpreadPitchers)} pt gap). Exploit handedness advantages aggressively.`
      : platoonSpreadPitchers > 6
      ? `Moderate pitcher platoon split. Some matchup value.`
      : `Small pitching platoon splits. L/R matchups not critical.`,
    stuVLValues.length > 3 && stuVRValues.length > 3 ? 'medium' : 'low'
  );

  // 19. L/R Batting Matchups
  const lrBatValue = platVLValues.length > 0 && platVRValues.length > 0
    ? Math.min(10, (platoonSpreadHitters / 20) * 7 + 2)
    : 4;
  const lrBattingMatchups = rec(
    lrBatValue,
    platoonSpreadHitters > 12
      ? `Significant batting platoon splits (${Math.round(platoonSpreadHitters)} pt gap). Exploit handedness in late-game situations.`
      : platoonSpreadHitters > 5
      ? `Moderate batting platoon splits. Some matchup value.`
      : `Balanced hitters vs L/R. Less benefit from matchup substitutions.`,
    platVLValues.length > 5 && platVRValues.length > 5 ? 'medium' : 'low'
  );

  // 20. Pinch-Hit for Position Players
  const pinchHitValue = Math.min(9, benchDepth * 1.8 + 1.5);
  const pinchHitForPositionPlayers = rec(
    pinchHitValue,
    benchDepth >= 4
      ? `Strong bench (${benchDepth} quality hitters). Aggressive pinch-hit usage is viable.`
      : benchDepth >= 2
      ? `Moderate bench depth (${benchDepth} hitters). Use pinch hits in high-leverage spots.`
      : `Thin bench. Reserve pinch hitters for critical late-game situations only.`,
    'medium'
  );

  // 21. Use Pinch Runners
  const pinchRunValue = Math.min(9, benchSpeedCount * 2.5 + 1.5);
  const usePinchRunners = rec(
    pinchRunValue,
    benchSpeedCount >= 3
      ? `${benchSpeedCount} fast bench players available. Pinch runner strategy adds meaningful run-scoring value.`
      : benchSpeedCount >= 1
      ? `${benchSpeedCount} fast bench player(s). Use pinch runners in key spots.`
      : `No speed on bench. Avoid pinch runner substitutions.`,
    'medium'
  );

  return {
    offensive: {
      stealingBases,
      baseRunning,
      hitAndRun,
      sacrificeBunt,
      squeezeBunt,
      buntForHit,
    },
    pitchingDefense: {
      pitchAround,
      intentionalWalk,
      holdRunners,
      playInfieldIn,
      playCornersIn,
      guardLines,
      useInfieldShifts,
      useOutfieldShifts,
      shiftOFDepth,
    },
    substitution: {
      hookStartingPitchers,
      hookRelievers,
      lrPitchingMatchups,
      lrBattingMatchups,
      pinchHitForPositionPlayers,
      usePinchRunners,
    },
  };
}
