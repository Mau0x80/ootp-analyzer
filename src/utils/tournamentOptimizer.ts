import type { Player, TournamentConfig, Lineup, AppSettings } from '../types';
import { generateLineup } from './lineupOptimizer';

// ============================================================
// Tournament Optimizer
// Filters players by OVR cap/tier, then uses the existing
// lineup optimizer with the filtered pool.
// ============================================================

export function generateTournamentLineup(
  players: Player[],
  config: TournamentConfig,
  settings: AppSettings
): Lineup | null {
  const eligible = filterByTournament(players, config);
  if (eligible.length === 0) return null;

  return generateLineup(
    eligible,
    'balanced',
    settings,
    settings.useDH,
    settings.allowOutOfPosition
  );
}

export function filterByTournament(
  players: Player[],
  config: TournamentConfig
): Player[] {
  return players.filter((p) => {
    if (config.tierFilter.length > 0 && !config.tierFilter.includes(p.cardTier)) return false;
    if (p.cardOvr > config.ovrCap) return false;
    return true;
  });
}

// Sort eligible players by their effective value for tournament use
export function rankTournamentPlayers(
  players: Player[],
  config: TournamentConfig
): Player[] {
  const eligible = filterByTournament(players, config);

  return eligible.sort((a, b) => {
    // Prefer artifact-boosted scores when prioritizeArtifacts is on
    const scoreA = config.prioritizeArtifacts ? a.effectiveScores.overallValue : a.scores.overallValue;
    const scoreB = config.prioritizeArtifacts ? b.effectiveScores.overallValue : b.scores.overallValue;
    return scoreB - scoreA;
  });
}
