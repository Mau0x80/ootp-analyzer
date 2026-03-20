import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Star, Search, UserPlus } from 'lucide-react';
import type { Player } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TabId = 'prospects' | 'draft' | 'freeAgents';

function ovrColor(value: number): string {
  if (value >= 80) return 'text-emerald-400';
  if (value >= 60) return 'text-blue-400';
  if (value >= 40) return 'text-yellow-400';
  return 'text-gray-400';
}

function estimateEta(age: number, pot: number, ovr: number): string {
  const gap = pot - ovr;
  if (gap < 10) return 'Ready now';
  if (gap < 20) return '1-2 years';
  if (gap < 30) return '2-3 years';
  return '3+ years';
}

function getProspectScore(p: Player): number {
  const pot = p.dumpData?.potential ?? 0;
  return pot * 0.6 + p.cardOvr * 0.4;
}

function getWar(p: Player): number | null {
  if (p.isPitcher && p.pitchingStats?.war != null) return p.pitchingStats.war;
  if (!p.isPitcher && p.battingStats?.war != null) return p.battingStats.war;
  return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Icon className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span
        className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
          active ? 'bg-blue-500/30 text-blue-300' : 'bg-gray-700 text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section: Top Organization Prospects
// ---------------------------------------------------------------------------

function ProspectsSection({ players }: { players: Player[] }) {
  const prospects = useMemo(() => {
    const nonMlb = players.filter((p) => {
      const level = p.dumpData?.rosterInfo?.playingLevel ?? 0;
      return level !== 1 && level > 0;
    });
    return nonMlb
      .map((p) => ({ player: p, score: getProspectScore(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }, [players]);

  if (prospects.length === 0) {
    return <EmptyState icon={Star} label="No minor league prospects found. Import dump data to see prospects." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-gray-700">
            <th className="text-center py-2 px-2 w-10">#</th>
            <th className="text-left py-2 px-2">Name</th>
            <th className="text-center py-2 px-1">Pos</th>
            <th className="text-center py-2 px-1">Age</th>
            <th className="text-left py-2 px-2">Team</th>
            <th className="text-center py-2 px-1">OVR</th>
            <th className="text-center py-2 px-1">POT</th>
            <th className="text-center py-2 px-1">Score</th>
            <th className="text-center py-2 px-2">ETA</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map(({ player: p, score }, i) => {
            const pot = p.dumpData?.potential ?? 0;
            const isElite = pot >= 80;
            return (
              <tr
                key={p.id}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="text-center py-1.5 px-2 text-gray-500 text-xs">{i + 1}</td>
                <td className="py-1.5 px-2">
                  <div className="flex items-center gap-1.5">
                    {isElite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    <span className="font-medium text-white">{p.name}</span>
                  </div>
                </td>
                <td className="text-center py-1.5 px-1 text-xs text-gray-300">{p.pos}</td>
                <td className="text-center py-1.5 px-1 text-xs">{p.age}</td>
                <td className="text-left py-1.5 px-2 text-xs text-gray-400">{p.dumpData?.teamName ?? '-'}</td>
                <td className={`text-center py-1.5 px-1 text-xs font-bold ${ovrColor(p.cardOvr)}`}>
                  {p.cardOvr}
                </td>
                <td className={`text-center py-1.5 px-1 text-xs font-bold ${ovrColor(pot)}`}>
                  {pot}
                </td>
                <td className="text-center py-1.5 px-1 text-xs font-semibold text-white">
                  {score.toFixed(1)}
                </td>
                <td className="text-center py-1.5 px-2 text-xs text-gray-300">
                  {estimateEta(p.age, pot, p.cardOvr)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Draft Gems
// ---------------------------------------------------------------------------

function DraftSection({ draftPlayers }: { draftPlayers: Player[] }) {
  const gems = useMemo(() => {
    return [...draftPlayers]
      .sort((a, b) => (b.dumpData?.potential ?? 0) - (a.dumpData?.potential ?? 0))
      .slice(0, 50);
  }, [draftPlayers]);

  if (gems.length === 0) {
    return <EmptyState icon={Search} label="No draft players found. Import dump data to see the draft pool." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-gray-700">
            <th className="text-center py-2 px-2 w-10">#</th>
            <th className="text-left py-2 px-2">Name</th>
            <th className="text-center py-2 px-1">Pos</th>
            <th className="text-center py-2 px-1">Age</th>
            <th className="text-center py-2 px-1">POT</th>
            <th className="text-center py-2 px-1">OVR</th>
            <th className="text-center py-2 px-1">Gap</th>
            <th className="text-center py-2 px-1">B/T</th>
          </tr>
        </thead>
        <tbody>
          {gems.map((p, i) => {
            const pot = p.dumpData?.potential ?? 0;
            const gap = pot - p.cardOvr;
            const gapClass = gap > 30 ? 'text-amber-400 font-bold' : 'text-gray-300';
            const potClass = pot >= 75 ? 'text-emerald-400 font-bold' : ovrColor(pot);
            return (
              <tr
                key={p.id}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="text-center py-1.5 px-2 text-gray-500 text-xs">{i + 1}</td>
                <td className="py-1.5 px-2">
                  <span className="font-medium text-white">{p.name}</span>
                </td>
                <td className="text-center py-1.5 px-1 text-xs text-gray-300">{p.pos}</td>
                <td className="text-center py-1.5 px-1 text-xs">{p.age}</td>
                <td className={`text-center py-1.5 px-1 text-xs ${potClass}`}>{pot}</td>
                <td className={`text-center py-1.5 px-1 text-xs font-bold ${ovrColor(p.cardOvr)}`}>
                  {p.cardOvr}
                </td>
                <td className={`text-center py-1.5 px-1 text-xs ${gapClass}`}>{gap}</td>
                <td className="text-center py-1.5 px-1 text-xs text-gray-400">
                  {p.bats}/{p.throws}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Best Free Agents
// ---------------------------------------------------------------------------

function FreeAgentsSection({ freeAgents }: { freeAgents: Player[] }) {
  const sorted = useMemo(() => {
    return [...freeAgents].sort((a, b) => b.cardOvr - a.cardOvr).slice(0, 50);
  }, [freeAgents]);

  if (sorted.length === 0) {
    return <EmptyState icon={UserPlus} label="No free agents found. Import dump data to see available free agents." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-gray-700">
            <th className="text-center py-2 px-2 w-10">#</th>
            <th className="text-left py-2 px-2">Name</th>
            <th className="text-center py-2 px-1">Pos</th>
            <th className="text-center py-2 px-1">Age</th>
            <th className="text-center py-2 px-1">OVR</th>
            <th className="text-center py-2 px-1">B/T</th>
            <th className="text-center py-2 px-1">Role</th>
            <th className="text-center py-2 px-1">WAR</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const war = getWar(p);
            const role = p.isPitcher ? p.pos : 'Batter';
            return (
              <tr
                key={p.id}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="text-center py-1.5 px-2 text-gray-500 text-xs">{i + 1}</td>
                <td className="py-1.5 px-2">
                  <span className="font-medium text-white">{p.name}</span>
                </td>
                <td className="text-center py-1.5 px-1 text-xs text-gray-300">{p.pos}</td>
                <td className="text-center py-1.5 px-1 text-xs">{p.age}</td>
                <td className={`text-center py-1.5 px-1 text-xs font-bold ${ovrColor(p.cardOvr)}`}>
                  {p.cardOvr}
                </td>
                <td className="text-center py-1.5 px-1 text-xs text-gray-400">
                  {p.bats}/{p.throws}
                </td>
                <td className="text-center py-1.5 px-1 text-xs text-gray-300">{role}</td>
                <td className="text-center py-1.5 px-1 text-xs text-gray-300">
                  {war != null ? war.toFixed(1) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Prospects() {
  const players = useStore((s) => s.players);
  const freeAgents = useStore((s) => s.freeAgents);
  const draftPlayers = useStore((s) => s.draftPlayers);
  const [activeTab, setActiveTab] = useState<TabId>('prospects');

  const prospectCount = useMemo(() => {
    return players.filter((p) => {
      const level = p.dumpData?.rosterInfo?.playingLevel ?? 0;
      return level !== 1 && level > 0;
    }).length;
  }, [players]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Prospects &amp; Scouting</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <TabButton
          active={activeTab === 'prospects'}
          onClick={() => setActiveTab('prospects')}
          icon={Star}
          label="Prospects"
          count={prospectCount}
        />
        <TabButton
          active={activeTab === 'draft'}
          onClick={() => setActiveTab('draft')}
          icon={Search}
          label="Draft Pool"
          count={draftPlayers.length}
        />
        <TabButton
          active={activeTab === 'freeAgents'}
          onClick={() => setActiveTab('freeAgents')}
          icon={UserPlus}
          label="Free Agents"
          count={freeAgents.length}
        />
      </div>

      {/* Content */}
      <div className="card p-4">
        {activeTab === 'prospects' && <ProspectsSection players={players} />}
        {activeTab === 'draft' && <DraftSection draftPlayers={draftPlayers} />}
        {activeTab === 'freeAgents' && <FreeAgentsSection freeAgents={freeAgents} />}
      </div>
    </div>
  );
}
