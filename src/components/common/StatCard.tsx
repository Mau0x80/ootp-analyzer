interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, subtitle, color, icon }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${color || 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
