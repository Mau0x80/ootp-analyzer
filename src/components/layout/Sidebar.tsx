import { useStore } from '../../store/useStore';
import type { AppTab } from '../../types';
import {
  LayoutDashboard, Users, Swords, Shield, ListOrdered,
  RotateCcw, Upload, Settings, Activity, TrendingUp, Sliders,
  Building2, Star,
} from 'lucide-react';

const NAV_ITEMS: { tab: AppTab; label: string; icon: React.FC<any> }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'batters', label: 'Batters', icon: Swords },
  { tab: 'pitchers', label: 'Pitchers', icon: Activity },
  { tab: 'defense', label: 'Defense', icon: Shield },
  { tab: 'organization', label: 'Organization', icon: Building2 },
  { tab: 'prospects', label: 'Prospects & FA', icon: Star },
  { tab: 'lineups', label: 'Lineups', icon: ListOrdered },
  { tab: 'rotation', label: 'Rotation', icon: RotateCcw },
  { tab: 'trends', label: 'Trends', icon: TrendingUp },
  { tab: 'strategy', label: 'Strategy', icon: Sliders },
  { tab: 'import', label: 'Import Data', icon: Upload },
  { tab: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const playerCount = useStore((s) => s.players.length);

  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold text-brand-500 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          OOTP Analyzer
        </h1>
        {playerCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">{playerCount} players loaded</p>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {NAV_ITEMS.map(({ tab, label, icon: Icon }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-500/10 text-brand-500'
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
        OOTP Roster Analyzer v1.0
      </div>
    </aside>
  );
}
