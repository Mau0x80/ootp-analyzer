import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import PlayerTable from '../components/common/PlayerTable';
import ScoreBadge from '../components/common/ScoreBadge';
import type { Player } from '../types';
import { HITTER_ARCHETYPE_INFO, RATINGS_SCALES } from '../types';
import { ratingColor } from '../utils/helpers';
import {
  groupPlayersByLevel,
  getLevelBadgeClasses,
  getPlayingLevel,
} from '../utils/helpers';

const POSITIONS = ['All', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

export default function Batters() {
  const players = useStore((s) => s.players);
  const scale = useStore((s) => RATINGS_SCALES[s.settings.currentRatingsScale]);
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);
  const [search, setSearch] = useState('');
  const [activePos, setActivePos] = useState('All');

  const batters = useMemo(() => players.filter((p) => !p.isPitcher || p.isTwoWay), [players]);
  const hasDumpData = useMemo(() => batters.some((p) => p.dumpData !== null), [batters]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        sortKey: (p: Player) => p.name,
        render: (p: Player) => (
          <div>
            <span className="font-medium text-white">{p.name}</span>
            <span className="ml-2 text-xs text-gray-500">#{p.number}</span>
          </div>
        ),
      },
      {
        key: 'pos',
        label: 'POS',
        sortKey: (p: Player) => p.pos,
        render: (p: Player) => <span className="text-xs font-medium text-gray-300">{p.pos}</span>,
      },
      {
        key: 'age',
        label: 'Age',
        sortKey: (p: Player) => p.age,
        render: (p: Player) => <span className="text-xs">{p.age}</span>,
      },
      {
        key: 'bt',
        label: 'B/T',
        render: (p: Player) => <span className="text-xs text-gray-400">{p.bats}/{p.throws}</span>,
      },
      {
        key: 'ovr',
        label: 'OVR',
        sortKey: (p: Player) => p.battingRatings?.ovr ?? 0,
        render: (p: Player) => {
          const v = p.battingRatings?.ovr ?? 0;
          return <span className={`text-xs font-bold ${ratingColor(v, scale.max, scale.min)}`}>{v || '-'}</span>;
        },
      },
      {
        key: 'con',
        label: 'CON',
        sortKey: (p: Player) => p.battingRatings?.con ?? 0,
        render: (p: Player) => {
          const v = p.battingRatings?.con ?? 0;
          return <span className={`text-xs ${ratingColor(v, scale.max, scale.min)}`}>{v || '-'}</span>;
        },
      },
      {
        key: 'pow',
        label: 'POW',
        sortKey: (p: Player) => p.battingRatings?.pow ?? 0,
        render: (p: Player) => {
          const v = p.battingRatings?.pow ?? 0;
          return <span className={`text-xs ${ratingColor(v, scale.max, scale.min)}`}>{v || '-'}</span>;
        },
      },
      {
        key: 'eye',
        label: 'EYE',
        sortKey: (p: Player) => p.battingRatings?.eye ?? 0,
        render: (p: Player) => {
          const v = p.battingRatings?.eye ?? 0;
          return <span className={`text-xs ${ratingColor(v, scale.max, scale.min)}`}>{v || '-'}</span>;
        },
      },
      {
        key: 'spe',
        label: 'SPE',
        sortKey: (p: Player) => p.battingRatings?.spe ?? 0,
        render: (p: Player) => {
          const v = p.battingRatings?.spe ?? 0;
          return <span className={`text-xs ${ratingColor(v, scale.max, scale.min)}`}>{v || '-'}</span>;
        },
      },
      {
        key: 'ops',
        label: 'OPS',
        sortKey: (p: Player) => p.battingStats?.ops ?? 0,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.battingStats && p.battingStats.pa > 0 ? p.battingStats.ops.toFixed(3) : '-'}</span>
        ),
      },
      {
        key: 'opsPlus',
        label: 'OPS+',
        sortKey: (p: Player) => p.battingStats?.opsPlus ?? -999,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.battingStats && p.battingStats.pa > 0 ? p.battingStats.opsPlus : '-'}</span>
        ),
      },
      {
        key: 'woba',
        label: 'wOBA',
        sortKey: (p: Player) => p.battingStats?.woba ?? 0,
        render: (p: Player) => (
          <span className="text-xs font-mono text-blue-300">{p.battingStats && p.battingStats.woba > 0 ? p.battingStats.woba.toFixed(3) : '-'}</span>
        ),
      },
      {
        key: 'wrcPlus',
        label: 'wRC+',
        sortKey: (p: Player) => p.battingStats?.wrcPlus ?? -999,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.battingStats && p.battingStats.wrcPlus > 0 && p.battingStats.pa > 0 ? p.battingStats.wrcPlus : '-'}</span>
        ),
      },
      {
        key: 'war',
        label: 'WAR',
        sortKey: (p: Player) => p.battingStats?.war ?? -999,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.battingStats && p.battingStats.pa > 0 ? p.battingStats.war.toFixed(1) : '-'}</span>
        ),
      },
      {
        key: 'archetype',
        label: 'Type',
        sortKey: (p: Player) => p.hitterArchetype ?? '',
        render: (p: Player) => {
          if (!p.hitterArchetype) return <span className="text-xs text-gray-600">-</span>;
          const info = HITTER_ARCHETYPE_INFO[p.hitterArchetype];
          return <span className={`text-[10px] font-medium ${info.color}`} title={info.description}>{info.label}</span>;
        },
      },
      {
        key: 'pctile',
        label: 'PCT',
        sortKey: (p: Player) => p.percentiles.offensiveScore ?? 0,
        render: (p: Player) => {
          const pct = p.percentiles.offensiveScore;
          if (pct === undefined) return <span className="text-xs text-gray-600">-</span>;
          const color = pct >= 90 ? 'text-red-400' : pct >= 75 ? 'text-orange-400' : pct >= 50 ? 'text-yellow-400' : 'text-gray-400';
          return <span className={`text-[10px] font-mono font-bold ${color}`} title="Offensive percentile vs roster">{pct}th</span>;
        },
      },
      {
        key: 'offScore',
        label: 'OFF',
        sortKey: (p: Player) => p.scores.offensiveScore,
        render: (p: Player) => <ScoreBadge score={p.scores.offensiveScore} size="sm" />,
      },
      {
        key: 'defScore',
        label: 'DEF',
        sortKey: (p: Player) => p.scores.defensiveScore,
        render: (p: Player) => <ScoreBadge score={p.scores.defensiveScore} size="sm" />,
      },
    ],
    [scale]
  );

  if (batters.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No batters loaded. Import CSV files first.</p>
      </div>
    );
  }

  // --- Grouped view (dump data loaded) ---
  if (hasDumpData) {
    const q = search.toLowerCase();
    const filtered = batters.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.pos.toLowerCase().includes(q);
      const matchPos = activePos === 'All' || p.pos === activePos;
      return matchSearch && matchPos;
    });
    const groups = groupPlayersByLevel(filtered);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Batters</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-44"
            />
            <div className="flex gap-1 flex-wrap">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setActivePos(pos)}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    activePos === pos
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {groups.length === 0 && (
          <p className="text-center py-10 text-gray-500">No players match the current filters.</p>
        )}

        {groups.map((group) => (
          <div key={group.label} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${getLevelBadgeClasses(group.level)}`}>
                {group.label}
              </span>
              <span className="text-sm text-gray-400">{group.teamName}</span>
              <span className="text-xs text-gray-600">({group.players.length} players)</span>
            </div>
            <PlayerTable
              players={group.players}
              columns={columns}
              onPlayerClick={(p) => setSelectedPlayer(p.id)}
              showSearch={false}
              showPositionFilter={false}
            />
          </div>
        ))}
      </div>
    );
  }

  // --- Flat view (CSV only) ---
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Batters</h1>
      <PlayerTable players={batters} columns={columns} />
    </div>
  );
}
