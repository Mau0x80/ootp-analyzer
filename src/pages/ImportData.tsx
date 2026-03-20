import { useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, FolderOpen, Database } from 'lucide-react';
import type { CsvFileType, ImportMode } from '../types';
import { DUMP_FILE_MAP } from '../types';

const TYPE_LABELS: Record<CsvFileType, string> = {
  batting_ratings: 'Batting Ratings',
  pitching_ratings: 'Pitching Ratings',
  fielding_ratings: 'Fielding Ratings',
  position_ratings: 'Position Ratings',
  batting_stats: 'Batting Stats (Basic)',
  pitching_stats: 'Pitching Stats (Basic)',
  batting_super_stats: 'Batting Stats (Advanced)',
  pitching_super_stats: 'Pitching Stats (Advanced)',
};

// ============================================================
// Manual CSV Import (existing)
// ============================================================

function ManualImport() {
  const loadCsvFile = useStore((s) => s.loadCsvFile);
  const csvFiles = useStore((s) => s.csvFiles);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newErrors: string[] = [];
      Array.from(files).forEach((file) => {
        if (!file.name.endsWith('.csv')) {
          newErrors.push(`"${file.name}" is not a CSV file.`);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const result = loadCsvFile(file.name, text);
          if (!result.success) {
            setErrors((prev) => [...prev, result.error || `Failed to load ${file.name}`]);
          }
        };
        reader.readAsText(file);
      });
      if (newErrors.length > 0) setErrors((prev) => [...prev, ...newErrors]);
    },
    [loadCsvFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const allTypes = Object.keys(TYPE_LABELS) as CsvFileType[];
  const loadedTypes = new Set(csvFiles.map((f) => f.type));

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragOver ? 'border-brand-500 bg-brand-500/10' : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <Upload className="w-10 h-10 mx-auto text-gray-500 mb-3" />
        <p className="text-lg font-medium text-gray-300">Drag & drop CSV files here</p>
        <p className="text-xs text-gray-500 mt-1">Individual OOTP CSV exports (ratings, stats)</p>
        <label className="mt-3 inline-block">
          <input type="file" multiple accept=".csv" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
          <span className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium cursor-pointer">
            Browse Files
          </span>
        </label>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Expected CSV Files</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allTypes.map((type) => {
            const loaded = loadedTypes.has(type);
            const fileInfo = csvFiles.find((f) => f.type === type);
            return (
              <div key={type} className={`flex items-center gap-3 p-3 rounded-lg border ${
                loaded ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-gray-700 bg-gray-800/50'
              }`}>
                {loaded
                  ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  : <FileText className="w-5 h-5 text-gray-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${loaded ? 'text-emerald-300' : 'text-gray-400'}`}>
                    {TYPE_LABELS[type]}
                  </p>
                  {fileInfo && <p className="text-xs text-gray-500 truncate">{fileInfo.fileName} ({fileInfo.rowCount} rows)</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="card p-4 border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Errors</h3>
          </div>
          {errors.map((err, i) => <p key={i} className="text-xs text-red-300">{err}</p>)}
          <button onClick={() => setErrors([])} className="text-xs text-gray-500 hover:text-gray-300 mt-2">Clear errors</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Dump Folder Import (new)
// ============================================================

function DumpFolderImport() {
  const scanDumpFolder = useStore((s) => s.scanDumpFolder);
  const dumpFiles = useStore((s) => s.dumpFiles);
  const dumpProgress = useStore((s) => s.dumpProgress);
  const dumpTeams = useStore((s) => s.dumpTeams);
  const dumpFilterTeamId = useStore((s) => s.dumpFilterTeamId);
  const setDumpFilterTeamId = useStore((s) => s.setDumpFilterTeamId);
  const playerCount = useStore((s) => s.players.length);
  const [dragOver, setDragOver] = useState(false);

  const handleFolder = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      void scanDumpFolder(files);
    },
    [scanDumpFolder]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const fileList: File[] = [];
        let pending = items.length;
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.();
          if (entry && entry.isDirectory) {
            const reader = (entry as any).createReader();
            reader.readEntries((entries: any[]) => {
              for (const ent of entries) {
                if (ent.isFile) {
                  ent.file((f: File) => {
                    fileList.push(f);
                    pending--;
                    if (pending <= 0) {
                      const dt = new DataTransfer();
                      fileList.forEach((fl) => dt.items.add(fl));
                      void scanDumpFolder(dt.files);
                    }
                  });
                } else {
                  pending--;
                }
              }
            });
          } else {
            const file = items[i].getAsFile();
            if (file) fileList.push(file);
            pending--;
          }
        }
        if (pending <= 0 && fileList.length > 0) {
          const dt = new DataTransfer();
          fileList.forEach((fl) => dt.items.add(fl));
          void scanDumpFolder(dt.files);
        }
      } else {
        handleFolder(e.dataTransfer.files);
      }
    },
    [scanDumpFolder, handleFolder]
  );

  const allDumpFiles = Object.entries(DUMP_FILE_MAP);
  const loadedTypes = new Set(dumpFiles.filter((f) => f.loaded).map((f) => f.type));

  const tier1Files = allDumpFiles.filter(([, info]) => info.tier === 1);
  const tier2Files = allDumpFiles.filter(([, info]) => info.tier === 2);

  const folderScanned = dumpTeams.length > 0;
  const isLoading = dumpProgress !== null;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <FolderOpen className="w-10 h-10 mx-auto text-blue-400 mb-3" />
        <p className="text-lg font-medium text-gray-300">
          {folderScanned ? 'Dump folder loaded — select a team below' : 'Drop your OOTP dump folder here'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Or select the dump folder from your OOTP saved game
        </p>
        <label className="mt-3 inline-block">
          <input
            type="file"
            multiple
            accept=".csv"
            {...({ webkitdirectory: '', directory: '' } as any)}
            onChange={(e) => handleFolder(e.target.files)}
            className="hidden"
          />
          <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium cursor-pointer">
            {folderScanned ? 'Change Folder' : 'Select Dump Folder'}
          </span>
        </label>
      </div>

      {/* Progress */}
      {isLoading && (
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <div className="flex-1">
              <p className="text-sm text-gray-300">{dumpProgress.currentFile}</p>
              <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(dumpProgress.loaded / dumpProgress.total) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500">{dumpProgress.loaded}/{dumpProgress.total}</span>
          </div>
        </div>
      )}

      {/* Team selector — required step before loading data */}
      {folderScanned && (
        <div className="card p-5 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-300">Select Your Team</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Choose your MLB team to load its roster and minor league affiliates
              </p>
            </div>
            <select
              value={dumpFilterTeamId ?? ''}
              onChange={(e) => setDumpFilterTeamId(e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isLoading}
              className="px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white min-w-[260px] disabled:opacity-50"
            >
              <option value="">-- Select a team --</option>
              {dumpTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.abbr} — {t.name}</option>
              ))}
            </select>
          </div>
          {dumpFilterTeamId !== undefined && playerCount > 0 && !isLoading && (
            <p className="text-xs text-emerald-400 mt-2">
              {playerCount} players loaded for this organization
            </p>
          )}
        </div>
      )}

      {/* File status grids — only show after data is loaded */}
      {dumpFiles.some((f) => f.loaded) && (
        <>
          {/* File status - Tier 1 */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              <span className="text-emerald-400">Tier 1</span> — Essential Files
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tier1Files.map(([fileName, info]) => {
                const loaded = loadedTypes.has(info.type);
                const fInfo = dumpFiles.find((f) => f.type === info.type);
                return (
                  <div key={fileName} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    loaded ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-gray-700 bg-gray-800/50'
                  }`}>
                    {loaded
                      ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      : <FileText className="w-5 h-5 text-gray-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${loaded ? 'text-emerald-300' : 'text-gray-400'}`}>
                        {info.label}
                      </p>
                      <p className="text-[10px] text-gray-600">{fileName}</p>
                      {fInfo && fInfo.loaded && (
                        <p className="text-xs text-gray-500">{fInfo.rowCount.toLocaleString()} records</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File status - Tier 2 */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              <span className="text-blue-400">Tier 2</span> — High Value Files
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tier2Files.map(([fileName, info]) => {
                const loaded = loadedTypes.has(info.type);
                const fInfo = dumpFiles.find((f) => f.type === info.type);
                return (
                  <div key={fileName} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    loaded ? 'border-blue-500/30 bg-blue-500/10' : 'border-gray-700 bg-gray-800/50'
                  }`}>
                    {loaded
                      ? <CheckCircle className="w-5 h-5 text-blue-400 shrink-0" />
                      : <FileText className="w-5 h-5 text-gray-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${loaded ? 'text-blue-300' : 'text-gray-400'}`}>
                        {info.label}
                      </p>
                      <p className="text-[10px] text-gray-600">{fileName}</p>
                      {fInfo && fInfo.loaded && (
                        <p className="text-xs text-gray-500">{fInfo.rowCount.toLocaleString()} records</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Detected files count before team selection */}
      {folderScanned && !dumpFiles.some((f) => f.loaded) && (
        <div className="card p-4">
          <p className="text-sm text-gray-400">
            {dumpFiles.length} dump files detected. Select a team above to begin loading data.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Import Page
// ============================================================

export default function ImportData() {
  const importMode = useStore((s) => s.importMode);
  const setImportMode = useStore((s) => s.setImportMode);
  const playerCount = useStore((s) => s.players.length);
  const resetData = useStore((s) => s.resetData);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Data</h1>
        <p className="text-gray-500 mt-1">Upload your OOTP data to get started.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setImportMode('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            importMode === 'manual'
              ? 'bg-brand-500/15 text-brand-400 border border-brand-500/40'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          Manual CSV Import
        </button>
        <button
          onClick={() => setImportMode('dump')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            importMode === 'dump'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/40'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
          }`}
        >
          <Database className="w-4 h-4" />
          OOTP Dump Folder
        </button>
      </div>

      {/* Description */}
      {importMode === 'dump' && (
        <div className="card p-4 border-blue-500/20">
          <p className="text-sm text-gray-300">
            Import directly from an OOTP database dump folder. This provides much richer data including
            personality, talent ratings, zone rating, park factors, contracts, Statcast data, and more.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            To generate a dump: In OOTP, go to <strong>Commissioner &gt; Data Dump</strong> and export to CSV.
          </p>
        </div>
      )}

      {/* Import content */}
      {importMode === 'manual' ? <ManualImport /> : <DumpFolderImport />}

      {/* Summary */}
      {playerCount > 0 && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">
              {playerCount} players loaded
            </p>
            <p className="text-xs text-gray-500">Data has been merged and scored automatically.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium"
            >
              View Dashboard
            </button>
            <button
              onClick={resetData}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
