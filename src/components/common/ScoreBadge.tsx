import { scoreColor, scoreBgColor } from '../../utils/helpers';

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreBadge({ score, label, size = 'md' }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold border ${scoreBgColor(score)} ${scoreColor(score)} ${sizeClasses[size]}`}
      title={label ? `${label}: ${score}` : `Score: ${score}`}
    >
      {score.toFixed(1)}
      {label && <span className="opacity-70 text-[0.7em] font-normal">{label}</span>}
    </span>
  );
}
