import type { Player, PlayerBase, BattingRatings, PitchingRatings, FieldingRatings, PositionRatings, BattingStats, PitchingStats, PlayerScores } from '../types';
import { getCardTier } from '../types';

// ============================================================
// Player Merger
// Combines data from multiple CSV files into unified Player objects.
// Matching is done primarily by Name, with fallback to # and POS.
// Super stats CSVs override basic stats (they are a superset).
// ============================================================

interface RawPlayerData {
  base: PlayerBase;
  battingRatings?: BattingRatings;
  pitchingRatings?: PitchingRatings;
  fieldingRatings?: FieldingRatings;
  positionRatings?: PositionRatings;
  battingStats?: BattingStats;
  pitchingStats?: PitchingStats;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeKey(base: PlayerBase): string {
  return normalizeName(base.name);
}

export function mergePlayers(datasets: {
  battingRatings?: { base: PlayerBase; data: BattingRatings }[];
  pitchingRatings?: { base: PlayerBase; data: PitchingRatings }[];
  fieldingRatings?: { base: PlayerBase; data: FieldingRatings }[];
  positionRatings?: { base: PlayerBase; data: PositionRatings }[];
  battingStats?: { base: PlayerBase; data: BattingStats }[];
  pitchingStats?: { base: PlayerBase; data: PitchingStats }[];
  battingSuperStats?: { base: PlayerBase; data: BattingStats }[];
  pitchingSuperStats?: { base: PlayerBase; data: PitchingStats }[];
}): Player[] {
  const playerMap = new Map<string, RawPlayerData>();

  function getOrCreate(base: PlayerBase): RawPlayerData {
    const key = makeKey(base);
    if (!playerMap.has(key)) {
      playerMap.set(key, { base });
    }
    const existing = playerMap.get(key)!;
    if (base.age > 0 && existing.base.age === 0) {
      existing.base = { ...existing.base, ...base };
    }
    return existing;
  }

  datasets.battingRatings?.forEach(({ base, data }) => {
    getOrCreate(base).battingRatings = data;
  });
  datasets.pitchingRatings?.forEach(({ base, data }) => {
    getOrCreate(base).pitchingRatings = data;
  });
  datasets.fieldingRatings?.forEach(({ base, data }) => {
    getOrCreate(base).fieldingRatings = data;
  });
  datasets.positionRatings?.forEach(({ base, data }) => {
    getOrCreate(base).positionRatings = data;
  });
  // Basic stats first
  datasets.battingStats?.forEach(({ base, data }) => {
    getOrCreate(base).battingStats = data;
  });
  datasets.pitchingStats?.forEach(({ base, data }) => {
    getOrCreate(base).pitchingStats = data;
  });
  // Super stats override basic stats (superset with more fields)
  datasets.battingSuperStats?.forEach(({ base, data }) => {
    getOrCreate(base).battingStats = data;
  });
  datasets.pitchingSuperStats?.forEach(({ base, data }) => {
    getOrCreate(base).pitchingStats = data;
  });

  return Array.from(playerMap.values()).map(buildPlayer);
}

const PITCHER_POSITIONS = new Set(['SP', 'RP', 'CL', 'MR', 'LR', 'SU']);

function buildPlayer(raw: RawPlayerData): Player {
  const { base } = raw;
  const pos = base.pos.toUpperCase();
  const isPitcher = PITCHER_POSITIONS.has(pos);

  const eligiblePositions: string[] = [];
  if (raw.positionRatings) {
    const pr = raw.positionRatings;
    const posMap: [string, number][] = [
      ['P', pr.p], ['C', pr.c], ['1B', pr['1b']], ['2B', pr['2b']],
      ['3B', pr['3b']], ['SS', pr.ss], ['LF', pr.lf], ['CF', pr.cf], ['RF', pr.rf],
    ];
    posMap.forEach(([p, val]) => {
      if (val > 0) eligiblePositions.push(p);
    });
  }
  if (eligiblePositions.length === 0) {
    eligiblePositions.push(pos);
  }

  const isPositionPlayer = !isPitcher || eligiblePositions.some(
    (p) => !PITCHER_POSITIONS.has(p) && p !== 'P'
  );
  const isTwoWay = isPitcher && isPositionPlayer && eligiblePositions.length > 1;

  const id = `${normalizeName(base.name)}-${base.number}`;

  const emptyScores: PlayerScores = {
    offensiveScore: 0, defensiveScore: 0, pitchingScore: 0,
    lineupFitScore: 0, platoonVsLHP: 0, platoonVsRHP: 0,
    starterScore: 0, relieverScore: 0, positionalFlexibility: 0,
    overallValue: 0,
  };

  const cardOvr = Math.max(raw.battingRatings?.ovr ?? 0, raw.pitchingRatings?.ovr ?? 0);

  return {
    ...base,
    id,
    battingRatings: raw.battingRatings || null,
    pitchingRatings: raw.pitchingRatings || null,
    fieldingRatings: raw.fieldingRatings || null,
    positionRatings: raw.positionRatings || null,
    battingStats: raw.battingStats || null,
    pitchingStats: raw.pitchingStats || null,
    isPitcher,
    isPositionPlayer: !isPitcher || isTwoWay,
    isTwoWay,
    eligiblePositions,
    scores: emptyScores,
    hitterArchetype: null,
    pitcherArchetype: null,
    percentiles: {},
    // PT fields (populated by ptScoringEngine when in PT mode)
    cardOvr,
    cardTier: getCardTier(cardOvr),
    artifactBoosts: [],
    effectiveBattingRatings: null,
    effectivePitchingRatings: null,
    effectiveFieldingRatings: null,
    effectiveScores: emptyScores,
    hiddenPotentialGap: 0,
  };
}
