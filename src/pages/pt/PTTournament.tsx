import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { CARD_TIER_COLORS, CARD_TIER_BOUNDARIES } from '../../types';
import type { CardTier } from '../../types';
import { filterByTournament } from '../../utils/tournamentOptimizer';
import ScoreBadge from '../../components/common/ScoreBadge';

const PRESET_CAPS: { label: string; ovrCap: number; tiers: CardTier[] }[] = [
  { label: 'Bronze Only', ovrCap: 69, tiers: ['Bronze'] },
  { label: 'Silver Only', ovrCap: 79, tiers: ['Silver'] },
  { label: 'Gold Only', ovrCap: 89, tiers: ['Gold'] },
  { label: 'Diamond Only', ovrCap: 99, tiers: ['Diamond'] },
  { label: 'Silver + Bronze', ovrCap: 79, tiers: ['Silver', 'Bronze'] },
  { label: 'Gold + Below', ovrCap: 89, tiers: ['Gold', 'Silver', 'Bronze'] },
  { label: 'No Limit', ovrCap: 200, tiers: [] },
];

export default function PTTournament() {
  const ptPlayers = useStore((s) => s.ptPlayers);
  const tournamentConfig = useStore((s) => s.tournamentConfig);
  const updateTournamentConfig = useStore((s) => s.updateTournamentConfig);
  const doGenerateLineup = useStore((s) => s.generateTournamentLineup);
  const tournamentLineup = useStore((s) => s.tournamentLineup);

  const eligible = useMemo(
    () => filterByTournament(ptPlayers, tournamentConfig),
    [ptPlayers, tournamentConfig]
  );

  const eligibleSorted = useMemo(
    () => [...eligible].sort((a, b) => {
      const sa = tournamentConfig.prioritizeArtifacts ? a.effectiveScores.overallValue : a.scores.overallValue;
      const sb = tournamentConfig.prioritizeArtifacts ? b.effectiveScores.overallValue : b.scores.overallValue;
      return sb - sa;
    }),
    [eligible, tournamentConfig.prioritizeArtifacts]
  );

  if (ptPlayers.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No cards loaded. Import CSV files first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tournament Optimizer</h1>

      {/* Controls */}
      <div className="card p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300">Tournament Rules</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_CAPS.map((preset) => {
            const active =
              tournamentConfig.ovrCap === preset.ovrCap &&
              JSON.stringify(tournamentConfig.tierFilter.sort()) === JSON.stringify(preset.tiers.sort());
            return (
              <button
                key={preset.label}
                onClick={() => updateTournamentConfig({ ovrCap: preset.ovrCap, tierFilter: preset.tiers })}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  active
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Custom OVR Cap:</label>
            <input
              type="number"
              min={0}
              max={200}
              value={tournamentConfig.ovrCap}
              onChange={(e) => updateTournamentConfig({ ovrCap: parseInt(e.target.value) || 79 })}
              className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={tournamentConfig.prioritizeArtifacts}
              onChange={(e) => updateTournamentConfig({ prioritizeArtifacts: e.target.checked })}
              className="rounded accent-purple-500"
            />
            Prioritize Artifact-Boosted Scores
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={doGenerateLineup}
            disabled={eligible.length === 0}
            className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white transition-colors"
          >
            Generate Optimal Lineup
          </button>
          <span className="text-xs text-gray-500">
            {eligible.length} eligible cards (OVR ≤ {tournamentConfig.ovrCap})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Eligible card pool */}
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">
            Eligible Card Pool ({eligible.length})
          </h2>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {eligibleSorted.slice(0, 30).map((p) => {
              const colors = CARD_TIER_COLORS[p.cardTier];
              const score = tournamentConfig.prioritizeArtifacts
                ? p.effectiveScores.overallValue
                : p.scores.overallValue;
              return (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1 py-0.5 rounded border font-medium ${colors.text} ${colors.bg} ${colors.border}`}>
                      {p.cardOvr}
                    </span>
                    <div>
                      <p className="text-sm text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-500">{p.pos}{p.artifactBoosts.length > 0 ? ' ✦' : ''}</p>
                    </div>
                  </div>
                  <ScoreBadge score={score} size="sm" />
                </div>
              );
            })}
            {eligibleSorted.length > 30 && (
              <p className="text-xs text-gray-500 text-center py-2">
                + {eligibleSorted.length - 30} more cards
              </p>
            )}
          </div>
        </div>

        {/* Generated lineup */}
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Optimized Lineup</h2>
          {tournamentLineup ? (
            <div className="space-y-2">
              <div className="flex gap-4 text-xs text-gray-400 mb-3">
                <span>Total OFF: <span className="text-emerald-400 font-mono">{tournamentLineup.totalOffense.toFixed(1)}</span></span>
                <span>Total DEF: <span className="text-blue-400 font-mono">{tournamentLineup.totalDefense.toFixed(1)}</span></span>
              </div>
              {tournamentLineup.slots.map((slot) => {
                const colors = CARD_TIER_COLORS[slot.player.cardTier];
                return (
                  <div key={slot.position} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-6 text-center font-bold text-brand-400">{slot.position}</span>
                      <div>
                        <p className="text-sm text-white">{slot.player.name}</p>
                        <p className="text-[10px] text-gray-500">
                          OVR {slot.player.cardOvr}
                          {slot.outOfPosition && <span className="text-yellow-400 ml-1">OOP</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1 py-0.5 rounded border font-medium ${colors.text} ${colors.bg} ${colors.border}`}>
                        {slot.player.cardTier}
                      </span>
                      <ScoreBadge score={slot.score} size="sm" />
                    </div>
                  </div>
                );
              })}

              {tournamentLineup.bench.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mt-4 mb-2 font-medium">Bench ({tournamentLineup.bench.length})</p>
                  {tournamentLineup.bench.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30">
                      <p className="text-xs text-gray-400">{p.name} ({p.pos})</p>
                      <span className="text-xs font-mono text-gray-500">OVR {p.cardOvr}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 py-8 text-center">
              Click "Generate Optimal Lineup" to build the best lineup within the OVR cap.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
