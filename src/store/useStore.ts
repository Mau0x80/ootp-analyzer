import { create } from 'zustand';
import type { Player, AppTab, AppSettings, CsvFileInfo, CsvFileType, Lineup, PitchingStaff, SeasonSnapshot } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import {
  parseCsvText, detectCsvType, extractPlayerBase,
  parseBattingRatings, parsePitchingRatings, parseFieldingRatings,
  parsePositionRatings, parseBattingStats, parsePitchingStats,
} from '../utils/csvParser';
import { mergePlayers } from '../utils/playerMerger';
import { scoreAllPlayers } from '../utils/scoringEngine';
import { calcPercentiles } from '../utils/percentileEngine';
import { generateLineup, generatePitchingStaff } from '../utils/lineupOptimizer';

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
