import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import ScoreBadge from '../components/common/ScoreBadge';
import { ratingColor } from '../utils/helpers';
import { calcDefensiveScoreForPosition } from '../utils/scoringEngine';
import type { Player } from '../types';
import { RATINGS_SCALES } from '../types';

const FIELD_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

export default function Defense() {
  const players = useStore((s) => s.players);
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);
  const scale = useStore((s) => RATINGS_SCALES[s.settings.currentRatingsScale]);

  const positionRankings = useMemo(() => {
    const rankings: Record<string, { player: Player; score: number; posRating: number }[]> = {};

    for (const pos of FIELD_POSITIONS) {
      const eligible = players.filter((p) =>
        p.eligiblePositions.some((ep) => ep.toUpperCase() === pos) && (!p.isPitcher || p.isTwoWay)
      );

      rankings[pos] = eligible
        .map((p) => {
          const score = calcDefensiveScoreForPosition(p, pos);
          const pr = p.positionRatings;
          const posRating = pr ? (pr[pos.toLowerCase() as keyof typeof pr] as number) || 0 : 0;
          return { player: p, score, posRating };
        })
        .sort((a, b) => b.score - a.score);
    }

    return rankings;
  }, [players, scale]);

  if (players.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No players loaded. Import CSV files first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Defense</h1>
      <p className="text-sm text-gray-500">
        Best defenders at each position, ranked by composite fielding score.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {FIELD_POSITIONS.map((pos) => {
          const ranked = positionRankings[pos] || [];
          return (
            <div key={pos} className="card p-4">
              <h3 className="text-lg font-bold text-brand-400 mb-3">{pos}</h3>
              {ranked.length === 0 && (
                <p className="text-xs text-gray-500">No eligible players</p>
              )}
              <div className="space-y-2">
                {ranked.slice(0, 5).map((entry, i) => {
                  const { player: p, score, posRating } = entry;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer(p.id)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs w-4 text-center font-bold ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.pos} | Pos Rating: <span className={ratingColor(posRating, scale.max, scale.min)}>{posRating}</span>
                          </p>
                        </div>
                      </div>
                      <ScoreBadge score={score} size="sm" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fielding ratings detail table */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Fielding Ratings Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50">
                {['Name', 'POS', 'C ABI', 'C ARM', 'IF RNG', 'IF ERR', 'IF ARM', 'TDP', 'OF RNG', 'OF ERR', 'OF ARM'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {players
                .filter((p) => p.fieldingRatings && (!p.isPitcher || p.isTwoWay))
                .sort((a, b) => b.scores.defensiveScore - a.scores.defensiveScore)
                .map((p) => {
                  const fr = p.fieldingRatings!;
                  return (
                    <tr key={p.id} onClick={() => setSelectedPlayer(p.id)} className="hover:bg-gray-800/50 cursor-pointer">
                      <td className="px-3 py-2 font-medium text-white">{p.name}</td>
                      <td className="px-3 py-2 text-xs">{p.pos}</td>
                      {[fr.cAbi, fr.cArm, fr.ifRng, fr.ifErr, fr.ifArm, fr.tdp, fr.ofRng, fr.ofErr, fr.ofArm].map((v, i) => (
                        <td key={i} className={`px-3 py-2 text-xs font-mono ${ratingColor(v, scale.max, scale.min)}`}>{v || '-'}</td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
