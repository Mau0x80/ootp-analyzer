import { useState } from 'react';
import { useStore } from '../store/useStore';
import ScoreBadge from '../components/common/ScoreBadge';
import DiamondField from '../components/lineup/DiamondField';
import LineupBuilder from '../components/lineup/LineupBuilder';
import { exportLineupAsText, exportLineupAsImage } from '../utils/lineupExporter';
import { Copy, Download, MousePointerClick, Cpu } from 'lucide-react';
import type { Lineup } from '../types';

const LINEUP_MODES = [
  { key: 'general', label: 'General' },
  { key: 'vs_rhp', label: 'vs RHP' },
  { key: 'vs_lhp', label: 'vs LHP' },
  { key: 'defense', label: 'Best Defense' },
  { key: 'balanced', label: 'Balanced' },
] as const;

export default function Lineups() {
  const lineups = useStore((s) => s.lineups);
  const players = useStore((s) => s.players);
  const pitchingStaff = useStore((s) => s.pitchingStaff);
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);
  const isManualMode = useStore((s) => s.isManualMode);
  const toggleManualMode = useStore((s) => s.toggleManualMode);
  const [activeMode, setActiveMode] = useState<string>('general');
  const [copied, setCopied] = useState(false);

  const lineup: Lineup | null = lineups[activeMode] || null;

  if (players.length === 0 || !lineup) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No lineup data. Import CSV files first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Lineup Generator</h1>
        <div className="flex items-center gap-2">
          {LINEUP_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveMode(key)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                activeMode === key
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-700 mx-1" />
          <button
            onClick={async () => {
              const text = exportLineupAsText(lineup, pitchingStaff);
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
            title="Copy lineup as text"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => exportLineupAsImage('lineup-export-area')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
            title="Save lineup as image"
          >
            <Download className="w-3.5 h-3.5" />
            Image
          </button>
          <div className="w-px h-6 bg-gray-700 mx-1" />
          <button
            onClick={toggleManualMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              isManualMode
                ? 'bg-brand-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            title={isManualMode ? 'Switch to optimizer view' : 'Switch to manual builder'}
          >
            {isManualMode ? <Cpu className="w-3.5 h-3.5" /> : <MousePointerClick className="w-3.5 h-3.5" />}
            {isManualMode ? 'Optimizer' : 'Manual'}
          </button>
        </div>
      </div>

      {/* Manual Builder Mode */}
      {isManualMode && <LineupBuilder baseLineup={lineup} />}

      {/* Optimizer View */}
      {!isManualMode && (
      <div id="lineup-export-area" className="space-y-6">

      {/* Lineup summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total Offense</p>
          <p className="text-2xl font-bold text-brand-400">{lineup.totalOffense.toFixed(1)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total Defense</p>
          <p className="text-2xl font-bold text-emerald-400">{lineup.totalDefense.toFixed(1)}</p>
        </div>
      </div>

      {/* Diamond Visualization */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Field View</h3>
        <DiamondField slots={lineup.slots} onSlotClick={(id) => setSelectedPlayer(id)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field positions */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Starting Lineup (by Position)</h3>
          <div className="space-y-2">
            {lineup.slots.map((slot) => (
              <div
                key={slot.position}
                onClick={() => setSelectedPlayer(slot.player.id)}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-8 ${slot.outOfPosition ? 'text-red-400' : 'text-brand-400'}`}>
                    {slot.position}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {slot.player.name}
                      {slot.outOfPosition && (
                        <span className="ml-2 text-[10px] text-red-400 font-normal">(Out of Position)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      B:{slot.player.bats} T:{slot.player.throws} | Age {slot.player.age}
                    </p>
                  </div>
                </div>
                <ScoreBadge score={slot.score} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Batting order */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Batting Order</h3>
          <div className="space-y-2">
            {lineup.battingOrder.map((slot, i) => (
              <div
                key={slot.player.id}
                onClick={() => setSelectedPlayer(slot.player.id)}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-500 w-8 text-center">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{slot.player.name}</p>
                    <p className="text-xs text-gray-500">
                      {slot.position} | B:{slot.player.bats} |
                      {slot.player.battingRatings && (
                        <> CON {slot.player.battingRatings.con} / POW {slot.player.battingRatings.pow} / EYE {slot.player.battingRatings.eye}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <ScoreBadge score={slot.player.scores.offensiveScore} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bench */}
      {lineup.bench.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Bench ({lineup.bench.length} players)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lineup.bench.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlayer(p.id)}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.pos} | {p.eligiblePositions.join(', ')}
                  </p>
                </div>
                <ScoreBadge score={p.scores.overallValue} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
      )}
    </div>
  );
}
