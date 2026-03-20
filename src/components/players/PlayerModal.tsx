import { useStore } from '../../store/useStore';
import RatingBar from '../common/RatingBar';
import ScoreBadge from '../common/ScoreBadge';
import PercentileBar from '../common/PercentileBar';
import PlayerRadarChart from './PlayerRadarChart';
import { analyzePlayer, getPlayerRecommendation } from '../../utils/helpers';
import { HITTER_ARCHETYPE_INFO, PITCHER_ARCHETYPE_INFO } from '../../types';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PlayerModal() {
  const selectedPlayerId = useStore((s) => s.selectedPlayerId);
  const players = useStore((s) => s.players);
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);

  const player = players.find((p) => p.id === selectedPlayerId);
  if (!player) return null;

  const insights = analyzePlayer(player);
  const recommendation = getPlayerRecommendation(player);
  const pct = player.percentiles;
  const hitterInfo = player.hitterArchetype ? HITTER_ARCHETYPE_INFO[player.hitterArchetype] : null;
  const pitcherInfo = player.pitcherArchetype ? PITCHER_ARCHETYPE_INFO[player.pitcherArchetype] : null;
  const dump = player.dumpData ?? null;

  const formatSalary = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${val}`;
  };

  const personalityBarColor = (val: number, isGreed = false) => {
    if (isGreed) {
      if (val <= 80) return 'bg-emerald-500';
      if (val <= 120) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    if (val >= 150) return 'bg-emerald-500';
    if (val >= 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const gapColor = (gap: number) =>
    gap > 0 ? 'text-emerald-400' : gap < 0 ? 'text-red-400' : 'text-gray-500';

  const GapIcon = ({ gap }: { gap: number }) =>
    gap > 0 ? <TrendingUp className="w-3 h-3 inline text-emerald-400" /> :
    gap < 0 ? <TrendingDown className="w-3 h-3 inline text-red-400" /> :
    <Minus className="w-3 h-3 inline text-gray-500" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">{player.name}</h2>
            <p className="text-sm text-gray-400">
              #{player.number} | {player.pos} | Age {player.age} | B:{player.bats} T:{player.throws}
            </p>
          </div>
          <button onClick={() => setSelectedPlayer(null)} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Archetype & Recommendation */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 bg-brand-500/10 border border-brand-500/30 rounded-lg p-3">
              <p className="text-sm font-medium text-brand-400">Recommendation: {recommendation}</p>
            </div>
            {hitterInfo && (
              <div className={`rounded-lg p-3 border ${hitterInfo.bgColor}`}>
                <p className="text-[10px] uppercase tracking-wide opacity-70" style={{ color: 'inherit' }}>Hitter Type</p>
                <p className={`text-sm font-bold ${hitterInfo.color}`}>{hitterInfo.label}</p>
                <p className="text-[10px] text-gray-400 mt-1">{hitterInfo.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {hitterInfo.keyTraits.map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-800/80 rounded-full text-gray-300">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {pitcherInfo && (
              <div className={`rounded-lg p-3 border ${pitcherInfo.bgColor}`}>
                <p className="text-[10px] uppercase tracking-wide opacity-70">Pitcher Type</p>
                <p className={`text-sm font-bold ${pitcherInfo.color}`}>{pitcherInfo.label}</p>
                <p className="text-[10px] text-gray-400 mt-1">{pitcherInfo.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {pitcherInfo.keyTraits.map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-800/80 rounded-full text-gray-300">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scores */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Composite Scores</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                ['Offense', player.scores.offensiveScore],
                ['Defense', player.scores.defensiveScore],
                ['Pitching', player.scores.pitchingScore],
                ['Lineup Fit', player.scores.lineupFitScore],
                ['vs LHP', player.scores.platoonVsLHP],
                ['vs RHP', player.scores.platoonVsRHP],
                ['Starter', player.scores.starterScore],
                ['Reliever', player.scores.relieverScore],
                ['Flexibility', player.scores.positionalFlexibility],
                ['Overall', player.scores.overallValue],
              ].map(([label, val]) => (
                <div key={label as string} className="text-center">
                  <ScoreBadge score={val as number} size="sm" />
                  <p className="text-[10px] text-gray-500 mt-1">{label as string}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          <PlayerRadarChart player={player} />

          {/* Percentile Rankings — Batting */}
          {pct.offensiveScore !== undefined && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                Percentile Rankings <span className="text-[10px] text-gray-500 font-normal">(vs roster)</span>
              </h3>
              <div className="space-y-1.5 bg-gray-800/30 rounded-lg p-3">
                <PercentileBar label="OFF" value={player.scores.offensiveScore.toFixed(1)} percentile={pct.offensiveScore} />
                {pct.defensiveScore !== undefined && (
                  <PercentileBar label="DEF" value={player.scores.defensiveScore.toFixed(1)} percentile={pct.defensiveScore} />
                )}
                {pct.ops !== undefined && player.battingStats && (
                  <PercentileBar label="OPS" value={player.battingStats.ops.toFixed(3)} percentile={pct.ops} />
                )}
                {pct.opsPlus !== undefined && player.battingStats && (
                  <PercentileBar label="OPS+" value={player.battingStats.opsPlus} percentile={pct.opsPlus} />
                )}
                {pct.woba !== undefined && player.battingStats && (
                  <PercentileBar label="wOBA" value={player.battingStats.woba.toFixed(3)} percentile={pct.woba} />
                )}
                {pct.wrcPlus !== undefined && player.battingStats && (
                  <PercentileBar label="wRC+" value={player.battingStats.wrcPlus} percentile={pct.wrcPlus} />
                )}
                {pct.war !== undefined && player.battingStats && (
                  <PercentileBar label="WAR" value={player.battingStats.war.toFixed(1)} percentile={pct.war} />
                )}
                {pct.iso !== undefined && player.battingStats && (
                  <PercentileBar label="ISO" value={player.battingStats.iso.toFixed(3)} percentile={pct.iso} />
                )}
                {pct.avg !== undefined && player.battingStats && (
                  <PercentileBar label="AVG" value={player.battingStats.avg.toFixed(3)} percentile={pct.avg} />
                )}
                {pct.bbPct !== undefined && player.battingStats && (
                  <PercentileBar label="BB%" value={player.battingStats.bbPct.toFixed(1)} percentile={pct.bbPct} />
                )}
                {pct.kPct !== undefined && player.battingStats && (
                  <PercentileBar label="K%" value={player.battingStats.kPct.toFixed(1)} percentile={pct.kPct} />
                )}
              </div>
            </div>
          )}

          {/* Percentile Rankings — Pitching */}
          {pct.pitchingScore !== undefined && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                Percentile Rankings <span className="text-[10px] text-gray-500 font-normal">(vs roster pitchers)</span>
              </h3>
              <div className="space-y-1.5 bg-gray-800/30 rounded-lg p-3">
                <PercentileBar label="Score" value={player.scores.pitchingScore.toFixed(1)} percentile={pct.pitchingScore} />
                {pct.era !== undefined && player.pitchingStats && (
                  <PercentileBar label="ERA" value={player.pitchingStats.era.toFixed(2)} percentile={pct.era} />
                )}
                {pct.fip !== undefined && player.pitchingStats && (
                  <PercentileBar label="FIP" value={player.pitchingStats.fip.toFixed(2)} percentile={pct.fip} />
                )}
                {pct.whip !== undefined && player.pitchingStats && (
                  <PercentileBar label="WHIP" value={player.pitchingStats.whip.toFixed(2)} percentile={pct.whip} />
                )}
                {pct.k9 !== undefined && player.pitchingStats && (
                  <PercentileBar label="K/9" value={player.pitchingStats.k9.toFixed(1)} percentile={pct.k9} />
                )}
                {pct.kBbPct !== undefined && player.pitchingStats && (
                  <PercentileBar label="K-BB%" value={player.pitchingStats.kBbPct.toFixed(1)} percentile={pct.kBbPct} />
                )}
                {pct.siera !== undefined && player.pitchingStats && (
                  <PercentileBar label="SIERA" value={player.pitchingStats.siera.toFixed(2)} percentile={pct.siera} />
                )}
                {pct.pitchWar !== undefined && player.pitchingStats && (
                  <PercentileBar label="WAR" value={player.pitchingStats.war.toFixed(1)} percentile={pct.pitchWar} />
                )}
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Strengths & Weaknesses</h3>
              <div className="flex flex-wrap gap-2">
                {insights.map((i, idx) => (
                  <span
                    key={idx}
                    className={`badge-${i.type}`}
                    title={i.detail}
                  >
                    {i.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Eligible Positions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Eligible Positions</h3>
            <div className="flex gap-2">
              {player.eligiblePositions.map((pos) => (
                <span key={pos} className="px-2 py-1 bg-gray-800 rounded-md text-xs font-medium text-gray-300">
                  {pos}
                  {player.positionRatings && (
                    <span className="ml-1 text-gray-500">
                      ({player.positionRatings[pos.toLowerCase() as keyof typeof player.positionRatings] ?? '-'})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Dump Info Header */}
          {dump && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-gray-800 rounded p-2">
                <p className="text-gray-500">OVR</p>
                <p className="text-white font-mono font-bold text-base">{dump.overallAbility}</p>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <p className="text-gray-500">POT</p>
                <p className="text-brand-400 font-mono font-bold text-base">{dump.potential}</p>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <p className="text-gray-500">Team</p>
                <p className="text-white font-mono">{dump.teamAbbr || dump.teamName || '-'}</p>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <p className="text-gray-500">Morale</p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dump.morale >= 150 ? 'bg-emerald-500' : dump.morale >= 100 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${(dump.morale / 200) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-mono shrink-0">{dump.morale}</span>
                </div>
              </div>
            </div>
          )}

          {/* Contract & Service */}
          {dump && (dump.contractInfo || dump.rosterInfo) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Contract & Service</h3>
              <div className="bg-gray-800/30 rounded-lg p-3 space-y-3">
                {dump.rosterInfo && (
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {dump.rosterInfo.isActive && <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">Active</span>}
                      {dump.rosterInfo.isOnDL && <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-medium">DL</span>}
                      {dump.rosterInfo.isOnDL60 && <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-medium">DL-60</span>}
                      {dump.rosterInfo.isOnWaivers && <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full font-medium">Waivers</span>}
                      {dump.rosterInfo.designatedForAssignment && <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-medium">DFA</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-gray-800 rounded p-2">
                        <p className="text-gray-500">MLB Service</p>
                        <p className="text-white font-mono">{dump.rosterInfo.mlbServiceYears}.{String(dump.rosterInfo.mlbServiceDays).padStart(3, '0')}</p>
                      </div>
                      <div className="bg-gray-800 rounded p-2">
                        <p className="text-gray-500">Pro Years</p>
                        <p className="text-white font-mono">{dump.rosterInfo.proServiceYears}</p>
                      </div>
                      <div className="bg-gray-800 rounded p-2">
                        <p className="text-gray-500">Options Used</p>
                        <p className="text-white font-mono">{dump.rosterInfo.optionsUsed}</p>
                      </div>
                    </div>
                  </div>
                )}
                {dump.contractInfo && (
                  <div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                      <div className="bg-gray-800 rounded p-2">
                        <p className="text-gray-500">Years</p>
                        <p className="text-white font-mono">{dump.contractInfo.currentYear}/{dump.contractInfo.totalYears}</p>
                      </div>
                      <div className="bg-gray-800 rounded p-2">
                        <p className="text-gray-500">Remaining</p>
                        <p className="text-white font-mono">{dump.contractInfo.totalYears - dump.contractInfo.currentYear}yr</p>
                      </div>
                      <div className="bg-gray-800 rounded p-2">
                        <p className="text-gray-500">Total Value</p>
                        <p className="text-white font-mono">{formatSalary(dump.contractInfo.salaries.reduce((a, b) => a + b, 0))}</p>
                      </div>
                    </div>
                    {dump.contractInfo.salaries.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {dump.contractInfo.salaries.map((s, i) => (
                          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${i < dump.contractInfo!.currentYear ? 'bg-gray-700 text-gray-500' : 'bg-gray-700 text-white'}`}>
                            Y{i + 1}: {formatSalary(s)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1.5 flex-wrap">
                      {dump.contractInfo.isMajor && <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">Major League</span>}
                      {!dump.contractInfo.isMajor && <span className="text-[10px] px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full">Minor League</span>}
                      {dump.contractInfo.noTrade && <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">No-Trade</span>}
                      {dump.contractInfo.teamOption && <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Team Option</span>}
                      {dump.contractInfo.playerOption && <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">Player Option</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personality */}
          {dump?.personality && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Personality</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-gray-800/30 rounded-lg p-3">
                {([
                  ['Work Ethic', dump.personality.workEthic, false],
                  ['Intelligence', dump.personality.intelligence, false],
                  ['Leadership', dump.personality.leadership, false],
                  ['Loyalty', dump.personality.loyalty, false],
                  ['Play for Winner', dump.personality.playForWinner, false],
                  ['Greed', dump.personality.greed, true],
                ] as [string, number, boolean][]).map(([label, val, isGreed]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-28 shrink-0 text-right">{label}</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${personalityBarColor(val, isGreed)}`}
                        style={{ width: `${(val / 200) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-300 w-8 text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statcast Data */}
          {dump?.statcastData && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Statcast</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                {([
                  ['Avg EV', dump.statcastData.avgExitVelo?.toFixed(1)],
                  ['Max EV', dump.statcastData.maxExitVelo?.toFixed(1)],
                  ['LA', dump.statcastData.avgLaunchAngle?.toFixed(1)],
                  ['Sprint', dump.statcastData.sprintSpeed?.toFixed(1)],
                  ['Hard Hit%', dump.statcastData.hardHitPct?.toFixed(1)],
                  ['Barrel%', dump.statcastData.barrelPct?.toFixed(1)],
                ] as [string, string | undefined][]).map(([label, val]) => (
                  <div key={label} className="bg-gray-800 rounded p-2">
                    <p className="text-gray-500">{label}</p>
                    <p className="text-white font-mono">{val ?? '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pitch Repertoire */}
          {dump?.pitchRepertoire && player.isPitcher && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Pitch Repertoire</h3>
              <div className="bg-gray-800/30 rounded-lg p-3 space-y-1.5">
                {([
                  ['Fastball', dump.pitchRepertoire.fastball],
                  ['Sinker', dump.pitchRepertoire.sinker],
                  ['Cutter', dump.pitchRepertoire.cutter],
                  ['Slider', dump.pitchRepertoire.slider],
                  ['Curveball', dump.pitchRepertoire.curveball],
                  ['Changeup', dump.pitchRepertoire.changeup],
                  ['Splitter', dump.pitchRepertoire.splitter],
                  ['Knuckleball', dump.pitchRepertoire.knuckleball],
                  ['Screwball', dump.pitchRepertoire.screwball],
                  ['Forkball', dump.pitchRepertoire.forkball],
                  ['Circle Change', dump.pitchRepertoire.circlechange],
                  ['Knuckle Curve', dump.pitchRepertoire.knucklecurve],
                ] as [string, number][]).filter(([, val]) => val > 0).map(([label, val]) => {
                  const pct = (val / 200) * 100;
                  let barColor = 'bg-red-500';
                  if (pct >= 60) barColor = 'bg-emerald-500';
                  else if (pct >= 40) barColor = 'bg-blue-500';
                  else if (pct >= 25) barColor = 'bg-yellow-500';
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-28 shrink-0 text-right">{label}</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-gray-300 w-8 text-right">{val}</span>
                    </div>
                  );
                })}
                <div className="flex gap-4 mt-2 pt-2 border-t border-gray-700">
                  <span className="text-xs text-gray-400">Velocity: <span className="text-white font-mono">{dump.velocity ?? '-'}</span></span>
                  <span className="text-xs text-gray-400">Arm Slot: <span className="text-white font-mono">{dump.armSlot ?? '-'}</span></span>
                </div>
              </div>
            </div>
          )}

          {/* Talent vs Current Ratings */}
          {dump && (dump.talentBattingRatings || dump.talentPitchingRatings) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                Talent vs Current <span className="text-[10px] text-gray-500 font-normal">(development gap)</span>
              </h3>
              <div className="bg-gray-800/30 rounded-lg p-3 space-y-4">
                {/* Batting talent comparison */}
                {dump.talentBattingRatings && player.battingRatings && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Batting</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {([
                        ['CON', player.battingRatings.con, dump.talentBattingRatings.con],
                        ['POW', player.battingRatings.pow, dump.talentBattingRatings.pow],
                        ['EYE', player.battingRatings.eye, dump.talentBattingRatings.eye],
                        ['GAP', player.battingRatings.gap, dump.talentBattingRatings.gap],
                        ['SPE', player.battingRatings.spe, dump.talentBattingRatings.spe],
                        ['STE', player.battingRatings.ste, dump.talentBattingRatings.ste],
                        ['BABIP', player.battingRatings.babip, dump.talentBattingRatings.babip],
                        ['K\'s', player.battingRatings.ks, dump.talentBattingRatings.ks],
                      ] as [string, number, number][]).map(([label, cur, tal]) => {
                        const gap = tal - cur;
                        return (
                          <div key={label} className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-400 w-12 text-right shrink-0">{label}</span>
                            <span className="text-gray-300 font-mono w-7 text-right">{cur}</span>
                            <span className="text-gray-600 mx-0.5">/</span>
                            <span className="text-brand-400 font-mono w-7 text-right">{tal}</span>
                            <span className={`font-mono w-10 text-right ${gapColor(gap)}`}>
                              <GapIcon gap={gap} /> {gap > 0 ? '+' : ''}{gap}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Pitching talent comparison */}
                {dump.talentPitchingRatings && player.pitchingRatings && player.isPitcher && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Pitching</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {([
                        ['STU', player.pitchingRatings.stu, dump.talentPitchingRatings.stu],
                        ['MOV', player.pitchingRatings.mov, dump.talentPitchingRatings.mov],
                        ['CON', player.pitchingRatings.con, dump.talentPitchingRatings.con],
                        ['HRA', player.pitchingRatings.hra, dump.talentPitchingRatings.hra],
                        ['PBABIP', player.pitchingRatings.pbabip, dump.talentPitchingRatings.pbabip],
                        ['HLD', player.pitchingRatings.hld, dump.talentPitchingRatings.hld],
                      ] as [string, number, number][]).map(([label, cur, tal]) => {
                        const gap = tal - cur;
                        return (
                          <div key={label} className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-400 w-12 text-right shrink-0">{label}</span>
                            <span className="text-gray-300 font-mono w-7 text-right">{cur}</span>
                            <span className="text-gray-600 mx-0.5">/</span>
                            <span className="text-brand-400 font-mono w-7 text-right">{tal}</span>
                            <span className={`font-mono w-10 text-right ${gapColor(gap)}`}>
                              <GapIcon gap={gap} /> {gap > 0 ? '+' : ''}{gap}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Batting Ratings */}
          {player.battingRatings && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Batting Ratings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                <RatingBar label="CON" value={player.battingRatings.con} />
                <RatingBar label="POW" value={player.battingRatings.pow} />
                <RatingBar label="EYE" value={player.battingRatings.eye} />
                <RatingBar label="GAP" value={player.battingRatings.gap} />
                <RatingBar label="SPE" value={player.battingRatings.spe} />
                <RatingBar label="STE" value={player.battingRatings.ste} />
                <RatingBar label="BABIP" value={player.battingRatings.babip} />
                <RatingBar label="K's" value={player.battingRatings.ks} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-gray-500">vs LHP</p>
                  <p className="text-white font-mono">CON {player.battingRatings.conVL} / POW {player.battingRatings.powVL} / EYE {player.battingRatings.eyeVL}</p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-gray-500">vs RHP</p>
                  <p className="text-white font-mono">CON {player.battingRatings.conVR} / POW {player.battingRatings.powVR} / EYE {player.battingRatings.eyeVR}</p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <p className="text-gray-500">Overall</p>
                  <p className="text-white font-mono">OVR {player.battingRatings.ovr}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pitching Ratings */}
          {player.pitchingRatings && player.isPitcher && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Pitching Ratings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                <RatingBar label="STU" value={player.pitchingRatings.stu} />
                <RatingBar label="MOV" value={player.pitchingRatings.mov} />
                <RatingBar label="CON" value={player.pitchingRatings.con} />
                <RatingBar label="STM" value={player.pitchingRatings.stm} max={100} />
                <RatingBar label="HRA" value={player.pitchingRatings.hra} />
                <RatingBar label="PBABIP" value={player.pitchingRatings.pbabip} />
                <RatingBar label="HLD" value={player.pitchingRatings.hld} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                VELO: {player.pitchingRatings.velo} | G/F: {player.pitchingRatings.gf} |
                STU vL: {player.pitchingRatings.stuVL} | STU vR: {player.pitchingRatings.stuVR}
              </p>
            </div>
          )}

          {/* Fielding Ratings */}
          {player.fieldingRatings && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Fielding Ratings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                <RatingBar label="C ABI" value={player.fieldingRatings.cAbi} />
                <RatingBar label="C ARM" value={player.fieldingRatings.cArm} />
                <RatingBar label="IF RNG" value={player.fieldingRatings.ifRng} />
                <RatingBar label="IF ERR" value={player.fieldingRatings.ifErr} />
                <RatingBar label="IF ARM" value={player.fieldingRatings.ifArm} />
                <RatingBar label="TDP" value={player.fieldingRatings.tdp} />
                <RatingBar label="OF RNG" value={player.fieldingRatings.ofRng} />
                <RatingBar label="OF ERR" value={player.fieldingRatings.ofErr} />
                <RatingBar label="OF ARM" value={player.fieldingRatings.ofArm} />
              </div>
            </div>
          )}

          {/* Batting Stats */}
          {player.battingStats && player.battingStats.pa > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Batting Stats</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-xs">
                {([
                  ['G', player.battingStats.g],
                  ['PA', player.battingStats.pa],
                  ['AVG', player.battingStats.avg.toFixed(3)],
                  ['OBP', player.battingStats.obp.toFixed(3)],
                  ['SLG', player.battingStats.slg.toFixed(3)],
                  ['OPS', player.battingStats.ops.toFixed(3)],
                  ['OPS+', player.battingStats.opsPlus],
                  ['HR', player.battingStats.hr],
                  ['RBI', player.battingStats.rbi],
                  ['WAR', player.battingStats.war.toFixed(1)],
                  ['ISO', player.battingStats.iso.toFixed(3)],
                  ['SB', player.battingStats.sb],
                ] as [string, string | number][]).map(([label, val]) => (
                  <div key={label} className="bg-gray-800 rounded p-2">
                    <p className="text-gray-500">{label}</p>
                    <p className="text-white font-mono">{val}</p>
                  </div>
                ))}
              </div>
              {/* Advanced stats from super stats CSV */}
              {player.battingStats.woba > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Advanced Metrics</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-xs">
                    {([
                      ['wOBA', player.battingStats.woba.toFixed(3)],
                      ['wRC+', player.battingStats.wrcPlus],
                      ['wRAA', player.battingStats.wraa.toFixed(1)],
                      ['BB%', player.battingStats.bbPct.toFixed(1)],
                      ['K%', player.battingStats.kPct.toFixed(1)],
                      ['WPA', player.battingStats.wpa.toFixed(2)],
                      ['RC/27', player.battingStats.rc27.toFixed(1)],
                      ['PI/PA', player.battingStats.piPa.toFixed(2)],
                      ['UBR', player.battingStats.ubr.toFixed(1)],
                      ['wSB', player.battingStats.wsb.toFixed(1)],
                      ['SB%', player.battingStats.sbPct.toFixed(1)],
                      ['EBH', player.battingStats.ebh],
                    ] as [string, string | number][]).map(([label, val]) => (
                      <div key={label} className="bg-gray-800/70 rounded p-2 border border-gray-700/50">
                        <p className="text-blue-400/70">{label}</p>
                        <p className="text-white font-mono">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pitching Stats */}
          {player.pitchingStats && player.pitchingStats.ip > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Pitching Stats</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-xs">
                {([
                  ['G', player.pitchingStats.g],
                  ['GS', player.pitchingStats.gs],
                  ['W-L', `${player.pitchingStats.w}-${player.pitchingStats.l}`],
                  ['SV', player.pitchingStats.sv],
                  ['IP', player.pitchingStats.ip.toFixed(1)],
                  ['ERA', player.pitchingStats.era.toFixed(2)],
                  ['FIP', player.pitchingStats.fip.toFixed(2)],
                  ['WHIP', player.pitchingStats.whip.toFixed(2)],
                  ['K/9', player.pitchingStats.k9.toFixed(1)],
                  ['BB/9', player.pitchingStats.bb9.toFixed(1)],
                  ['ERA+', player.pitchingStats.eraPlus],
                  ['WAR', player.pitchingStats.war.toFixed(1)],
                ] as [string, string | number][]).map(([label, val]) => (
                  <div key={label} className="bg-gray-800 rounded p-2">
                    <p className="text-gray-500">{label}</p>
                    <p className="text-white font-mono">{val}</p>
                  </div>
                ))}
              </div>
              {/* Advanced pitching stats from super stats CSV */}
              {player.pitchingStats.kBbPct !== 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Advanced Metrics</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-xs">
                    {([
                      ['K%', player.pitchingStats.kPct.toFixed(1)],
                      ['BB%', player.pitchingStats.bbPct.toFixed(1)],
                      ['K-BB%', player.pitchingStats.kBbPct.toFixed(1)],
                      ['SIERA', player.pitchingStats.siera.toFixed(2)],
                      ['FIP-', player.pitchingStats.fipMinus],
                      ['rWAR', player.pitchingStats.rwar.toFixed(1)],
                      ['WPA', player.pitchingStats.wpa.toFixed(2)],
                      ['LOB%', player.pitchingStats.lobPct.toFixed(1)],
                      ['pLi', player.pitchingStats.pli.toFixed(2)],
                      ['QS', player.pitchingStats.qs],
                      ['SD/MD', `${player.pitchingStats.sd}/${player.pitchingStats.md}`],
                      ['GO%', player.pitchingStats.goPct.toFixed(1)],
                    ] as [string, string | number][]).map(([label, val]) => (
                      <div key={label} className="bg-gray-800/70 rounded p-2 border border-gray-700/50">
                        <p className="text-emerald-400/70">{label}</p>
                        <p className="text-white font-mono">{val}</p>
                      </div>
                    ))}
                  </div>
                  {/* Reliever-specific stats */}
                  {player.pitchingStats.ir > 0 && (
                    <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                      {([
                        ['IR', player.pitchingStats.ir],
                        ['IRS', player.pitchingStats.irs],
                        ['IRS%', player.pitchingStats.irsPct.toFixed(1)],
                        ['BS', player.pitchingStats.bs],
                      ] as [string, string | number][]).map(([label, val]) => (
                        <div key={label} className="bg-gray-800/70 rounded p-2 border border-gray-700/50">
                          <p className="text-yellow-400/70">{label}</p>
                          <p className="text-white font-mono">{val}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
