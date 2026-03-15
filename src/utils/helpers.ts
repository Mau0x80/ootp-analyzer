import type { Player } from '../types';

// Detect player strengths and weaknesses based on ratings
export interface PlayerInsight {
  label: string;
  type: 'strength' | 'weakness' | 'neutral';
  detail: string;
}

export function analyzePlayer(p: Player): PlayerInsight[] {
  const insights: PlayerInsight[] = [];

  if (p.battingRatings) {
    const br = p.battingRatings;

    if (br.con >= 100) insights.push({ label: 'Elite Contact', type: 'strength', detail: `CON ${br.con}` });
    else if (br.con < 40 && !p.isPitcher) insights.push({ label: 'Weak Contact', type: 'weakness', detail: `CON ${br.con}` });

    if (br.pow >= 90) insights.push({ label: 'Power Hitter', type: 'strength', detail: `POW ${br.pow}` });
    else if (br.pow < 30 && !p.isPitcher) insights.push({ label: 'No Power', type: 'weakness', detail: `POW ${br.pow}` });

    if (br.eye >= 90) insights.push({ label: 'Great Eye', type: 'strength', detail: `EYE ${br.eye}` });
    else if (br.eye < 30 && !p.isPitcher) insights.push({ label: 'Poor Eye', type: 'weakness', detail: `EYE ${br.eye}` });

    if (br.spe >= 80) insights.push({ label: 'Speedster', type: 'strength', detail: `SPE ${br.spe}` });
    if (br.ste >= 80) insights.push({ label: 'Base Stealer', type: 'strength', detail: `STE ${br.ste}` });

    // Platoon splits
    const conDiff = Math.abs(br.conVL - br.conVR);
    if (conDiff >= 30) {
      if (br.conVL > br.conVR) insights.push({ label: 'Better vs LHP', type: 'neutral', detail: `CON vL ${br.conVL} vs vR ${br.conVR}` });
      else insights.push({ label: 'Better vs RHP', type: 'neutral', detail: `CON vR ${br.conVR} vs vL ${br.conVL}` });
    }
  }

  if (p.pitchingRatings && p.isPitcher) {
    const pr = p.pitchingRatings;

    if (pr.stu >= 90) insights.push({ label: 'Dominant Stuff', type: 'strength', detail: `STU ${pr.stu}` });
    if (pr.mov >= 90) insights.push({ label: 'Great Movement', type: 'strength', detail: `MOV ${pr.mov}` });
    if (pr.con >= 90) insights.push({ label: 'Pinpoint Control', type: 'strength', detail: `CON ${pr.con}` });
    if (pr.stm >= 60) insights.push({ label: 'Workhorse', type: 'strength', detail: `STM ${pr.stm}` });
    else if (pr.stm < 20) insights.push({ label: 'Low Stamina', type: 'neutral', detail: `STM ${pr.stm}` });

    if (pr.stu < 50) insights.push({ label: 'Weak Stuff', type: 'weakness', detail: `STU ${pr.stu}` });
    if (pr.con < 50) insights.push({ label: 'Wild', type: 'weakness', detail: `CON ${pr.con}` });
  }

  if (p.eligiblePositions.filter((pos) => pos !== 'P' && pos !== 'DH').length >= 3) {
    insights.push({ label: 'Utility Player', type: 'strength', detail: `${p.eligiblePositions.length} positions` });
  }

  return insights;
}

export function getPlayerRecommendation(p: Player): string {
  if (p.isPitcher && !p.isTwoWay) {
    const pr = p.pitchingRatings;
    if (pr) {
      if (pr.stm >= 50 && p.scores.starterScore > p.scores.relieverScore) return 'Best as Starter';
      if (pr.stm < 25 && pr.hld >= 50) return 'Best as Setup/Closer';
      if (pr.stm < 25) return 'Best as Reliever';
      return 'Swing Man (SP/RP)';
    }
  }

  if (!p.isPitcher || p.isTwoWay) {
    const platoonDiff = p.scores.platoonVsLHP - p.scores.platoonVsRHP;
    if (Math.abs(platoonDiff) >= 10) {
      if (platoonDiff > 0) return 'Platoon bat vs LHP';
      return 'Platoon bat vs RHP';
    }
    if (p.scores.positionalFlexibility >= 50) return 'Utility / Super-sub';
    if (p.scores.offensiveScore >= 40 && p.scores.defensiveScore >= 40) return 'Everyday Starter';
    if (p.scores.offensiveScore >= 50 && p.scores.defensiveScore < 25) return 'DH / Offense-first';
    if (p.scores.defensiveScore >= 50 && p.scores.offensiveScore < 25) return 'Defensive Replacement';
    return 'Roster player';
  }

  return 'Evaluate further';
}

// Color for a rating value (green = good, red = bad)
// min/max define the scale range (e.g., 20/80 for 20-80 scale)
export function ratingColor(val: number, max = 200, min = 0): string {
  const range = max - min;
  const pct = range > 0 ? (val - min) / range : 0;
  if (pct >= 0.6) return 'text-emerald-400';
  if (pct >= 0.4) return 'text-blue-400';
  if (pct >= 0.25) return 'text-yellow-400';
  return 'text-red-400';
}

export function scoreColor(val: number): string {
  if (val >= 70) return 'text-emerald-400';
  if (val >= 50) return 'text-blue-400';
  if (val >= 30) return 'text-yellow-400';
  return 'text-red-400';
}

export function scoreBgColor(val: number): string {
  if (val >= 70) return 'bg-emerald-500/20 border-emerald-500/30';
  if (val >= 50) return 'bg-blue-500/20 border-blue-500/30';
  if (val >= 30) return 'bg-yellow-500/20 border-yellow-500/30';
  return 'bg-red-500/20 border-red-500/30';
}
