import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import StatCard from '../components/common/StatCard';
import ScoreBadge from '../components/common/ScoreBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Swords, Activity, Trophy } from 'lucide-react';
import { HITTER_ARCHETYPE_INFO, PITCHER_ARCHETYPE_INFO } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const players = useStore((s) => s.players);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);

  const stats = useMemo(() => {
    if (players.length === 0) return null;

    const batters = players.filter((p) => !p.isPitcher || p.isTwoWay);
    const pitchers = players.filter((p) => p.isPitcher);

    // Age distribution
    const ageGroups: Record<string, number> = {};
    players.forEach((p) => {
      const bracket = p.age < 25 ? '<25' : p.age < 28 ? '25-27' : p.age < 31 ? '28-30' : p.age < 35 ? '31-34' : '35+';
      ageGroups[bracket] = (ageGroups[bracket] || 0) + 1;
    });
    const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));

    // Top by WAR (batters)
    const topWAR = [...batters]
      .filter((p) => p.battingStats && p.battingStats.pa > 0)
      .sort((a, b) => (b.battingStats?.war ?? 0) - (a.battingStats?.war ?? 0))
      .slice(0, 5);

    // Top by OPS+
    const topOPS = [...batters]
      .filter((p) => p.battingStats && p.battingStats.pa >= 20)
      .sort((a, b) => (b.battingStats?.opsPlus ?? 0) - (a.battingStats?.opsPlus ?? 0))
      .slice(0, 5);

    // Top pitchers by ERA+
    const topERA = [...pitchers]
      .filter((p) => p.pitchingStats && p.pitchingStats.ip >= 5)
      .sort((a, b) => (b.pitchingStats?.eraPlus ?? 0) - (a.pitchingStats?.eraPlus ?? 0))
      .slice(0, 5);

    // Top by offensive score
    const topOffense = [...batters]
      .sort((a, b) => b.scores.offensiveScore - a.scores.offensiveScore)
      .slice(0, 5);

    // WAR chart data
    const warData = topWAR.map((p) => ({
      name: p.name.split(' ').pop() || p.name,
      WAR: p.battingStats?.war ?? 0,
    }));

    // Position distribution
    const posData: Record<string, number> = {};
    batters.forEach((p) => {
      const pos = p.pos.toUpperCase();
      posData[pos] = (posData[pos] || 0) + 1;
    });
    const positionData = Object.entries(posData).map(([name, value]) => ({ name, value }));

    // Archetype distribution
    const hitterArchetypes: Record<string, number> = {};
    batters.forEach((p) => {
      if (p.hitterArchetype) hitterArchetypes[p.hitterArchetype] = (hitterArchetypes[p.hitterArchetype] || 0) + 1;
    });
    const pitcherArchetypes: Record<string, number> = {};
    pitchers.forEach((p) => {
      if (p.pitcherArchetype) pitcherArchetypes[p.pitcherArchetype] = (pitcherArchetypes[p.pitcherArchetype] || 0) + 1;
    });

    return {
      total: players.length,
      batterCount: batters.length,
      pitcherCount: pitchers.length,
      ageData,
      topWAR,
      topOPS,
      topERA,
      topOffense,
      warData,
      positionData,
      hitterArchetypes,
      pitcherArchetypes,
    };
  }, [players]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Users className="w-16 h-16 mb-4 opacity-30" />
        <h2 className="text-xl font-medium mb-2">No Data Loaded</h2>
        <p className="text-sm mb-4">Import your OOTP CSV files to get started.</p>
        <button
          onClick={() => setActiveTab('import')}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium"
        >
          Go to Import
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Players" value={stats.total} icon={<Users className="w-4 h-4" />} />
        <StatCard label="Batters" value={stats.batterCount} icon={<Swords className="w-4 h-4" />} color="text-blue-400" />
        <StatCard label="Pitchers" value={stats.pitcherCount} icon={<Activity className="w-4 h-4" />} color="text-emerald-400" />
        <StatCard
          label="Best WAR"
          value={stats.topWAR[0]?.battingStats?.war.toFixed(1) ?? '-'}
          subtitle={stats.topWAR[0]?.name ?? ''}
          icon={<Trophy className="w-4 h-4" />}
          color="text-yellow-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WAR Leaders Chart */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">WAR Leaders (Batters)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.warData}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Bar dataKey="WAR" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.ageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {stats.ageData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Batters by OPS+ */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Top Batters (OPS+)</h3>
          <div className="space-y-2">
            {stats.topOPS.map((p, i) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.pos} | Age {p.age}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-400">{p.battingStats?.opsPlus}</p>
                  <p className="text-xs text-gray-500">OPS+ | {p.battingStats?.ops.toFixed(3)} OPS</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Pitchers by ERA+ */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Top Pitchers (ERA+)</h3>
          <div className="space-y-2">
            {stats.topERA.map((p, i) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.pos} | {p.pitchingStats?.ip.toFixed(1)} IP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{p.pitchingStats?.eraPlus}</p>
                  <p className="text-xs text-gray-500">ERA+ | {p.pitchingStats?.era.toFixed(2)} ERA</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Offensive Scores */}
        <div className="card p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Top Offensive Scores (Ratings-Based)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {stats.topOffense.map((p, i) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                className="text-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <p className="text-xs text-gray-500 mb-1">#{i + 1}</p>
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.pos}</p>
                <div className="mt-2">
                  <ScoreBadge score={p.scores.offensiveScore} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hitter Archetype Breakdown */}
        {Object.keys(stats.hitterArchetypes).length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Hitter Archetypes</h3>
            <div className="space-y-2">
              {Object.entries(stats.hitterArchetypes)
                .sort(([, a], [, b]) => b - a)
                .map(([arch, count]) => {
                  const info = HITTER_ARCHETYPE_INFO[arch as keyof typeof HITTER_ARCHETYPE_INFO];
                  if (!info) return null;
                  return (
                    <div key={arch} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${info.color}`}>{info.label}</span>
                          <span className="text-[10px] text-gray-500">{count}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${info.color.replace('text-', 'bg-')}`}
                            style={{ width: `${(count / Math.max(...Object.values(stats.hitterArchetypes))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Pitcher Archetype Breakdown */}
        {Object.keys(stats.pitcherArchetypes).length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Pitcher Archetypes</h3>
            <div className="space-y-2">
              {Object.entries(stats.pitcherArchetypes)
                .sort(([, a], [, b]) => b - a)
                .map(([arch, count]) => {
                  const info = PITCHER_ARCHETYPE_INFO[arch as keyof typeof PITCHER_ARCHETYPE_INFO];
                  if (!info) return null;
                  return (
                    <div key={arch} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${info.color}`}>{info.label}</span>
                          <span className="text-[10px] text-gray-500">{count}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${info.color.replace('text-', 'bg-')}`}
                            style={{ width: `${(count / Math.max(...Object.values(stats.pitcherArchetypes))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
