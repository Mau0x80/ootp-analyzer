import { useStore } from '../../store/useStore';
import type { AppMode } from '../../types';

export default function ModeSelector() {
  const appMode = useStore((s) => s.appMode);
  const setAppMode = useStore((s) => s.setAppMode);

  const modes: { id: AppMode; label: string; desc: string }[] = [
    { id: 'franchise', label: 'Franchise', desc: 'Traditional roster analysis' },
    { id: 'perfectTeam', label: 'Perfect Team', desc: 'OOTP 27 PT meta' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-800 rounded-lg">
      {modes.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setAppMode(id)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            appMode === id
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
