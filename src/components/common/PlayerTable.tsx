import { useState, useMemo } from 'react';
import type { Player } from '../../types';
import { useStore } from '../../store/useStore';
import ScoreBadge from './ScoreBadge';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortKey?: (p: Player) => number | string;
  render?: (p: Player) => React.ReactNode;
  className?: string;
}

interface PlayerTableProps {
  players: Player[];
  columns: Column[];
  onPlayerClick?: (p: Player) => void;
  showSearch?: boolean;
  showPositionFilter?: boolean;
}

const POSITIONS = ['All', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];

export default function PlayerTable({
  players,
  columns,
  onPlayerClick,
  showSearch = true,
  showPositionFilter = true,
}: PlayerTableProps) {
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortCol === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let result = players;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (posFilter !== 'All') {
      result = result.filter(
        (p) => p.pos.toUpperCase() === posFilter || p.eligiblePositions.includes(posFilter)
      );
    }

    if (sortCol) {
      const col = columns.find((c) => c.key === sortCol);
      if (col?.sortKey) {
        const fn = col.sortKey;
        result = [...result].sort((a, b) => {
          const va = fn(a);
          const vb = fn(b);
          if (typeof va === 'number' && typeof vb === 'number') {
            return sortDir === 'asc' ? va - vb : vb - va;
          }
          return sortDir === 'asc'
            ? String(va).localeCompare(String(vb))
            : String(vb).localeCompare(String(va));
        });
      }
    }

    return result;
  }, [players, search, posFilter, sortCol, sortDir, columns]);

  const handleClick = (p: Player) => {
    if (onPlayerClick) onPlayerClick(p);
    else setSelectedPlayer(p.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}
        {showPositionFilter && (
          <div className="flex gap-1 flex-wrap">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                  posFilter === pos
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        )}
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} players</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortKey && handleSort(col.key)}
                  className={`px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                    col.sortKey ? 'cursor-pointer hover:text-gray-200' : ''
                  } ${col.className || ''}`}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortCol === col.key && (
                      sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => handleClick(p)}
                className="hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.className || ''}`}>
                    {col.render ? col.render(p) : '-'}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500">
                  No players found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
