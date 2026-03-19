import { useStore } from './store/useStore';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Batters from './pages/Batters';
import Pitchers from './pages/Pitchers';
import Defense from './pages/Defense';
import Lineups from './pages/Lineups';
import Rotation from './pages/Rotation';
import Trends from './pages/Trends';
import Strategy from './pages/Strategy';
import ImportData from './pages/ImportData';
import Settings from './pages/Settings';
import PlayerModal from './components/players/PlayerModal';

const PAGES: Record<string, React.FC> = {
  dashboard: Dashboard,
  batters: Batters,
  pitchers: Pitchers,
  defense: Defense,
  lineups: Lineups,
  rotation: Rotation,
  trends: Trends,
  strategy: Strategy,
  import: ImportData,
  settings: Settings,
};

export default function App() {
  const activeTab = useStore((s) => s.activeTab);
  const selectedPlayerId = useStore((s) => s.selectedPlayerId);
  const Page = PAGES[activeTab] || Dashboard;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Page />
      </main>
      {selectedPlayerId && <PlayerModal />}
    </div>
  );
}
