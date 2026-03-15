import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import PlayerTable from '../components/common/PlayerTable';
import ScoreBadge from '../components/common/ScoreBadge';
import type { Player } from '../types';
import { PITCHER_ARCHETYPE_INFO, RATINGS_SCALES } from '../types';
import { ratingColor } from '../utils/helpers';

export default function Pitchers() {
  const players = useStore((s) => s.players);
  const scale = useStore((s) => RATINGS_SCALES[s.settings.currentRatingsScale]);
  const pitchers = useMemo(() => players.filter((p) => p.isPitcher), [players]);

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pitchers</h1>
      <PlayerTable players={pitchers} columns={columns} />
    </div>
  );
}
