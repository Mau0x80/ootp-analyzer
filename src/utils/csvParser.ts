import Papa from 'papaparse';
import type {
  CsvFileType,
  BattingRatings,
  PitchingRatings,
  FieldingRatings,
  PositionRatings,
  BattingStats,
  PitchingStats,
  PlayerBase,
} from '../types';

// ============================================================
// CSV Auto-Detection
// Detects which OOTP CSV type a file is based on its columns.
// Super stats files are detected first (they have unique columns
// like wOBA, wRC+, K%-BB%, SIERA that basic stats don't have).
// ============================================================

const FILE_SIGNATURES: Record<CsvFileType, string[]> = {
  // Super stats must be checked BEFORE basic stats (they share many columns)
  batting_super_stats: ['wOBA', 'wRC', 'wRC+', 'wRAA', 'BB%', 'K%', 'UBR', 'wSB', 'PI/PA'],
  pitching_super_stats: ['K%-BB%', 'SIERA', 'FIP-', 'rWAR', 'QS', 'QS%', 'IRS%', 'LOB%', 'pLi', 'SD', 'MD'],
  batting_ratings: ['CON', 'GAP', 'POW', 'EYE', 'BUN', 'BFH', 'STE'],
  pitching_ratings: ['STU', 'MOV', 'HRA', 'PBABIP', 'STM', 'G/F'],
  fielding_ratings: ['C ABI', 'C ARM', 'IF RNG', 'IF ERR', 'OF RNG', 'OF ERR'],
  position_ratings: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
  batting_stats: ['PA', 'AB', 'HR', 'RBI', 'AVG', 'OBP', 'SLG', 'OPS'],
  pitching_stats: ['GS', 'SV', 'IP', 'ERA', 'WHIP', 'FIP', 'K/9'],
};

// Detection priority: super stats first so they aren't misidentified as basic stats
const DETECTION_ORDER: CsvFileType[] = [
  'batting_super_stats',
  'pitching_super_stats',
  'batting_ratings',
  'pitching_ratings',
  'fielding_ratings',
  'position_ratings',
  'batting_stats',
  'pitching_stats',
];

export function detectCsvType(headers: string[]): CsvFileType | null {
  const upperHeaders = new Set(headers.map((h) => h.trim().toUpperCase()));

  let bestMatch: CsvFileType | null = null;
  let bestScore = 0;

  for (const type of DETECTION_ORDER) {
    const sigs = FILE_SIGNATURES[type];
    const score = sigs.filter((s) => upperHeaders.has(s.toUpperCase())).length;
    if (score > bestScore && score >= 3) {
      bestScore = score;
      bestMatch = type;
    }
  }

  return bestMatch;
}

// ============================================================
// Parse CSV text into rows
// ============================================================

export function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return { headers: result.meta.fields || [], rows: result.data };
}

// ============================================================
// Extract common player base info from a CSV row
// ============================================================

function parseNum(val: string | undefined): number {
  if (!val || val === '-' || val === '') return 0;
  const cleaned = val.replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseHand(val: string | undefined): 'L' | 'R' | 'S' {
  const v = (val || '').trim().toUpperCase();
  if (v === 'L' || v === 'LEFT') return 'L';
  if (v === 'S' || v === 'SWITCH') return 'S';
  return 'R';
}

export function extractPlayerBase(row: Record<string, string>): PlayerBase {
  return {
    name: (row['Name'] || '').trim(),
    number: (row['#'] || '').trim(),
    pos: (row['POS'] || row['Pos'] || '').trim(),
    age: parseNum(row['Age']),
    bats: parseHand(row['B']),
    throws: parseHand(row['T']),
    inf: (row['Inf'] || '').trim(),
    status: (row['St'] || '').trim(),
  };
}

// ============================================================
// Parse specific rating/stat blocks
// ============================================================

export function parseBattingRatings(row: Record<string, string>): BattingRatings {
  return {
    ovr: parseNum(row['OVR']),
    con: parseNum(row['CON']),
    babip: parseNum(row['BABIP']),
    ks: parseNum(row["K's"]),
    gap: parseNum(row['GAP']),
    pow: parseNum(row['POW']),
    eye: parseNum(row['EYE']),
    conVL: parseNum(row['CON vL']),
    powVL: parseNum(row['POW vL']),
    eyeVL: parseNum(row['EYE vL']),
    conVR: parseNum(row['CON vR']),
    powVR: parseNum(row['POW vR']),
    eyeVR: parseNum(row['EYE vR']),
    bun: parseNum(row['BUN']),
    bfh: parseNum(row['BFH']),
    spe: parseNum(row['SPE']),
    ste: parseNum(row['STE']),
    def: parseNum(row['DEF']),
  };
}

export function parsePitchingRatings(row: Record<string, string>): PitchingRatings {
  return {
    ovr: parseNum(row['OVR']),
    stu: parseNum(row['STU']),
    mov: parseNum(row['MOV']),
    hra: parseNum(row['HRA']),
    pbabip: parseNum(row['PBABIP']),
    con: parseNum(row['CON']),
    stuVL: parseNum(row['STU vL']),
    stuVR: parseNum(row['STU vR']),
    velo: (row['VELO'] || '').trim(),
    stm: parseNum(row['STM']),
    gf: (row['G/F'] || '').trim(),
    hld: parseNum(row['HLD']),
  };
}

export function parseFieldingRatings(row: Record<string, string>): FieldingRatings {
  return {
    cAbi: parseNum(row['C ABI']),
    cArm: parseNum(row['C ARM']),
    ifRng: parseNum(row['IF RNG']),
    ifErr: parseNum(row['IF ERR']),
    ifArm: parseNum(row['IF ARM']),
    tdp: parseNum(row['TDP']),
    ofRng: parseNum(row['OF RNG']),
    ofErr: parseNum(row['OF ERR']),
    ofArm: parseNum(row['OF ARM']),
  };
}

export function parsePositionRatings(row: Record<string, string>): PositionRatings {
  return {
    def: parseNum(row['DEF']),
    p: parseNum(row['P']),
    c: parseNum(row['C']),
    '1b': parseNum(row['1B']),
    '2b': parseNum(row['2B']),
    '3b': parseNum(row['3B']),
    ss: parseNum(row['SS']),
    lf: parseNum(row['LF']),
    cf: parseNum(row['CF']),
    rf: parseNum(row['RF']),
  };
}

// ============================================================
// Batting Stats — works for both basic and super stats CSVs.
// Super stats CSV has all the fields; basic CSV will get 0
// for missing advanced fields.
// ============================================================
export function parseBattingStats(row: Record<string, string>): BattingStats {
  return {
    g: parseNum(row['G']),
    pa: parseNum(row['PA']),
    ab: parseNum(row['AB']),
    h: parseNum(row['H']),
    '1b': parseNum(row['1B']),
    '2b': parseNum(row['2B']),
    '3b': parseNum(row['3B']),
    hr: parseNum(row['HR']),
    rbi: parseNum(row['RBI']),
    r: parseNum(row['R']),
    bb: parseNum(row['BB']),
    bbPct: parseNum(row['BB%']),
    ibb: parseNum(row['IBB']),
    hp: parseNum(row['HP']),
    sf: parseNum(row['SF']),
    k: parseNum(row['K']),
    kPct: parseNum(row['K%']),
    gidp: parseNum(row['GIDP']),
    ebh: parseNum(row['EBH']),
    tb: parseNum(row['TB']),
    avg: parseNum(row['AVG']),
    obp: parseNum(row['OBP']),
    slg: parseNum(row['SLG']),
    rc27: parseNum(row['RC/27']),
    iso: parseNum(row['ISO']),
    woba: parseNum(row['wOBA']),
    ops: parseNum(row['OPS']),
    opsPlus: parseNum(row['OPS+']),
    babip: parseNum(row['BABIP']),
    wpa: parseNum(row['WPA']),
    wrc: parseNum(row['wRC']),
    wrcPlus: parseNum(row['wRC+']),
    wraa: parseNum(row['wRAA']),
    war: parseNum(row['WAR']),
    piPa: parseNum(row['PI/PA']),
    sb: parseNum(row['SB']),
    cs: parseNum(row['CS']),
    sbPct: parseNum(row['SB%']),
    wsb: parseNum(row['wSB']),
    ubr: parseNum(row['UBR']),
  };
}

// ============================================================
// Pitching Stats — works for both basic and super stats CSVs.
// ============================================================
export function parsePitchingStats(row: Record<string, string>): PitchingStats {
  return {
    g: parseNum(row['G']),
    gs: parseNum(row['GS']),
    w: parseNum(row['W']),
    l: parseNum(row['L']),
    winPct: parseNum(row['WIN%']),
    svo: parseNum(row['SVO']),
    sv: parseNum(row['SV']),
    svPct: parseNum(row['SV%']),
    bs: parseNum(row['BS']),
    bsPct: parseNum(row['BS%']),
    hld: parseNum(row['HLD']),
    sd: parseNum(row['SD']),
    md: parseNum(row['MD']),
    ip: parseNum(row['IP']),
    bf: parseNum(row['BF']),
    ha: parseNum(row['HA']),
    hr: parseNum(row['HR']),
    tb: parseNum(row['TB']),
    r: parseNum(row['R']),
    er: parseNum(row['ER']),
    bb: parseNum(row['BB']),
    ibb: parseNum(row['IBB']),
    k: parseNum(row['K']),
    hp: parseNum(row['HP']),
    era: parseNum(row['ERA']),
    avg: parseNum(row['AVG']),
    oppObp: parseNum(row['OBP']),
    oppSlg: parseNum(row['SLG']),
    oppOps: parseNum(row['OPS']),
    babip: parseNum(row['BABIP']),
    whip: parseNum(row['WHIP']),
    hr9: parseNum(row['HR/9']),
    h9: parseNum(row['H/9']),
    bb9: parseNum(row['BB/9']),
    k9: parseNum(row['K/9']),
    kbb: parseNum(row['K/BB']),
    kPct: parseNum(row['K%']),
    bbPct: parseNum(row['BB%']),
    kBbPct: parseNum(row['K%-BB%']),
    ir: parseNum(row['IR']),
    irs: parseNum(row['IRS']),
    irsPct: parseNum(row['IRS%']),
    lobPct: parseNum(row['LOB%']),
    pli: parseNum(row['pLi']),
    qs: parseNum(row['QS']),
    qsPct: parseNum(row['QS%']),
    ppg: parseNum(row['PPG']),
    gb: parseNum(row['GB']),
    fb: parseNum(row['FB']),
    goPct: parseNum(row['GO%']),
    eraPlus: parseNum(row['ERA+']),
    fip: parseNum(row['FIP']),
    fipMinus: parseNum(row['FIP-']),
    wpa: parseNum(row['WPA']),
    war: parseNum(row['WAR']),
    rwar: parseNum(row['rWAR']),
    siera: parseNum(row['SIERA']),
  };
}
