import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { CARD_TIER_COLORS } from '../../types';
import type { CardTier } from '../../types';

function TierCard({ tier, count, total }: { tier: CardTier; count: number; total: number }) {
  const colors = CARD_TIER_COLORS[tier];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={`card p-4 border ${colors.border}`}>
      <p className={`text-lg font-bold ${colors.text}`}>{count}</p>
      <p className="text-xs text-gray-400">{tier} ({pct}%)</p>
    </div>
  );
}

export default function PTDashboard() {
  const ptPlayers = useStore((s) => s.ptPlayers);

  const tierCounts = useMemo(() => {
    const counts: Record<CardTier, number> = { Bronze: 0, Silver: 0, Gold: 0, Diamond: 0, Perfect: 0 };
    ptPlayers.forEach((p) => { counts[p.cardTier]++; });
    return counts;
  }, [ptPlayers]);

  const topSleepers = useMemo(
    () => [...ptPlayers]
      .filter((p) => p.hiddenPotentialGap > 0)
      .sort((a, b) => b.hiddenPotentialGap - a.hiddenPotentialGap)
      .slice(0, 10),
    [ptPlayers]
  );

  const topCards = useMemo(
    () => [...ptPlayers].sort((a, b) => b.scores.overallValue - a.scores.overallValue).slice(0, 10),
    [ptPlayers]
  );

  // OVR vs Score data for the scatter visualization
  const scatterData = useMemo(
    () => ptPlayers.map((p) => ({
      name: p.name,
      ovr: p.cardOvr,
      score: p.scores.overallValue,
      effectiveScore: p.effectiveScores.overallValue,
      tier: p.cardTier,
      gap: p.hiddenPotentialGap,
    })),
    [ptPlayers]
  );

  if (ptPlayers.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No cards loaded. Import CSV files first.</p>
      </div>
    );
  }

  const tiers: CardTier[] = ['Perfect', 'Diamond', 'Gold', 'Silver', 'Bronze'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Perfect Team Dashboard</h1>

      {/* Tier breakdown */}
      <div className="grid grid-cols-5 gap-3">
        {tiers.map((tier) => (
          <TierCard key={tier} tier={tier} count={tierCounts[tier]} total={ptPlayers.length} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Cards */}
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Top Cards by Overall Value</h2>
          <div className="space-y-2">
            {topCards.map((p, i) => {
              const colors = CARD_TIER_COLORS[p.cardTier];
              return (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs w-5 text-center font-bold ${i < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.pos} | OVR {p.cardOvr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colors.text} ${colors.bg} ${colors.border}`}>
                      {p.cardTier}
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {p.scores.overallValue.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* OVR vs Score scatter (text representation) */}
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Attributes vs OVR — Undervalued Cards</h2>
          <p className="text-xs text-gray-500">
            Cards where overall value score significantly exceeds what their OVR tier would suggest.
          </p>
          <div className="space-y-2">
            {scatterData
              .filter((d) => d.score > 0)
              .sort((a, b) => {
                const aRatio = a.score / Math.max(1, a.ovr);
                const bRatio = b.score / Math.max(1, b.ovr);
                return bRatio - aRatio;
              })
              .slice(0, 10)
              .map((d, i) => {
                const colors = CARD_TIER_COLORS[d.tier];
                const ratio = (d.score / Math.max(1, d.ovr)).toFixed(2);
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-5 text-center font-bold text-gray-500">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{d.name}</p>
                        <p className="text-xs text-gray-500">OVR {d.ovr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colors.text} ${colors.bg} ${colors.border}`}>
                        {d.tier}
                      </span>
                      <span className="text-xs font-mono text-cyan-400">
                        Score {d.score.toFixed(1)} ({ratio}x)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Sleepers */}
      {topSleepers.length > 0 && (
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Top Sleepers (Artifact Potential)</h2>
          <p className="text-xs text-gray-500">
            Cards with the biggest gap between base and artifact-boosted scores.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {topSleepers.map((p) => {
              const colors = CARD_TIER_COLORS[p.cardTier];
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.pos} | OVR {p.cardOvr}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colors.text} ${colors.bg} ${colors.border}`}>
                      {p.cardTier}
                    </span>
                    <p className="text-xs font-mono mt-1">
                      <span className="text-gray-400">{p.scores.overallValue.toFixed(1)}</span>
                      <span className="text-gray-600 mx-1">→</span>
                      <span className="text-emerald-400">{p.effectiveScores.overallValue.toFixed(1)}</span>
                      <span className="text-yellow-400 ml-1">(+{p.hiddenPotentialGap.toFixed(1)})</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
