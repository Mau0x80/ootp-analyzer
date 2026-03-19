import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { CARD_TIER_COLORS, RATINGS_SCALES } from '../../types';
import type { CardTier, ArtifactBoost, Player } from '../../types';
import ScoreBadge from '../../components/common/ScoreBadge';

const TIER_OPTIONS: CardTier[] = ['Silver', 'Gold', 'Bronze', 'Diamond'];

// Boostable attributes for simulation
const BOOST_ATTRIBUTES = [
  { key: 'con', label: 'Contact', group: 'batting' },
  { key: 'pow', label: 'Power', group: 'batting' },
  { key: 'eye', label: 'Eye', group: 'batting' },
  { key: 'gap', label: 'Gap', group: 'batting' },
  { key: 'spe', label: 'Speed', group: 'batting' },
  { key: 'stu', label: 'Stuff', group: 'pitching' },
  { key: 'mov', label: 'Movement', group: 'pitching' },
  { key: 'con', label: 'Control (P)', group: 'pitching' },
  { key: 'cAbi', label: 'C Ability', group: 'fielding' },
  { key: 'ifRng', label: 'IF Range', group: 'fielding' },
  { key: 'ofRng', label: 'OF Range', group: 'fielding' },
];

export default function PTSleepers() {
  const ptPlayers = useStore((s) => s.ptPlayers);
  const applyArtifactToPlayer = useStore((s) => s.applyArtifactToPlayer);
  const clearPlayerArtifacts = useStore((s) => s.clearPlayerArtifacts);
  const settings = useStore((s) => s.settings);
  const scale = RATINGS_SCALES[settings.currentRatingsScale];

  const [tierFilter, setTierFilter] = useState<CardTier[]>(['Silver', 'Gold']);
  const [simPlayerId, setSimPlayerId] = useState<string | null>(null);
  const [simBoosts, setSimBoosts] = useState<Record<string, number>>({});

  const sleepers = useMemo(() => {
    // Calculate "potential ceiling" for each card by looking at attribute gaps
    return ptPlayers
      .filter((p) => tierFilter.length === 0 || tierFilter.includes(p.cardTier))
      .map((p) => {
        // Estimate max boost potential based on gap between current attrs and scale max
        let roomToGrow = 0;
        if (p.battingRatings) {
          const br = p.battingRatings;
          roomToGrow += (scale.max - br.con) + (scale.max - br.eye) + (scale.max - br.pow);
        }
        if (p.pitchingRatings) {
          const pr = p.pitchingRatings;
          roomToGrow += (scale.max - pr.stu) + (scale.max - pr.mov);
        }
        return { player: p, roomToGrow, existingGap: p.hiddenPotentialGap };
      })
      .sort((a, b) => {
        // Sort by existing gap first, then by room to grow
        if (b.existingGap !== a.existingGap) return b.existingGap - a.existingGap;
        return b.roomToGrow - a.roomToGrow;
      })
      .slice(0, 20);
  }, [ptPlayers, tierFilter, scale]);

  const simPlayer = simPlayerId ? ptPlayers.find((p) => p.id === simPlayerId) : null;

  const handleApplySimulation = () => {
    if (!simPlayerId) return;
    const boosts: ArtifactBoost[] = Object.entries(simBoosts)
      .filter(([, v]) => v > 0)
      .map(([attribute, boost]) => ({ attribute, boost }));
    if (boosts.length > 0) {
      applyArtifactToPlayer(simPlayerId, boosts);
    }
  };

  const handleClearArtifact = (playerId: string) => {
    clearPlayerArtifacts(playerId);
  };

  const toggleTier = (tier: CardTier) => {
    setTierFilter((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  if (ptPlayers.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No cards loaded. Import CSV files first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sleeper Finder</h1>
        <p className="text-sm text-gray-400 mt-1">
          Identify cards with the most hidden potential for Cap Tournaments. Apply artifact simulations to see boosted scores.
        </p>
      </div>

      {/* Tier filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Filter tiers:</span>
        {TIER_OPTIONS.map((tier) => {
          const colors = CARD_TIER_COLORS[tier];
          const active = tierFilter.includes(tier);
          return (
            <button
              key={tier}
              onClick={() => toggleTier(tier)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                active
                  ? `${colors.text} ${colors.bg} ${colors.border}`
                  : 'text-gray-500 bg-gray-800 border-gray-700'
              }`}
            >
              {tier}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sleeper list */}
        <div className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Top Sleeper Candidates</h2>
          <div className="space-y-2">
            {sleepers.map(({ player: p, roomToGrow }, i) => {
              const colors = CARD_TIER_COLORS[p.cardTier];
              const hasArtifact = p.artifactBoosts.length > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => { setSimPlayerId(p.id); setSimBoosts({}); }}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    simPlayerId === p.id ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs w-5 text-center font-bold ${i < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {p.name}
                        {hasArtifact && <span className="text-yellow-400 ml-1 text-[10px]">✦ Boosted</span>}
                      </p>
                      <p className="text-[10px] text-gray-500">{p.pos} | OVR {p.cardOvr} | Room: +{roomToGrow}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colors.text} ${colors.bg} ${colors.border}`}>
                      {p.cardTier}
                    </span>
                    <div className="text-right">
                      <ScoreBadge score={p.scores.overallValue} size="sm" />
                      {p.hiddenPotentialGap > 0 && (
                        <p className="text-[10px] font-mono text-yellow-400">+{p.hiddenPotentialGap.toFixed(1)}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Artifact simulation panel */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Artifact Simulation</h2>
          {simPlayer ? (
            <>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-sm font-medium text-white">{simPlayer.name}</p>
                <p className="text-xs text-gray-400">
                  {simPlayer.pos} | OVR {simPlayer.cardOvr} | {simPlayer.cardTier}
                </p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span>Base: <span className="text-gray-200 font-mono">{simPlayer.scores.overallValue.toFixed(1)}</span></span>
                  {simPlayer.hiddenPotentialGap > 0 && (
                    <span>Effective: <span className="text-emerald-400 font-mono">{simPlayer.effectiveScores.overallValue.toFixed(1)}</span></span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-gray-400">Boost attributes (points in current scale, max {scale.max}):</p>
                {BOOST_ATTRIBUTES.filter(({ group }) => {
                  if (group === 'batting' && !simPlayer.battingRatings) return false;
                  if (group === 'pitching' && !simPlayer.pitchingRatings) return false;
                  if (group === 'fielding' && !simPlayer.fieldingRatings) return false;
                  return true;
                }).map(({ key, label }) => (
                  <div key={`${key}-${label}`} className="flex items-center gap-3">
                    <label className="text-xs text-gray-300 w-24">{label}</label>
                    <input
                      type="range"
                      min={0}
                      max={Math.round(scale.max * 0.3)}
                      value={simBoosts[key] || 0}
                      onChange={(e) => setSimBoosts({ ...simBoosts, [key]: parseInt(e.target.value) })}
                      className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <span className="text-xs font-mono text-purple-400 w-8 text-right">
                      +{simBoosts[key] || 0}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApplySimulation}
                  className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
                >
                  Apply Artifacts
                </button>
                {simPlayer.artifactBoosts.length > 0 && (
                  <button
                    onClick={() => handleClearArtifact(simPlayer.id)}
                    className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
                  >
                    Clear Artifacts
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500 py-8 text-center">
              Select a card from the sleeper list to simulate artifact boosts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
