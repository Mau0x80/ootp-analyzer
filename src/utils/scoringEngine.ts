import type { Player, PlayerScores, ScoringWeights, HitterArchetype, PitcherArchetype, RatingsScale, RatingsScaleInfo, AppSettings } from '../types';
import { RATINGS_SCALES } from '../types';

// ============================================================
// Scoring Engine v2
// Uses advanced stats (wOBA, wRC+, K-BB%, SIERA, etc.) when
// available from super stats CSVs, falling back to basic stats.
// All scores are 0–100 scale.
// ============================================================

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

// Normalize a rating from any OOTP scale to 0-100
export function normRating(val: number, scale: RatingsScaleInfo): number {
  if (val <= 0) return 0;
  // For scales with a non-zero min (like 20-80), map the range linearly
  const range = scale.max - scale.min;
  if (range <= 0) return 0;
  return clamp(((val - scale.min) / range) * 100);
}

// Convert a "reference threshold" (written assuming 20-80 scale) to the user's scale.
// This lets archetype checks work regardless of which scale the user exports.
function scaleThreshold(refVal: number, scale: RatingsScaleInfo): number {
  // refVal is on the 20-80 scout scale; convert to user's scale
  const pct = (refVal - 20) / 60; // normalize 20-80 to 0-1
  return scale.min + pct * (scale.max - scale.min);
}

// ============================================================
// Offensive Score — now uses wOBA, wRC+, wRAA, UBR when available
// ============================================================
function calcOffensiveScore(p: Player, w: ScoringWeights, scale: RatingsScaleInfo): number {
  let ratingScore = 0;
  let statScore = 0;

  if (p.battingRatings) {
    const br = p.battingRatings;
    ratingScore =
      normRating(br.con, scale) * 0.2 +
      normRating(br.pow, scale) * 0.2 +
      normRating(br.eye, scale) * 0.2 +
      normRating(br.gap, scale) * 0.15 +
      normRating(br.spe, scale) * 0.1 +
      normRating(br.ste, scale) * 0.05 +
      normRating(br.babip, scale) * 0.1;
  }

  if (p.battingStats && p.battingStats.pa >= 20) {
    const bs = p.battingStats;

    // Prefer advanced metrics when available (from super stats CSV)
    if (bs.wrcPlus > 0 && bs.wrcPlus !== 100) {
      // wRC+ based scoring: 100 = league avg, 150 = elite
      const wrcScore = clamp(((bs.wrcPlus - 0) / 180) * 100);
      const wobaScore = bs.woba > 0 ? clamp((bs.woba / 0.450) * 100) : 0;
      const wraaScore = clamp(((bs.wraa + 10) / 20) * 100); // -10 to +10 range normalized
      const warScore = clamp((bs.war / 8) * 100);
      const ubrScore = bs.ubr !== 0 ? clamp(((bs.ubr + 3) / 6) * 100) : 50; // -3 to +3 range
      const wsbScore = bs.wsb !== 0 ? clamp(((bs.wsb + 2) / 4) * 100) : 50;

      statScore = wrcScore * 0.30 + wobaScore * 0.25 + warScore * 0.20 +
        wraaScore * 0.15 + ubrScore * 0.05 + wsbScore * 0.05;
    } else {
      // Fallback to basic stats
      const opsScore = clamp((bs.ops / 1.1) * 100);
      const opsPlusScore = clamp((bs.opsPlus / 180) * 100);
      const warScore = clamp((bs.war / 8) * 100);
      const obpScore = clamp((bs.obp / 0.450) * 100);
      statScore = opsScore * 0.25 + opsPlusScore * 0.3 + warScore * 0.25 + obpScore * 0.2;
    }
  }

  const hasStats = p.battingStats && p.battingStats.pa >= 20;
  if (hasStats && ratingScore > 0) {
    return ratingScore * w.ratingsWeight + statScore * w.statsWeight;
  }
  return ratingScore > 0 ? ratingScore : statScore;
}

// ============================================================
// Defensive Score
// ============================================================
function calcDefensiveScore(p: Player, scale: RatingsScaleInfo): number {
  if (!p.fieldingRatings) return 0;
  const fr = p.fieldingRatings;
  const pos = p.pos.toUpperCase();

  if (pos === 'C') return normRating(fr.cAbi, scale) * 0.5 + normRating(fr.cArm, scale) * 0.5;
  if (['SS', '2B', '3B', '1B'].includes(pos)) {
    return normRating(fr.ifRng, scale) * 0.35 + normRating(fr.ifErr, scale) * 0.25 +
      normRating(fr.ifArm, scale) * 0.25 + normRating(fr.tdp, scale) * 0.15;
  }
  if (['LF', 'CF', 'RF'].includes(pos)) {
    return normRating(fr.ofRng, scale) * 0.4 + normRating(fr.ofErr, scale) * 0.3 + normRating(fr.ofArm, scale) * 0.3;
  }
  return 0;
}

export function calcDefensiveScoreForPosition(p: Player, position: string, scale?: RatingsScaleInfo): number {
  if (!p.fieldingRatings) return 0;
  const s = scale || RATINGS_SCALES['20_80'];
  const fr = p.fieldingRatings;
  const pos = position.toUpperCase();

  if (pos === 'C') return normRating(fr.cAbi, s) * 0.5 + normRating(fr.cArm, s) * 0.5;
  if (['SS', '2B', '3B', '1B'].includes(pos)) {
    return normRating(fr.ifRng, s) * 0.35 + normRating(fr.ifErr, s) * 0.25 +
      normRating(fr.ifArm, s) * 0.25 + normRating(fr.tdp, s) * 0.15;
  }
  if (['LF', 'CF', 'RF'].includes(pos)) {
    return normRating(fr.ofRng, s) * 0.4 + normRating(fr.ofErr, s) * 0.3 + normRating(fr.ofArm, s) * 0.3;
  }
  return 0;
}

// ============================================================
// Pitching Score — now uses K-BB%, SIERA, FIP-, rWAR, QS%
// ============================================================
function calcPitchingScore(p: Player, w: ScoringWeights, scale: RatingsScaleInfo): number {
  let ratingScore = 0;
  let statScore = 0;

  if (p.pitchingRatings) {
    const pr = p.pitchingRatings;
    ratingScore =
      normRating(pr.stu, scale) * 0.3 +
      normRating(pr.mov, scale) * 0.25 +
      normRating(pr.con, scale) * 0.2 +
      normRating(pr.hra, scale) * 0.1 +
      normRating(pr.pbabip, scale) * 0.1 +
      normRating(pr.hld, scale) * 0.05;
  }

  if (p.pitchingStats && p.pitchingStats.ip >= 5) {
    const ps = p.pitchingStats;

    // Use advanced metrics when available (from super stats CSV)
    if (ps.kBbPct !== 0 || ps.siera > 0) {
      const kbbScore = clamp((ps.kBbPct / 25) * 100);
      const sieraScore = ps.siera > 0 ? clamp((1 - ps.siera / 6) * 100) : 0;
      const fipMinusScore = ps.fipMinus > 0 ? clamp((1 - ps.fipMinus / 150) * 100) : 0;
      const fipScore = clamp((1 - ps.fip / 8) * 100);
      const eraScore = clamp((1 - ps.era / 8) * 100);
      const warScore = clamp((ps.war / 6) * 100);
      const rwarScore = ps.rwar !== 0 ? clamp((ps.rwar / 6) * 100) : warScore;
      const wpaScore = clamp(((ps.wpa + 2) / 4) * 100);

      statScore =
        kbbScore * 0.20 +
        sieraScore * 0.15 +
        (ps.fipMinus > 0 ? fipMinusScore : fipScore) * 0.15 +
        eraScore * 0.10 +
        ((warScore + rwarScore) / 2) * 0.20 +
        wpaScore * 0.10 +
        clamp((ps.kPct / 35) * 100) * 0.10;
    } else {
      const eraScore = clamp((1 - ps.era / 8) * 100);
      const fipScore = clamp((1 - ps.fip / 8) * 100);
      const whipScore = clamp((1 - ps.whip / 2.5) * 100);
      const k9Score = clamp((ps.k9 / 15) * 100);
      const eraPlusScore = clamp((ps.eraPlus / 250) * 100);
      const warScore = clamp((ps.war / 6) * 100);
      statScore = eraScore * 0.15 + fipScore * 0.2 + whipScore * 0.15 +
        k9Score * 0.15 + eraPlusScore * 0.2 + warScore * 0.15;
    }
  }

  const hasStats = p.pitchingStats && p.pitchingStats.ip >= 5;
  if (hasStats && ratingScore > 0) {
    return ratingScore * w.ratingsWeight + statScore * w.statsWeight;
  }
  return ratingScore > 0 ? ratingScore : statScore;
}

// ============================================================
// Starter / Reliever Scores — enhanced with QS%, IRS%, SD/MD
// ============================================================
function calcStarterScore(p: Player, scale: RatingsScaleInfo): number {
  if (!p.pitchingRatings) return 0;
  const pr = p.pitchingRatings;
  let score = normRating(pr.stm, scale) * 0.25 + normRating(pr.stu, scale) * 0.25 +
    normRating(pr.mov, scale) * 0.2 + normRating(pr.con, scale) * 0.2 + normRating(pr.hra, scale) * 0.1;

  if (p.pitchingStats && p.pitchingStats.gs > 0 && p.pitchingStats.qsPct > 0) {
    const qsBonus = (p.pitchingStats.qsPct / 100) * 15;
    score += qsBonus;
  }
  return clamp(score);
}

function calcRelieverScore(p: Player, scale: RatingsScaleInfo): number {
  if (!p.pitchingRatings) return 0;
  const pr = p.pitchingRatings;
  let score = normRating(pr.stu, scale) * 0.35 + normRating(pr.mov, scale) * 0.2 +
    normRating(pr.con, scale) * 0.15 + normRating(pr.hld, scale) * 0.15 +
    normRating(pr.hra, scale) * 0.1 + normRating(pr.pbabip, scale) * 0.05;

  if (p.pitchingStats) {
    const ps = p.pitchingStats;
    if (ps.sd + ps.md > 0) {
      const sdRatio = ps.sd / (ps.sd + ps.md);
      score += (sdRatio - 0.5) * 20;
    }
    if (ps.ir > 0 && ps.irsPct > 0) {
      const irsBonus = (1 - ps.irsPct / 100) * 10;
      score += irsBonus;
    }
    if (ps.pli > 1.5) score += 5;
  }
  return clamp(score);
}

// ============================================================
// Platoon Scores
// ============================================================
function calcPlatoonVsLHP(p: Player, scale: RatingsScaleInfo): number {
  if (!p.battingRatings) return 0;
  const br = p.battingRatings;
  return normRating(br.conVL, scale) * 0.4 + normRating(br.powVL, scale) * 0.35 + normRating(br.eyeVL, scale) * 0.25;
}

function calcPlatoonVsRHP(p: Player, scale: RatingsScaleInfo): number {
  if (!p.battingRatings) return 0;
  const br = p.battingRatings;
  return normRating(br.conVR, scale) * 0.4 + normRating(br.powVR, scale) * 0.35 + normRating(br.eyeVR, scale) * 0.25;
}

// ============================================================
// Positional Flexibility
// ============================================================
function calcFlexibility(p: Player): number {
  const count = p.eligiblePositions.filter((pos) => pos !== 'P' && pos !== 'DH').length;
  return clamp((count / 6) * 100);
}

// ============================================================
// Hitter Archetype Classification
// All rating thresholds are written in 20-80 scout scale and
// converted dynamically to whatever scale the user has selected.
// ============================================================
function classifyHitter(p: Player, scale: RatingsScaleInfo): HitterArchetype | null {
  if (p.isPitcher && !p.isTwoWay) return null;

  const bs = p.battingStats;
  const br = p.battingRatings;
  if (!br && !bs) return null;
  if (bs && bs.pa < 20 && !br) return 'Developing';

  const hasSuperStats = bs && bs.woba > 0 && bs.pa >= 20;

  if (hasSuperStats && bs) {
    const highBBPct = bs.bbPct >= 10;
    const lowKPct = bs.kPct <= 18;
    const highWoba = bs.woba >= 0.340;
    const highSlg = bs.slg >= 0.450;
    const highIso = bs.iso >= 0.180;
    const highAvg = bs.avg >= 0.270;
    const weakSlg = bs.slg < 0.380;
    const goodWrcPlus = bs.wrcPlus >= 120;
    const highObp = bs.obp >= 0.360;

    if (highBBPct && (highWoba || highSlg) && highIso) return 'Patient Slugger';
    if (highObp && highBBPct && !highIso) return 'OBP Machine';
    if (highAvg && lowKPct && !highIso) return 'Contact Hitter';
    if (highIso && highSlg && bs.kPct >= 25) return 'Power Masher';
    if (bs.rbi >= 15 && bs.wpa > 0.5 && bs.slg >= 0.400) return 'Run Producer';
    if (bs.avg >= 0.250 && weakSlg) return 'Empty Average';
    if (bs.sb >= 10 || (bs.sbPct >= 70 && bs.sb >= 5)) return 'Speed Threat';
    if (goodWrcPlus) return 'Balanced Hitter';
    if (bs.wrcPlus < 85) return 'Bench Bat';
    return 'Balanced Hitter';
  }

  // Ratings-based classification — thresholds scaled from 20-80 reference
  if (br) {
    const highPow = br.pow >= scaleThreshold(60, scale);   // 60 on 20-80 = "good"
    const highCon = br.con >= scaleThreshold(60, scale);
    const highEye = br.eye >= scaleThreshold(60, scale);
    const highSpe = br.spe >= scaleThreshold(55, scale);
    const highSte = br.ste >= scaleThreshold(55, scale);
    const lowKs = br.ks <= scaleThreshold(45, scale);
    const lowPow = br.pow < scaleThreshold(40, scale);
    const goodOvr = br.ovr >= scaleThreshold(55, scale);

    if (highEye && highPow) return 'Patient Slugger';
    if (highEye && !highPow && highCon) return 'OBP Machine';
    if (highCon && !highPow && lowKs) return 'Contact Hitter';
    if (highPow && !highCon && br.ks >= scaleThreshold(60, scale)) return 'Power Masher';
    if (highSpe && highSte) return 'Speed Threat';
    if (highCon && lowPow) return 'Empty Average';
    if (goodOvr) return 'Balanced Hitter';
    return 'Bench Bat';
  }

  return 'Developing';
}

// ============================================================
// Pitcher Archetype Classification
// ============================================================
function classifyPitcher(p: Player, scale: RatingsScaleInfo): PitcherArchetype | null {
  if (!p.isPitcher) return null;

  const pr = p.pitchingRatings;
  const ps = p.pitchingStats;
  const pos = p.pos.toUpperCase();

  if (ps && ps.ip >= 10 && ps.kBbPct !== undefined) {
    const isStarter = pos === 'SP' || ps.gs >= 3;
    const strongKBB = ps.kBbPct >= 15;
    const eliteKBB = ps.kBbPct >= 20;
    const goodFIP = ps.fip <= 3.00;
    const strongK = ps.kPct >= 25;

    if (isStarter) {
      if (eliteKBB && goodFIP) return 'Ace';
      if (strongKBB || (ps.fip <= 3.50 && ps.qsPct >= 50)) return 'No. 2/3 Starter';
      if (ps.ip >= 50 && ps.era <= 4.50 && !strongKBB) return 'Innings Eater';
      return 'Back-End Starter';
    } else {
      if (ps.pli > 1.5 && ps.ir > 3 && ps.irsPct <= 25) return 'Fireman';
      if (strongK && strongKBB) return 'Setup/Closer';
      if (ps.kBbPct >= 8) return 'Middle Reliever';
      return 'Mop-Up';
    }
  }

  // Ratings-based classification — thresholds scaled
  if (pr) {
    const isStarter = pos === 'SP' || pr.stm >= scaleThreshold(50, scale);
    if (isStarter) {
      if (pr.stu >= scaleThreshold(65, scale) && pr.mov >= scaleThreshold(55, scale) && pr.con >= scaleThreshold(55, scale)) return 'Ace';
      if (pr.stu >= scaleThreshold(55, scale) || (pr.mov >= scaleThreshold(55, scale) && pr.con >= scaleThreshold(55, scale))) return 'No. 2/3 Starter';
      if (pr.stm >= scaleThreshold(55, scale) && pr.con >= scaleThreshold(50, scale)) return 'Innings Eater';
      return 'Back-End Starter';
    } else {
      if (pr.stu >= scaleThreshold(60, scale) && pr.hld >= scaleThreshold(40, scale)) return 'Setup/Closer';
      if (pr.hld >= scaleThreshold(55, scale) && pr.con >= scaleThreshold(55, scale)) return 'Fireman';
      if (pr.stu >= scaleThreshold(50, scale)) return 'Middle Reliever';
      return 'Mop-Up';
    }
  }

  return 'Developing';
}

// ============================================================
// Main: Score all players
// ============================================================
export function scoreAllPlayers(players: Player[], settings: AppSettings): Player[] {
  const scale = RATINGS_SCALES[settings.currentRatingsScale];

  return players.map((p) => {
    const offensiveScore = calcOffensiveScore(p, settings, scale);
    const defensiveScore = calcDefensiveScore(p, scale);
    const pitchingScore = calcPitchingScore(p, settings, scale);
    const platoonVsLHP = calcPlatoonVsLHP(p, scale);
    const platoonVsRHP = calcPlatoonVsRHP(p, scale);
    const starterScore = calcStarterScore(p, scale);
    const relieverScore = calcRelieverScore(p, scale);
    const positionalFlexibility = calcFlexibility(p);

    const lineupFitScore = p.isPitcher
      ? 0
      : offensiveScore * settings.offensiveWeight +
        defensiveScore * settings.defensiveWeight +
        positionalFlexibility * settings.versatilityWeight;

    const overallValue = p.isPitcher
      ? pitchingScore * 0.8 + defensiveScore * 0.05 + positionalFlexibility * 0.15
      : lineupFitScore;

    const scores: PlayerScores = {
      offensiveScore: Math.round(offensiveScore * 10) / 10,
      defensiveScore: Math.round(defensiveScore * 10) / 10,
      pitchingScore: Math.round(pitchingScore * 10) / 10,
      lineupFitScore: Math.round(lineupFitScore * 10) / 10,
      platoonVsLHP: Math.round(platoonVsLHP * 10) / 10,
      platoonVsRHP: Math.round(platoonVsRHP * 10) / 10,
      starterScore: Math.round(starterScore * 10) / 10,
      relieverScore: Math.round(relieverScore * 10) / 10,
      positionalFlexibility: Math.round(positionalFlexibility * 10) / 10,
      overallValue: Math.round(overallValue * 10) / 10,
    };

    return {
      ...p,
      scores,
      hitterArchetype: classifyHitter({ ...p, scores }, scale),
      pitcherArchetype: classifyPitcher({ ...p, scores }, scale),
    };
  });
}
