import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { CARD_TIER_COLORS } from '../../types';
import type { CardTier, Player } from '../../types';
import ScoreBadge from '../../components/common/ScoreBadge';

const TIER_OPTIONS: CardTier[] = ['Perfect', 'Diamond', 'Gold', 'Silver', 'Bronze'];

type SortKey = 'name' | 'ovr' | 'overallValue' | 'offensiveScore' | 'defensiveScore' | 'pitchingScore' | 'gap';

export default function PTCollection() {
  const ptPlayers = useStore((s) => s.ptPlayers);
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);
  const [tierFilter, setTierFilter] = useState<CardTier | 'all'>('all');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('overallValue');
  const [sortAsc, setSortAsc] = useState(false);

  const positions = useMemo(() => {
    const set = new Set(ptPlayers.map((p) => p.pos));
    return Array.from(set).sort();
  }, [ptPlayers]);

  const filtered = useMemo(() => {
    let list = ptPlayers;
    if (tierFilter !== 'all') list = list.filter((p) => p.cardTier === tierFilter);
    if (posFilter !== 'all') list = list.filter((p) => p.pos === posFilter);

    const getSortVal = (p: Player): number | string => {
      switch (sortKey) {
        case 'name': return p.name;
        case 'ovr': return p.cardOvr;
        case 'overallValue': return p.scores.overallValue;
        case 'offensiveScore': return p.scores.offensiveScore;
        case 'defensiveScore': return p.scores.defensiveScore;
        case 'pitchingScore': return p.scores.pitchingScore;
        case 'gap': return p.hiddenPotentialGap;
        default: return p.scores.overallValue;
      }
    };

    return [...list].sort((a, b) => {
      const va = getSortVal(a);
      const vb = getSortVal(b);
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [ptPlayers, tierFilter, posFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  if (ptPlayers.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No cards loaded. Import CSV files first.</p>
      </div>
    );
  }

  const thClass = 'px-3 py-2 text-left text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-200';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Card Collection</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as CardTier | 'all')}
          className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="all">All Tiers</option>
          {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="all">All Positions</option>
          {positions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs text-gray-500">{filtered.length} cards</span>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50">
              <th className={thClass} onClick={() => handleSort('name')}>Name</th>
              <th className={thClass}>POS</th>
              <th className={thClass} onClick={() => handleSort('ovr')}>OVR</th>
              <th className={thClass}>Tier</th>
              <th className={thClass} onClick={() => handleSort('offensiveScore')}>OFF</th>
              <th className={thClass} onClick={() => handleSort('defensiveScore')}>DEF</th>
              <th className={thClass} onClick={() => handleSort('pitchingScore')}>PIT</th>
              <th className={thClass} onClick={() => handleSort('overallValue')}>Value</th>
              <th className={thClass} onClick={() => handleSort('gap')}>Eff. Value</th>
              <th className={thClass}>Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((p) => {
              const colors = CARD_TIER_COLORS[p.cardTier];
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPlayer(p.id)}
                  className="hover:bg-gray-800/50 cursor-pointer"
                >
                  <td className="px-3 py-2 font-medium text-white">{p.name}</td>
                  <td className="px-3 py-2 text-xs">{p.pos}</td>
                  <td className="px-3 py-2 text-xs font-mono">{p.cardOvr}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colors.text} ${colors.bg} ${colors.border}`}>
                      {p.cardTier}
                    </span>
                  </td>
                  <td className="px-3 py-2"><ScoreBadge score={p.scores.offensiveScore} size="sm" /></td>
                  <td className="px-3 py-2"><ScoreBadge score={p.scores.defensiveScore} size="sm" /></td>
                  <td className="px-3 py-2"><ScoreBadge score={p.scores.pitchingScore} size="sm" /></td>
                  <td className="px-3 py-2"><ScoreBadge score={p.scores.overallValue} size="sm" /></td>
                  <td className="px-3 py-2 text-xs font-mono text-cyan-400">
                    {p.effectiveScores.overallValue > 0 ? p.effectiveScores.overallValue.toFixed(1) : '-'}
                  </td>
                  <td className="px-3 py-2">
                    {p.hiddenPotentialGap > 0 && (
                      <span className="text-xs font-mono text-yellow-400">+{p.hiddenPotentialGap.toFixed(1)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
