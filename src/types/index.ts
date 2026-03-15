// ============================================================
// Core OOTP Player Types
// ============================================================

export type Hand = 'L' | 'R' | 'S'; // Switch hitter
export type RosterStatus = 'Active Roster' | 'Reserve' | 'Minors' | string;
export type GroundFlyType = 'EX FB' | 'FB' | 'NEU' | 'GB' | 'EX GB' | string;

export interface PlayerBase {
  name: string;
  number: string;
  pos: string; // Primary position from CSV
  age: number;
  bats: Hand;
  throws: Hand;
  inf: string;
  status: RosterStatus;
}

export interface BattingRatings {
  ovr: number;
  con: number;
  babip: number;
  ks: number;
  gap: number;
  pow: number;
  eye: number;
  conVL: number;
  powVL: number;
  eyeVL: number;
  conVR: number;
  powVR: number;
  eyeVR: number;
  bun: number;
  bfh: number;
  spe: number;
  ste: number;
  def: number;
}

export interface PitchingRatings {
  ovr: number;
  stu: number;
  mov: number;
  hra: number;
  pbabip: number;
  con: number;
  stuVL: number;
  stuVR: number;
  velo: string;
  stm: number;
  gf: GroundFlyType;
  hld: number;
}

export interface FieldingRatings {
  cAbi: number;
  cArm: number;
  ifRng: number;
  ifErr: number;
  ifArm: number;
  tdp: number;
  ofRng: number;
  ofErr: number;
  ofArm: number;
}

export interface PositionRatings {
  def: number;
  p: number;
  c: number;
  '1b': number;
  '2b': number;
  '3b': number;
  ss: number;
  lf: number;
  cf: number;
  rf: number;
}

export interface BattingStats {
  g: number;
  pa: number;
  ab: number;
  h: number;
  '1b': number;
  '2b': number;
  '3b': number;
  hr: number;
  rbi: number;
  r: number;
  bb: number;
  bbPct: number;
  ibb: number;
  hp: number;
  sf: number;
  k: number;
  kPct: number;
  gidp: number;
  ebh: number;
  tb: number;
  avg: number;
  obp: number;
  slg: number;
  rc27: number;
  iso: number;
  woba: number;
  ops: number;
  opsPlus: number;
  babip: number;
  wpa: number;
  wrc: number;
  wrcPlus: number;
  wraa: number;
  war: number;
  piPa: number;
  sb: number;
  cs: number;
  sbPct: number;
  wsb: number;
  ubr: number;
}

// Hitter archetype based on the OOTP Advanced Stats Cheat Sheet
export type HitterArchetype =
  | 'Patient Slugger'    // high BB%, low chase, strong wOBA/power
  | 'Contact Hitter'     // strong AVG, low K%, good contact
  | 'Power Masher'       // big SLG/ISO, high K risk
  | 'Empty Average'      // decent AVG, weak SLG, little damage
  | 'Balanced Hitter'    // solid across the board
  | 'Speed Threat'       // high speed/steal, leadoff profile
  | 'OBP Machine'        // walks, gets on base, patient
  | 'Run Producer'       // RBI machine, clutch hitting
  | 'Developing'         // insufficient data
  | 'Bench Bat';         // below average overall

export interface PitchingStats {
  g: number;
  gs: number;
  w: number;
  l: number;
  winPct: number;
  svo: number;
  sv: number;
  svPct: number;
  bs: number;
  bsPct: number;
  hld: number;
  sd: number;
  md: number;
  ip: number;
  bf: number;
  ha: number;
  hr: number;
  tb: number;
  r: number;
  er: number;
  bb: number;
  ibb: number;
  k: number;
  hp: number;
  era: number;
  avg: number;
  oppObp: number;
  oppSlg: number;
  oppOps: number;
  babip: number;
  whip: number;
  hr9: number;
  h9: number;
  bb9: number;
  k9: number;
  kbb: number;
  kPct: number;
  bbPct: number;
  kBbPct: number;
  ir: number;
  irs: number;
  irsPct: number;
  lobPct: number;
  pli: number;
  qs: number;
  qsPct: number;
  ppg: number;
  gb: number;
  fb: number;
  goPct: number;
  eraPlus: number;
  fip: number;
  fipMinus: number;
  wpa: number;
  war: number;
  rwar: number;
  siera: number;
}

// Pitcher archetype based on the OOTP Advanced Stats Cheat Sheet
export type PitcherArchetype =
  | 'Ace'              // misses bats, limits damage, multi-pitch
  | 'No. 2/3 Starter'  // solid command + contact suppression + mix
  | 'Back-End Starter'  // survives on command/durability/weak contact
  | 'Innings Eater'     // durable, high IP, steady
  | 'Setup/Closer'      // elite FB/breaking value, huge whiff, short outings
  | 'Fireman'           // high-leverage reliever, strong IRS/pLi
  | 'Middle Reliever'   // decent stuff, fills innings
  | 'Mop-Up'            // back of bullpen
  | 'Developing';       // insufficient data

// Archetype metadata for display
export interface ArchetypeInfo {
  label: string;
  description: string;
  keyTraits: string[];
  color: string;
  bgColor: string;
}

export const HITTER_ARCHETYPE_INFO: Record<HitterArchetype, ArchetypeInfo> = {
  'Patient Slugger': { label: 'Patient Slugger', description: 'Elite plate discipline with power. Draws walks and punishes mistakes.', keyTraits: ['High BB%', 'Strong wOBA', 'High ISO'], color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30' },
  'Contact Hitter': { label: 'Contact Hitter', description: 'Rarely strikes out, puts the ball in play consistently.', keyTraits: ['High AVG', 'Low K%', 'Line drives'], color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  'Power Masher': { label: 'Power Masher', description: 'Big-time power with K risk. Home run or bust approach.', keyTraits: ['High SLG/ISO', 'High K%', 'HR threat'], color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
  'Empty Average': { label: 'Empty Average', description: 'Gets hits but little extra-base damage. Singles hitter.', keyTraits: ['Decent AVG', 'Low SLG', 'Low ISO'], color: 'text-gray-400', bgColor: 'bg-gray-500/10 border-gray-500/30' },
  'Balanced Hitter': { label: 'Balanced Hitter', description: 'Solid across the board. No glaring weakness.', keyTraits: ['Above-avg wRC+', 'Balanced tools', 'Reliable'], color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  'Speed Threat': { label: 'Speed Threat', description: 'Uses speed to create havoc on the bases.', keyTraits: ['High SB', 'Speed rating', 'Leadoff profile'], color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  'OBP Machine': { label: 'OBP Machine', description: 'Elite on-base skills. Walks frequently and rarely chases.', keyTraits: ['High OBP', 'High BB%', 'Patient'], color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/30' },
  'Run Producer': { label: 'Run Producer', description: 'Drives in runs. Performs well with runners on.', keyTraits: ['High RBI', 'Clutch WPA', 'Middle of order'], color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  'Developing': { label: 'Developing', description: 'Insufficient sample size to classify.', keyTraits: ['Limited PA', 'Needs reps'], color: 'text-gray-600', bgColor: 'bg-gray-600/10 border-gray-600/30' },
  'Bench Bat': { label: 'Bench Bat', description: 'Below average production. Best in a reserve role.', keyTraits: ['Low wRC+', 'Limited offense'], color: 'text-gray-500', bgColor: 'bg-gray-500/10 border-gray-500/30' },
};

export const PITCHER_ARCHETYPE_INFO: Record<PitcherArchetype, ArchetypeInfo> = {
  'Ace': { label: 'Ace', description: 'Dominant frontline starter. Misses bats and limits damage.', keyTraits: ['K-BB% >= 20%', 'Low FIP', 'Elite stuff'], color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30' },
  'No. 2/3 Starter': { label: 'No. 2/3 Starter', description: 'Solid mid-rotation arm with good command and mix.', keyTraits: ['K-BB% >= 15%', 'Quality starts', 'Reliable'], color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  'Back-End Starter': { label: 'Back-End Starter', description: 'Survives on command and durability. Contact manager.', keyTraits: ['Durability', 'Command', 'Weak contact'], color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  'Innings Eater': { label: 'Innings Eater', description: 'Durable arm that logs heavy innings with decent results.', keyTraits: ['High IP', 'High STM', 'Consistent'], color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30' },
  'Setup/Closer': { label: 'Setup/Closer', description: 'High-leverage reliever with swing-and-miss stuff.', keyTraits: ['High K%', 'Strong K-BB%', 'Late innings'], color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
  'Fireman': { label: 'Fireman', description: 'Excels in high-leverage spots. Strands inherited runners.', keyTraits: ['High pLi', 'Low IRS%', 'Clutch'], color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  'Middle Reliever': { label: 'Middle Reliever', description: 'Fills innings from the bullpen. Decent but not dominant.', keyTraits: ['Moderate K-BB%', 'Bridge innings'], color: 'text-gray-300', bgColor: 'bg-gray-500/10 border-gray-500/30' },
  'Mop-Up': { label: 'Mop-Up', description: 'Low-leverage arm for blowout situations.', keyTraits: ['Low K-BB%', 'Low pLi'], color: 'text-gray-500', bgColor: 'bg-gray-500/10 border-gray-500/30' },
  'Developing': { label: 'Developing', description: 'Insufficient sample size to classify.', keyTraits: ['Limited IP', 'Needs evaluation'], color: 'text-gray-600', bgColor: 'bg-gray-600/10 border-gray-600/30' },
};

// Percentile rankings within the roster (0-100)
export interface PlayerPercentiles {
  // Batting percentiles (among batters with PA)
  offensiveScore?: number;
  defensiveScore?: number;
  ops?: number;
  opsPlus?: number;
  woba?: number;
  wrcPlus?: number;
  war?: number;
  iso?: number;
  bbPct?: number;
  kPct?: number;  // inverted: lower K% = higher percentile
  avg?: number;
  // Pitching percentiles (among pitchers with IP)
  pitchingScore?: number;
  era?: number;    // inverted: lower ERA = higher percentile
  fip?: number;    // inverted
  whip?: number;   // inverted
  kBbPct?: number;
  siera?: number;  // inverted
  k9?: number;
  pitchWar?: number;
  // Score percentiles (among all players)
  overallValue?: number;
}

// The unified player model that merges all CSV data
export interface Player extends PlayerBase {
  id: string; // generated from name + number
  battingRatings: BattingRatings | null;
  pitchingRatings: PitchingRatings | null;
  fieldingRatings: FieldingRatings | null;
  positionRatings: PositionRatings | null;
  battingStats: BattingStats | null;
  pitchingStats: PitchingStats | null;
  // Computed
  isPitcher: boolean;
  isPositionPlayer: boolean;
  isTwoWay: boolean;
  eligiblePositions: string[];
  scores: PlayerScores;
  hitterArchetype: HitterArchetype | null;
  pitcherArchetype: PitcherArchetype | null;
  percentiles: PlayerPercentiles;
}

// ============================================================
// Ratings Scale Types
// ============================================================

export type RatingsScale = '1_5' | '2_8' | '1_10' | '1_20' | '20_80' | '1_100' | '1_200';

export interface RatingsScaleInfo {
  label: string;
  min: number;
  max: number;
}

export const RATINGS_SCALES: Record<RatingsScale, RatingsScaleInfo> = {
  '1_5':   { label: '1 to 5',   min: 1,  max: 5 },
  '2_8':   { label: '2 to 8',   min: 2,  max: 8 },
  '1_10':  { label: '1 to 10',  min: 1,  max: 10 },
  '1_20':  { label: '1 to 20',  min: 1,  max: 20 },
  '20_80': { label: '20 to 80', min: 20, max: 80 },
  '1_100': { label: '1 to 100', min: 1,  max: 100 },
  '1_200': { label: '1 to 200', min: 1,  max: 200 },
};

// ============================================================
// Scoring Types
// ============================================================

export interface PlayerScores {
  offensiveScore: number;
  defensiveScore: number;
  pitchingScore: number;
  lineupFitScore: number;
  platoonVsLHP: number;
  platoonVsRHP: number;
  starterScore: number;
  relieverScore: number;
  positionalFlexibility: number;
  overallValue: number;
}

export interface ScoringWeights {
  offensiveWeight: number;
  defensiveWeight: number;
  ratingsWeight: number;
  statsWeight: number;
  versatilityWeight: number;
  outOfPositionPenalty: number;
  // Position-specific defense importance (0-1)
  positionDefenseWeight: Record<string, number>;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  offensiveWeight: 0.5,
  defensiveWeight: 0.3,
  ratingsWeight: 0.6,
  statsWeight: 0.4,
  versatilityWeight: 0.1,
  outOfPositionPenalty: 0.3,
  positionDefenseWeight: {
    C: 0.7,
    SS: 0.65,
    CF: 0.6,
    '2B': 0.5,
    '3B': 0.45,
    RF: 0.4,
    LF: 0.3,
    '1B': 0.2,
    DH: 0,
  },
};

// ============================================================
// Lineup Types
// ============================================================

export interface LineupSlot {
  position: string;
  player: Player;
  score: number;
  outOfPosition: boolean;
}

export interface Lineup {
  type: 'general' | 'vs_rhp' | 'vs_lhp' | 'defense' | 'balanced';
  slots: LineupSlot[];
  bench: Player[];
  battingOrder: LineupSlot[];
  totalOffense: number;
  totalDefense: number;
}

export interface PitchingStaff {
  rotation: Player[];
  closer: Player | null;
  setupMen: Player[];
  middleRelievers: Player[];
  longReliever: Player | null;
}

// ============================================================
// App State Types
// ============================================================

export type CsvFileType =
  | 'batting_ratings'
  | 'pitching_ratings'
  | 'fielding_ratings'
  | 'position_ratings'
  | 'batting_stats'
  | 'pitching_stats'
  | 'batting_super_stats'
  | 'pitching_super_stats';

export interface CsvFileInfo {
  type: CsvFileType;
  fileName: string;
  rowCount: number;
  loaded: boolean;
}

export type AppTab =
  | 'dashboard'
  | 'batters'
  | 'pitchers'
  | 'defense'
  | 'lineups'
  | 'rotation'
  | 'trends'
  | 'import'
  | 'settings';

export interface SeasonSnapshot {
  label: string;
  players: Player[];
  savedAt: number; // timestamp
}

export interface AppSettings extends ScoringWeights {
  darkMode: boolean;
  rosterPitcherCount: number;
  allowOutOfPosition: boolean;
  useDH: boolean;
  currentRatingsScale: RatingsScale;
  potentialRatingsScale: RatingsScale;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ...DEFAULT_WEIGHTS,
  darkMode: true,
  rosterPitcherCount: 13,
  allowOutOfPosition: false,
  useDH: true,
  currentRatingsScale: '20_80',
  potentialRatingsScale: '20_80',
};
