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
  // Perfect Team fields (populated only in PT mode)
  cardOvr: number;
  cardTier: CardTier;
  artifactBoosts: ArtifactBoost[];
  effectiveBattingRatings: BattingRatings | null;
  effectivePitchingRatings: PitchingRatings | null;
  effectiveFieldingRatings: FieldingRatings | null;
  effectiveScores: PlayerScores;
  hiddenPotentialGap: number;
  // Dump import extra data (populated only when importing from OOTP dump folder)
  dumpData: DumpExtraData | null;
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
  | 'strategy'
  | 'organization'
  | 'prospects'
  | 'analysis'
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

// ============================================================
// Perfect Team Mode Types
// ============================================================

export type AppMode = 'franchise' | 'perfectTeam';

export type PTAppTab =
  | 'pt_dashboard'
  | 'pt_collection'
  | 'pt_tournament'
  | 'pt_sleepers'
  | 'pt_import'
  | 'pt_settings';

export type CardTier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Perfect';

export const CARD_TIER_BOUNDARIES: { tier: CardTier; min: number; max: number }[] = [
  { tier: 'Bronze',  min: 0,   max: 69 },
  { tier: 'Silver',  min: 70,  max: 79 },
  { tier: 'Gold',    min: 80,  max: 89 },
  { tier: 'Diamond', min: 90,  max: 99 },
  { tier: 'Perfect', min: 100, max: 200 },
];

export const CARD_TIER_COLORS: Record<CardTier, { text: string; bg: string; border: string }> = {
  Bronze:  { text: 'text-amber-600',   bg: 'bg-amber-600/10',   border: 'border-amber-600/30' },
  Silver:  { text: 'text-gray-300',    bg: 'bg-gray-300/10',    border: 'border-gray-300/30' },
  Gold:    { text: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30' },
  Diamond: { text: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/30' },
  Perfect: { text: 'text-purple-400',  bg: 'bg-purple-400/10',  border: 'border-purple-400/30' },
};

export function getCardTier(ovr: number): CardTier {
  if (ovr >= 100) return 'Perfect';
  if (ovr >= 90) return 'Diamond';
  if (ovr >= 80) return 'Gold';
  if (ovr >= 70) return 'Silver';
  return 'Bronze';
}

// Artifact system
export interface ArtifactBoost {
  attribute: string; // e.g., 'con', 'pow', 'eye', 'stu', 'mov', 'ifRng', etc.
  boost: number;     // raw points added (in the user's current ratings scale)
}

export interface ArtifactConfig {
  id: string;
  name: string;
  boosts: ArtifactBoost[];
}

// Scoring profile for PT meta weighting
export interface ScoringProfile {
  id: string;
  label: string;
  description: string;
  offensiveWeights: { con: number; pow: number; eye: number; gap: number; spe: number; ste: number; babip: number };
  defensiveWeights: {
    catcher: { cAbi: number; cArm: number };
    infield: { ifRng: number; ifErr: number; ifArm: number; tdp: number };
    outfield: { ofRng: number; ofErr: number; ofArm: number };
  };
  pitchingWeights: { stu: number; mov: number; con: number; hra: number; pbabip: number; hld: number };
  relieverWeights: { stu: number; mov: number; con: number; hld: number; hra: number; pbabip: number };
  positionDefenseImportance: Record<string, number>;
}

// Tournament configuration
export interface TournamentConfig {
  ovrCap: number;
  tierFilter: CardTier[];
  prioritizeArtifacts: boolean;
}

// ============================================================
// OOTP Dump Import Types
// ============================================================

export type ImportMode = 'manual' | 'dump';

export type DumpFileType =
  | 'dump_players'
  | 'dump_players_batting'
  | 'dump_players_pitching'
  | 'dump_players_fielding'
  | 'dump_players_value'
  | 'dump_career_batting'
  | 'dump_career_pitching'
  | 'dump_career_fielding'
  | 'dump_roster_status'
  | 'dump_contract'
  | 'dump_team_roster'
  | 'dump_teams'
  | 'dump_parks'
  | 'dump_at_bat_stats';

export interface DumpFileInfo {
  type: DumpFileType;
  fileName: string;
  rowCount: number;
  loaded: boolean;
  tier: 1 | 2;
}

export const DUMP_FILE_MAP: Record<string, { type: DumpFileType; tier: 1 | 2; label: string }> = {
  'players.csv':                    { type: 'dump_players',          tier: 1, label: 'Players (Bio/Personality)' },
  'players_batting.csv':            { type: 'dump_players_batting',  tier: 1, label: 'Batting Ratings' },
  'players_pitching.csv':           { type: 'dump_players_pitching', tier: 1, label: 'Pitching Ratings' },
  'players_fielding.csv':           { type: 'dump_players_fielding', tier: 1, label: 'Fielding Ratings' },
  'players_value.csv':              { type: 'dump_players_value',    tier: 1, label: 'Player Values (OVR/OA/POT)' },
  'players_career_batting_stats.csv':  { type: 'dump_career_batting',  tier: 1, label: 'Career Batting Stats' },
  'players_career_pitching_stats.csv': { type: 'dump_career_pitching', tier: 1, label: 'Career Pitching Stats' },
  'players_career_fielding_stats.csv': { type: 'dump_career_fielding', tier: 1, label: 'Career Fielding Stats (ZR)' },
  'players_roster_status.csv':      { type: 'dump_roster_status',    tier: 2, label: 'Roster Status' },
  'players_contract.csv':           { type: 'dump_contract',         tier: 2, label: 'Contracts' },
  'team_roster.csv':                { type: 'dump_team_roster',      tier: 2, label: 'Team Rosters' },
  'teams.csv':                      { type: 'dump_teams',            tier: 2, label: 'Teams' },
  'parks.csv':                      { type: 'dump_parks',            tier: 2, label: 'Parks (Factors)' },
  'players_at_bat_batting_stats.csv': { type: 'dump_at_bat_stats',   tier: 2, label: 'At-Bat Stats (Statcast)' },
};

export interface PlayerPersonality {
  greed: number;
  loyalty: number;
  playForWinner: number;
  workEthic: number;
  intelligence: number;
  leadership: number;
}

export interface PlayerStrategySettings {
  stealing: number;
  running: number;
  buntForHit: number;
  sacBunt: number;
  hitRun: number;
  hookStart: number;
  hookRelief: number;
  pitchCount: number;
  pitchAround: number;
  neverPinchHit: number;
  defensiveSub: number;
}

export interface RosterInfo {
  playingLevel: number;
  isActive: boolean;
  isOnDL: boolean;
  isOnDL60: boolean;
  mlbServiceYears: number;
  mlbServiceDays: number;
  proServiceYears: number;
  optionsUsed: number;
  isOnWaivers: boolean;
  designatedForAssignment: boolean;
  wasTrade: boolean;
}

export interface ContractInfo {
  salaries: number[];
  totalYears: number;
  currentYear: number;
  noTrade: boolean;
  isMajor: boolean;
  teamOption: boolean;
  playerOption: boolean;
}

export interface StatcastData {
  avgExitVelo: number;
  maxExitVelo: number;
  avgLaunchAngle: number;
  sprintSpeed: number;
  hardHitPct: number;
  barrelPct: number;
  totalBattedBalls: number;
}

export interface ParkFactors {
  parkId: number;
  name: string;
  avg: number;
  avgL: number;
  avgR: number;
  doubles: number;
  triples: number;
  hr: number;
  hrR: number;
  hrL: number;
}

export interface PitchRepertoire {
  fastball: number;
  slider: number;
  curveball: number;
  changeup: number;
  sinker: number;
  cutter: number;
  splitter: number;
  knuckleball: number;
  knucklecurve: number;
  circlechange: number;
  screwball: number;
  forkball: number;
}

export interface DumpExtraData {
  playerId: number;
  teamId: number;
  teamName: string;
  teamAbbr: string;
  personality: PlayerPersonality;
  morale: number;
  playerStrategy: PlayerStrategySettings;
  rosterInfo: RosterInfo | null;
  contractInfo: ContractInfo | null;
  statcastData: StatcastData | null;
  zoneRating: number;
  catcherFraming: number;
  talentBattingRatings: BattingRatings | null;
  talentPitchingRatings: PitchingRatings | null;
  positionPotentials: Record<string, number>;
  ovrByPosition: Record<string, number>;
  overallAbility: number;
  potential: number;
  parkFactors: ParkFactors | null;
  pitchRepertoire: PitchRepertoire | null;
  velocity: number;
  armSlot: number;
}
