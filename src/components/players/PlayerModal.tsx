import { useStore } from '../../store/useStore';
import RatingBar from '../common/RatingBar';
import ScoreBadge from '../common/ScoreBadge';
import PercentileBar from '../common/PercentileBar';
import PlayerRadarChart from './PlayerRadarChart';
import { analyzePlayer, getPlayerRecommendation } from '../../utils/helpers';
import { HITTER_ARCHETYPE_INFO, PITCHER_ARCHETYPE_INFO } from '../../types';
import { X } from 'lucide-react';

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
