import Papa from 'papaparse';
import type {
  BattingRatings, PitchingRatings, FieldingRatings, PositionRatings,
  PlayerPersonality, PlayerStrategySettings, RosterInfo, ContractInfo,
  ParkFactors, PitchRepertoire, StatcastData,
} from '../types';

// ============================================================
// OOTP Dump CSV Parser
// Parses raw dump files from OOTP's database export.
// All tables join on player_id (integer).
// ============================================================

function pn(val: string | undefined): number {
  if (!val || val === '' || val === 'NULL') return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function pint(val: string | undefined): number {
  if (!val || val === '' || val === 'NULL') return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

function parseDumpCsv(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}

// ============================================================
// Position / Bats / Throws / Role mappings
// ============================================================

const POS_NUM_TO_STR: Record<number, string> = {
  0: 'DH', 1: 'P', 2: 'C', 3: '1B', 4: '2B', 5: '3B', 6: 'SS', 7: 'LF', 8: 'CF', 9: 'RF',
};

const ROLE_TO_POS: Record<number, string> = {
  11: 'SP', 12: 'LR', 13: 'MR', 14: 'SU', 15: 'CL',
};

function mapBats(v: number): 'L' | 'R' | 'S' {
  if (v === 2) return 'L';
  if (v === 3) return 'S';
  return 'R';
}

function mapThrows(v: number): 'L' | 'R' {
  return v === 2 ? 'L' : 'R';
}

function mapPosition(posNum: number, roleNum: number): string {
  if (roleNum >= 11 && roleNum <= 15) return ROLE_TO_POS[roleNum] || 'RP';
  return POS_NUM_TO_STR[posNum] || 'DH';
}

// ============================================================
// Parsed types (keyed by player_id)
// ============================================================

export interface DumpPlayerBio {
  playerId: number;
  teamId: number;
  leagueId: number;
  firstName: string;
  lastName: string;
  nickName: string;
  age: number;
  posNum: number;
  roleNum: number;
  pos: string;
  bats: 'L' | 'R' | 'S';
  throws: 'L' | 'R';
  uniformNumber: string;
  personality: PlayerPersonality;
  morale: number;
  playerStrategy: PlayerStrategySettings;
  injuryIsInjured: boolean;
  injuryDLLeft: number;
  proneOverall: number;
  proneLeg: number;
  proneBack: number;
  proneArm: number;
}

export interface DumpBattingRatings {
  playerId: number;
  current: BattingRatings;
  talent: BattingRatings;
  speed: number;
  steal: number;
  baserunning: number;
  stealingRate: number;
}

export interface DumpPitchingRatings {
  playerId: number;
  current: PitchingRatings;
  talent: PitchingRatings;
  repertoire: PitchRepertoire;
  velocity: number;
  velocityTarget: number;
  armSlot: number;
  stamina: number;
  groundFly: number;
  hold: number;
}

export interface DumpFieldingRatings {
  playerId: number;
  fieldingRatings: FieldingRatings;
  catcherFraming: number;
  positionRatings: PositionRatings;
  positionPotentials: Record<string, number>;
  fieldingExperience: Record<string, number>;
}

export interface DumpPlayerValue {
  playerId: number;
  offensiveValue: number;
  pitchingValue: number;
  overallValue: number;
  talentValue: number;
  runningValue: number;
  stealingValue: number;
  oa: number;
  pot: number;
  oaRating: number;
  potRating: number;
  ovrByPosition: Record<string, number>;
}

export interface DumpCareerBattingRow {
  playerId: number;
  year: number;
  teamId: number;
  leagueId: number;
  levelId: number;
  splitId: number;
  ab: number; h: number; k: number; pa: number;
  g: number; gs: number; d: number; t: number; hr: number;
  r: number; rbi: number; sb: number; cs: number;
  bb: number; ibb: number; gdp: number; sh: number; sf: number;
  hp: number; wpa: number; ubr: number; war: number;
}

export interface DumpCareerPitchingRow {
  playerId: number;
  year: number;
  teamId: number;
  leagueId: number;
  levelId: number;
  splitId: number;
  ip: number; ab: number; ha: number; k: number; bf: number;
  bb: number; r: number; er: number; gb: number; fb: number;
  g: number; gs: number; w: number; l: number;
  sv: number; svo: number; bs: number; hld: number;
  ir: number; irs: number; hra: number; hp: number; iw: number;
  wp: number; sb: number; cs: number; qs: number;
  sd: number; md: number; war: number; ra9war: number;
  wpa: number; li: number; outs: number; tb: number;
}

export interface DumpCareerFieldingRow {
  playerId: number;
  year: number;
  teamId: number;
  levelId: number;
  splitId: number;
  position: number;
  g: number; ip: number; e: number; dp: number;
  zr: number; framing: number; arm: number;
}

export interface DumpTeam {
  teamId: number;
  name: string;
  abbr: string;
  nickname: string;
  parkId: number;
  leagueId: number;
  level: number;
  parentTeamId: number;
}

export interface DumpParkFactors extends ParkFactors {}

export interface DumpRosterEntry {
  teamId: number;
  playerId: number;
  listId: number;
}

export interface DumpAtBatRow {
  playerId: number;
  exitVelo: number;
  launchAngle: number;
  sprintSpeed: number;
}

// ============================================================
// All parsed dump data
// ============================================================

export interface ParsedDumpData {
  players: Map<number, DumpPlayerBio>;
  battingRatings: Map<number, DumpBattingRatings>;
  pitchingRatings: Map<number, DumpPitchingRatings>;
  fieldingRatings: Map<number, DumpFieldingRatings>;
  playerValues: Map<number, DumpPlayerValue>;
  careerBatting: DumpCareerBattingRow[];
  careerPitching: DumpCareerPitchingRow[];
  careerFielding: DumpCareerFieldingRow[];
  rosterStatus: Map<number, RosterInfo>;
  contracts: Map<number, ContractInfo>;
  teamRoster: DumpRosterEntry[];
  teams: Map<number, DumpTeam>;
  parks: Map<number, DumpParkFactors>;
  atBatStats: Map<number, StatcastData>;
}

// ============================================================
// Individual file parsers
// ============================================================

export function parseDumpPlayers(text: string): Map<number, DumpPlayerBio> {
  const rows = parseDumpCsv(text);
  const map = new Map<number, DumpPlayerBio>();
  for (const r of rows) {
    const pid = pint(r['player_id']);
    if (pid <= 0) continue;
    const posNum = pint(r['position']);
    const roleNum = pint(r['role']);
    map.set(pid, {
      playerId: pid,
      teamId: pint(r['team_id']),
      leagueId: pint(r['league_id']),
      firstName: (r['first_name'] || '').replace(/"/g, ''),
      lastName: (r['last_name'] || '').replace(/"/g, ''),
      nickName: (r['nick_name'] || '').replace(/"/g, ''),
      age: pint(r['age']),
      posNum,
      roleNum,
      pos: mapPosition(posNum, roleNum),
      bats: mapBats(pint(r['bats'])),
      throws: mapThrows(pint(r['throws'])),
      uniformNumber: (r['uniform_number'] || '').trim(),
      personality: {
        greed: pint(r['personality_greed']),
        loyalty: pint(r['personality_loyalty']),
        playForWinner: pint(r['personality_play_for_winner']),
        workEthic: pint(r['personality_work_ethic']),
        intelligence: pint(r['personality_intelligence']),
        leadership: pint(r['personality_leader']),
      },
      morale: pint(r['morale']),
      playerStrategy: {
        stealing: pint(r['strategy_stealing']),
        running: pint(r['strategy_running']),
        buntForHit: pint(r['strategy_bunt_for_hit']),
        sacBunt: pint(r['strategy_sac_bunt']),
        hitRun: pint(r['strategy_hit_run']),
        hookStart: pint(r['strategy_hook_start']),
        hookRelief: pint(r['strategy_hook_relief']),
        pitchCount: pint(r['strategy_pitch_count']),
        pitchAround: pint(r['strategy_pitch_around']),
        neverPinchHit: pint(r['strategy_never_pinch_hit']),
        defensiveSub: pint(r['strategy_defensive_sub']),
      },
      injuryIsInjured: pint(r['injury_is_injured']) === 1,
      injuryDLLeft: pint(r['injury_dl_left']),
      proneOverall: pint(r['prone_overall']),
      proneLeg: pint(r['prone_leg']),
      proneBack: pint(r['prone_back']),
      proneArm: pint(r['prone_arm']),
    });
  }
  return map;
}

export function parseDumpBattingRatings(text: string): Map<number, DumpBattingRatings> {
  const rows = parseDumpCsv(text);
  const map = new Map<number, DumpBattingRatings>();
  for (const r of rows) {
    const pid = pint(r['player_id']);
    if (pid <= 0) continue;

    const mkRatings = (prefix: string): BattingRatings => ({
      ovr: 0,
      con: pn(r[`batting_ratings_${prefix}_contact`]),
      gap: pn(r[`batting_ratings_${prefix}_gap`]),
      eye: pn(r[`batting_ratings_${prefix}_eye`]),
      ks: pn(r[`batting_ratings_${prefix}_strikeouts`]),
      pow: pn(r[`batting_ratings_${prefix}_power`]),
      babip: pn(r[`batting_ratings_${prefix}_babip`]),

      conVL: pn(r['batting_ratings_vsl_contact']),
      powVL: pn(r['batting_ratings_vsl_power']),
      eyeVL: pn(r['batting_ratings_vsl_eye']),
      conVR: pn(r['batting_ratings_vsr_contact']),
      powVR: pn(r['batting_ratings_vsr_power']),
      eyeVR: pn(r['batting_ratings_vsr_eye']),
      bun: pn(r['batting_ratings_misc_bunt']),
      bfh: pn(r['batting_ratings_misc_bunt_for_hit']),
      spe: pn(r['running_ratings_speed']),
      ste: pn(r['running_ratings_stealing']),
      def: 0,
    });

    map.set(pid, {
      playerId: pid,
      current: mkRatings('overall'),
      talent: mkRatings('talent'),
      speed: pn(r['running_ratings_speed']),
      steal: pn(r['running_ratings_stealing']),
      baserunning: pn(r['running_ratings_baserunning']),
      stealingRate: pn(r['running_ratings_stealing_rate']),
    });
  }
  return map;
}

export function parseDumpPitchingRatings(text: string): Map<number, DumpPitchingRatings> {
  const rows = parseDumpCsv(text);
  const map = new Map<number, DumpPitchingRatings>();
  for (const r of rows) {
    const pid = pint(r['player_id']);
    if (pid <= 0) continue;

    const mkRatings = (prefix: string): PitchingRatings => ({
      ovr: 0,
      stu: pn(r[`pitching_ratings_${prefix}_stuff`]),
      mov: pn(r[`pitching_ratings_${prefix}_movement`]),
      hra: pn(r[`pitching_ratings_${prefix}_hra`]),
      pbabip: pn(r[`pitching_ratings_${prefix}_pbabip`]),
      con: pn(r[`pitching_ratings_${prefix}_control`]),
      stuVL: pn(r['pitching_ratings_vsl_stuff']),
      stuVR: pn(r['pitching_ratings_vsr_stuff']),
      velo: (r['pitching_ratings_misc_velocity'] || '').trim(),
      stm: pn(r['pitching_ratings_misc_stamina']),
      gf: String(pn(r['pitching_ratings_misc_ground_fly'])),
      hld: pn(r['pitching_ratings_misc_hold']),
    });

    const repertoire: PitchRepertoire = {
      fastball: pn(r['pitching_ratings_pitches_fastball']),
      slider: pn(r['pitching_ratings_pitches_slider']),
      curveball: pn(r['pitching_ratings_pitches_curveball']),
      changeup: pn(r['pitching_ratings_pitches_changeup']),
      sinker: pn(r['pitching_ratings_pitches_sinker']),
      cutter: pn(r['pitching_ratings_pitches_cutter']),
      splitter: pn(r['pitching_ratings_pitches_splitter']),
      knuckleball: pn(r['pitching_ratings_pitches_knuckleball']),
      knucklecurve: pn(r['pitching_ratings_pitches_knucklecurve']),
      circlechange: pn(r['pitching_ratings_pitches_circlechange']),
      screwball: pn(r['pitching_ratings_pitches_screwball']),
      forkball: pn(r['pitching_ratings_pitches_forkball']),
    };

    map.set(pid, {
      playerId: pid,
      current: mkRatings('overall'),
      talent: mkRatings('talent'),
      repertoire,
      velocity: pn(r['pitching_ratings_misc_velocity']),
      velocityTarget: pn(r['pitching_ratings_misc_velocity_target']),
      armSlot: pn(r['pitching_ratings_misc_arm_slot']),
      stamina: pn(r['pitching_ratings_misc_stamina']),
      groundFly: pn(r['pitching_ratings_misc_ground_fly']),
      hold: pn(r['pitching_ratings_misc_hold']),
    });
  }
  return map;
}

export function parseDumpFieldingRatings(text: string): Map<number, DumpFieldingRatings> {
  const rows = parseDumpCsv(text);
  const map = new Map<number, DumpFieldingRatings>();
  for (const r of rows) {
    const pid = pint(r['player_id']);
    if (pid <= 0) continue;

    const fieldingRatings: FieldingRatings = {
      cAbi: pn(r['fielding_ratings_catcher_ability']),
      cArm: pn(r['fielding_ratings_catcher_arm']),
      ifRng: pn(r['fielding_ratings_infield_range']),
      ifErr: pn(r['fielding_ratings_infield_error']),
      ifArm: pn(r['fielding_ratings_infield_arm']),
      tdp: pn(r['fielding_ratings_turn_doubleplay']),
      ofRng: pn(r['fielding_ratings_outfield_range']),
      ofErr: pn(r['fielding_ratings_outfield_error']),
      ofArm: pn(r['fielding_ratings_outfield_arm']),
    };

    // Position ratings: pos1=P, pos2=C, ... pos9=RF
    const positionRatings: PositionRatings = {
      def: 0,
      p: pn(r['fielding_rating_pos1']),
      c: pn(r['fielding_rating_pos2']),
      '1b': pn(r['fielding_rating_pos3']),
      '2b': pn(r['fielding_rating_pos4']),
      '3b': pn(r['fielding_rating_pos5']),
      ss: pn(r['fielding_rating_pos6']),
      lf: pn(r['fielding_rating_pos7']),
      cf: pn(r['fielding_rating_pos8']),
      rf: pn(r['fielding_rating_pos9']),
    };

    const positionPotentials: Record<string, number> = {
      P: pn(r['fielding_rating_pos1_pot']),
      C: pn(r['fielding_rating_pos2_pot']),
      '1B': pn(r['fielding_rating_pos3_pot']),
      '2B': pn(r['fielding_rating_pos4_pot']),
      '3B': pn(r['fielding_rating_pos5_pot']),
      SS: pn(r['fielding_rating_pos6_pot']),
      LF: pn(r['fielding_rating_pos7_pot']),
      CF: pn(r['fielding_rating_pos8_pot']),
      RF: pn(r['fielding_rating_pos9_pot']),
    };

    const fieldingExperience: Record<string, number> = {};
    for (let i = 0; i <= 9; i++) {
      fieldingExperience[String(i)] = pn(r[`fielding_experience${i}`]);
    }

    map.set(pid, {
      playerId: pid,
      fieldingRatings,
      catcherFraming: pn(r['fielding_ratings_catcher_framing']),
      positionRatings,
      positionPotentials,
      fieldingExperience,
    });
  }
  return map;
}

export function parseDumpPlayerValues(text: string): Map<number, DumpPlayerValue> {
  const rows = parseDumpCsv(text);
  const map = new Map<number, DumpPlayerValue>();
  for (const r of rows) {
    const pid = pint(r['player_id']);
    if (pid <= 0) continue;
    map.set(pid, {
      playerId: pid,
      offensiveValue: pn(r['offensive_value']),
      pitchingValue: pn(r['pitching_value']),
      overallValue: pn(r['overall_value']),
      talentValue: pn(r['talent_value']),
      runningValue: pn(r['running_value']),
      stealingValue: pn(r['stealing_value']),
      oa: pint(r['oa']),
      pot: pint(r['pot']),
      oaRating: pn(r['oa_rating']),
      potRating: pn(r['pot_rating']),
      ovrByPosition: {
        SP: pn(r['overall_sp']),
        RP: pn(r['overall_rp']),
        C: pn(r['overall_c']),
        '1B': pn(r['overall_1b']),
        '2B': pn(r['overall_2b']),
        '3B': pn(r['overall_3b']),
        SS: pn(r['overall_ss']),
        LF: pn(r['overall_lf']),
        CF: pn(r['overall_cf']),
        RF: pn(r['overall_rf']),
      },
    });
  }
  return map;
}

export function parseDumpCareerBatting(text: string): DumpCareerBattingRow[] {
  const rows = parseDumpCsv(text);
  return rows.map((r) => ({
    playerId: pint(r['player_id']),
    year: pint(r['year']),
    teamId: pint(r['team_id']),
    leagueId: pint(r['league_id']),
    levelId: pint(r['level_id']),
    splitId: pint(r['split_id']),
    ab: pint(r['ab']), h: pint(r['h']), k: pint(r['k']), pa: pint(r['pa']),
    g: pint(r['g']), gs: pint(r['gs']),
    d: pint(r['d']), t: pint(r['t']), hr: pint(r['hr']),
    r: pint(r['r']), rbi: pint(r['rbi']),
    sb: pint(r['sb']), cs: pint(r['cs']),
    bb: pint(r['bb']), ibb: pint(r['ibb']),
    gdp: pint(r['gdp']), sh: pint(r['sh']), sf: pint(r['sf']),
    hp: pint(r['hp']),
    wpa: pn(r['wpa']), ubr: pn(r['ubr']), war: pn(r['war']),
  })).filter((r) => r.playerId > 0);
}

export function parseDumpCareerPitching(text: string): DumpCareerPitchingRow[] {
  const rows = parseDumpCsv(text);
  return rows.map((r) => ({
    playerId: pint(r['player_id']),
    year: pint(r['year']),
    teamId: pint(r['team_id']),
    leagueId: pint(r['league_id']),
    levelId: pint(r['level_id']),
    splitId: pint(r['split_id']),
    ip: pn(r['ip']), ab: pint(r['ab']), ha: pint(r['ha']),
    k: pint(r['k']), bf: pint(r['bf']),
    bb: pint(r['bb']), r: pint(r['r']), er: pint(r['er']),
    gb: pint(r['gb']), fb: pint(r['fb']),
    g: pint(r['g']), gs: pint(r['gs']),
    w: pint(r['w']), l: pint(r['l']),
    sv: pint(r['s']), svo: pint(r['svo']), bs: pint(r['bs']),
    hld: pint(r['hld']),
    ir: pint(r['ir']), irs: pint(r['irs']),
    hra: pint(r['hra']), hp: pint(r['hp']),
    iw: pint(r['iw']), wp: pint(r['wp']),
    sb: pint(r['sb']), cs: pint(r['cs']),
    qs: pint(r['qs']), sd: pint(r['sd']), md: pint(r['md']),
    war: pn(r['war']), ra9war: pn(r['ra9war']),
    wpa: pn(r['wpa']), li: pn(r['li']),
    outs: pint(r['outs']), tb: pint(r['tb']),
  })).filter((r) => r.playerId > 0);
}

export function parseDumpCareerFielding(text: string): DumpCareerFieldingRow[] {
  const rows = parseDumpCsv(text);
  return rows.map((r) => ({
    playerId: pint(r['player_id']),
    year: pint(r['year']),
    teamId: pint(r['team_id']),
    levelId: pint(r['level_id']),
    splitId: pint(r['split_id']),
    position: pint(r['position']),
    g: pint(r['g']), ip: pn(r['ip']),
    e: pint(r['e']), dp: pint(r['dp']),
    zr: pn(r['zr']), framing: pn(r['framing']), arm: pn(r['arm']),
  })).filter((r) => r.playerId > 0);
}

export function parseDumpRosterStatus(text: string): Map<number, RosterInfo> {
  const rows = parseDumpCsv(text);
  const map = new Map<number, RosterInfo>();
  for (const r of rows) {
    const pid = pint(r['player_id']);
    if (pid <= 0) continue;
    map.set(pid, {
      playingLevel: pint(r['playing_level']),
      isActive: pint(r['is_active']) === 1,
      isOnDL: pint(r['is_on_dl']) === 1,
      isOnDL60: pint(r['is_on_dl60']) === 1,
      mlbServiceYears: pint(r['mlb_service_years']),
      mlbServiceDays: pint(r['mlb_service_days']),
      proServiceYears: pint(r['pro_service_years']),
      optionsUsed: pint(r['options_used']),
      isOnWaivers: pint(r['is_on_waivers']) === 1,
      designatedForAssignment: pint(r['designated_for_assignment']) === 1,
      wasTrade: pint(r['was_traded']) === 1,
    });
  }
  return map;
}

export function parseDumpContracts(text: string): Map<number, ContractInfo> {
  const rows = parseDumpCsv(text);
  const map = new Map<number, ContractInfo>();
  for (const r of rows) {
    const pid = pint(r['player_id']);
    if (pid <= 0) continue;
    const salaries: number[] = [];
    for (let i = 0; i <= 14; i++) {
      salaries.push(pint(r[`salary${i}`]));
    }
    map.set(pid, {
      salaries,
      totalYears: pint(r['years']),
      currentYear: pint(r['current_year']),
      noTrade: pint(r['no_trade']) === 1,
      isMajor: pint(r['is_major']) === 1,
      teamOption: pint(r['last_year_team_option']) === 1,
      playerOption: pint(r['last_year_player_option']) === 1,
    });
  }
  return map;
}

export function parseDumpTeams(text: string): Map<number, DumpTeam> {
  const rows = parseDumpCsv(text);
  const map = new Map<number, DumpTeam>();
  for (const r of rows) {
    const tid = pint(r['team_id']);
    if (tid <= 0) continue;
    map.set(tid, {
      teamId: tid,
      name: (r['name'] || '').replace(/"/g, ''),
      abbr: (r['abbr'] || '').replace(/"/g, ''),
      nickname: (r['nickname'] || '').replace(/"/g, ''),
      parkId: pint(r['park_id']),
      leagueId: pint(r['league_id']),
      level: pint(r['level']),
      parentTeamId: pint(r['parent_team_id']),
    });
  }
  return map;
}

export function parseDumpParks(text: string): Map<number, DumpParkFactors> {
  const rows = parseDumpCsv(text);
  const map = new Map<number, DumpParkFactors>();
  for (const r of rows) {
    const pid = pint(r['park_id']);
    map.set(pid, {
      parkId: pid,
      name: (r['name'] || '').replace(/"/g, ''),
      avg: pn(r['avg']),
      avgL: pn(r['avg_l']),
      avgR: pn(r['avg_r']),
      doubles: pn(r['d']),
      triples: pn(r['t']),
      hr: pn(r['hr']),
      hrR: pn(r['hr_r']),
      hrL: pn(r['hr_l']),
    });
  }
  return map;
}

export function parseDumpTeamRoster(text: string): DumpRosterEntry[] {
  const rows = parseDumpCsv(text);
  return rows.map((r) => ({
    teamId: pint(r['team_id']),
    playerId: pint(r['player_id']),
    listId: pint(r['list_id']),
  })).filter((r) => r.playerId > 0);
}

export function parseDumpAtBatStats(text: string): Map<number, StatcastData> {
  const rows = parseDumpCsv(text);
  // Aggregate per player
  const agg = new Map<number, { evs: number[]; las: number[]; speeds: number[] }>();
  for (const r of rows) {
    const pid = pint(r['player_id']);
    if (pid <= 0) continue;
    const ev = pn(r['exit_velo']);
    const la = pn(r['launch_angle']);
    const sp = pint(r['sprint_speed']);
    if (!agg.has(pid)) agg.set(pid, { evs: [], las: [], speeds: [] });
    const a = agg.get(pid)!;
    if (ev > 0) { a.evs.push(ev); a.las.push(la); }
    if (sp > 0) a.speeds.push(sp);
  }

  const map = new Map<number, StatcastData>();
  for (const [pid, a] of agg) {
    const totalBB = a.evs.length;
    if (totalBB === 0) continue;
    const avgEV = a.evs.reduce((s, v) => s + v, 0) / totalBB;
    const maxEV = Math.max(...a.evs);
    const avgLA = a.las.reduce((s, v) => s + v, 0) / totalBB;
    const hardHit = a.evs.filter((v) => v >= 95).length;
    // Barrel: exit_velo >= 98 mph and launch angle 26-30 (simplified)
    const barrels = a.evs.filter((v, i) => v >= 98 && a.las[i] >= 8 && a.las[i] <= 50).length;
    const avgSpeed = a.speeds.length > 0
      ? a.speeds.reduce((s, v) => s + v, 0) / a.speeds.length
      : 0;
    map.set(pid, {
      avgExitVelo: Math.round(avgEV * 10) / 10,
      maxExitVelo: Math.round(maxEV * 10) / 10,
      avgLaunchAngle: Math.round(avgLA * 10) / 10,
      sprintSpeed: Math.round(avgSpeed),
      hardHitPct: Math.round((hardHit / totalBB) * 1000) / 10,
      barrelPct: Math.round((barrels / totalBB) * 1000) / 10,
      totalBattedBalls: totalBB,
    });
  }
  return map;
}
