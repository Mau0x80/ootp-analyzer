import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import PlayerTable from '../components/common/PlayerTable';
import ScoreBadge from '../components/common/ScoreBadge';
import type { Player } from '../types';
import { PITCHER_ARCHETYPE_INFO, RATINGS_SCALES } from '../types';
import { ratingColor, groupPlayersByLevel, getLevelBadgeClasses } from '../utils/helpers';

const ROLES = ['All', 'SP', 'RP', 'CL'];

export default function Pitchers() {
  const players = useStore((s) => s.players);
  const scale = useStore((s) => RATINGS_SCALES[s.settings.currentRatingsScale]);
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('All');

  const pitchers = useMemo(() => players.filter((p) => p.isPitcher), [players]);
  const hasDumpData = useMemo(() => pitchers.some((p) => p.dumpData !== null), [pitchers]);

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
        label: 'Role',
        sortKey: (p: Player) => p.pos,
        render: (p: Player) => {
          const color = p.pos === 'SP' ? 'text-blue-400' : p.pos === 'CL' ? 'text-red-400' : 'text-yellow-400';
          return <span className={`text-xs font-medium ${color}`}>{p.pos}</span>;
        },
      },
      {
        key: 'age',
        label: 'Age',
        sortKey: (p: Player) => p.age,
        render: (p: Player) => <span className="text-xs">{p.age}</span>,
      },
      {
        key: 'stu',
        label: 'STU',
        sortKey: (p: Player) => p.pitchingRatings?.stu ?? 0,
        render: (p: Player) => {
          const v = p.pitchingRatings?.stu ?? 0;
          return <span className={`text-xs font-bold ${ratingColor(v, scale.max, scale.min)}`}>{v || '-'}</span>;
        },
      },
      {
        key: 'mov',
        label: 'MOV',
        sortKey: (p: Player) => p.pitchingRatings?.mov ?? 0,
        render: (p: Player) => {
          const v = p.pitchingRatings?.mov ?? 0;
          return <span className={`text-xs ${ratingColor(v, scale.max, scale.min)}`}>{v || '-'}</span>;
        },
      },
      {
        key: 'con',
        label: 'CON',
        sortKey: (p: Player) => p.pitchingRatings?.con ?? 0,
        render: (p: Player) => {
          const v = p.pitchingRatings?.con ?? 0;
          return <span className={`text-xs ${ratingColor(v, scale.max, scale.min)}`}>{v || '-'}</span>;
        },
      },
      {
        key: 'stm',
        label: 'STM',
        sortKey: (p: Player) => p.pitchingRatings?.stm ?? 0,
        render: (p: Player) => <span className="text-xs">{p.pitchingRatings?.stm ?? '-'}</span>,
      },
      {
        key: 'velo',
        label: 'VELO',
        render: (p: Player) => <span className="text-xs font-mono">{p.pitchingRatings?.velo || '-'}</span>,
      },
      {
        key: 'era',
        label: 'ERA',
        sortKey: (p: Player) => p.pitchingStats?.ip ? p.pitchingStats.era : 999,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.pitchingStats && p.pitchingStats.ip > 0 ? p.pitchingStats.era.toFixed(2) : '-'}</span>
        ),
      },
      {
        key: 'fip',
        label: 'FIP',
        sortKey: (p: Player) => p.pitchingStats?.ip ? p.pitchingStats.fip : 999,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.pitchingStats && p.pitchingStats.ip > 0 ? p.pitchingStats.fip.toFixed(2) : '-'}</span>
        ),
      },
      {
        key: 'whip',
        label: 'WHIP',
        sortKey: (p: Player) => p.pitchingStats?.ip ? p.pitchingStats.whip : 999,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.pitchingStats && p.pitchingStats.ip > 0 ? p.pitchingStats.whip.toFixed(2) : '-'}</span>
        ),
      },
      {
        key: 'k9',
        label: 'K/9',
        sortKey: (p: Player) => p.pitchingStats?.k9 ?? 0,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.pitchingStats && p.pitchingStats.ip > 0 ? p.pitchingStats.k9.toFixed(1) : '-'}</span>
        ),
      },
      {
        key: 'eraPlus',
        label: 'ERA+',
        sortKey: (p: Player) => p.pitchingStats?.ip ? p.pitchingStats.eraPlus : 0,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.pitchingStats && p.pitchingStats.ip > 0 ? p.pitchingStats.eraPlus : '-'}</span>
        ),
      },
      {
        key: 'kbbpct',
        label: 'K-BB%',
        sortKey: (p: Player) => p.pitchingStats?.kBbPct ?? -999,
        render: (p: Player) => (
          <span className="text-xs font-mono text-blue-300">{p.pitchingStats && p.pitchingStats.ip > 0 && p.pitchingStats.kBbPct ? p.pitchingStats.kBbPct.toFixed(1) : '-'}</span>
        ),
      },
      {
        key: 'siera',
        label: 'SIERA',
        sortKey: (p: Player) => p.pitchingStats?.siera ? p.pitchingStats.siera : 999,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.pitchingStats && p.pitchingStats.siera > 0 ? p.pitchingStats.siera.toFixed(2) : '-'}</span>
        ),
      },
      {
        key: 'war',
        label: 'WAR',
        sortKey: (p: Player) => p.pitchingStats?.war ?? -999,
        render: (p: Player) => (
          <span className="text-xs font-mono">{p.pitchingStats && p.pitchingStats.ip > 0 ? p.pitchingStats.war.toFixed(1) : '-'}</span>
        ),
      },
      {
        key: 'archetype',
        label: 'Type',
        sortKey: (p: Player) => p.pitcherArchetype ?? '',
        render: (p: Player) => {
          if (!p.pitcherArchetype) return <span className="text-xs text-gray-600">-</span>;
          const info = PITCHER_ARCHETYPE_INFO[p.pitcherArchetype];
          return <span className={`text-[10px] font-medium ${info.color}`} title={info.description}>{info.label}</span>;
        },
      },
      {
        key: 'pctile',
        label: 'PCT',
        sortKey: (p: Player) => p.percentiles.pitchingScore ?? 0,
        render: (p: Player) => {
          const pct = p.percentiles.pitchingScore;
          if (pct === undefined) return <span className="text-xs text-gray-600">-</span>;
          const color = pct >= 90 ? 'text-red-400' : pct >= 75 ? 'text-orange-400' : pct >= 50 ? 'text-yellow-400' : 'text-gray-400';
          return <span className={`text-[10px] font-mono font-bold ${color}`} title="Pitching percentile vs roster">{pct}th</span>;
        },
      },
      {
        key: 'pitchScore',
        label: 'Score',
        sortKey: (p: Player) => p.scores.pitchingScore,
        render: (p: Player) => <ScoreBadge score={p.scores.pitchingScore} size="sm" />,
      },
    ],
    [scale]
  );

  if (pitchers.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No pitchers loaded. Import CSV files first.</p>
      </div>
    );
  }

  // --- Grouped view (dump data loaded) ---
  if (hasDumpData) {
    const q = search.toLowerCase();
    const filtered = pitchers.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q);
      const matchRole = activeRole === 'All' || p.pos === activeRole;
      return matchSearch && matchRole;
    });
    const groups = groupPlayersByLevel(filtered);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Pitchers</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search pitcher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-44"
            />
            <div className="flex gap-1">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    activeRole === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {groups.length === 0 && (
          <p className="text-center py-10 text-gray-500">No pitchers match the current filters.</p>
        )}

        {groups.map((group) => (
          <div key={group.label} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${getLevelBadgeClasses(group.level)}`}>
                {group.label}
              </span>
              <span className="text-sm text-gray-400">{group.teamName}</span>
              <span className="text-xs text-gray-600">({group.players.length} pitchers)</span>
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
      <h1 className="text-2xl font-bold">Pitchers</h1>
      <PlayerTable players={pitchers} columns={columns} />
    </div>
  );
}
