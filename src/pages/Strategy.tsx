import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { RATINGS_SCALES } from '../types';
import { generateStrategyReport } from '../utils/strategyEngine';
import type { StrategyRecommendation } from '../utils/strategyEngine';

// ============================================================
// Sub-components
// ============================================================

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${styles[level]}`}>
      {level}
    </span>
  );
}

function SliderRow({ label, rec }: { label: string; rec: StrategyRecommendation }) {
  const pct = (rec.value / 10) * 100;

  const barColor =
    rec.value >= 8 ? 'bg-emerald-500' :
    rec.value >= 6 ? 'bg-blue-500' :
    rec.value >= 4 ? 'bg-yellow-500' :
    rec.value >= 2 ? 'bg-orange-500' :
    'bg-gray-600';

  const valueColor =
    rec.value >= 8 ? 'text-emerald-400' :
    rec.value >= 6 ? 'text-blue-400' :
    rec.value >= 4 ? 'text-yellow-400' :
    rec.value >= 2 ? 'text-orange-400' :
    'text-gray-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-200 truncate">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <ConfidenceBadge level={rec.confidence} />
          <span className={`text-sm font-bold font-mono w-6 text-right ${valueColor}`}>
            {rec.value}
          </span>
        </div>
      </div>

      {/* Visual bar */}
      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
        {/* Tick marks */}
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <div
            key={n}
            className="absolute top-0 h-full w-px bg-gray-900/60"
            style={{ left: `${n * 10}%` }}
          />
        ))}
      </div>

      <p className="text-[11px] text-gray-500 leading-snug">{rec.rationale}</p>
    </div>
  );
}

interface CategoryCardProps {
  title: string;
  icon: string;
  items: { label: string; rec: StrategyRecommendation }[];
}

function CategoryCard({ title, icon, items }: CategoryCardProps) {
  const avgValue = Math.round(
    items.reduce((s, i) => s + i.rec.value, 0) / items.length
  );
  const avgColor =
    avgValue >= 7 ? 'text-emerald-400' :
    avgValue >= 5 ? 'text-blue-400' :
    avgValue >= 3 ? 'text-yellow-400' :
    'text-gray-500';

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <span className="text-lg">{icon}</span>
          {title}
        </h2>
        <span className={`text-xs font-mono font-bold ${avgColor}`}>
          avg {avgValue}/10
        </span>
      </div>
      <div className="space-y-4">
        {items.map(({ label, rec }) => (
          <SliderRow key={label} label={label} rec={rec} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function Strategy() {
  const players = useStore((s) => s.players);
  const scaleKey = useStore((s) => s.settings.currentRatingsScale);
  const scale = RATINGS_SCALES[scaleKey];

  const report = useMemo(() => generateStrategyReport(players, scale), [players, scale]);

  if (players.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No players loaded. Import CSV files first.</p>
      </div>
    );
  }

  const offensiveItems = [
    { label: 'Stealing Bases', rec: report.offensive.stealingBases },
    { label: 'Base-Running', rec: report.offensive.baseRunning },
    { label: 'Use Hit & Run', rec: report.offensive.hitAndRun },
    { label: 'Sacrifice Bunt', rec: report.offensive.sacrificeBunt },
    { label: 'Use Squeeze Bunt Play', rec: report.offensive.squeezeBunt },
    { label: 'Bunt for Hit', rec: report.offensive.buntForHit },
  ];

  const pitchDefItems = [
    { label: 'Pitch Around', rec: report.pitchingDefense.pitchAround },
    { label: 'Intentional Walk', rec: report.pitchingDefense.intentionalWalk },
    { label: 'Hold Runners', rec: report.pitchingDefense.holdRunners },
    { label: 'Play Infield In', rec: report.pitchingDefense.playInfieldIn },
    { label: 'Play Corners In', rec: report.pitchingDefense.playCornersIn },
    { label: 'Guard Lines', rec: report.pitchingDefense.guardLines },
    { label: 'Use Infield Shifts', rec: report.pitchingDefense.useInfieldShifts },
    { label: 'Use Outfield Shifts', rec: report.pitchingDefense.useOutfieldShifts },
    { label: 'Shift OF Depth', rec: report.pitchingDefense.shiftOFDepth },
  ];

  const subItems = [
    { label: 'Hook Starting Pitchers', rec: report.substitution.hookStartingPitchers },
    { label: 'Hook Relievers', rec: report.substitution.hookRelievers },
    { label: 'L/R Pitching Matchups', rec: report.substitution.lrPitchingMatchups },
    { label: 'L/R Batting Matchups', rec: report.substitution.lrBattingMatchups },
    { label: 'Pinch-Hit for Position Players', rec: report.substitution.pinchHitForPositionPlayers },
    { label: 'Use Pinch Runners', rec: report.substitution.usePinchRunners },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Strategy Recommendations</h1>
        <p className="text-sm text-gray-400 mt-1">
          Recommended OOTP strategy slider values (0–10) based on your roster's strengths and tendencies.
        </p>
      </div>

      {/* Legend */}
      <div className="card p-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
        <span className="font-medium text-gray-300">Confidence:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> High — based on full stats
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium — based on ratings
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-500" /> Low — insufficient data
        </span>
        <span className="ml-auto">Scale: 0 (never) → 10 (always)</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <CategoryCard title="Offensive Strategy" icon="⚡" items={offensiveItems} />
        <CategoryCard title="Pitching & Defensive Strategy" icon="🛡️" items={pitchDefItems} />
        <CategoryCard title="Substitution Strategy" icon="🔄" items={subItems} />
      </div>
    </div>
  );
}
