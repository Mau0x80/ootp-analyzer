import { create } from 'zustand';
import type {
  Player, AppTab, AppSettings, CsvFileInfo, CsvFileType, Lineup, PitchingStaff,
  SeasonSnapshot, AppMode, PTAppTab, ArtifactBoost, ArtifactConfig, TournamentConfig,
  ImportMode, DumpFileInfo, DumpFileType,
} from '../types';
import { DEFAULT_SETTINGS, RATINGS_SCALES, DUMP_FILE_MAP } from '../types';
import {
  parseCsvText, detectCsvType, extractPlayerBase,
  parseBattingRatings, parsePitchingRatings, parseFieldingRatings,
  parsePositionRatings, parseBattingStats, parsePitchingStats,
} from '../utils/csvParser';
import { mergePlayers } from '../utils/playerMerger';
import { scoreAllPlayers } from '../utils/scoringEngine';
import { calcPercentiles } from '../utils/percentileEngine';
import { generateLineup, generatePitchingStaff } from '../utils/lineupOptimizer';
import { ptScoreAllPlayers, applyArtifacts } from '../utils/ptScoringEngine';
import { PT27_META_PROFILE } from '../utils/scoringProfiles';
import { generateTournamentLineup } from '../utils/tournamentOptimizer';
import {
  parseDumpPlayers, parseDumpBattingRatings, parseDumpPitchingRatings,
  parseDumpFieldingRatings, parseDumpPlayerValues, parseDumpCareerBatting,
  parseDumpCareerPitching, parseDumpCareerFielding, parseDumpRosterStatus,
  parseDumpContracts, parseDumpTeams, parseDumpParks, parseDumpTeamRoster,
  parseDumpAtBatStats,
} from '../utils/dumpParser';
import type { ParsedDumpData } from '../utils/dumpParser';
import { mergeDumpData, mergeFreeAgents, mergeDraftPlayers } from '../utils/dumpMerger';

interface RawDatasets {
  batting_ratings: { base: any; data: any }[];
  pitching_ratings: { base: any; data: any }[];
  fielding_ratings: { base: any; data: any }[];
  position_ratings: { base: any; data: any }[];
  batting_stats: { base: any; data: any }[];
  pitching_stats: { base: any; data: any }[];
  batting_super_stats: { base: any; data: any }[];
  pitching_super_stats: { base: any; data: any }[];
}

interface AppState {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  players: Player[];
  csvFiles: CsvFileInfo[];
  rawDatasets: RawDatasets;
  lineups: Record<string, Lineup>;
  pitchingStaff: PitchingStaff | null;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  loadCsvFile: (fileName: string, text: string) => { success: boolean; type: CsvFileType | null; error?: string };
  rebuildPlayers: () => void;
  generateAllLineups: () => void;
  resetData: () => void;
  selectedPlayerId: string | null;
  setSelectedPlayer: (id: string | null) => void;
  // Manual lineup builder
  isManualMode: boolean;
  manualOverrides: Record<string, string>;
  toggleManualMode: () => void;
  setManualOverride: (position: string, playerId: string) => void;
  removeManualOverride: (position: string) => void;
  clearManualOverrides: () => void;
  // Season snapshots
  seasons: SeasonSnapshot[];
  saveCurrentAsSeason: (label: string) => void;
  deleteSeason: (index: number) => void;
  clearSeasons: () => void;
  // Dump folder import
  importMode: ImportMode;
  setImportMode: (mode: ImportMode) => void;
  dumpFiles: DumpFileInfo[];
  dumpProgress: { total: number; loaded: number; currentFile: string } | null;
  scanDumpFolder: (files: FileList) => Promise<void>;
  loadDumpTeam: () => Promise<void>;
  dumpFilterTeamId: number | undefined;
  setDumpFilterTeamId: (teamId: number | undefined) => void;
  dumpTeams: { id: number; name: string; abbr: string }[];
  freeAgents: Player[];
  draftPlayers: Player[];
  // Perfect Team mode
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  ptActiveTab: PTAppTab;
  setPTActiveTab: (tab: PTAppTab) => void;
  ptPlayers: Player[];
  ptCsvFiles: CsvFileInfo[];
  ptRawDatasets: RawDatasets;
  ptLoadCsvFile: (fileName: string, text: string) => { success: boolean; type: CsvFileType | null; error?: string };
  ptRebuildPlayers: () => void;
  ptResetData: () => void;
  // Artifacts
  artifactConfigs: ArtifactConfig[];
  playerArtifacts: Record<string, ArtifactBoost[]>;
  addArtifactConfig: (config: ArtifactConfig) => void;
  removeArtifactConfig: (id: string) => void;
  applyArtifactToPlayer: (playerId: string, boosts: ArtifactBoost[]) => void;
  clearPlayerArtifacts: (playerId: string) => void;
  // Tournament
  tournamentConfig: TournamentConfig;
  tournamentLineup: Lineup | null;
  updateTournamentConfig: (partial: Partial<TournamentConfig>) => void;
  generateTournamentLineup: () => void;
}

const EMPTY_DATASETS: RawDatasets = {
  batting_ratings: [],
  pitching_ratings: [],
  fielding_ratings: [],
  position_ratings: [],
  batting_stats: [],
  pitching_stats: [],
  batting_super_stats: [],
  pitching_super_stats: [],
};

// Maps CSV file types to their parser functions.
// Super stats use the same parsers as basic stats (same function, more fields).
const PARSERS: Record<CsvFileType, (row: Record<string, string>) => any> = {
  batting_ratings: parseBattingRatings,
  pitching_ratings: parsePitchingRatings,
  fielding_ratings: parseFieldingRatings,
  position_ratings: parsePositionRatings,
  batting_stats: parseBattingStats,
  pitching_stats: parsePitchingStats,
  batting_super_stats: parseBattingStats,   // same parser, more fields filled
  pitching_super_stats: parsePitchingStats, // same parser, more fields filled
};

export const useStore = create<AppState>((set, get) => ({
  activeTab: 'import',
  setActiveTab: (tab) => set({ activeTab: tab }),

  players: [],
  csvFiles: [],
  rawDatasets: { ...EMPTY_DATASETS },

  lineups: {},
  pitchingStaff: null,

  settings: { ...DEFAULT_SETTINGS },
  updateSettings: (partial) => {
    set((state) => {
      const newSettings = { ...state.settings, ...partial };
      if (partial.darkMode !== undefined) {
        document.documentElement.classList.toggle('dark', newSettings.darkMode);
      }
      return { settings: newSettings };
    });
    const state = get();
    if (state.players.length > 0) {
      state.rebuildPlayers();
    }
  },

  selectedPlayerId: null,
  setSelectedPlayer: (id) => set({ selectedPlayerId: id }),

  isManualMode: false,
  manualOverrides: {},
  toggleManualMode: () => set((s) => ({ isManualMode: !s.isManualMode })),
  setManualOverride: (position, playerId) =>
    set((s) => ({ manualOverrides: { ...s.manualOverrides, [position]: playerId } })),
  removeManualOverride: (position) =>
    set((s) => {
      const next = { ...s.manualOverrides };
      delete next[position];
      return { manualOverrides: next };
    }),
  clearManualOverrides: () => set({ manualOverrides: {} }),

  loadCsvFile: (fileName, text) => {
    const { headers, rows } = parseCsvText(text);
    const type = detectCsvType(headers);

    if (!type) {
      return { success: false, type: null, error: `Could not detect CSV type for "${fileName}". Check column headers.` };
    }

    const state = get();
    const newDatasets = { ...state.rawDatasets };

    const parser = PARSERS[type];
    const parsed = rows
      .filter((row) => (row['Name'] || '').trim().length > 0)
      .map((row) => ({
        base: extractPlayerBase(row),
        data: parser(row),
      }));

    newDatasets[type] = parsed;

    const newFiles = state.csvFiles.filter((f) => f.type !== type);
    newFiles.push({ type, fileName, rowCount: parsed.length, loaded: true });

    set({ rawDatasets: newDatasets, csvFiles: newFiles });
    get().rebuildPlayers();

    return { success: true, type };
  },

  rebuildPlayers: () => {
    const state = get();
    const ds = state.rawDatasets;
    const datasets: any = {};
    if (ds.batting_ratings.length > 0) datasets.battingRatings = ds.batting_ratings;
    if (ds.pitching_ratings.length > 0) datasets.pitchingRatings = ds.pitching_ratings;
    if (ds.fielding_ratings.length > 0) datasets.fieldingRatings = ds.fielding_ratings;
    if (ds.position_ratings.length > 0) datasets.positionRatings = ds.position_ratings;
    if (ds.batting_stats.length > 0) datasets.battingStats = ds.batting_stats;
    if (ds.pitching_stats.length > 0) datasets.pitchingStats = ds.pitching_stats;
    if (ds.batting_super_stats.length > 0) datasets.battingSuperStats = ds.batting_super_stats;
    if (ds.pitching_super_stats.length > 0) datasets.pitchingSuperStats = ds.pitching_super_stats;

    const merged = mergePlayers(datasets);
    const scored = scoreAllPlayers(merged, state.settings);
    const withPercentiles = calcPercentiles(scored);
    set({ players: withPercentiles });

    get().generateAllLineups();
  },

  generateAllLineups: () => {
    const state = get();
    if (state.players.length === 0) return;
    const { settings, players } = state;
    const modes = ['general', 'vs_rhp', 'vs_lhp', 'defense', 'balanced'] as const;
    const lineups: Record<string, Lineup> = {};
    for (const mode of modes) {
      lineups[mode] = generateLineup(
        players, mode, settings, settings.useDH, settings.allowOutOfPosition
      );
    }
    const pitchingStaff = generatePitchingStaff(players);
    set({ lineups, pitchingStaff });
  },

  resetData: () => {
    set({
      players: [],
      csvFiles: [],
      rawDatasets: { ...EMPTY_DATASETS },
      lineups: {},
      pitchingStaff: null,
      selectedPlayerId: null,
    });
  },

  // ============================================================
  // Dump Folder Import (two-phase)
  // Phase 1: scanDumpFolder — reads only teams.csv to populate team dropdown (fast)
  // Phase 2: loadDumpTeam — user picks a team, then all files are parsed & merged
  // ============================================================
  importMode: 'manual' as ImportMode,
  setImportMode: (mode) => set({ importMode: mode }),
  dumpFiles: [],
  dumpProgress: null,
  dumpFilterTeamId: undefined,
  setDumpFilterTeamId: (teamId) => {
    set({ dumpFilterTeamId: teamId });
    if (teamId !== undefined) {
      void get().loadDumpTeam();
    }
  },
  dumpTeams: [],
  freeAgents: [],
  draftPlayers: [],

  // Phase 1: Quick scan — read only teams.csv + team_roster.csv to build team list
  scanDumpFolder: async (files: FileList) => {
    const fileArray = Array.from(files);
    const csvFiles = fileArray.filter((f) => f.name.endsWith('.csv'));
    const recognized: { file: File; type: DumpFileType; tier: 1 | 2; label: string }[] = [];

    for (const file of csvFiles) {
      const baseName = file.name.split('/').pop()!.split('\\').pop()!;
      const info = DUMP_FILE_MAP[baseName];
      if (info) recognized.push({ file, type: info.type, tier: info.tier, label: info.label });
    }

    if (recognized.length === 0) return;

    set({
      dumpProgress: { total: 3, loaded: 0, currentFile: 'Scanning folder...' },
      dumpFiles: recognized.map((r) => ({
        type: r.type, fileName: r.file.name, rowCount: 0, loaded: false, tier: r.tier,
      })),
      // Reset previous state
      players: [],
      dumpFilterTeamId: undefined,
      dumpTeams: [],
  freeAgents: [],
  draftPlayers: [],
    });

    // Store file handles for Phase 2
    (globalThis as any).__dumpFileHandles = recognized;

    // Parse only teams.csv to build the dropdown
    const teamsFile = recognized.find((r) => r.type === 'dump_teams');
    if (!teamsFile) {
      set({ dumpProgress: null });
      return;
    }

    set({ dumpProgress: { total: 3, loaded: 1, currentFile: 'Reading teams...' } });
    const teamsText = await teamsFile.file.text();
    const teams = parseDumpTeams(teamsText);

    set({ dumpProgress: { total: 3, loaded: 2, currentFile: 'Building team list...' } });

    // Build team list: MLB-level teams (level === 1), with their affiliate count
    const dumpTeams: { id: number; name: string; abbr: string }[] = [];
    // Count affiliates per parent
    const affiliateCounts = new Map<number, number>();
    for (const [, team] of teams) {
      if (team.parentTeamId > 0) {
        affiliateCounts.set(team.parentTeamId, (affiliateCounts.get(team.parentTeamId) || 0) + 1);
      }
    }
    for (const [id, team] of teams) {
      if (team.level === 1) {
        const affCount = affiliateCounts.get(id) || 0;
        const suffix = affCount > 0 ? ` (+${affCount} affiliates)` : '';
        dumpTeams.push({ id, name: `${team.name} ${team.nickname}`.trim() + suffix, abbr: team.abbr });
      }
    }
    dumpTeams.sort((a, b) => a.name.localeCompare(b.name));

    // Cache teams map for later use in merge
    (globalThis as any).__dumpTeamsMap = teams;

    set({
      dumpTeams,
      dumpProgress: null,
      importMode: 'dump',
    });
  },

  // Phase 2: Full parse + merge for the selected team (and affiliates)
  loadDumpTeam: async () => {
    const recognized: { file: File; type: DumpFileType; tier: 1 | 2; label: string }[] =
      (globalThis as any).__dumpFileHandles || [];
    const filterTeamId = get().dumpFilterTeamId;
    if (recognized.length === 0 || filterTeamId === undefined) return;

    const yieldToUI = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

    // Sort: at-bat stats last (largest file)
    const sorted = [...recognized].sort((a, b) => {
      if (a.type === 'dump_at_bat_stats') return 1;
      if (b.type === 'dump_at_bat_stats') return -1;
      return 0;
    });

    const totalSteps = sorted.length;
    const parsedData: ParsedDumpData = {
      players: new Map(), battingRatings: new Map(), pitchingRatings: new Map(),
      fieldingRatings: new Map(), playerValues: new Map(),
      careerBatting: [], careerPitching: [], careerFielding: [],
      rosterStatus: new Map(), contracts: new Map(), teamRoster: [],
      teams: (globalThis as any).__dumpTeamsMap || new Map(),
      parks: new Map(), atBatStats: new Map(),
    };

    const parseFn: Record<string, (text: string) => void> = {
      dump_players: (t) => { parsedData.players = parseDumpPlayers(t); },
      dump_players_batting: (t) => { parsedData.battingRatings = parseDumpBattingRatings(t); },
      dump_players_pitching: (t) => { parsedData.pitchingRatings = parseDumpPitchingRatings(t); },
      dump_players_fielding: (t) => { parsedData.fieldingRatings = parseDumpFieldingRatings(t); },
      dump_players_value: (t) => { parsedData.playerValues = parseDumpPlayerValues(t); },
      dump_career_batting: (t) => { parsedData.careerBatting = parseDumpCareerBatting(t); },
      dump_career_pitching: (t) => { parsedData.careerPitching = parseDumpCareerPitching(t); },
      dump_career_fielding: (t) => { parsedData.careerFielding = parseDumpCareerFielding(t); },
      dump_roster_status: (t) => { parsedData.rosterStatus = parseDumpRosterStatus(t); },
      dump_contract: (t) => { parsedData.contracts = parseDumpContracts(t); },
      dump_team_roster: (t) => { parsedData.teamRoster = parseDumpTeamRoster(t); },
      dump_teams: (t) => { parsedData.teams = parseDumpTeams(t); },
      dump_parks: (t) => { parsedData.parks = parseDumpParks(t); },
      dump_at_bat_stats: (t) => { parsedData.atBatStats = parseDumpAtBatStats(t); },
    };

    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      set({ dumpProgress: { total: totalSteps, loaded: i, currentFile: `Reading ${r.label}...` } });
      await yieldToUI();

      // Skip teams.csv if already cached
      if (r.type === 'dump_teams' && parsedData.teams.size > 0) {
        continue;
      }

      const text = await r.file.text();

      set({ dumpProgress: { total: totalSteps, loaded: i, currentFile: `Parsing ${r.label}...` } });
      await yieldToUI();

      // Skip at-bat stats if too large (>30MB)
      if (r.type === 'dump_at_bat_stats' && text.length > 30_000_000) {
        console.warn(`Skipping ${r.file.name}: too large (${(text.length / 1048576).toFixed(0)}MB). Statcast data unavailable.`);
      } else {
        parseFn[r.type]?.(text);
      }

      await yieldToUI();
    }

    // Cache parsed data for re-merge on team change
    (globalThis as any).__cachedDumpData = parsedData;

    // Update dumpFiles status with row counts
    const updatedDumpFiles = sorted.map((r) => {
      let rowCount = 0;
      if (r.type === 'dump_players') rowCount = parsedData.players.size;
      else if (r.type === 'dump_players_batting') rowCount = parsedData.battingRatings.size;
      else if (r.type === 'dump_players_pitching') rowCount = parsedData.pitchingRatings.size;
      else if (r.type === 'dump_players_fielding') rowCount = parsedData.fieldingRatings.size;
      else if (r.type === 'dump_players_value') rowCount = parsedData.playerValues.size;
      else if (r.type === 'dump_career_batting') rowCount = parsedData.careerBatting.length;
      else if (r.type === 'dump_career_pitching') rowCount = parsedData.careerPitching.length;
      else if (r.type === 'dump_career_fielding') rowCount = parsedData.careerFielding.length;
      else if (r.type === 'dump_roster_status') rowCount = parsedData.rosterStatus.size;
      else if (r.type === 'dump_contract') rowCount = parsedData.contracts.size;
      else if (r.type === 'dump_team_roster') rowCount = parsedData.teamRoster.length;
      else if (r.type === 'dump_teams') rowCount = parsedData.teams.size;
      else if (r.type === 'dump_parks') rowCount = parsedData.parks.size;
      else if (r.type === 'dump_at_bat_stats') rowCount = parsedData.atBatStats.size;
      return { type: r.type, fileName: r.file.name, rowCount, loaded: true, tier: r.tier };
    });
    set({ dumpFiles: updatedDumpFiles });

    // Merge + Score + Percentiles with UI yields
    set({ dumpProgress: { total: 1, loaded: 0, currentFile: 'Merging player data...' } });
    await yieldToUI();
    const merged = mergeDumpData(parsedData, filterTeamId);

    set({ dumpProgress: { total: 1, loaded: 0, currentFile: `Scoring ${merged.length} players...` } });
    await yieldToUI();
    const scored = scoreAllPlayers(merged, get().settings);

    set({ dumpProgress: { total: 1, loaded: 0, currentFile: 'Computing percentiles...' } });
    await yieldToUI();
    const withPercentiles = calcPercentiles(scored);

    // Build free agents and draft players (top prospects only to keep it fast)
    set({ dumpProgress: { total: 1, loaded: 0, currentFile: 'Loading free agents & draft pool...' } });
    await yieldToUI();
    const fa = mergeFreeAgents(parsedData);
    const faScored = scoreAllPlayers(fa, get().settings);

    const draft = mergeDraftPlayers(parsedData);
    const draftScored = scoreAllPlayers(draft, get().settings);

    set({
      players: withPercentiles,
      freeAgents: faScored.sort((a, b) => b.cardOvr - a.cardOvr).slice(0, 300),
      draftPlayers: draftScored.sort((a, b) => {
        // Sort by potential desc, then OA desc
        const potA = a.dumpData?.potential ?? 0;
        const potB = b.dumpData?.potential ?? 0;
        if (potB !== potA) return potB - potA;
        return b.cardOvr - a.cardOvr;
      }).slice(0, 200),
      dumpProgress: null,
    });

    get().generateAllLineups();
  },

  // ============================================================
  // Perfect Team Mode
  // ============================================================
  appMode: 'franchise',
  setAppMode: (mode) => set({ appMode: mode }),

  ptActiveTab: 'pt_import',
  setPTActiveTab: (tab) => set({ ptActiveTab: tab }),

  ptPlayers: [],
  ptCsvFiles: [],
  ptRawDatasets: { ...EMPTY_DATASETS },

  ptLoadCsvFile: (fileName, text) => {
    const { headers, rows } = parseCsvText(text);
    const type = detectCsvType(headers);
    if (!type) {
      return { success: false, type: null, error: `Could not detect CSV type for "${fileName}".` };
    }
    const state = get();
    const newDatasets = { ...state.ptRawDatasets };
    const parser = PARSERS[type];
    const parsed = rows
      .filter((row) => (row['Name'] || '').trim().length > 0)
      .map((row) => ({ base: extractPlayerBase(row), data: parser(row) }));
    newDatasets[type] = parsed;
    const newFiles = state.ptCsvFiles.filter((f) => f.type !== type);
    newFiles.push({ type, fileName, rowCount: parsed.length, loaded: true });
    set({ ptRawDatasets: newDatasets, ptCsvFiles: newFiles });
    get().ptRebuildPlayers();
    return { success: true, type };
  },

  ptRebuildPlayers: () => {
    const state = get();
    const ds = state.ptRawDatasets;
    const datasets: any = {};
    if (ds.batting_ratings.length > 0) datasets.battingRatings = ds.batting_ratings;
    if (ds.pitching_ratings.length > 0) datasets.pitchingRatings = ds.pitching_ratings;
    if (ds.fielding_ratings.length > 0) datasets.fieldingRatings = ds.fielding_ratings;
    if (ds.position_ratings.length > 0) datasets.positionRatings = ds.position_ratings;
    if (ds.batting_stats.length > 0) datasets.battingStats = ds.batting_stats;
    if (ds.pitching_stats.length > 0) datasets.pitchingStats = ds.pitching_stats;
    if (ds.batting_super_stats.length > 0) datasets.battingSuperStats = ds.batting_super_stats;
    if (ds.pitching_super_stats.length > 0) datasets.pitchingSuperStats = ds.pitching_super_stats;

    const merged = mergePlayers(datasets);
    const scored = ptScoreAllPlayers(merged, state.settings.currentRatingsScale);
    const withPercentiles = calcPercentiles(scored);

    // Re-apply existing artifact boosts
    const { playerArtifacts, settings } = state;
    const scale = RATINGS_SCALES[settings.currentRatingsScale as keyof typeof RATINGS_SCALES] || RATINGS_SCALES['20_80'];
    const withArtifacts = withPercentiles.map((p) => {
      const boosts = playerArtifacts[p.id];
      if (boosts && boosts.length > 0) {
        return applyArtifacts(p, boosts, scale, PT27_META_PROFILE);
      }
      return p;
    });

    set({ ptPlayers: withArtifacts });
  },

  ptResetData: () => {
    set({
      ptPlayers: [],
      ptCsvFiles: [],
      ptRawDatasets: { ...EMPTY_DATASETS },
      playerArtifacts: {},
      tournamentLineup: null,
    });
  },

  // Artifacts
  artifactConfigs: [],
  playerArtifacts: {},

  addArtifactConfig: (config) =>
    set((s) => ({ artifactConfigs: [...s.artifactConfigs, config] })),

  removeArtifactConfig: (id) =>
    set((s) => ({ artifactConfigs: s.artifactConfigs.filter((c) => c.id !== id) })),

  applyArtifactToPlayer: (playerId, boosts) => {
    const state = get();
    const newArtifacts = { ...state.playerArtifacts, [playerId]: boosts };
    set({ playerArtifacts: newArtifacts });

    const scale = RATINGS_SCALES[state.settings.currentRatingsScale as keyof typeof RATINGS_SCALES] || RATINGS_SCALES['20_80'];
    const updatedPlayers = state.ptPlayers.map((p) => {
      if (p.id === playerId) {
        return applyArtifacts(p, boosts, scale, PT27_META_PROFILE);
      }
      return p;
    });
    set({ ptPlayers: updatedPlayers });
  },

  clearPlayerArtifacts: (playerId) => {
    const state = get();
    const newArtifacts = { ...state.playerArtifacts };
    delete newArtifacts[playerId];
    set({ playerArtifacts: newArtifacts });

    const scale = RATINGS_SCALES[state.settings.currentRatingsScale as keyof typeof RATINGS_SCALES] || RATINGS_SCALES['20_80'];
    const updatedPlayers = state.ptPlayers.map((p) => {
      if (p.id === playerId) {
        return applyArtifacts(p, [], scale, PT27_META_PROFILE);
      }
      return p;
    });
    set({ ptPlayers: updatedPlayers });
  },

  // Tournament
  tournamentConfig: { ovrCap: 79, tierFilter: ['Silver'], prioritizeArtifacts: true },
  tournamentLineup: null,

  updateTournamentConfig: (partial) =>
    set((s) => ({ tournamentConfig: { ...s.tournamentConfig, ...partial } })),

  generateTournamentLineup: () => {
    const state = get();
    const lineup = generateTournamentLineup(state.ptPlayers, state.tournamentConfig, state.settings);
    set({ tournamentLineup: lineup });
  },

  // ============================================================
  // Season Snapshots (Franchise)
  // ============================================================
  seasons: [],
  saveCurrentAsSeason: (label) => {
    const state = get();
    if (state.players.length === 0) return;
    const snapshot: SeasonSnapshot = {
      label,
      players: JSON.parse(JSON.stringify(state.players)),
      savedAt: Date.now(),
    };
    set((s) => ({
      seasons: [...s.seasons.slice(-1), snapshot].slice(0, 2), // keep max 2
    }));
  },
  deleteSeason: (index) =>
    set((s) => ({ seasons: s.seasons.filter((_, i) => i !== index) })),
  clearSeasons: () => set({ seasons: [] }),
}));
