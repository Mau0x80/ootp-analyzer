import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Users,
} from 'lucide-react';
import type { Player } from '../types';
import {
  getPlayingLevel,
  getLevelLabel,
  getLevelSortOrder,
  getLevelBadgeClasses,
} from '../utils/helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ratingColor(value: number): string {
  if (value >= 80) return 'text-emerald-400';
  if (value >= 60) return 'text-blue-400';
  if (value >= 40) return 'text-yellow-400';
  return 'text-gray-400';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface TeamGroup {
  teamName: string;
  level: number;
  levelLabel: string;
  players: Player[];
}

function PlayerTable({ players, compact }: { players: Player[]; compact?: boolean }) {
  const sorted = [...players].sort((a, b) => b.cardOvr - a.cardOvr);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-gray-700">
            <th className="text-left py-1.5 px-2">Name</th>
            <th className="text-center py-1.5 px-1">Pos</th>
            <th className="text-center py-1.5 px-1">Age</th>
            <th className="text-center py-1.5 px-1">OVR</th>
            <th className="text-center py-1.5 px-1">POT</th>
            <th className="text-center py-1.5 px-1">B/T</th>
            <th className="text-left py-1.5 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const pot = p.dumpData?.potential ?? 0;
            return (
              <tr
                key={p.id}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-1 px-2 text-gray-200 font-medium whitespace-nowrap">
                  {compact ? p.name.split(' ').slice(-1)[0] : p.name}
                </td>
                <td className="py-1 px-1 text-center text-gray-300">{p.pos}</td>
                <td className="py-1 px-1 text-center text-gray-300">{p.age}</td>
                <td className={`py-1 px-1 text-center font-semibold ${ratingColor(p.cardOvr)}`}>
                  {p.cardOvr}
                </td>
                <td className={`py-1 px-1 text-center font-semibold ${ratingColor(pot)}`}>
                  {pot || '—'}
                </td>
                <td className="py-1 px-1 text-center text-gray-400">
                  {p.bats}/{p.throws}
                </td>
                <td className="py-1 px-2 text-gray-400 text-xs whitespace-nowrap">{p.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Map a level sort order back to a representative playingLevel number */
function sortOrderToLevel(order: number): number {
  const map: Record<number, number> = { 0: 1, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10 };
  return map[order] ?? 10;
}

/** Suggest which level a player should move to.
 *  direction: 'up' = promote (lower sort order), 'down' = demote (higher sort order) */
function suggestLevel(p: Player, direction: 'up' | 'down'): { from: string; to: string; arrow: string } {
  const currentLevel = getPlayingLevel(p);
  const currentOrder = getLevelSortOrder(currentLevel);
  const targetOrder = direction === 'up'
    ? Math.max(0, currentOrder - 1)
    : Math.min(5, currentOrder + 1);
  const targetLevel = sortOrderToLevel(targetOrder);
  return {
    from: getLevelLabel(currentLevel),
    to: getLevelLabel(targetLevel),
    arrow: direction === 'up' ? '\u2191' : '\u2193', // ↑ or ↓
  };
}

function InsightSection({
  title,
  icon,
  iconColor,
  players,
  emptyMsg,
  direction,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  players: Player[];
  emptyMsg: string;
  direction: 'up' | 'down';
}) {
  if (players.length === 0) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={iconColor}>{icon}</span>
          <h3 className="text-gray-200 font-semibold">{title}</h3>
        </div>
        <p className="text-gray-500 text-sm">{emptyMsg}</p>
      </div>
    );
  }

  const sorted = [...players].sort((a, b) => b.cardOvr - a.cardOvr);
  const arrowColor = direction === 'up' ? 'text-emerald-400' : 'text-amber-400';
  const suggestionBg = direction === 'up'
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : 'bg-amber-500/10 border-amber-500/30';

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={iconColor}>{icon}</span>
        <h3 className="text-gray-200 font-semibold">{title}</h3>
        <span className="text-xs text-gray-500">({players.length})</span>
      </div>
      <div className="space-y-1">
        {sorted.map((p) => {
          const pot = p.dumpData?.potential ?? 0;
          const level = getPlayingLevel(p);
          const sug = suggestLevel(p, direction);
          return (
            <div
              key={p.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800/50 text-sm"
            >
              <span className="text-gray-200 font-medium flex-1 min-w-0 truncate">{p.name}</span>
              <span className="text-gray-400 text-xs w-8 text-center">{p.pos}</span>
              <span className="text-gray-500 text-xs w-6 text-center">{p.age}</span>
              <span className={`font-semibold text-xs w-8 text-center ${ratingColor(p.cardOvr)}`}>
                {p.cardOvr}
              </span>
              <span className={`font-semibold text-xs w-8 text-center ${ratingColor(pot)}`}>
                {pot || '\u2014'}
              </span>
              {/* Current level → Suggested level */}
              <span className={`text-xs px-1.5 py-0.5 rounded border ${suggestionBg} flex items-center gap-1 whitespace-nowrap`}>
                <span className={`text-xs ${getLevelBadgeClasses(level).split(' ').find(c => c.startsWith('text-'))}`}>{sug.from}</span>
                <span className={`font-bold ${arrowColor}`}>{sug.arrow}</span>
                <span className={`font-semibold ${arrowColor}`}>{sug.to}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Organization() {
  const players = useStore((s) => s.players);

  const { teamGroups, mlbReady, needsDev, promotionCandidates, demotionCandidates } =
    useMemo(() => {
      if (players.length === 0) {
        return {
          teamGroups: [] as TeamGroup[],
          mlbReady: [] as Player[],
          needsDev: [] as Player[],
          promotionCandidates: [] as Player[],
          demotionCandidates: [] as Player[],
        };
      }

      // ------- Group by team -------
      const groupMap = new Map<string, { level: number; players: Player[] }>();
      for (const p of players) {
        const teamName = p.dumpData?.teamName || 'Unknown';
        const level = getPlayingLevel(p);
        const existing = groupMap.get(teamName);
        if (existing) {
          existing.players.push(p);
        } else {
          groupMap.set(teamName, { level, players: [p] });
        }
      }

      const teamGroups: TeamGroup[] = [];
      for (const [teamName, data] of groupMap) {
        teamGroups.push({
          teamName,
          level: data.level,
          levelLabel: getLevelLabel(data.level),
          players: data.players,
        });
      }
      teamGroups.sort((a, b) => getLevelSortOrder(a.level) - getLevelSortOrder(b.level));

      // ------- Compute level averages -------
      const levelAvg = new Map<number, number>();
      const levelPlayers = new Map<number, Player[]>();
      for (const p of players) {
        const lvl = getPlayingLevel(p);
        const bucket = getLevelSortOrder(lvl);
        if (!levelPlayers.has(bucket)) levelPlayers.set(bucket, []);
        levelPlayers.get(bucket)!.push(p);
      }
      for (const [bucket, pls] of levelPlayers) {
        const sum = pls.reduce((acc, p) => acc + p.cardOvr, 0);
        levelAvg.set(bucket, pls.length > 0 ? sum / pls.length : 0);
      }

      // ------- MLB-Ready Prospects -------
      const mlbReady = players.filter((p) => {
        const level = getPlayingLevel(p);
        if (level === 1) return false;
        const pot = p.dumpData?.potential ?? 0;
        return p.cardOvr >= 55 || pot >= 70;
      });

      // ------- Needs Development (MLB underperformers) -------
      const needsDev = players.filter((p) => {
        const level = getPlayingLevel(p);
        if (level !== 1) return false;
        const pot = p.dumpData?.potential ?? 0;
        return p.cardOvr < 40 || (p.age < 24 && pot > p.cardOvr + 20);
      });

      // ------- Promotion Candidates -------
      const promotionCandidates = players.filter((p) => {
        const level = getPlayingLevel(p);
        if (level === 1) return false; // already MLB
        const bucket = getLevelSortOrder(level);
        const avg = levelAvg.get(bucket) ?? 0;
        return p.cardOvr > avg + 10;
      });

      // ------- Demotion Candidates -------
      const demotionCandidates = players.filter((p) => {
        const level = getPlayingLevel(p);
        const bucket = getLevelSortOrder(level);
        if (bucket === 0) return false; // MLB handled by needsDev
        if (bucket >= 5) return false; // already at lowest (Rookie)
        const avg = levelAvg.get(bucket) ?? 0;
        return p.cardOvr < avg - 10;
      });

      return { teamGroups, mlbReady, needsDev, promotionCandidates, demotionCandidates };
    }, [players]);

  // ------- Empty state -------
  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Building2 size={48} className="mb-4 opacity-40" />
        <p className="text-lg font-medium">No organization data loaded</p>
        <p className="text-sm mt-1">Import a dump folder and select a team to view the organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-blue-400" />
          <h1 className="text-xl font-bold text-gray-100">Organization Overview</h1>
          <span className="text-sm text-gray-500">{players.length} players across {teamGroups.length} teams</span>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InsightSection
          title="MLB-Ready Prospects"
          icon={<Star size={18} />}
          iconColor="text-emerald-400"
          players={mlbReady}
          emptyMsg="No minor league players currently meet promotion thresholds (OVR >= 55 or POT >= 70)."
          direction="up"
        />

        <InsightSection
          title="Needs Development"
          icon={<AlertTriangle size={18} />}
          iconColor="text-red-400"
          players={needsDev}
          emptyMsg="No MLB players currently flagged for demotion."
          direction="down"
        />

        <InsightSection
          title="Promotion Candidates"
          icon={<ChevronUp size={18} />}
          iconColor="text-blue-400"
          players={promotionCandidates}
          emptyMsg="No players significantly outperforming their level."
          direction="up"
        />

        <InsightSection
          title="Demotion Candidates"
          icon={<ChevronDown size={18} />}
          iconColor="text-amber-400"
          players={demotionCandidates}
          emptyMsg="No players significantly underperforming their level."
          direction="down"
        />
      </div>

      {/* Organization Summary Bar */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} className="text-gray-400" />
          <h2 className="text-gray-200 font-semibold">Roster Summary</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {teamGroups.map((g) => {
            const avgOvr =
              g.players.length > 0
                ? Math.round(g.players.reduce((s, p) => s + p.cardOvr, 0) / g.players.length)
                : 0;
            return (
              <div
                key={g.teamName}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700"
              >
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getLevelBadgeClasses(g.level)}`}>
                  {g.levelLabel}
                </span>
                <span className="text-sm text-gray-300">{g.teamName}</span>
                <span className="text-xs text-gray-500">{g.players.length}p</span>
                <span className={`text-xs font-semibold ${ratingColor(avgOvr)}`}>
                  avg {avgOvr}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Cards */}
      {teamGroups.map((g) => {
        const avgOvr =
          g.players.length > 0
            ? Math.round(g.players.reduce((s, p) => s + p.cardOvr, 0) / g.players.length)
            : 0;
        return (
          <div key={g.teamName} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-100">{g.teamName}</h2>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${getLevelBadgeClasses(g.level)}`}
                >
                  {g.levelLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{g.players.length} players</span>
                <span className="text-gray-600">|</span>
                <span>
                  Avg OVR:{' '}
                  <span className={`font-semibold ${ratingColor(avgOvr)}`}>{avgOvr}</span>
                </span>
              </div>
            </div>
            <PlayerTable players={g.players} />
          </div>
        );
      })}
    </div>
  );
}
