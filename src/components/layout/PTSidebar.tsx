import { useStore } from '../../store/useStore';
import type { PTAppTab } from '../../types';
import {
  LayoutDashboard, Library, Trophy, Search, Upload, Settings, Zap,
} from 'lucide-react';

const PT_NAV_ITEMS: { tab: PTAppTab; label: string; icon: React.FC<any> }[] = [
  { tab: 'pt_dashboard', label: 'PT Dashboard', icon: LayoutDashboard },
  { tab: 'pt_collection', label: 'Collection', icon: Library },
  { tab: 'pt_tournament', label: 'Tournament', icon: Trophy },
  { tab: 'pt_sleepers', label: 'Sleepers', icon: Search },
  { tab: 'pt_import', label: 'Import Cards', icon: Upload },
  { tab: 'pt_settings', label: 'PT Settings', icon: Settings },
];

export default function PTSidebar() {
  const ptActiveTab = useStore((s) => s.ptActiveTab);
  const setPTActiveTab = useStore((s) => s.setPTActiveTab);
  const playerCount = useStore((s) => s.ptPlayers.length);

  return (
    <aside className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold text-purple-400 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Perfect Team
        </h1>
        {playerCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">{playerCount} cards loaded</p>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {PT_NAV_ITEMS.map(({ tab, label, icon: Icon }) => {
          const active = ptActiveTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setPTActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
        OOTP 27 Perfect Team Mode
      </div>
    </aside>
  );
}
