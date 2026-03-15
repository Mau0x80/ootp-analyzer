import type { Player } from '../types';

export interface MatchedPlayer {
  name: string;
  playerA: Player | null;
  playerB: Player | null;
}

function normalizePlayerName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function matchPlayers(seasonA: Player[], seasonB: Player[]): MatchedPlayer[] {
  const mapA = new Map<string, Player>();
  seasonA.forEach((p) => mapA.set(normalizePlayerName(p.name), p));

  const mapB = new Map<string, Player>();
  seasonB.forEach((p) => mapB.set(normalizePlayerName(p.name), p));

  const allNames = new Set([...mapA.keys(), ...mapB.keys()]);
  const matches: MatchedPlayer[] = [];

  for (const key of allNames) {
    const pA = mapA.get(key) ?? null;
    const pB = mapB.get(key) ?? null;
    matches.push({
      name: pA?.name ?? pB?.name ?? key,
      playerA: pA,
      playerB: pB,
    });
  }

  // Sort: both present first (by name), then A-only, then B-only
  matches.sort((a, b) => {
    const aScore = (a.playerA ? 2 : 0) + (a.playerB ? 1 : 0);
    const bScore = (b.playerA ? 2 : 0) + (b.playerB ? 1 : 0);
    if (aScore !== bScore) return bScore - aScore;
    return a.name.localeCompare(b.name);
  });

  return matches;
}
