import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import ScoreBadge from '../../components/common/ScoreBadge';
import DiamondField from '../../components/lineup/DiamondField';
import { generateLineup, generatePitchingStaff } from '../../utils/lineupOptimizer';
import { CARD_TIER_COLORS } from '../../types';
import type { CardTier } from '../../types';

const LINEUP_MODES = [
  { key: 'general',  label: 'General' },
  { key: 'vs_rhp',   label: 'vs RHP' },
  { key: 'vs_lhp',   label: 'vs LHP' },
  { key: 'defense',  label: 'Best Defense' },
  { key: 'balanced', label: 'Balanced' },
] as const;

type LineupMode = typeof LINEUP_MODES[number]['key'];

function TierBadge({ tier }: { tier: CardTier }) {
  const c = CARD_TIER_COLORS[tier];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${c.text} ${c.bg} ${c.border}`}>
      {tier}
    </span>
  );
}

export default function PTLineup() {
  const ptPlayers = useStore((s) => s.ptPlayers);
  const settings = useStore((s) => s.settings);
  const [activeMode, setActiveMode] = useState<LineupMode>('general');
  const [useDH, setUseDH] = useState(true);
  const [allowOOP, setAllowOOP] = useState(false);

  const lineup = useMemo(
    () => ptPlayers.length > 0
      ? generateLineup(ptPlayers, activeMode, settings, useDH, allowOOP)
      : null,
    [ptPlayers, activeMode, settings, useDH, allowOOP]
  );

  const pitchingStaff = useMemo(
    () => ptPlayers.length > 0 ? generatePitchingStaff(ptPlayers) : null,
    [ptPlayers]
  );

  if (ptPlayers.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No cards loaded. Import your PT collection first.</p>
      </div>
    );
  }

  if (!lineup) return null;

  return (
    <div className="space-y-6">
      {/* Header & controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Best Lineup</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {LINEUP_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveMode(key)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                activeMode === key
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-700 mx-1" />
          <button
            onClick={() => setUseDH((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              useDH ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            DH {useDH ? 'On' : 'Off'}
          </button>
          <button
            onClick={() => setAllowOOP((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              allowOOP ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {allowOOP ? 'Any Pos' : 'Eligible Only'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total Offense</p>
          <p className="text-2xl font-bold text-purple-400">{lineup.totalOffense.toFixed(1)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total Defense</p>
          <p className="text-2xl font-bold text-emerald-400">{lineup.totalDefense.toFixed(1)}</p>
        </div>
      </div>

      {/* Diamond */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Field View</h3>
        <DiamondField slots={lineup.slots} onSlotClick={() => {}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Starting lineup */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Starting Lineup (by Position)</h3>
          <div className="space-y-2">
            {lineup.slots.map((slot) => (
              <div
                key={slot.position}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-8 ${slot.outOfPosition ? 'text-red-400' : 'text-purple-400'}`}>
                    {slot.position}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {slot.player.name}
                      {slot.outOfPosition && (
                        <span className="ml-2 text-[10px] text-red-400 font-normal">(Out of Position)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      B:{slot.player.bats} | Age {slot.player.age}
                      {(slot.player as any).cardOvr !== undefined && ` | OVR ${(slot.player as any).cardOvr}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(slot.player as any).cardTier && <TierBadge tier={(slot.player as any).cardTier as CardTier} />}
                  <ScoreBadge score={slot.score} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batting order */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Batting Order</h3>
          <div className="space-y-2">
            {lineup.battingOrder.map((slot, i) => (
              <div
                key={slot.player.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-500 w-8 text-center">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{slot.player.name}</p>
                    <p className="text-xs text-gray-500">
                      {slot.position} | B:{slot.player.bats}
                      {slot.player.battingRatings && (
                        <> | CON {slot.player.battingRatings.con} POW {slot.player.battingRatings.pow} EYE {slot.player.battingRatings.eye}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(slot.player as any).cardTier && <TierBadge tier={(slot.player as any).cardTier as CardTier} />}
                  <ScoreBadge score={slot.player.scores.offensiveScore} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bench */}
      {lineup.bench.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Bench ({lineup.bench.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lineup.bench.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.pos} | {p.eligiblePositions.join(', ')}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(p as any).cardTier && <TierBadge tier={(p as any).cardTier as CardTier} />}
                  <ScoreBadge score={p.scores.overallValue} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pitching Staff */}
      {pitchingStaff && (
        <div className="card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">Pitching Staff</h3>

          {pitchingStaff.rotation.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Starting Rotation</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {pitchingStaff.rotation.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 w-5 text-center">SP{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">Age {p.age}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(p as any).cardTier && <TierBadge tier={(p as any).cardTier as CardTier} />}
                      <ScoreBadge score={p.scores.overallValue} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(pitchingStaff.closer || pitchingStaff.setupMen.length > 0 || pitchingStaff.middleRelievers.length > 0) && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Bullpen</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  ...(pitchingStaff.closer ? [pitchingStaff.closer] : []),
                  ...pitchingStaff.setupMen,
                  ...pitchingStaff.middleRelievers,
                  ...(pitchingStaff.longReliever ? [pitchingStaff.longReliever] : []),
                ].map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.pos} | Age {p.age}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(p as any).cardTier && <TierBadge tier={(p as any).cardTier as CardTier} />}
                      <ScoreBadge score={p.scores.overallValue} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
