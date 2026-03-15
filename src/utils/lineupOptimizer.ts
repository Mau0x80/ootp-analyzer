import type { Player, Lineup, LineupSlot, ScoringWeights, PitchingStaff } from '../types';
import { calcDefensiveScoreForPosition } from './scoringEngine';

// ============================================================
// Lineup Optimizer
// Assigns players to positions maximizing total team value.
// Uses a greedy assignment approach with position eligibility.
//
// Assumptions:
// - Standard 9-position lineup (C, 1B, 2B, 3B, SS, LF, CF, RF, DH)
// - DH is optional (configurable)
// - Players can only play eligible positions unless allowOutOfPosition is set
// - Premium defensive positions (C, SS, CF) weight defense higher
// ============================================================

const LINEUP_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const LINEUP_POSITIONS_NO_DH = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

// Position-specific defense weight multipliers (higher = defense matters more)
const POSITION_DEF_IMPORTANCE: Record<string, number> = {
  C: 0.7, SS: 0.65, CF: 0.6, '2B': 0.5, '3B': 0.45,
  RF: 0.4, LF: 0.3, '1B': 0.2, DH: 0,
};

function isEligible(player: Player, position: string, allowOOP: boolean): boolean {
  if (position === 'DH') return true; // Anyone can DH
  if (allowOOP) return true;
  const posUpper = position.toUpperCase();
  return player.eligiblePositions.some((p) => p.toUpperCase() === posUpper);
}

// Score a player at a given position for lineup purposes
function playerPositionScore(
  player: Player,
  position: string,
  mode: 'general' | 'vs_rhp' | 'vs_lhp' | 'defense' | 'balanced',
  weights: ScoringWeights
): number {
  const defImportance = POSITION_DEF_IMPORTANCE[position] ?? 0.3;
  const defScore = calcDefensiveScoreForPosition(player, position);

  let offScore = player.scores.offensiveScore;
  if (mode === 'vs_rhp') offScore = player.scores.platoonVsRHP;
  if (mode === 'vs_lhp') offScore = player.scores.platoonVsLHP;

  if (mode === 'defense') {
    return defScore * 0.85 + offScore * 0.15;
  }
  if (mode === 'balanced') {
    const dw = defImportance;
    return offScore * (1 - dw) + defScore * dw;
  }
  // general, vs_rhp, vs_lhp: offense-heavy but factor in defense for premium positions
  const dw = defImportance * weights.defensiveWeight;
  return offScore * (1 - dw) + defScore * dw;
}

// ============================================================
// Greedy lineup assignment
// For each position (in priority order), assign the best available player.
// Priority: premium defense positions first.
// ============================================================
const POSITION_PRIORITY = ['C', 'SS', 'CF', '2B', '3B', 'RF', 'LF', '1B', 'DH'];

export function generateLineup(
  players: Player[],
  mode: 'general' | 'vs_rhp' | 'vs_lhp' | 'defense' | 'balanced',
  weights: ScoringWeights,
  useDH: boolean,
  allowOOP: boolean
): Lineup {
  const positionPlayers = players.filter((p) => !p.isPitcher || p.isTwoWay);
  const positions = useDH ? LINEUP_POSITIONS : LINEUP_POSITIONS_NO_DH;
  const priority = POSITION_PRIORITY.filter((p) => positions.includes(p));

  const assigned = new Set<string>(); // player IDs
  const slots: LineupSlot[] = [];

  for (const pos of priority) {
    // Find best available eligible player for this position
    let bestPlayer: Player | null = null;
    let bestScore = -Infinity;

    for (const player of positionPlayers) {
      if (assigned.has(player.id)) continue;
      if (!isEligible(player, pos, allowOOP)) continue;

      const score = playerPositionScore(player, pos, mode, weights);
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = player;
      }
    }

    if (bestPlayer) {
      assigned.add(bestPlayer.id);
      const isOOP = !bestPlayer.eligiblePositions.some(
        (p) => p.toUpperCase() === pos.toUpperCase()
      ) && pos !== 'DH';
      slots.push({
        position: pos,
        player: bestPlayer,
        score: Math.round(bestScore * 10) / 10,
        outOfPosition: isOOP,
      });
    }
  }

  // Bench: remaining position players sorted by overall value
  const bench = positionPlayers
    .filter((p) => !assigned.has(p.id))
    .sort((a, b) => b.scores.overallValue - a.scores.overallValue);

  // Batting order optimization
  const battingOrder = optimizeBattingOrder(slots, mode);

  const totalOffense = slots.reduce((sum, s) => sum + s.player.scores.offensiveScore, 0);
  const totalDefense = slots.reduce(
    (sum, s) => sum + calcDefensiveScoreForPosition(s.player, s.position),
    0
  );

  return {
    type: mode,
    slots,
    bench,
    battingOrder,
    totalOffense: Math.round(totalOffense * 10) / 10,
    totalDefense: Math.round(totalDefense * 10) / 10,
  };
}

// ============================================================
// Batting Order Optimizer
// Assigns lineup spots 1-9 based on player profiles:
// 1: High OBP, speed, contact
// 2: Best all-around hitter (high OBP + power)
// 3: Best hitter overall
// 4: Power hitter (cleanup)
// 5: Second-best power
// 6-7: Middle hitters
// 8-9: Weakest bats (9 often pitcher spot in NL)
// ============================================================
function optimizeBattingOrder(
  slots: LineupSlot[],
  mode: 'general' | 'vs_rhp' | 'vs_lhp' | 'defense' | 'balanced'
): LineupSlot[] {
  if (slots.length === 0) return [];

  // Create scoring functions for batting order
  const getOff = (s: LineupSlot) => {
    if (mode === 'vs_lhp') return s.player.scores.platoonVsLHP;
    if (mode === 'vs_rhp') return s.player.scores.platoonVsRHP;
    return s.player.scores.offensiveScore;
  };

  const getObp = (s: LineupSlot) => {
    const br = s.player.battingRatings;
    if (!br) return 0;
    return (br.con + br.eye) / 2;
  };

  const getPow = (s: LineupSlot) => {
    const br = s.player.battingRatings;
    if (!br) return 0;
    return (br.pow + br.gap) / 2;
  };

  const getSpeed = (s: LineupSlot) => {
    const br = s.player.battingRatings;
    return br?.spe ?? 0;
  };

  // Leadoff (1): OBP + speed
  // 2: OBP + overall
  // 3: Best overall
  // 4: Power
  // 5: Power + contact
  // 6-7: remaining by overall
  // 8-9: weakest

  const available = [...slots];
  const order: LineupSlot[] = new Array(slots.length);

  function pickBest(scoreFn: (s: LineupSlot) => number): LineupSlot {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < available.length; i++) {
      const score = scoreFn(available[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    return available.splice(bestIdx, 1)[0];
  }

  const count = slots.length;

  // 1 - Leadoff: OBP + speed
  if (available.length > 0)
    order[0] = pickBest((s) => getObp(s) * 0.5 + getSpeed(s) * 0.3 + getOff(s) * 0.2);
  // 3 - Best overall hitter
  if (available.length > 0)
    order[2] = pickBest((s) => getOff(s) * 0.5 + getPow(s) * 0.3 + getObp(s) * 0.2);
  // 4 - Cleanup: power
  if (available.length > 0)
    order[3] = pickBest((s) => getPow(s) * 0.5 + getOff(s) * 0.35 + getObp(s) * 0.15);
  // 2 - Second best OBP + overall
  if (available.length > 0)
    order[1] = pickBest((s) => getObp(s) * 0.4 + getOff(s) * 0.4 + getPow(s) * 0.2);
  // 5 - Second power
  if (available.length > 0)
    order[4] = pickBest((s) => getPow(s) * 0.4 + getOff(s) * 0.4 + getObp(s) * 0.2);

  // Fill remaining spots 6-9 (indices 5+) by overall offense descending
  const remaining = available.sort((a, b) => getOff(b) - getOff(a));
  let idx = 5;
  for (const slot of remaining) {
    if (idx < count) {
      order[idx] = slot;
      idx++;
    }
  }

  return order.filter(Boolean);
}

// ============================================================
// Pitching Staff Optimizer
// ============================================================
export function generatePitchingStaff(players: Player[]): PitchingStaff {
  const pitchers = players
    .filter((p) => p.isPitcher)
    .sort((a, b) => b.scores.pitchingScore - a.scores.pitchingScore);

  // Separate by profile
  const starterCandidates = pitchers
    .filter((p) => {
      const pos = p.pos.toUpperCase();
      if (pos === 'SP') return true;
      // Also consider RP with high stamina as potential starters
      if (p.pitchingRatings && p.pitchingRatings.stm >= 50) return true;
      return false;
    })
    .sort((a, b) => b.scores.starterScore - a.scores.starterScore);

  const relieverCandidates = pitchers
    .filter((p) => {
      const pos = p.pos.toUpperCase();
      return pos === 'RP' || pos === 'CL' || pos === 'MR' || pos === 'LR' || pos === 'SU';
    })
    .sort((a, b) => b.scores.relieverScore - a.scores.relieverScore);

  // Build rotation (top 5 starters)
  const rotation = starterCandidates.slice(0, 5);
  const usedIds = new Set(rotation.map((p) => p.id));

  // From remaining pitchers, build bullpen
  const bullpenCandidates = relieverCandidates.filter((p) => !usedIds.has(p.id));

  // Closer: highest reliever score among CL candidates, or best reliever
  const closerCandidates = bullpenCandidates.filter((p) => p.pos.toUpperCase() === 'CL');
  const closer = closerCandidates.length > 0
    ? closerCandidates[0]
    : bullpenCandidates[0] || null;

  if (closer) usedIds.add(closer.id);

  const remainingBullpen = bullpenCandidates.filter((p) => !usedIds.has(p.id));

  // Setup men: next 2 best
  const setupMen = remainingBullpen.slice(0, 2);
  setupMen.forEach((p) => usedIds.add(p.id));

  const afterSetup = remainingBullpen.filter((p) => !usedIds.has(p.id));

  // Long reliever: pitcher with highest stamina among remaining
  const longReliever = afterSetup.length > 0
    ? afterSetup.sort((a, b) => (b.pitchingRatings?.stm ?? 0) - (a.pitchingRatings?.stm ?? 0))[0]
    : null;
  if (longReliever) usedIds.add(longReliever.id);

  // Middle relievers: the rest
  const middleRelievers = afterSetup.filter((p) => !usedIds.has(p.id));

  return { rotation, closer, setupMen, middleRelievers, longReliever };
}
