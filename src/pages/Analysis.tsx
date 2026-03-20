import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { Player } from '../types';
import {
  TrendingUp,
  BarChart3,
  Shield,
  Activity,
  Clock,
  Users,
  AlertTriangle,
  Star,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  Heart,
  Zap,
  Target,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type AnalysisTab = 'tradeValue' | 'depthChart' | 'injuryRisk' | 'agingCurves' | 'platoon' | 'slamDunks';

interface TradeValuePlayer {
  player: Player;
  tradeValue: number;
  agePenalty: number;
  salaryBurden: number;
  scarcityBonus: number;
  personalityBonus: number;
  remainingSalary: number;
  contractYears: number;
  flags: string[];
}

interface DepthEntry {
  player: Player;
  posScore: number;
  role: 'starter' | 'backup' | 'emergency';
}

interface DepthPosition {
  position: string;
  entries: DepthEntry[];
  depthScore: number;
  isThin: boolean;
}

interface InjuryRiskPlayer {
  player: Player;
  riskScore: number;
  baseAgeRisk: number;
  dlHistoryRisk: number;
  workloadRisk: number;
  factors: string[];
}

interface AgingPlayer {
  player: Player;
  currentOvr: number;
  talentOvr: number | null;
  gap: number;
  projected1: number;
  projected2: number;
  projected3: number;
  category: 'rising' | 'peak' | 'graceful' | 'decline';
}

interface PlatoonPair {
  position: string;
  leftBatter: Player | null;
  rightBatter: Player | null;
  platoonAdvantage: number;
  bestSingle: Player | null;
  bestSingleOvr: number;
  combinedOvr: number;
  isStrong: boolean;
}

interface PitcherSplit {
  player: Player;
  stuVL: number;
  stuVR: number;
  splitDiff: number;
  specialistType: 'LOOGY' | 'ROOGY' | 'balanced';
}

// ============================================================
// Helpers
// ============================================================

const TAB_CONFIG: { key: AnalysisTab; label: string; icon: React.ReactNode }[] = [
  { key: 'tradeValue', label: 'Trade Value', icon: <DollarSign className="w-4 h-4" /> },
  { key: 'depthChart', label: 'Depth Chart', icon: <Users className="w-4 h-4" /> },
  { key: 'injuryRisk', label: 'Injury Risk', icon: <Heart className="w-4 h-4" /> },
  { key: 'agingCurves', label: 'Aging Curves', icon: <Clock className="w-4 h-4" /> },
  { key: 'platoon', label: 'Platoon Optimizer', icon: <Target className="w-4 h-4" /> },
  { key: 'slamDunks', label: 'Slam Dunks', icon: <Zap className="w-4 h-4" /> },
];

const FIELD_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const ALL_POSITIONS = [...FIELD_POSITIONS, 'SP', 'RP/CL'];

const POS_KEY_MAP: Record<string, string> = {
  C: 'c', '1B': '1b', '2B': '2b', '3B': '3b', SS: 'ss',
  LF: 'lf', CF: 'cf', RF: 'rf',
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function getRemainingContractSalary(player: Player): number {
  const ci = player.dumpData?.contractInfo;
  if (!ci || !ci.salaries.length) return 0;
  const remaining = ci.salaries.slice(ci.currentYear);
  return remaining.reduce((a, b) => a + b, 0);
}

function getContractYearsRemaining(player: Player): number {
  const ci = player.dumpData?.contractInfo;
  if (!ci) return 0;
  return Math.max(0, ci.totalYears - ci.currentYear);
}

function getOvr(player: Player): number {
  if (player.dumpData?.overallAbility) return player.dumpData.overallAbility;
  if (player.cardOvr) return player.cardOvr;
  if (player.isPitcher && player.pitchingRatings) return player.pitchingRatings.ovr;
  if (player.battingRatings) return player.battingRatings.ovr;
  return 0;
}

function getPotential(player: Player): number {
  return player.dumpData?.potential ?? 0;
}

// ============================================================
// Trade Value Calculator
// ============================================================

function computeTradeValues(players: Player[]): TradeValuePlayer[] {
  return players.map((p) => {
    const ovr = getOvr(p);
    const pot = getPotential(p);
    const age = p.age;

    // Age penalty
    let agePenalty = 0;
    if (age > 32) {
      agePenalty = (age - 32) * 6 + (32 - 27) * 2;
    } else if (age > 27) {
      agePenalty = (age - 27) * 2;
    }

    // Salary burden
    const remainingSalary = getRemainingContractSalary(p);
    const salaryBurden = remainingSalary / 10_000_000;

    // Scarcity bonus
    const primaryPos = p.pos.toUpperCase();
    let scarcityBonus = 5;
    if (['SS', 'C', 'CF'].includes(primaryPos)) scarcityBonus = 20;
    else if (['2B', '3B'].includes(primaryPos)) scarcityBonus = 10;

    // Personality bonus
    let personalityBonus = 0;
    const pers = p.dumpData?.personality;
    if (pers) {
      if (pers.workEthic >= 140) personalityBonus += 5;
      if (pers.loyalty >= 140) personalityBonus += 3;
      if (pers.greed <= 60) personalityBonus += 5;
    }

    const ovrWeight = 1.2;
    const potWeight = 0.6;
    const ageWeight = 1.0;
    const salaryWeight = 3.0;

    const tradeValue =
      ovrWeight * ovr +
      potWeight * pot -
      ageWeight * agePenalty -
      salaryWeight * salaryBurden +
      scarcityBonus +
      personalityBonus;

    const flags: string[] = [];
    if (pot > ovr + 20) flags.push('High Ceiling');
    if (age <= 25 && ovr >= 50) flags.push('Young Talent');
    if (p.dumpData?.contractInfo?.noTrade) flags.push('No-Trade');
    if (salaryBurden > 5) flags.push('Expensive');
    if (pers && pers.workEthic >= 160) flags.push('Hard Worker');
    if (scarcityBonus >= 20) flags.push('Scarce Pos');

    return {
      player: p,
      tradeValue: Math.round(tradeValue * 10) / 10,
      agePenalty,
      salaryBurden: Math.round(salaryBurden * 10) / 10,
      scarcityBonus,
      personalityBonus,
      remainingSalary,
      contractYears: getContractYearsRemaining(p),
      flags,
    };
  }).sort((a, b) => b.tradeValue - a.tradeValue);
}

// ============================================================
// Depth Chart
// ============================================================

function computeDepthChart(players: Player[]): DepthPosition[] {
  return ALL_POSITIONS.map((pos) => {
    let eligible: { player: Player; score: number }[];

    if (pos === 'SP') {
      eligible = players
        .filter((p) => p.isPitcher && (p.pitcherArchetype?.includes('Starter') || p.pitcherArchetype === 'Ace' || p.pitcherArchetype === 'Innings Eater' || p.pos === 'SP'))
        .map((p) => ({ player: p, score: p.pitchingRatings?.ovr ?? getOvr(p) }));
    } else if (pos === 'RP/CL') {
      eligible = players
        .filter((p) => p.isPitcher && (p.pitcherArchetype?.includes('Reliever') || p.pitcherArchetype === 'Setup/Closer' || p.pitcherArchetype === 'Fireman' || p.pitcherArchetype === 'Mop-Up' || p.pos === 'RP' || p.pos === 'CL'))
        .map((p) => ({ player: p, score: p.pitchingRatings?.ovr ?? getOvr(p) }));
    } else if (pos === 'DH') {
      eligible = players
        .filter((p) => p.isPositionPlayer)
        .map((p) => ({ player: p, score: p.battingRatings?.ovr ?? getOvr(p) }));
    } else {
      const posKey = POS_KEY_MAP[pos];
      eligible = players
        .filter((p) => {
          if (p.eligiblePositions.some((ep) => ep.toUpperCase() === pos)) return true;
          if (p.positionRatings && posKey && (p.positionRatings as any)[posKey] > 0) return true;
          if (p.pos.toUpperCase() === pos) return true;
          return false;
        })
        .map((p) => {
          const posRating = p.positionRatings && posKey ? (p.positionRatings as any)[posKey] ?? 0 : 0;
          const ovrVal = getOvr(p);
          return { player: p, score: posRating > 0 ? (posRating * 0.4 + ovrVal * 0.6) : ovrVal * 0.7 };
        });
    }

    eligible.sort((a, b) => b.score - a.score);
    const top = eligible.slice(0, 8);

    const entries: DepthEntry[] = top.map((e, i) => ({
      player: e.player,
      posScore: Math.round(e.score * 10) / 10,
      role: i === 0 ? 'starter' : i <= 2 ? 'backup' : 'emergency',
    }));

    const topScores = entries.slice(0, 3).map((e) => e.posScore);
    const depthScore = topScores.length >= 3
      ? Math.round((topScores.reduce((a, b) => a + b, 0) / 3) * 10) / 10
      : topScores.length > 0
        ? Math.round((topScores.reduce((a, b) => a + b, 0) / topScores.length) * 10) / 10
        : 0;

    return {
      position: pos,
      entries,
      depthScore,
      isThin: entries.length < 2,
    };
  });
}

// ============================================================
// Injury Risk
// ============================================================

function computeInjuryRisks(players: Player[]): InjuryRiskPlayer[] {
  return players.map((p) => {
    const factors: string[] = [];

    // Base age risk
    let baseAgeRisk: number;
    if (p.age < 26) { baseAgeRisk = 10; }
    else if (p.age <= 30) { baseAgeRisk = 20; factors.push('Age 26-30'); }
    else if (p.age <= 34) { baseAgeRisk = 35; factors.push('Age 31-34'); }
    else { baseAgeRisk = 50; factors.push('Age 35+'); }

    // DL history
    let dlHistoryRisk = 0;
    const ri = p.dumpData?.rosterInfo;
    if (ri?.isOnDL60) {
      dlHistoryRisk = 50;
      factors.push('On 60-day DL');
    } else if (ri?.isOnDL) {
      dlHistoryRisk = 30;
      factors.push('On DL');
    }

    // Workload risk
    let workloadRisk = 0;
    if (p.isPitcher && p.pitchingStats) {
      if (p.pitchingStats.ip > 200) {
        workloadRisk = 20;
        factors.push('200+ IP');
      } else if (p.pitchingStats.ip > 180) {
        workloadRisk = 15;
        factors.push('180+ IP');
      } else if (p.pitchingStats.ip > 160) {
        workloadRisk = 8;
        factors.push('160+ IP');
      }
    }

    const riskScore = clamp(baseAgeRisk + dlHistoryRisk + workloadRisk, 0, 100);

    return { player: p, riskScore, baseAgeRisk, dlHistoryRisk, workloadRisk, factors };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

// ============================================================
// Aging Curves
// ============================================================

function computeAgingCurves(players: Player[]): AgingPlayer[] {
  return players.map((p) => {
    const currentOvr = getOvr(p);
    const talent = p.dumpData?.talentBattingRatings?.ovr ?? p.dumpData?.talentPitchingRatings?.ovr ?? null;
    const talentOvr = talent;
    const gap = talentOvr != null ? talentOvr - currentOvr : 0;

    // Project future OVR
    function project(yearsAhead: number): number {
      let proj = currentOvr;
      for (let y = 1; y <= yearsAhead; y++) {
        const futureAge = p.age + y;
        if (gap > 0 && futureAge < 28) {
          // Still developing
          proj += Math.min(gap / 3, 5);
        } else if (futureAge <= 30) {
          // Peak window - slight decline
          proj -= 1;
        } else if (futureAge <= 34) {
          // Gradual decline
          proj -= 2.5;
        } else {
          // Steep decline
          proj -= 4.5;
        }
      }
      return Math.round(clamp(proj, 0, 200) * 10) / 10;
    }

    // Categorize
    let category: AgingPlayer['category'];
    if (p.age < 27 && gap > 10) category = 'rising';
    else if (p.age >= 27 && p.age <= 30 && Math.abs(gap) <= 10) category = 'peak';
    else if (p.age >= 31 && p.age <= 34 && currentOvr > 50) category = 'graceful';
    else if (p.age >= 35 || gap < -10) category = 'decline';
    else if (p.age < 27) category = 'rising';
    else if (p.age <= 30) category = 'peak';
    else category = 'graceful';

    return {
      player: p,
      currentOvr,
      talentOvr,
      gap,
      projected1: project(1),
      projected2: project(2),
      projected3: project(3),
      category,
    };
  });
}

// ============================================================
// Platoon Optimizer
// ============================================================

function computePlatoons(players: Player[]): { pairs: PlatoonPair[]; pitcherSplits: PitcherSplit[] } {
  const positionPlayers = players.filter((p) => p.isPositionPlayer && p.battingRatings);

  const pairs: PlatoonPair[] = FIELD_POSITIONS.map((pos) => {
    const eligible = positionPlayers.filter((p) => {
      if (pos === 'DH') return true;
      const posKey = POS_KEY_MAP[pos];
      if (p.eligiblePositions.some((ep) => ep.toUpperCase() === pos)) return true;
      if (p.positionRatings && posKey && (p.positionRatings as any)[posKey] > 0) return true;
      if (p.pos.toUpperCase() === pos) return true;
      return false;
    });

    const lefties = eligible.filter((p) => p.bats === 'L');
    const righties = eligible.filter((p) => p.bats === 'R');

    // Best lefty vs RHP
    const bestLefty = lefties.length > 0
      ? lefties.reduce((best, p) => {
          const score = (p.battingRatings!.conVR + p.battingRatings!.powVR + p.battingRatings!.eyeVR) / 3;
          const bestScore = (best.battingRatings!.conVR + best.battingRatings!.powVR + best.battingRatings!.eyeVR) / 3;
          return score > bestScore ? p : best;
        })
      : null;

    // Best righty vs LHP
    const bestRighty = righties.length > 0
      ? righties.reduce((best, p) => {
          const score = (p.battingRatings!.conVL + p.battingRatings!.powVL + p.battingRatings!.eyeVL) / 3;
          const bestScore = (best.battingRatings!.conVL + best.battingRatings!.powVL + best.battingRatings!.eyeVL) / 3;
          return score > bestScore ? p : best;
        })
      : null;

    // Best single player overall
    const bestSingle = eligible.length > 0
      ? eligible.reduce((best, p) => {
          const overall = p.battingRatings!.ovr;
          const bestOvr = best.battingRatings!.ovr;
          return overall > bestOvr ? p : best;
        })
      : null;

    const bestSingleOvr = bestSingle?.battingRatings?.ovr ?? 0;

    // Combined platoon OVR
    let combinedOvr = 0;
    if (bestLefty && bestRighty) {
      const leftyVsR = (bestLefty.battingRatings!.conVR + bestLefty.battingRatings!.powVR + bestLefty.battingRatings!.eyeVR) / 3;
      const rightyVsL = (bestRighty.battingRatings!.conVL + bestRighty.battingRatings!.powVL + bestRighty.battingRatings!.eyeVL) / 3;
      combinedOvr = (leftyVsR + rightyVsL) / 2;
    }

    const platoonAdvantage = bestSingleOvr > 0
      ? ((combinedOvr - bestSingleOvr) / bestSingleOvr) * 100
      : 0;

    return {
      position: pos,
      leftBatter: bestLefty,
      rightBatter: bestRighty,
      platoonAdvantage: Math.round(platoonAdvantage * 10) / 10,
      bestSingle,
      bestSingleOvr,
      combinedOvr: Math.round(combinedOvr * 10) / 10,
      isStrong: platoonAdvantage > 10,
    };
  });

  // Pitcher splits
  const pitchers = players.filter((p) => p.isPitcher && p.pitchingRatings);
  const pitcherSplits: PitcherSplit[] = pitchers.map((p) => {
    const stuVL = p.pitchingRatings!.stuVL;
    const stuVR = p.pitchingRatings!.stuVR;
    const diff = stuVL - stuVR;
    let specialistType: PitcherSplit['specialistType'] = 'balanced';
    if (diff > 15) specialistType = 'LOOGY';
    else if (diff < -15) specialistType = 'ROOGY';
    return { player: p, stuVL, stuVR, splitDiff: diff, specialistType };
  }).sort((a, b) => Math.abs(b.splitDiff) - Math.abs(a.splitDiff));

  return { pairs, pitcherSplits };
}

// ============================================================
// Sub-components
// ============================================================

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${color}`}>
      {text}
    </span>
  );
}

function RiskBar({ value }: { value: number }) {
  const color =
    value >= 70 ? 'bg-red-500' :
    value >= 50 ? 'bg-orange-500' :
    value >= 30 ? 'bg-yellow-500' :
    'bg-emerald-500';
  const textColor =
    value >= 70 ? 'text-red-400' :
    value >= 50 ? 'text-orange-400' :
    value >= 30 ? 'text-yellow-400' :
    'text-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold ${textColor}`}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 bg-gray-700/50 rounded-lg">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ============================================================
// Tab 1: Trade Value
// ============================================================

function TradeValueTab({ players }: { players: Player[] }) {
  const data = useMemo(() => computeTradeValues(players), [players]);
  const top30 = data.slice(0, 30);
  const bestValue = useMemo(() =>
    [...data]
      .filter((d) => d.remainingSalary > 0)
      .sort((a, b) => (b.tradeValue / Math.max(b.salaryBurden, 0.1)) - (a.tradeValue / Math.max(a.salaryBurden, 0.1)))
      .slice(0, 10),
    [data]
  );
  const overpaid = useMemo(() =>
    [...data]
      .filter((d) => d.remainingSalary > 0)
      .sort((a, b) => (a.tradeValue / Math.max(a.salaryBurden, 0.1)) - (b.tradeValue / Math.max(b.salaryBurden, 0.1)))
      .slice(0, 10),
    [data]
  );

  if (data.length === 0) return <EmptyState message="No players loaded. Import data to see trade values." />;

  return (
    <div className="space-y-6">
      {/* Top 30 */}
      <div className="card p-4">
        <SectionHeader
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          title="Top 30 Most Tradeable Players"
          subtitle="Ranked by composite trade value score"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-700/50">
                <th className="text-left py-2 px-2 w-8">#</th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-1">Pos</th>
                <th className="text-right py-2 px-1">Age</th>
                <th className="text-right py-2 px-1">OVR</th>
                <th className="text-right py-2 px-1">POT</th>
                <th className="text-right py-2 px-2">Trade Value</th>
                <th className="text-right py-2 px-1">Salary</th>
                <th className="text-right py-2 px-1">Yrs</th>
                <th className="text-left py-2 px-2">Flags</th>
              </tr>
            </thead>
            <tbody>
              {top30.map((d, i) => (
                <tr key={d.player.id} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                  <td className="py-1.5 px-2 text-gray-500 font-mono text-xs">{i + 1}</td>
                  <td className="py-1.5 px-2 text-gray-100 font-medium truncate max-w-[160px]">{d.player.name}</td>
                  <td className="py-1.5 px-1 text-gray-400">{d.player.pos}</td>
                  <td className="py-1.5 px-1 text-right text-gray-300">{d.player.age}</td>
                  <td className="py-1.5 px-1 text-right font-mono text-gray-200">{getOvr(d.player)}</td>
                  <td className="py-1.5 px-1 text-right font-mono text-gray-300">{getPotential(d.player) || '-'}</td>
                  <td className={`py-1.5 px-2 text-right font-mono font-bold ${d.tradeValue >= 100 ? 'text-emerald-400' : d.tradeValue >= 60 ? 'text-blue-400' : d.tradeValue >= 30 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {fmt(d.tradeValue, 1)}
                  </td>
                  <td className="py-1.5 px-1 text-right text-gray-400 text-xs">{d.remainingSalary > 0 ? fmtMoney(d.remainingSalary) : 'Pre-Arb'}</td>
                  <td className="py-1.5 px-1 text-right text-gray-400 text-xs">{d.contractYears > 0 ? d.contractYears : '-'}</td>
                  <td className="py-1.5 px-2">
                    <div className="flex flex-wrap gap-1">
                      {d.flags.map((f) => (
                        <Badge
                          key={f}
                          text={f}
                          color={
                            f === 'High Ceiling' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                            f === 'Young Talent' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                            f === 'No-Trade' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                            f === 'Expensive' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                            f === 'Hard Worker' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                            f === 'Scarce Pos' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                            'bg-gray-500/15 text-gray-400 border-gray-500/30'
                          }
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Value + Overpaid side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionHeader
            icon={<ArrowUpRight className="w-4 h-4 text-emerald-400" />}
            title="Best Value"
            subtitle="High trade value, low salary burden"
          />
          <div className="space-y-1">
            {bestValue.map((d, i) => (
              <div key={d.player.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-800/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-gray-500 font-mono w-4">{i + 1}</span>
                  <span className="text-sm text-gray-200 truncate">{d.player.name}</span>
                  <span className="text-[10px] text-gray-500">{d.player.pos}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-emerald-400 font-mono">{fmt(d.tradeValue)}</span>
                  <span className="text-[10px] text-gray-500">{d.remainingSalary > 0 ? fmtMoney(d.remainingSalary) : 'Pre-Arb'}</span>
                </div>
              </div>
            ))}
            {bestValue.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No contract data available</p>}
          </div>
        </div>

        <div className="card p-4">
          <SectionHeader
            icon={<ArrowDownRight className="w-4 h-4 text-red-400" />}
            title="Overpaid"
            subtitle="Low trade value, high salary burden"
          />
          <div className="space-y-1">
            {overpaid.map((d, i) => (
              <div key={d.player.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-800/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-gray-500 font-mono w-4">{i + 1}</span>
                  <span className="text-sm text-gray-200 truncate">{d.player.name}</span>
                  <span className="text-[10px] text-gray-500">{d.player.pos}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-red-400 font-mono">{fmt(d.tradeValue)}</span>
                  <span className="text-[10px] text-gray-500">{fmtMoney(d.remainingSalary)}</span>
                </div>
              </div>
            ))}
            {overpaid.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No contract data available</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: Depth Chart
// ============================================================

function DepthChartTab({ players }: { players: Player[] }) {
  const depth = useMemo(() => computeDepthChart(players), [players]);

  if (players.length === 0) return <EmptyState message="No players loaded. Import data to see depth chart." />;

  const roleColor = (role: DepthEntry['role']) =>
    role === 'starter' ? 'border-l-emerald-500 bg-emerald-500/5' :
    role === 'backup' ? 'border-l-yellow-500 bg-yellow-500/5' :
    'border-l-red-500 bg-red-500/5';

  const roleLabel = (role: DepthEntry['role']) =>
    role === 'starter' ? 'text-emerald-400' :
    role === 'backup' ? 'text-yellow-400' :
    'text-red-400';

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="card p-4">
        <SectionHeader
          icon={<BarChart3 className="w-4 h-4 text-blue-400" />}
          title="Depth Summary"
          subtitle="Average of top 3 players at each position"
        />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
          {depth.map((d) => (
            <div
              key={d.position}
              className={`text-center p-2 rounded-lg border ${d.isThin ? 'border-red-500/40 bg-red-500/5' : 'border-gray-700/50 bg-gray-800/30'}`}
            >
              <div className="text-[10px] text-gray-400 font-medium">{d.position}</div>
              <div className={`text-lg font-bold font-mono ${d.depthScore >= 60 ? 'text-emerald-400' : d.depthScore >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>
                {fmt(d.depthScore, 0)}
              </div>
              <div className="text-[9px] text-gray-500">{d.entries.length} players</div>
              {d.isThin && (
                <div className="text-[9px] text-red-400 font-bold mt-0.5">THIN</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Position details */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {depth.map((d) => (
          <div key={d.position} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${d.isThin ? 'text-red-400' : 'text-gray-100'}`}>
                  {d.position}
                </span>
                {d.isThin && (
                  <Badge text="THIN" color="bg-red-500/15 text-red-400 border-red-500/30" />
                )}
              </div>
              <span className="text-xs text-gray-500">Depth: {fmt(d.depthScore, 0)}</span>
            </div>
            <div className="space-y-1">
              {d.entries.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-2">No eligible players</p>
              )}
              {d.entries.map((e, i) => (
                <div
                  key={e.player.id}
                  className={`flex items-center justify-between py-1.5 px-2 rounded border-l-2 ${roleColor(e.role)}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-gray-500 font-mono w-3">{i + 1}</span>
                    <span className="text-xs text-gray-200 truncate">{e.player.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-mono font-bold ${roleLabel(e.role)}`}>{fmt(e.posScore, 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Tab 3: Injury Risk
// ============================================================

function InjuryRiskTab({ players }: { players: Player[] }) {
  const risks = useMemo(() => computeInjuryRisks(players), [players]);
  const highRiskStars = useMemo(
    () => risks.filter((r) => getOvr(r.player) >= 55 && r.riskScore >= 40),
    [risks]
  );

  if (players.length === 0) return <EmptyState message="No players loaded. Import data to see injury risks." />;

  return (
    <div className="space-y-6">
      {/* High Risk Stars */}
      {highRiskStars.length > 0 && (
        <div className="card p-4 border-red-500/20">
          <SectionHeader
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            title="High Risk Stars"
            subtitle="Key players (OVR 55+) with elevated injury risk (40+)"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {highRiskStars.map((r) => (
              <div key={r.player.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-100 truncate">{r.player.name}</div>
                  <div className="text-[10px] text-gray-400">{r.player.pos} | Age {r.player.age} | OVR {getOvr(r.player)}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.factors.map((f) => (
                      <Badge key={f} text={f} color="bg-red-500/10 text-red-400 border-red-500/20" />
                    ))}
                  </div>
                </div>
                <div className="shrink-0 ml-3">
                  <RiskBar value={r.riskScore} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="card p-4">
        <SectionHeader
          icon={<Activity className="w-4 h-4 text-orange-400" />}
          title="All Players by Injury Risk"
          subtitle="Computed from age, DL history, and workload"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-700/50">
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-1">Pos</th>
                <th className="text-right py-2 px-1">Age</th>
                <th className="text-right py-2 px-1">OVR</th>
                <th className="text-left py-2 px-2">Risk Score</th>
                <th className="text-left py-2 px-2">Risk Factors</th>
              </tr>
            </thead>
            <tbody>
              {risks.slice(0, 50).map((r) => (
                <tr key={r.player.id} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                  <td className="py-1.5 px-2 text-gray-200 font-medium truncate max-w-[160px]">{r.player.name}</td>
                  <td className="py-1.5 px-1 text-gray-400">{r.player.pos}</td>
                  <td className="py-1.5 px-1 text-right text-gray-300">{r.player.age}</td>
                  <td className="py-1.5 px-1 text-right font-mono text-gray-200">{getOvr(r.player)}</td>
                  <td className="py-1.5 px-2"><RiskBar value={r.riskScore} /></td>
                  <td className="py-1.5 px-2">
                    <div className="flex flex-wrap gap-1">
                      {r.factors.length === 0 && <span className="text-[10px] text-gray-600">Low risk</span>}
                      {r.factors.map((f) => (
                        <Badge
                          key={f}
                          text={f}
                          color={
                            f.includes('60') ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                            f.includes('DL') ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                            f.includes('IP') ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                            'bg-gray-500/15 text-gray-400 border-gray-500/30'
                          }
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab 4: Aging Curves
// ============================================================

function AgingCurvesTab({ players }: { players: Player[] }) {
  const aging = useMemo(() => computeAgingCurves(players), [players]);

  const rising = useMemo(() => aging.filter((a) => a.category === 'rising').sort((a, b) => b.gap - a.gap), [aging]);
  const peak = useMemo(() => aging.filter((a) => a.category === 'peak').sort((a, b) => b.currentOvr - a.currentOvr), [aging]);
  const graceful = useMemo(() => aging.filter((a) => a.category === 'graceful').sort((a, b) => b.currentOvr - a.currentOvr), [aging]);
  const decline = useMemo(() => aging.filter((a) => a.category === 'decline').sort((a, b) => b.currentOvr - a.currentOvr), [aging]);

  if (players.length === 0) return <EmptyState message="No players loaded. Import data to see aging curves." />;

  const categoryConfig: { key: AgingPlayer['category']; label: string; subtitle: string; icon: React.ReactNode; color: string; data: AgingPlayer[] }[] = [
    { key: 'rising', label: 'Rising Stars', subtitle: 'Age < 27, talent gap > 10', icon: <ChevronUp className="w-4 h-4 text-emerald-400" />, color: 'text-emerald-400', data: rising },
    { key: 'peak', label: 'Peak Window', subtitle: 'Age 27-30, near max potential', icon: <Star className="w-4 h-4 text-yellow-400" />, color: 'text-yellow-400', data: peak },
    { key: 'graceful', label: 'Aging Gracefully', subtitle: 'Age 31-34, still productive', icon: <Minus className="w-4 h-4 text-blue-400" />, color: 'text-blue-400', data: graceful },
    { key: 'decline', label: 'Decline Phase', subtitle: 'Age 35+ or talent gap < -10', icon: <ChevronDown className="w-4 h-4 text-red-400" />, color: 'text-red-400', data: decline },
  ];

  function TrendArrow({ current, projected }: { current: number; projected: number }) {
    const diff = projected - current;
    if (diff > 2) return <ArrowUpRight className="w-3 h-3 text-emerald-400 inline" />;
    if (diff < -2) return <ArrowDownRight className="w-3 h-3 text-red-400 inline" />;
    return <Minus className="w-3 h-3 text-gray-500 inline" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categoryConfig.map((cat) => (
          <div key={cat.key} className="card p-3 text-center">
            <div className={`text-2xl font-bold font-mono ${cat.color}`}>{cat.data.length}</div>
            <div className="text-xs text-gray-300 font-medium">{cat.label}</div>
            <div className="text-[10px] text-gray-500">{cat.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Category tables */}
      {categoryConfig.map((cat) => (
        <div key={cat.key} className="card p-4">
          <SectionHeader icon={cat.icon} title={cat.label} subtitle={cat.subtitle} />
          {cat.data.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No players in this category</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-700/50">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-1">Pos</th>
                    <th className="text-right py-2 px-1">Age</th>
                    <th className="text-right py-2 px-1">Cur OVR</th>
                    <th className="text-right py-2 px-1">Tal OVR</th>
                    <th className="text-right py-2 px-1">Gap</th>
                    <th className="text-right py-2 px-1">+1yr</th>
                    <th className="text-right py-2 px-1">+2yr</th>
                    <th className="text-right py-2 px-1">+3yr</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.data.slice(0, 20).map((a) => (
                    <tr key={a.player.id} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                      <td className="py-1.5 px-2 text-gray-200 font-medium truncate max-w-[160px]">{a.player.name}</td>
                      <td className="py-1.5 px-1 text-gray-400">{a.player.pos}</td>
                      <td className="py-1.5 px-1 text-right text-gray-300">{a.player.age}</td>
                      <td className="py-1.5 px-1 text-right font-mono text-gray-200">{fmt(a.currentOvr, 0)}</td>
                      <td className="py-1.5 px-1 text-right font-mono text-gray-300">{a.talentOvr != null ? fmt(a.talentOvr, 0) : '-'}</td>
                      <td className={`py-1.5 px-1 text-right font-mono font-bold ${a.gap > 5 ? 'text-emerald-400' : a.gap < -5 ? 'text-red-400' : 'text-gray-400'}`}>
                        {a.gap > 0 ? '+' : ''}{fmt(a.gap, 0)}
                      </td>
                      <td className="py-1.5 px-1 text-right font-mono text-gray-300">
                        <TrendArrow current={a.currentOvr} projected={a.projected1} /> {fmt(a.projected1, 0)}
                      </td>
                      <td className="py-1.5 px-1 text-right font-mono text-gray-300">
                        <TrendArrow current={a.currentOvr} projected={a.projected2} /> {fmt(a.projected2, 0)}
                      </td>
                      <td className="py-1.5 px-1 text-right font-mono text-gray-300">
                        <TrendArrow current={a.currentOvr} projected={a.projected3} /> {fmt(a.projected3, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Tab 5: Platoon Optimizer
// ============================================================

function PlatoonTab({ players }: { players: Player[] }) {
  const { pairs, pitcherSplits } = useMemo(() => computePlatoons(players), [players]);
  const specialists = useMemo(() => pitcherSplits.filter((s) => s.specialistType !== 'balanced').slice(0, 15), [pitcherSplits]);

  if (players.length === 0) return <EmptyState message="No players loaded. Import data to see platoon analysis." />;

  return (
    <div className="space-y-6">
      {/* Platoon pairs */}
      <div className="card p-4">
        <SectionHeader
          icon={<Users className="w-4 h-4 text-purple-400" />}
          title="Platoon Pair Recommendations"
          subtitle="Best L/R split pairs for each position"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pairs.map((pp) => (
            <div
              key={pp.position}
              className={`p-3 rounded-lg border ${pp.isStrong ? 'border-purple-500/30 bg-purple-500/5' : 'border-gray-700/50 bg-gray-800/20'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-100">{pp.position}</span>
                {pp.isStrong && (
                  <Badge text="STRONG PLATOON" color="bg-purple-500/15 text-purple-400 border-purple-500/30" />
                )}
              </div>

              <div className="space-y-2">
                {/* Left batter */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">L</span>
                    <span className="text-xs text-gray-200 truncate">{pp.leftBatter?.name ?? 'None'}</span>
                  </div>
                  {pp.leftBatter?.battingRatings && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      vsR: {pp.leftBatter.battingRatings.conVR}/{pp.leftBatter.battingRatings.powVR}/{pp.leftBatter.battingRatings.eyeVR}
                    </span>
                  )}
                </div>

                {/* Right batter */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">R</span>
                    <span className="text-xs text-gray-200 truncate">{pp.rightBatter?.name ?? 'None'}</span>
                  </div>
                  {pp.rightBatter?.battingRatings && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      vsL: {pp.rightBatter.battingRatings.conVL}/{pp.rightBatter.battingRatings.powVL}/{pp.rightBatter.battingRatings.eyeVL}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-700/30">
                  <div className="text-[10px] text-gray-500">
                    Best single: <span className="text-gray-300">{pp.bestSingle?.name ?? '-'}</span> ({fmt(pp.bestSingleOvr, 0)})
                  </div>
                  <div className={`text-xs font-mono font-bold ${pp.platoonAdvantage > 10 ? 'text-purple-400' : pp.platoonAdvantage > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {pp.platoonAdvantage > 0 ? '+' : ''}{fmt(pp.platoonAdvantage, 1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pitcher Splits */}
      <div className="card p-4">
        <SectionHeader
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          title="Pitcher Platoon Specialists"
          subtitle="Pitchers with significant L/R stuff splits"
        />
        {specialists.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No significant platoon splits found among pitchers</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-700/50">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-1">Throws</th>
                  <th className="text-right py-2 px-1">STU vL</th>
                  <th className="text-right py-2 px-1">STU vR</th>
                  <th className="text-right py-2 px-1">Split</th>
                  <th className="text-left py-2 px-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {specialists.map((s) => (
                  <tr key={s.player.id} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                    <td className="py-1.5 px-2 text-gray-200 font-medium truncate max-w-[160px]">{s.player.name}</td>
                    <td className="py-1.5 px-1 text-gray-400">{s.player.throws}</td>
                    <td className="py-1.5 px-1 text-right font-mono text-gray-200">{s.stuVL}</td>
                    <td className="py-1.5 px-1 text-right font-mono text-gray-200">{s.stuVR}</td>
                    <td className={`py-1.5 px-1 text-right font-mono font-bold ${Math.abs(s.splitDiff) > 20 ? 'text-purple-400' : 'text-yellow-400'}`}>
                      {s.splitDiff > 0 ? '+' : ''}{s.splitDiff}
                    </td>
                    <td className="py-1.5 px-2">
                      <Badge
                        text={s.specialistType}
                        color={
                          s.specialistType === 'LOOGY'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Slam Dunks — Low Cost / High Value Finder
// ============================================================

interface SlamDunkEntry {
  player: Player;
  category: 'bargainFA' | 'hiddenGem' | 'underutilized';
  slamScore: number;
  reason: string;
  ovr: number;
  pot: number;
  salary: number;
  age: number;
}

function findSlamDunks(
  orgPlayers: Player[],
  freeAgents: Player[],
  draftPlayers: Player[],
): SlamDunkEntry[] {
  const entries: SlamDunkEntry[] = [];

  // --- Bargain Free Agents ---
  // High OVR or POT relative to expected salary / age
  for (const p of freeAgents) {
    const ovr = getOvr(p);
    const pot = getPotential(p);
    const salary = getCurrentSalary(p);
    const pers = p.dumpData?.personality;
    const age = p.age;

    // Value: good player, cheap or free
    let score = 0;
    if (ovr >= 45) score += (ovr - 40) * 1.5;
    if (pot >= 50) score += (pot - 45) * 0.8;
    if (age <= 28) score += (29 - age) * 3;
    if (salary === 0) score += 15;
    else if (salary < 1_000_000) score += 10;
    else if (salary < 5_000_000) score += 5;
    // Personality bonuses
    if (pers) {
      if (pers.greed <= 80) score += 8;
      if (pers.workEthic >= 140) score += 5;
      if (pers.loyalty >= 140) score += 3;
    }

    if (score >= 25) {
      const reasons: string[] = [];
      if (salary === 0) reasons.push('Free');
      else if (salary < 2_000_000) reasons.push('Cheap');
      if (ovr >= 55) reasons.push(`${ovr} OVR`);
      if (pot > ovr + 15) reasons.push('High ceiling');
      if (age <= 25) reasons.push('Young');
      if (pers && pers.greed <= 60) reasons.push('Low greed');
      if (pers && pers.workEthic >= 160) reasons.push('Hard worker');
      entries.push({
        player: p,
        category: 'bargainFA',
        slamScore: Math.round(score),
        reason: reasons.join(' · ') || 'Good value',
        ovr, pot, salary, age,
      });
    }
  }

  // --- Hidden Gems (from draft pool) ---
  for (const p of draftPlayers) {
    const ovr = getOvr(p);
    const pot = getPotential(p);
    const age = p.age;
    const pers = p.dumpData?.personality;

    let score = 0;
    if (pot >= 55) score += (pot - 45) * 1.5;
    if (age <= 22) score += (23 - age) * 4;
    if (pers) {
      if (pers.workEthic >= 150) score += 8;
      if (pers.intelligence >= 140) score += 5;
    }
    // Talent vs current gap
    const talentOvr = p.dumpData?.talentBattingRatings?.ovr ?? p.dumpData?.talentPitchingRatings?.ovr ?? 0;
    if (talentOvr > ovr + 10) score += (talentOvr - ovr) * 0.8;

    if (score >= 30) {
      const reasons: string[] = [];
      if (pot >= 65) reasons.push(`${pot} POT`);
      else if (pot >= 55) reasons.push(`${pot} POT`);
      if (talentOvr > ovr + 10) reasons.push(`Talent gap +${talentOvr - ovr}`);
      if (age <= 20) reasons.push('Very young');
      if (pers && pers.workEthic >= 160) reasons.push('Hard worker');
      if (pers && pers.intelligence >= 160) reasons.push('High IQ');
      entries.push({
        player: p,
        category: 'hiddenGem',
        slamScore: Math.round(score),
        reason: reasons.join(' · ') || 'High potential',
        ovr, pot, salary: 0, age,
      });
    }
  }

  // --- Underutilized in Organization ---
  // Players in org who are at a low level but have high OVR/POT
  for (const p of orgPlayers) {
    const ovr = getOvr(p);
    const pot = getPotential(p);
    const age = p.age;
    const level = p.dumpData?.rosterInfo?.playingLevel ?? 0;
    const talentOvr = p.dumpData?.talentBattingRatings?.ovr ?? p.dumpData?.talentPitchingRatings?.ovr ?? 0;

    let score = 0;
    // High OVR stuck in minors
    if (level > 1 && ovr >= 50) score += (ovr - 45) * 1.2;
    if (level > 3 && ovr >= 45) score += 10; // AA or lower with decent OVR
    if (pot > ovr + 15) score += (pot - ovr) * 0.6;
    if (talentOvr > ovr + 10) score += (talentOvr - ovr) * 0.5;
    if (age <= 25 && pot >= 55) score += 8;

    const pers = p.dumpData?.personality;
    if (pers && pers.workEthic >= 150) score += 4;

    if (score >= 25 && level > 1) {
      const levelName = getLevelName(level);
      const reasons: string[] = [];
      reasons.push(`${levelName} with ${ovr} OVR`);
      if (pot > ovr + 15) reasons.push(`${pot} POT`);
      if (talentOvr > ovr + 10) reasons.push(`Talent +${talentOvr - ovr}`);
      if (age <= 23) reasons.push('Young');
      entries.push({
        player: p,
        category: 'underutilized',
        slamScore: Math.round(score),
        reason: reasons.join(' · '),
        ovr, pot, salary: getCurrentSalary(p), age,
      });
    }
  }

  return entries.sort((a, b) => b.slamScore - a.slamScore);
}

function getCurrentSalary(p: Player): number {
  const ci = p.dumpData?.contractInfo;
  if (!ci || !ci.salaries.length || ci.currentYear < 1) return 0;
  return ci.salaries[ci.currentYear - 1] || 0;
}

function getLevelName(level: number): string {
  if (level === 1) return 'MLB';
  if (level <= 3) return 'AAA';
  if (level <= 5) return 'AA';
  if (level <= 7) return 'A+';
  if (level <= 9) return 'A';
  return 'Rookie';
}

const CATEGORY_CONFIG: Record<SlamDunkEntry['category'], { label: string; color: string; bgColor: string }> = {
  bargainFA: { label: 'Bargain FA', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/20' },
  hiddenGem: { label: 'Hidden Gem', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  underutilized: { label: 'Underutilized', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
};

function SlamDunksTab({ players, freeAgents, draftPlayers }: { players: Player[]; freeAgents: Player[]; draftPlayers: Player[] }) {
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);
  const [filterCat, setFilterCat] = useState<SlamDunkEntry['category'] | 'all'>('all');

  const allEntries = useMemo(
    () => findSlamDunks(players, freeAgents, draftPlayers),
    [players, freeAgents, draftPlayers],
  );

  const entries = filterCat === 'all' ? allEntries : allEntries.filter((e) => e.category === filterCat);

  const counts = useMemo(() => {
    const c = { bargainFA: 0, hiddenGem: 0, underutilized: 0 };
    allEntries.forEach((e) => c[e.category]++);
    return c;
  }, [allEntries]);

  if (allEntries.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500">
        <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No slam dunks found. Load dump folder data with free agents and draft players to see opportunities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(CATEGORY_CONFIG) as [SlamDunkEntry['category'], typeof CATEGORY_CONFIG[SlamDunkEntry['category']]][]).map(
          ([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterCat(filterCat === key ? 'all' : key)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                filterCat === key
                  ? cfg.bgColor + ' border-current'
                  : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/60'
              }`}
            >
              <p className={`text-lg font-bold ${cfg.color}`}>{counts[key]}</p>
              <p className="text-xs text-gray-400">{cfg.label}</p>
            </button>
          ),
        )}
      </div>

      {/* Results table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700/50 text-gray-400">
              <th className="py-2 px-2 text-left font-medium">Score</th>
              <th className="py-2 px-2 text-left font-medium">Type</th>
              <th className="py-2 px-2 text-left font-medium">Player</th>
              <th className="py-2 px-2 text-left font-medium">Pos</th>
              <th className="py-2 px-2 text-right font-medium">Age</th>
              <th className="py-2 px-2 text-right font-medium">OVR</th>
              <th className="py-2 px-2 text-right font-medium">POT</th>
              <th className="py-2 px-2 text-right font-medium">Salary</th>
              <th className="py-2 px-2 text-left font-medium">Why</th>
            </tr>
          </thead>
          <tbody>
            {entries.slice(0, 50).map((e, i) => {
              const cfg = CATEGORY_CONFIG[e.category];
              return (
                <tr
                  key={`${e.player.id}-${i}`}
                  onClick={() => setSelectedPlayer(e.player.id)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer"
                >
                  <td className="py-1.5 px-2">
                    <span className={`font-bold ${e.slamScore >= 50 ? 'text-green-400' : e.slamScore >= 35 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {e.slamScore}
                    </span>
                  </td>
                  <td className="py-1.5 px-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.bgColor}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 font-medium text-gray-200">{e.player.name}</td>
                  <td className="py-1.5 px-2 text-gray-400">{e.player.pos}</td>
                  <td className="py-1.5 px-2 text-right text-gray-300">{e.age}</td>
                  <td className="py-1.5 px-2 text-right">
                    <span className={e.ovr >= 55 ? 'text-green-400' : e.ovr >= 45 ? 'text-yellow-400' : 'text-gray-400'}>
                      {e.ovr}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <span className={e.pot >= 65 ? 'text-purple-400' : e.pot >= 50 ? 'text-blue-400' : 'text-gray-400'}>
                      {e.pot}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-right text-gray-300">
                    {e.salary === 0 ? <span className="text-green-500">Free</span> : fmtMoney(e.salary)}
                  </td>
                  <td className="py-1.5 px-2 text-gray-400 max-w-[200px] truncate" title={e.reason}>
                    {e.reason}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {entries.length > 50 && (
          <p className="text-[10px] text-gray-500 p-2 text-center">Showing top 50 of {entries.length}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function Analysis() {
  const players = useStore((s) => s.players);
  const freeAgents = useStore((s) => s.freeAgents);
  const draftPlayers = useStore((s) => s.draftPlayers);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('tradeValue');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-100">Competitive Analysis</h1>
          <p className="text-xs text-gray-500">
            {players.length} players loaded
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="text-[11px] text-gray-500">Franchise Analytics Suite</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-800/50 rounded-lg overflow-x-auto">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-gray-700 text-gray-100 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'tradeValue' && <TradeValueTab players={players} />}
      {activeTab === 'depthChart' && <DepthChartTab players={players} />}
      {activeTab === 'injuryRisk' && <InjuryRiskTab players={players} />}
      {activeTab === 'agingCurves' && <AgingCurvesTab players={players} />}
      {activeTab === 'platoon' && <PlatoonTab players={players} />}
      {activeTab === 'slamDunks' && <SlamDunksTab players={players} freeAgents={freeAgents} draftPlayers={draftPlayers} />}
    </div>
  );
}
