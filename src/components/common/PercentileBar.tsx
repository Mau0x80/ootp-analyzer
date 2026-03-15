interface PercentileBarProps {
  label: string;
  value: number | string;
  percentile: number;
  inverted?: boolean; // For stats where lower is better (ERA, K%, etc.)
}

function pctColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';      // Elite (baseball card red)
  if (pct >= 75) return 'bg-orange-500';
  if (pct >= 60) return 'bg-yellow-500';
  if (pct >= 40) return 'bg-gray-400';      // Average
  if (pct >= 25) return 'bg-blue-400';
  return 'bg-blue-600';                     // Below average
}

function pctTextColor(pct: number): string {
  if (pct >= 90) return 'text-red-400';
  if (pct >= 75) return 'text-orange-400';
  if (pct >= 60) return 'text-yellow-400';
  if (pct >= 40) return 'text-gray-400';
  if (pct >= 25) return 'text-blue-400';
  return 'text-blue-500';
}

export default function PercentileBar({ label, value, percentile }: PercentileBarProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-gray-400 text-right shrink-0">{label}</span>
      <span className="w-12 font-mono text-white text-right shrink-0">{value}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pctColor(percentile)}`}
          style={{ width: `${percentile}%` }}
        />
      </div>
      <span className={`w-8 font-mono font-bold text-right ${pctTextColor(percentile)}`}>
        {percentile}
      </span>
    </div>
  );
}
