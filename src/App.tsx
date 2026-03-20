import { useStore } from './store/useStore';
import Sidebar from './components/layout/Sidebar';
import PTSidebar from './components/layout/PTSidebar';
import ModeSelector from './components/layout/ModeSelector';
import Dashboard from './pages/Dashboard';
import Batters from './pages/Batters';
import Pitchers from './pages/Pitchers';
import Defense from './pages/Defense';
import Lineups from './pages/Lineups';
import Rotation from './pages/Rotation';
import Trends from './pages/Trends';
import Strategy from './pages/Strategy';
import Organization from './pages/Organization';
import Prospects from './pages/Prospects';
import Analysis from './pages/Analysis';
import ImportData from './pages/ImportData';
import Settings from './pages/Settings';
import PTDashboard from './pages/pt/PTDashboard';
import PTCollection from './pages/pt/PTCollection';
import PTTournament from './pages/pt/PTTournament';
import PTSleepers from './pages/pt/PTSleepers';
import PTImport from './pages/pt/PTImport';
import PTSettings from './pages/pt/PTSettings';
import PlayerModal from './components/players/PlayerModal';

const FRANCHISE_PAGES: Record<string, React.FC> = {
  dashboard: Dashboard,
  batters: Batters,
  pitchers: Pitchers,
  defense: Defense,
  lineups: Lineups,
  rotation: Rotation,
  trends: Trends,
  strategy: Strategy,
  organization: Organization,
  prospects: Prospects,
  analysis: Analysis,
  import: ImportData,
  settings: Settings,
};

const PT_PAGES: Record<string, React.FC> = {
  pt_dashboard: PTDashboard,
  pt_collection: PTCollection,
  pt_tournament: PTTournament,
  pt_sleepers: PTSleepers,
  pt_import: PTImport,
  pt_settings: PTSettings,
};

export default function App() {
  const appMode = useStore((s) => s.appMode);
  const activeTab = useStore((s) => s.activeTab);
  const ptActiveTab = useStore((s) => s.ptActiveTab);
  const selectedPlayerId = useStore((s) => s.selectedPlayerId);

  const isFranchise = appMode === 'franchise';
  const Page = isFranchise
    ? (FRANCHISE_PAGES[activeTab] || Dashboard)
    : (PT_PAGES[ptActiveTab] || PTDashboard);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Mode selector bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <ModeSelector />
        <span className="text-xs text-gray-600">OOTP Roster Analyzer</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {isFranchise ? <Sidebar /> : <PTSidebar />}
        <main className="flex-1 overflow-auto p-6">
          <Page />
        </main>
      </div>
      {selectedPlayerId && <PlayerModal />}
    </div>
  );
}
