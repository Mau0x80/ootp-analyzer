import type {
  Player, PlayerScores, BattingStats, PitchingStats,
  DumpExtraData, ParkFactors,
} from '../types';
import { getCardTier } from '../types';
import type {
  ParsedDumpData, DumpPlayerBio, DumpCareerBattingRow, DumpCareerPitchingRow,
  DumpCareerFieldingRow,
} from './dumpParser';

// ============================================================
// Dump Merger
// Joins all parsed dump tables on player_id and produces Player[].
// Career stats are aggregated into current-season BattingStats/PitchingStats.
// ============================================================

const PITCHER_POS = new Set(['SP', 'RP', 'CL', 'MR', 'LR', 'SU', 'P']);

const emptyScores: PlayerScores = {
  offensiveScore: 0, defensiveScore: 0, pitchingScore: 0,
  lineupFitScore: 0, platoonVsLHP: 0, platoonVsRHP: 0,
  starterScore: 0, relieverScore: 0, positionalFlexibility: 0,
  overallValue: 0,
};

// ============================================================
// Career stats aggregation helpers
// ============================================================

function aggregateBattingRows(rows: DumpCareerBattingRow[]): BattingStats | null {
  if (rows.length === 0) return null;
  // Sum counting stats across all splits for the latest year at the highest level
  const maxYear = Math.max(...rows.map((r) => r.year));
  const yearRows = rows.filter((r) => r.year === maxYear);
  // Prefer level_id=1 (MLB), then highest
  const maxLevel = Math.max(...yearRows.map((r) => r.levelId));
  const levelRows = yearRows.filter((r) => r.levelId === maxLevel);

  // Sum across splits
  const s = {
    ab: 0, h: 0, k: 0, pa: 0, g: 0, gs: 0,
    d: 0, t: 0, hr: 0, r: 0, rbi: 0,
    sb: 0, cs: 0, bb: 0, ibb: 0,
    gdp: 0, sh: 0, sf: 0, hp: 0,
    wpa: 0, ubr: 0, war: 0,
  };
  for (const row of levelRows) {
    s.ab += row.ab; s.h += row.h; s.k += row.k; s.pa += row.pa;
    s.g += row.g; s.gs += row.gs;
    s.d += row.d; s.t += row.t; s.hr += row.hr;
    s.r += row.r; s.rbi += row.rbi;
    s.sb += row.sb; s.cs += row.cs;
    s.bb += row.bb; s.ibb += row.ibb;
    s.gdp += row.gdp; s.sh += row.sh; s.sf += row.sf;
    s.hp += row.hp;
    s.wpa += row.wpa; s.ubr += row.ubr; s.war += row.war;
  }

  // Deduplicate games (splits double-count games since a player can face both LHP and RHP in same game)
  // Use max games from any single split as a better estimate
  const maxG = Math.max(...levelRows.map((r) => r.g), 0);

  if (s.pa === 0 && s.ab === 0) return null;
  // If PA wasn't exported, estimate it
  if (s.pa === 0) s.pa = s.ab + s.bb + s.hp + s.sf + s.sh;

  const singles = s.h - s.d - s.t - s.hr;
  const tb = singles + 2 * s.d + 3 * s.t + 4 * s.hr;
  const avg = s.ab > 0 ? s.h / s.ab : 0;
  const obp = (s.ab + s.bb + s.hp + s.sf) > 0
    ? (s.h + s.bb + s.hp) / (s.ab + s.bb + s.hp + s.sf)
    : 0;
  const slg = s.ab > 0 ? tb / s.ab : 0;
  const ops = obp + slg;
  const iso = slg - avg;
  const bbPct = s.pa > 0 ? (s.bb / s.pa) * 100 : 0;
  const kPct = s.pa > 0 ? (s.k / s.pa) * 100 : 0;
  const babipDenom = s.ab - s.k - s.hr + s.sf;
  const babip = babipDenom > 0 ? (s.h - s.hr) / babipDenom : 0;
  const sbPct = (s.sb + s.cs) > 0 ? (s.sb / (s.sb + s.cs)) * 100 : 0;

  // wOBA with standard FanGraphs linear weights
  const wobaDenom = s.ab + s.bb - s.ibb + s.sf + s.hp;
  const woba = wobaDenom > 0
    ? (0.69 * (s.bb - s.ibb) + 0.72 * s.hp + 0.89 * singles + 1.27 * s.d + 1.62 * s.t + 2.10 * s.hr) / wobaDenom
    : 0;

  return {
    g: maxG, pa: s.pa, ab: s.ab, h: s.h,
    '1b': singles, '2b': s.d, '3b': s.t, hr: s.hr,
    rbi: s.rbi, r: s.r, bb: s.bb, bbPct, ibb: s.ibb,
    hp: s.hp, sf: s.sf, k: s.k, kPct,
    gidp: s.gdp, ebh: s.d + s.t,
    tb, avg, obp, slg, ops, iso, babip, woba,
    rc27: 0, opsPlus: 0, wpa: s.wpa,
    wrc: 0, wrcPlus: 0, wraa: 0, war: s.war,
    piPa: 0, sb: s.sb, cs: s.cs, sbPct,
    wsb: 0, ubr: s.ubr,
  };
}

function aggregatePitchingRows(rows: DumpCareerPitchingRow[]): PitchingStats | null {
  if (rows.length === 0) return null;
  const maxYear = Math.max(...rows.map((r) => r.year));
  const yearRows = rows.filter((r) => r.year === maxYear);
  const maxLevel = Math.max(...yearRows.map((r) => r.levelId));
  const levelRows = yearRows.filter((r) => r.levelId === maxLevel);

  const s = {
    ip: 0, ab: 0, ha: 0, k: 0, bf: 0, bb: 0, r: 0, er: 0,
    gb: 0, fb: 0, g: 0, gs: 0, w: 0, l: 0,
    sv: 0, svo: 0, bs: 0, hld: 0,
    ir: 0, irs: 0, hra: 0, hp: 0, iw: 0, wp: 0,
    sbA: 0, csA: 0, qs: 0, sd: 0, md: 0,
    war: 0, ra9war: 0, wpa: 0, li: 0, tb: 0,
  };
  for (const row of levelRows) {
    s.ip += row.ip; s.ab += row.ab; s.ha += row.ha; s.k += row.k;
    s.bf += row.bf; s.bb += row.bb; s.r += row.r; s.er += row.er;
    s.gb += row.gb; s.fb += row.fb;
    s.g += row.g; s.gs += row.gs; s.w += row.w; s.l += row.l;
    s.sv += row.sv; s.svo += row.svo; s.bs += row.bs; s.hld += row.hld;
    s.ir += row.ir; s.irs += row.irs;
    s.hra += row.hra; s.hp += row.hp; s.iw += row.iw; s.wp += row.wp;
    s.sbA += row.sb; s.csA += row.cs;
    s.qs += row.qs; s.sd += row.sd; s.md += row.md;
    s.war += row.war; s.ra9war += row.ra9war;
    s.wpa += row.wpa; s.li += row.li; s.tb += row.tb;
  }

  const maxG = Math.max(...levelRows.map((r) => r.g), 0);
  if (s.ip === 0) return null;
  if (s.bf === 0) s.bf = Math.round(s.ip * 3) + s.ha + s.bb + s.hp;

  const era = (s.er / s.ip) * 9;
  const whip = (s.bb + s.ha) / s.ip;
  const avg = s.ab > 0 ? s.ha / s.ab : 0;
  const h9 = (s.ha / s.ip) * 9;
  const k9 = (s.k / s.ip) * 9;
  const bb9 = (s.bb / s.ip) * 9;
  const hr9 = (s.hra / s.ip) * 9;
  const kbb = s.bb > 0 ? s.k / s.bb : 0;
  const kPct = s.bf > 0 ? (s.k / s.bf) * 100 : 0;
  const bbPct = s.bf > 0 ? (s.bb / s.bf) * 100 : 0;
  const kBbPct = kPct - bbPct;
  const fip = ((13 * s.hra + 3 * (s.bb + s.hp) - 2 * s.k) / s.ip) + 3.10;
  const winPct = (s.w + s.l) > 0 ? s.w / (s.w + s.l) : 0;
  const svPct = s.svo > 0 ? (s.sv / s.svo) * 100 : 0;
  const bsPct = s.svo > 0 ? (s.bs / s.svo) * 100 : 0;
  const qsPct = s.gs > 0 ? (s.qs / s.gs) * 100 : 0;
  const goPct = (s.gb + s.fb) > 0 ? (s.gb / (s.gb + s.fb)) * 100 : 0;
  const irsPct = s.ir > 0 ? (s.irs / s.ir) * 100 : 0;
  const oppObp = s.bf > 0 ? (s.ha + s.bb + s.hp) / s.bf : 0;
  const oppSlg = s.ab > 0 ? s.tb / s.ab : 0;
  const pli = maxG > 0 ? s.li / maxG : 0;
  const lobPct = (s.ha + s.bb + s.hp - s.r) > 0
    ? ((s.ha + s.bb + s.hp - s.r) / (s.ha + s.bb + s.hp)) * 100
    : 0;

  // BABIP for pitchers
  const babipDenom = s.ab - s.k - s.hra;
  const babip = babipDenom > 0 ? (s.ha - s.hra) / babipDenom : 0;

  return {
    g: maxG, gs: s.gs, w: s.w, l: s.l, winPct,
    svo: s.svo, sv: s.sv, svPct, bs: s.bs, bsPct,
    hld: s.hld, sd: s.sd, md: s.md,
    ip: s.ip, bf: s.bf, ha: s.ha, hr: s.hra,
    tb: s.tb, r: s.r, er: s.er,
    bb: s.bb, ibb: s.iw, k: s.k, hp: s.hp,
    era, avg, oppObp, oppSlg, oppOps: oppObp + oppSlg,
    babip, whip, hr9, h9, bb9, k9, kbb,
    kPct, bbPct, kBbPct,
    ir: s.ir, irs: s.irs, irsPct,
    lobPct, pli, qs: s.qs, qsPct,
    ppg: 0, gb: s.gb, fb: s.fb, goPct,
    eraPlus: 0, fip, fipMinus: 0,
    wpa: s.wpa, war: s.war, rwar: s.ra9war,
    siera: 0,
  };
}

// ============================================================
// Main merge function
// ============================================================

export function mergeDumpData(data: ParsedDumpData, filterTeamId?: number): Player[] {
  const players: Player[] = [];

  // Build team lookup
  const teamMap = data.teams;
  const parkMap = data.parks;

  // Build player_id -> team_id from team_roster
  const playerTeamMap = new Map<number, number>();
  for (const entry of data.teamRoster) {
    playerTeamMap.set(entry.playerId, entry.teamId);
  }

  // Group career stats by player_id
  const careerBatByPlayer = new Map<number, DumpCareerBattingRow[]>();
  for (const row of data.careerBatting) {
    if (!careerBatByPlayer.has(row.playerId)) careerBatByPlayer.set(row.playerId, []);
    careerBatByPlayer.get(row.playerId)!.push(row);
  }

  const careerPitchByPlayer = new Map<number, DumpCareerPitchingRow[]>();
  for (const row of data.careerPitching) {
    if (!careerPitchByPlayer.has(row.playerId)) careerPitchByPlayer.set(row.playerId, []);
    careerPitchByPlayer.get(row.playerId)!.push(row);
  }

  const careerFieldByPlayer = new Map<number, DumpCareerFieldingRow[]>();
  for (const row of data.careerFielding) {
    if (!careerFieldByPlayer.has(row.playerId)) careerFieldByPlayer.set(row.playerId, []);
    careerFieldByPlayer.get(row.playerId)!.push(row);
  }

  for (const [pid, bio] of data.players) {
    // Optional team filter
    const teamId = playerTeamMap.get(pid) ?? bio.teamId;
    if (filterTeamId !== undefined && teamId !== filterTeamId) continue;

    // Skip retired / free agent with no team if filtering
    if (filterTeamId !== undefined && teamId === 0) continue;

    const batRatings = data.battingRatings.get(pid);
    const pitRatings = data.pitchingRatings.get(pid);
    const fldRatings = data.fieldingRatings.get(pid);
    const pValue = data.playerValues.get(pid);

    // Build batting/pitching ratings for the existing Player model
    const battingRatings = batRatings?.current ?? null;
    const pitchingRatings = pitRatings?.current ?? null;
    const fieldingRatings = fldRatings?.fieldingRatings ?? null;
    const positionRatings = fldRatings?.positionRatings ?? null;

    // Career stats
    const battingStats = aggregateBattingRows(careerBatByPlayer.get(pid) || []);
    const pitchingStats = aggregatePitchingRows(careerPitchByPlayer.get(pid) || []);

    // Zone Rating from fielding stats (latest year, overall split)
    const fldRows = careerFieldByPlayer.get(pid) || [];
    let zoneRating = 0;
    if (fldRows.length > 0) {
      const maxYear = Math.max(...fldRows.map((r) => r.year));
      const latestRows = fldRows.filter((r) => r.year === maxYear && r.splitId === 0);
      // Take the ZR of the position with the most games
      const best = latestRows.sort((a, b) => b.g - a.g)[0];
      if (best) zoneRating = best.zr;
    }

    // Build eligible positions
    const eligiblePositions: string[] = [];
    if (positionRatings) {
      const pr = positionRatings;
      const posMap: [string, number][] = [
        ['P', pr.p], ['C', pr.c], ['1B', pr['1b']], ['2B', pr['2b']],
        ['3B', pr['3b']], ['SS', pr.ss], ['LF', pr.lf], ['CF', pr.cf], ['RF', pr.rf],
      ];
      posMap.forEach(([p, val]) => { if (val > 0) eligiblePositions.push(p); });
    }
    if (eligiblePositions.length === 0) eligiblePositions.push(bio.pos);

    const isPitcher = PITCHER_POS.has(bio.pos);
    const isPositionPlayer = !isPitcher || eligiblePositions.some(
      (p) => !PITCHER_POS.has(p) && p !== 'P'
    );
    const isTwoWay = isPitcher && isPositionPlayer && eligiblePositions.length > 1;

    const name = `${bio.firstName} ${bio.lastName}`.trim();
    const id = `dump-${pid}`;

    // Resolve team + park
    const team = teamMap.get(teamId);
    const teamName = team ? `${team.name} ${team.nickname}`.trim() : '';
    const teamAbbr = team?.abbr || '';
    let parkFactors: ParkFactors | null = null;
    if (team && parkMap.has(team.parkId)) {
      parkFactors = parkMap.get(team.parkId)!;
    }

    const cardOvr = pValue?.oa ?? Math.max(battingRatings?.ovr ?? 0, pitchingRatings?.ovr ?? 0);

    // Build DumpExtraData
    const dumpData: DumpExtraData = {
      playerId: pid,
      teamId,
      teamName,
      teamAbbr,
      personality: bio.personality,
      morale: bio.morale,
      playerStrategy: bio.playerStrategy,
      rosterInfo: data.rosterStatus.get(pid) || null,
      contractInfo: data.contracts.get(pid) || null,
      statcastData: data.atBatStats.get(pid) || null,
      zoneRating,
      catcherFraming: fldRatings?.catcherFraming ?? 0,
      talentBattingRatings: batRatings?.talent ?? null,
      talentPitchingRatings: pitRatings?.talent ?? null,
      positionPotentials: fldRatings?.positionPotentials ?? {},
      ovrByPosition: pValue?.ovrByPosition ?? {},
      overallAbility: pValue?.oa ?? 0,
      potential: pValue?.pot ?? 0,
      parkFactors,
      pitchRepertoire: pitRatings?.repertoire ?? null,
      velocity: pitRatings?.velocity ?? 0,
      armSlot: pitRatings?.armSlot ?? 0,
    };

    players.push({
      name,
      number: bio.uniformNumber,
      pos: bio.pos,
      age: bio.age,
      bats: bio.bats,
      throws: bio.throws,
      inf: '',
      status: dumpData.rosterInfo?.isActive ? 'Active Roster' : 'Reserve',
      id,
      battingRatings,
      pitchingRatings,
      fieldingRatings,
      positionRatings,
      battingStats,
      pitchingStats,
      isPitcher,
      isPositionPlayer: !isPitcher || isTwoWay,
      isTwoWay,
      eligiblePositions,
      scores: { ...emptyScores },
      hitterArchetype: null,
      pitcherArchetype: null,
      percentiles: {},
      // PT fields (defaults)
      cardOvr,
      cardTier: getCardTier(cardOvr),
      artifactBoosts: [],
      effectiveBattingRatings: null,
      effectivePitchingRatings: null,
      effectiveFieldingRatings: null,
      effectiveScores: { ...emptyScores },
      hiddenPotentialGap: 0,
      // Dump data
      dumpData,
    });
  }

  return players;
}
