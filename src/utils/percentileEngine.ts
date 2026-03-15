import type { Player, PlayerPercentiles } from '../types';

// Calculate percentile rank for a value within a sorted array
function percentileRank(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return 50;
  let count = 0;
  for (const v of sortedValues) {
    if (v < value) count++;
    else if (v === value) count += 0.5;
  }
  return Math.round((count / sortedValues.length) * 100);
}

// For inverted stats (lower is better: ERA, FIP, WHIP, SIERA, K%)
function invertedPercentileRank(value: number, sortedValues: number[]): number {
  return 100 - percentileRank(value, sortedValues);
}

// Extract and sort values from a subset of players
function extractSorted(players: Player[], getter: (p: Player) => number | undefined): number[] {
  return players
    .map(getter)
    .filter((v): v is number => v !== undefined && !isNaN(v))
    .sort((a, b) => a - b);
}

export function calcPercentiles(players: Player[]): Player[] {
  // Split into batters (with PA) and pitchers (with IP)
  const battersWithPA = players.filter(
    (p) => (!p.isPitcher || p.isTwoWay) && p.battingStats && p.battingStats.pa >= 20
  );
  const pitchersWithIP = players.filter(
    (p) => p.isPitcher && p.pitchingStats && p.pitchingStats.ip >= 5
  );

  // Pre-compute sorted arrays for batting stats
  const battingSorted = {
    offensiveScore: extractSorted(battersWithPA, (p) => p.scores.offensiveScore),
    defensiveScore: extractSorted(battersWithPA, (p) => p.scores.defensiveScore),
    ops: extractSorted(battersWithPA, (p) => p.battingStats?.ops),
    opsPlus: extractSorted(battersWithPA, (p) => p.battingStats?.opsPlus),
    woba: extractSorted(battersWithPA, (p) => p.battingStats?.woba && p.battingStats.woba > 0 ? p.battingStats.woba : undefined),
    wrcPlus: extractSorted(battersWithPA, (p) => p.battingStats?.wrcPlus && p.battingStats.wrcPlus > 0 ? p.battingStats.wrcPlus : undefined),
    war: extractSorted(battersWithPA, (p) => p.battingStats?.war),
    iso: extractSorted(battersWithPA, (p) => p.battingStats?.iso),
    bbPct: extractSorted(battersWithPA, (p) => p.battingStats?.bbPct),
    kPct: extractSorted(battersWithPA, (p) => p.battingStats?.kPct),
    avg: extractSorted(battersWithPA, (p) => p.battingStats?.avg),
  };

  // Pre-compute sorted arrays for pitching stats
  const pitchingSorted = {
    pitchingScore: extractSorted(pitchersWithIP, (p) => p.scores.pitchingScore),
    era: extractSorted(pitchersWithIP, (p) => p.pitchingStats?.era),
    fip: extractSorted(pitchersWithIP, (p) => p.pitchingStats?.fip),
    whip: extractSorted(pitchersWithIP, (p) => p.pitchingStats?.whip),
    kBbPct: extractSorted(pitchersWithIP, (p) => p.pitchingStats?.kBbPct),
    siera: extractSorted(pitchersWithIP, (p) => p.pitchingStats?.siera && p.pitchingStats.siera > 0 ? p.pitchingStats.siera : undefined),
    k9: extractSorted(pitchersWithIP, (p) => p.pitchingStats?.k9),
    pitchWar: extractSorted(pitchersWithIP, (p) => p.pitchingStats?.war),
  };

  // Overall value for all players
  const overallSorted = extractSorted(players, (p) => p.scores.overallValue);

  return players.map((p) => {
    const percentiles: PlayerPercentiles = {
      overallValue: percentileRank(p.scores.overallValue, overallSorted),
    };

    // Batting percentiles
    if ((!p.isPitcher || p.isTwoWay) && p.battingStats && p.battingStats.pa >= 20) {
      const bs = p.battingStats;
      percentiles.offensiveScore = percentileRank(p.scores.offensiveScore, battingSorted.offensiveScore);
      percentiles.defensiveScore = percentileRank(p.scores.defensiveScore, battingSorted.defensiveScore);
      percentiles.ops = percentileRank(bs.ops, battingSorted.ops);
      percentiles.opsPlus = percentileRank(bs.opsPlus, battingSorted.opsPlus);
      percentiles.war = percentileRank(bs.war, battingSorted.war);
      percentiles.iso = percentileRank(bs.iso, battingSorted.iso);
      percentiles.bbPct = percentileRank(bs.bbPct, battingSorted.bbPct);
      percentiles.kPct = invertedPercentileRank(bs.kPct, battingSorted.kPct);
      percentiles.avg = percentileRank(bs.avg, battingSorted.avg);
      if (bs.woba > 0) percentiles.woba = percentileRank(bs.woba, battingSorted.woba);
      if (bs.wrcPlus > 0) percentiles.wrcPlus = percentileRank(bs.wrcPlus, battingSorted.wrcPlus);
    }

    // Pitching percentiles
    if (p.isPitcher && p.pitchingStats && p.pitchingStats.ip >= 5) {
      const ps = p.pitchingStats;
      percentiles.pitchingScore = percentileRank(p.scores.pitchingScore, pitchingSorted.pitchingScore);
      percentiles.era = invertedPercentileRank(ps.era, pitchingSorted.era);
      percentiles.fip = invertedPercentileRank(ps.fip, pitchingSorted.fip);
      percentiles.whip = invertedPercentileRank(ps.whip, pitchingSorted.whip);
      percentiles.k9 = percentileRank(ps.k9, pitchingSorted.k9);
      percentiles.pitchWar = percentileRank(ps.war, pitchingSorted.pitchWar);
      if (ps.kBbPct !== 0) percentiles.kBbPct = percentileRank(ps.kBbPct, pitchingSorted.kBbPct);
      if (ps.siera > 0) percentiles.siera = invertedPercentileRank(ps.siera, pitchingSorted.siera);
    }

    return { ...p, percentiles };
  });
}
