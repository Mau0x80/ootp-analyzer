import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { matchPlayers } from '../utils/seasonDiff';
import { TrendingUp, TrendingDown, Minus, Save, Trash2 } from 'lucide-react';

const COMPARE_METRICS = [
  { key: 'overallValue', label: 'Overall' },
  { key: 'offensiveScore', label: 'Offense' },
  { key: 'defensiveScore', label: 'Defense' },
  { key: 'pitchingScore', label: 'Pitching' },
] as const;

type MetricKey = (typeof COMPARE_METRICS)[number]['key'];

function DeltaArrow({ delta }: { delta: number }) {
  if (Math.abs(delta) < 1) return <Minus className="w-3 h-3 text-gray-500" />;
  if (delta > 0)
    return (
      <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold">
        <TrendingUp className="w-3 h-3" /> +{delta.toFixed(0)}
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-red-400 text-[10px] font-bold">
      <TrendingDown className="w-3 h-3" /> {delta.toFixed(0)}
    </span>
  );
}

export default function Trends() {
  const players = useStore((s) => s.players);
  const seasons = useStore((s) => s.seasons);
  const saveCurrentAsSeason = useStore((s) => s.saveCurrentAsSeason);
  const deleteSeason = useStore((s) => s.deleteSeason);
  const [seasonLabel, setSeasonLabel] = useState('');
  const [metric, setMetric] = useState<MetricKey>('overallValue');

  const matches = useMemo(() => {
    if (seasons.length < 2) return null;
    return matchPlayers(seasons[0].players, seasons[1].players);
  }, [seasons]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Season Trends</h1>
      <p className="text-sm text-gray-500">
        Save up to 2 roster snapshots and compare player progression between them.
      </p>

      {/* Save Snapshot */}
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Save Current Roster as Snapshot</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={seasonLabel}
            onChange={(e) => setSeasonLabel(e.target.value)}
            placeholder="Season label (e.g., 2024, Pre-Trade, etc.)"
            className="flex-1 px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
          />
          <button
            onClick={() => {
              if (!seasonLabel.trim() || players.length === 0) return;
              saveCurrentAsSeason(seasonLabel.trim());
              setSeasonLabel('');
            }}
            disabled={!seasonLabel.trim() || players.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
        {players.length === 0 && (
          <p className="text-[10px] text-yellow-400">Import CSV data first to save a snapshot.</p>
        )}
      </div>

      {/* Saved Snapshots */}
      {seasons.length > 0 && (
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Saved Snapshots</h3>
          <div className="space-y-2">
            {seasons.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                <div>
                  <p className="text-sm font-medium text-white">{s.label}</p>
                  <p className="text-[10px] text-gray-500">
                    {s.players.length} players | Saved {new Date(s.savedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteSeason(i)}
                  className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {seasons.length < 2 && (
            <p className="text-[10px] text-gray-500">
              Save one more snapshot to enable comparison. Tip: import a different season's CSVs, then save again.
            </p>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {matches && seasons.length >= 2 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">
              Comparison: {seasons[0].label} vs {seasons[1].label}
            </h3>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white"
            >
              {COMPARE_METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Player</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Pos</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">{seasons[0].label}</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">{seasons[1].label}</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-400">Change</th>
                  {COMPARE_METRICS.filter((m) => m.key !== metric).map((m) => (
                    <th key={m.key} className="px-3 py-2 text-center text-xs font-medium text-gray-500">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {matches.map((m) => {
                  const valA = m.playerA?.scores[metric] ?? 0;
                  const valB = m.playerB?.scores[metric] ?? 0;
                  const delta = m.playerA && m.playerB ? valB - valA : 0;
                  const pos = m.playerA?.pos ?? m.playerB?.pos ?? '-';

                  return (
                    <tr key={m.name} className="hover:bg-gray-800/50">
                      <td className="px-3 py-2 font-medium text-white">
                        {m.name}
                        {!m.playerA && <span className="ml-1 text-[9px] text-emerald-400">NEW</span>}
                        {!m.playerB && <span className="ml-1 text-[9px] text-red-400">GONE</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400">{pos}</td>
                      <td className="px-3 py-2 text-right text-xs font-mono">
                        {m.playerA ? valA.toFixed(0) : '-'}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-mono">
                        {m.playerB ? valB.toFixed(0) : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {m.playerA && m.playerB ? <DeltaArrow delta={delta} /> : <span className="text-xs text-gray-600">-</span>}
                      </td>
                      {COMPARE_METRICS.filter((cm) => cm.key !== metric).map((cm) => {
                        const a = m.playerA?.scores[cm.key] ?? 0;
                        const b = m.playerB?.scores[cm.key] ?? 0;
                        const d = m.playerA && m.playerB ? b - a : 0;
                        return (
                          <td key={cm.key} className="px-3 py-2 text-center">
                            {m.playerA && m.playerB ? <DeltaArrow delta={d} /> : <span className="text-xs text-gray-600">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
