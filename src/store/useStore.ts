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
import { mergeDumpData } from '../utils/dumpMerger';

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
  loadDumpFolder: (files: FileList) => Promise<void>;
  dumpFilterTeamId: number | undefined;
  setDumpFilterTeamId: (teamId: number | undefined) => void;
  dumpTeams: { id: number; name: string; abbr: string }[];
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
  // Dump Folder Import
  // ============================================================
  importMode: 'manual' as ImportMode,
  setImportMode: (mode) => set({ importMode: mode }),
  dumpFiles: [],
  dumpProgress: null,
  dumpFilterTeamId: undefined,
  setDumpFilterTeamId: (teamId) => {
    set({ dumpFilterTeamId: teamId });
    // Re-merge if we have dump data
    const state = get();
    if (state.dumpFiles.length > 0) {
      // Trigger a rebuild using stored raw dump data
      void state.loadDumpFolder(null as unknown as FileList); // will use cached data
    }
  },
  dumpTeams: [],

  loadDumpFolder: async (files: FileList) => {
    const state = get();

    // If files is null, re-merge from already-parsed data using _cachedDumpData
    if (!files && !(globalThis as any).__cachedDumpData) return;

    let parsedData: ParsedDumpData;

    if (files) {
      // Read files and detect dump types
      const fileArray = Array.from(files);
      const csvFiles = fileArray.filter((f) => f.name.endsWith('.csv'));
      const recognized: { file: File; type: DumpFileType; tier: 1 | 2; label: string }[] = [];

      for (const file of csvFiles) {
        // Extract just the filename (handle both paths and direct names)
        const baseName = file.name.split('/').pop()!.split('\\').pop()!;
        const info = DUMP_FILE_MAP[baseName];
        if (info) recognized.push({ file, type: info.type, tier: info.tier, label: info.label });
      }

      if (recognized.length === 0) return;

      set({
        dumpProgress: { total: recognized.length, loaded: 0, currentFile: '' },
        dumpFiles: recognized.map((r) => ({
          type: r.type, fileName: r.file.name, rowCount: 0, loaded: false, tier: r.tier,
        })),
      });

      // Read all files
      const fileTexts = new Map<DumpFileType, string>();
      for (let i = 0; i < recognized.length; i++) {
        const r = recognized[i];
        set({ dumpProgress: { total: recognized.length, loaded: i, currentFile: r.label } });
        const text = await r.file.text();
        fileTexts.set(r.type, text);
      }

      set({ dumpProgress: { total: recognized.length, loaded: recognized.length, currentFile: 'Merging data...' } });

      // Parse each file type
      parsedData = {
        players: fileTexts.has('dump_players') ? parseDumpPlayers(fileTexts.get('dump_players')!) : new Map(),
        battingRatings: fileTexts.has('dump_players_batting') ? parseDumpBattingRatings(fileTexts.get('dump_players_batting')!) : new Map(),
        pitchingRatings: fileTexts.has('dump_players_pitching') ? parseDumpPitchingRatings(fileTexts.get('dump_players_pitching')!) : new Map(),
        fieldingRatings: fileTexts.has('dump_players_fielding') ? parseDumpFieldingRatings(fileTexts.get('dump_players_fielding')!) : new Map(),
        playerValues: fileTexts.has('dump_players_value') ? parseDumpPlayerValues(fileTexts.get('dump_players_value')!) : new Map(),
        careerBatting: fileTexts.has('dump_career_batting') ? parseDumpCareerBatting(fileTexts.get('dump_career_batting')!) : [],
        careerPitching: fileTexts.has('dump_career_pitching') ? parseDumpCareerPitching(fileTexts.get('dump_career_pitching')!) : [],
        careerFielding: fileTexts.has('dump_career_fielding') ? parseDumpCareerFielding(fileTexts.get('dump_career_fielding')!) : [],
        rosterStatus: fileTexts.has('dump_roster_status') ? parseDumpRosterStatus(fileTexts.get('dump_roster_status')!) : new Map(),
        contracts: fileTexts.has('dump_contract') ? parseDumpContracts(fileTexts.get('dump_contract')!) : new Map(),
        teamRoster: fileTexts.has('dump_team_roster') ? parseDumpTeamRoster(fileTexts.get('dump_team_roster')!) : [],
        teams: fileTexts.has('dump_teams') ? parseDumpTeams(fileTexts.get('dump_teams')!) : new Map(),
        parks: fileTexts.has('dump_parks') ? parseDumpParks(fileTexts.get('dump_parks')!) : new Map(),
        atBatStats: fileTexts.has('dump_at_bat_stats') ? parseDumpAtBatStats(fileTexts.get('dump_at_bat_stats')!) : new Map(),
      };

      // Cache for re-merge
      (globalThis as any).__cachedDumpData = parsedData;

      // Build team list for UI dropdown
      const dumpTeams: { id: number; name: string; abbr: string }[] = [];
      for (const [id, team] of parsedData.teams) {
        if (team.level === 1) { // MLB level only
          dumpTeams.push({ id, name: `${team.name} ${team.nickname}`.trim(), abbr: team.abbr });
        }
      }
      dumpTeams.sort((a, b) => a.name.localeCompare(b.name));
      set({ dumpTeams });

      // Update dumpFiles status
      const updatedDumpFiles = recognized.map((r) => {
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
    } else {
      parsedData = (globalThis as any).__cachedDumpData as ParsedDumpData;
    }

    // Merge into Player[]
    const filterTeamId = get().dumpFilterTeamId;
    const merged = mergeDumpData(parsedData, filterTeamId);
    const scored = scoreAllPlayers(merged, state.settings);
    const withPercentiles = calcPercentiles(scored);

    set({
      players: withPercentiles,
      dumpProgress: null,
      importMode: 'dump',
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
