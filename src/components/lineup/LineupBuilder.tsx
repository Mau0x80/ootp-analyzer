import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import DiamondField from './DiamondField';
import DraggablePlayer from './DraggablePlayer';
import ScoreBadge from '../common/ScoreBadge';
import { RotateCcw } from 'lucide-react';
import type { Lineup, LineupSlot, Player } from '../../types';
import { calcDefensiveScoreForPosition } from '../../utils/scoringEngine';

interface Props {
  baseLineup: Lineup;
}

export default function LineupBuilder({ baseLineup }: Props) {
  const players = useStore((s) => s.players);
  const manualOverrides = useStore((s) => s.manualOverrides);
  const setManualOverride = useStore((s) => s.setManualOverride);
  const clearManualOverrides = useStore((s) => s.clearManualOverrides);
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);
  const [dragOverPos, setDragOverPos] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  // Build effective lineup by applying overrides on top of base
  const effectiveSlots: LineupSlot[] = useMemo(() => {
    const usedPlayerIds = new Set<string>();

    // First pass: apply overrides
    const slots = baseLineup.slots.map((slot) => {
      const overrideId = manualOverrides[slot.position];
      if (overrideId) {
        const p = playerMap.get(overrideId);
        if (p) {
          usedPlayerIds.add(p.id);
          const isEligible = p.eligiblePositions.some(
            (ep) => ep.toUpperCase() === slot.position.toUpperCase()
          );
          const score = calcDefensiveScoreForPosition(p, slot.position);
          return { ...slot, player: p, score, outOfPosition: !isEligible };
        }
      }
      usedPlayerIds.add(slot.player.id);
      return slot;
    });

    return slots;
  }, [baseLineup, manualOverrides, playerMap]);

  // Available players (not already in the effective lineup)
  const usedIds = new Set(effectiveSlots.map((s) => s.player.id));
  const availablePlayers = useMemo(() => {
    const positionPlayers = players.filter((p) => (!p.isPitcher || p.isTwoWay) && !usedIds.has(p.id));
    if (!filter) return positionPlayers;
    const lf = filter.toLowerCase();
    return positionPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(lf) ||
        p.eligiblePositions.some((ep) => ep.toLowerCase().includes(lf))
    );
  }, [players, usedIds, filter]);

  const highlightPositions = dragOverPos ? new Set([dragOverPos]) : undefined;

  const overrideCount = Object.keys(manualOverrides).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Diamond + overrides */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">
            Manual Lineup Builder
            {overrideCount > 0 && (
              <span className="ml-2 text-[10px] text-brand-400">({overrideCount} override{overrideCount > 1 ? 's' : ''})</span>
            )}
          </h3>
          {overrideCount > 0 && (
            <button
              onClick={clearManualOverrides}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Optimizer
            </button>
          )}
        </div>

        <div
          className="card p-4"
          onDragOver={(e) => e.preventDefault()}
        >
          <DiamondField
            slots={effectiveSlots}
            onSlotClick={(id) => setSelectedPlayer(id)}
            interactive
            onDrop={(position, playerId) => {
              setManualOverride(position, playerId);
              setDragOverPos(null);
            }}
            highlightPositions={highlightPositions}
          />
        </div>

        {/* Current assignments list */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Current Lineup</h3>
          <div className="space-y-1.5">
            {effectiveSlots.map((slot) => {
              const isOverride = !!manualOverrides[slot.position];
              return (
                <div
                  key={slot.position}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isOverride ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-6 ${slot.outOfPosition ? 'text-red-400' : 'text-brand-400'}`}>
                      {slot.position}
                    </span>
                    <span className="text-sm text-white">{slot.player.name}</span>
                    {isOverride && <span className="text-[9px] text-brand-400 bg-brand-500/20 px-1.5 py-0.5 rounded">manual</span>}
                    {slot.outOfPosition && <span className="text-[9px] text-red-400">OOP</span>}
                  </div>
                  <ScoreBadge score={slot.score} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Available players panel */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Available Players</h3>
        <p className="text-[10px] text-gray-500">Drag a player to a position on the diamond</p>
        <input
          type="text"
          placeholder="Filter by name or position..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
        />
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {availablePlayers.map((p) => (
            <DraggablePlayer
              key={p.id}
              player={p}
              onClick={() => setSelectedPlayer(p.id)}
            />
          ))}
          {availablePlayers.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No available players</p>
          )}
        </div>
      </div>
    </div>
  );
}
