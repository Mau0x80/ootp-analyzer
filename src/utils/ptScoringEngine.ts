import type {
  Player, PlayerScores, ScoringProfile, RatingsScaleInfo,
  ArtifactBoost, BattingRatings, PitchingRatings, FieldingRatings,
  HitterArchetype, PitcherArchetype,
} from '../types';
import { RATINGS_SCALES, getCardTier } from '../types';
import { normRating } from './scoringEngine';
import { PT27_META_PROFILE } from './scoringProfiles';

// ============================================================
// Perfect Team Scoring Engine
// Uses ScoringProfile weights instead of hard-coded values.
// Completely separate from the franchise scoringEngine.ts.
// ============================================================

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

const PITCHER_POSITIONS = new Set(['SP', 'RP', 'CL', 'MR', 'LR', 'SU']);

// ============================================================
// Offensive Score — profile-weighted
// ============================================================
function calcOffensiveScore(p: Player, profile: ScoringProfile, scale: RatingsScaleInfo): number {
  if (!p.battingRatings) return 0;
  const br = p.battingRatings;
  const w = profile.offensiveWeights;
  return (
    normRating(br.con, scale) * w.con +
    normRating(br.pow, scale) * w.pow +
    normRating(br.eye, scale) * w.eye +
    normRating(br.gap, scale) * w.gap +
    normRating(br.spe, scale) * w.spe +
    normRating(br.ste, scale) * w.ste +
    normRating(br.babip, scale) * w.babip
  );
}

// ============================================================
// Defensive Score — profile-weighted, position-dependent
// ============================================================
function calcDefensiveScore(p: Player, profile: ScoringProfile, scale: RatingsScaleInfo): number {
  if (!p.fieldingRatings) return 0;
  const fr = p.fieldingRatings;
  const pos = p.pos.toUpperCase();

  if (pos === 'C') {
    const w = profile.defensiveWeights.catcher;
    return normRating(fr.cAbi, scale) * w.cAbi + normRating(fr.cArm, scale) * w.cArm;
  }
  if (['SS', '2B', '3B', '1B'].includes(pos)) {
    const w = profile.defensiveWeights.infield;
    return (
      normRating(fr.ifRng, scale) * w.ifRng +
      normRating(fr.ifErr, scale) * w.ifErr +
      normRating(fr.ifArm, scale) * w.ifArm +
      normRating(fr.tdp, scale) * w.tdp
    );
  }
  if (['LF', 'CF', 'RF'].includes(pos)) {
    const w = profile.defensiveWeights.outfield;
    return (
      normRating(fr.ofRng, scale) * w.ofRng +
      normRating(fr.ofErr, scale) * w.ofErr +
      normRating(fr.ofArm, scale) * w.ofArm
    );
  }
  return 0;
}

// ============================================================
// Pitching Score — starter vs reliever weights
// ============================================================
function calcPitchingScore(p: Player, profile: ScoringProfile, scale: RatingsScaleInfo): number {
  if (!p.pitchingRatings) return 0;
  const pr = p.pitchingRatings;
  const isReliever = PITCHER_POSITIONS.has(p.pos.toUpperCase()) && p.pos.toUpperCase() !== 'SP';
  const w = isReliever ? profile.relieverWeights : profile.pitchingWeights;

  return (
    normRating(pr.stu, scale) * w.stu +
    normRating(pr.mov, scale) * w.mov +
    normRating(pr.con, scale) * w.con +
    normRating(pr.hra, scale) * w.hra +
    normRating(pr.pbabip, scale) * w.pbabip +
    normRating(pr.hld, scale) * w.hld
  );
}

// ============================================================
// Starter / Reliever Scores
// ============================================================
function calcStarterScore(p: Player, profile: ScoringProfile, scale: RatingsScaleInfo): number {
  if (!p.pitchingRatings) return 0;
  const pr = p.pitchingRatings;
  const w = profile.pitchingWeights;
  return (
    normRating(pr.stm, scale) * 0.20 +
    normRating(pr.stu, scale) * w.stu +
    normRating(pr.mov, scale) * w.mov +
    normRating(pr.con, scale) * w.con +
    normRating(pr.hra, scale) * (w.hra + w.pbabip)
  );
}

function calcRelieverScore(p: Player, profile: ScoringProfile, scale: RatingsScaleInfo): number {
  if (!p.pitchingRatings) return 0;
  const pr = p.pitchingRatings;
  const w = profile.relieverWeights;
  return (
    normRating(pr.stu, scale) * w.stu +
    normRating(pr.mov, scale) * w.mov +
    normRating(pr.con, scale) * w.con +
    normRating(pr.hld, scale) * w.hld +
    normRating(pr.hra, scale) * w.hra +
    normRating(pr.pbabip, scale) * w.pbabip
  );
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
// Artifact Application
// Clones ratings, applies boosts, does NOT change cardOvr.
// ============================================================
export function applyArtifacts(
  player: Player,
  boosts: ArtifactBoost[],
  scale: RatingsScaleInfo,
  profile: ScoringProfile
): Player {
  if (boosts.length === 0) {
    return {
      ...player,
      artifactBoosts: [],
      effectiveBattingRatings: null,
      effectivePitchingRatings: null,
      effectiveFieldingRatings: null,
      effectiveScores: player.scores,
      hiddenPotentialGap: 0,
    };
  }

  const effBat: BattingRatings | null = player.battingRatings ? { ...player.battingRatings } : null;
  const effPit: PitchingRatings | null = player.pitchingRatings ? { ...player.pitchingRatings } : null;
  const effFld: FieldingRatings | null = player.fieldingRatings ? { ...player.fieldingRatings } : null;

  for (const { attribute, boost } of boosts) {
    // Apply to batting ratings
    if (effBat && attribute in effBat) {
      const key = attribute as keyof BattingRatings;
      const current = effBat[key];
      if (typeof current === 'number') {
        (effBat as any)[key] = Math.min(scale.max, current + boost);
      }
    }
    // Apply to pitching ratings
    if (effPit && attribute in effPit) {
      const key = attribute as keyof PitchingRatings;
      const current = effPit[key];
      if (typeof current === 'number') {
        (effPit as any)[key] = Math.min(scale.max, current + boost);
      }
    }
    // Apply to fielding ratings
    if (effFld && attribute in effFld) {
      const key = attribute as keyof FieldingRatings;
      const current = effFld[key];
      if (typeof current === 'number') {
        (effFld as any)[key] = Math.min(scale.max, current + boost);
      }
    }
  }

  // Create a temporary player with effective ratings to score
  const tempPlayer: Player = {
    ...player,
    battingRatings: effBat,
    pitchingRatings: effPit,
    fieldingRatings: effFld,
  };

  const effectiveScores = computeScores(tempPlayer, profile, scale);

  return {
    ...player,
    artifactBoosts: boosts,
    effectiveBattingRatings: effBat,
    effectivePitchingRatings: effPit,
    effectiveFieldingRatings: effFld,
    effectiveScores,
    hiddenPotentialGap: Math.round((effectiveScores.overallValue - player.scores.overallValue) * 10) / 10,
  };
}

// ============================================================
// Score computation helper
// ============================================================
function computeScores(p: Player, profile: ScoringProfile, scale: RatingsScaleInfo): PlayerScores {
  const offensiveScore = calcOffensiveScore(p, profile, scale);
  const defensiveScore = calcDefensiveScore(p, profile, scale);
  const pitchingScore = calcPitchingScore(p, profile, scale);
  const platoonVsLHP = calcPlatoonVsLHP(p, scale);
  const platoonVsRHP = calcPlatoonVsRHP(p, scale);
  const starterScore = calcStarterScore(p, profile, scale);
  const relieverScore = calcRelieverScore(p, profile, scale);
  const positionalFlexibility = calcFlexibility(p);

  const lineupFitScore = p.isPitcher
    ? 0
    : offensiveScore * 0.55 + defensiveScore * 0.35 + positionalFlexibility * 0.10;

  const overallValue = p.isPitcher
    ? pitchingScore * 0.85 + defensiveScore * 0.05 + positionalFlexibility * 0.10
    : lineupFitScore;

  return {
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
}

// ============================================================
// Main: Score all players with PT profile
// ============================================================
export function ptScoreAllPlayers(
  players: Player[],
  scaleKey: string,
  profile?: ScoringProfile
): Player[] {
  const scale = RATINGS_SCALES[scaleKey as keyof typeof RATINGS_SCALES] || RATINGS_SCALES['20_80'];
  const p = profile || PT27_META_PROFILE;

  return players.map((player) => {
    const scores = computeScores(player, p, scale);
    return {
      ...player,
      scores,
      cardOvr: Math.max(player.battingRatings?.ovr ?? 0, player.pitchingRatings?.ovr ?? 0),
      cardTier: getCardTier(Math.max(player.battingRatings?.ovr ?? 0, player.pitchingRatings?.ovr ?? 0)),
    };
  });
}

// ============================================================
// Sleeper detection
// ============================================================
export function findSleeperCards(
  players: Player[],
  tierFilter: string[],
  topN: number = 10
): Player[] {
  return players
    .filter((p) => tierFilter.length === 0 || tierFilter.includes(p.cardTier))
    .filter((p) => p.hiddenPotentialGap > 0)
    .sort((a, b) => b.hiddenPotentialGap - a.hiddenPotentialGap)
    .slice(0, topN);
}
