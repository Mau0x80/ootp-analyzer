import { useStore } from '../../store/useStore';
import { RATINGS_SCALES } from '../../types';

interface RatingBarProps {
  value: number;
  max?: number; // override: use this instead of settings scale
  label: string;
  showValue?: boolean;
}

export default function RatingBar({ value, max, label, showValue = true }: RatingBarProps) {
  const scale = useStore((s) => RATINGS_SCALES[s.settings.currentRatingsScale]);

  // If max is explicitly passed, use simple 0-max normalization (for STM etc.)
  // Otherwise use the scale from settings
  const scaleMax = max ?? scale.max;
  const scaleMin = max ? 0 : scale.min;
  const range = scaleMax - scaleMin;
  const pct = range > 0 ? Math.min(100, ((value - scaleMin) / range) * 100) : 0;

  let barColor = 'bg-red-500';
  if (pct >= 60) barColor = 'bg-emerald-500';
  else if (pct >= 40) barColor = 'bg-blue-500';
  else if (pct >= 25) barColor = 'bg-yellow-500';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-16 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {showValue && (
        <span className="text-xs font-mono text-gray-300 w-8 text-right">{value}</span>
      )}
    </div>
  );
}
