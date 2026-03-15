import { useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import type { CsvFileType } from '../types';

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

export default function ImportData() {
  const loadCsvFile = useStore((s) => s.loadCsvFile);
  const csvFiles = useStore((s) => s.csvFiles);
  const playerCount = useStore((s) => s.players.length);
  const resetData = useStore((s) => s.resetData);
  const setActiveTab = useStore((s) => s.setActiveTab);
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

      if (newErrors.length > 0) {
        setErrors((prev) => [...prev, ...newErrors]);
      }
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Data</h1>
        <p className="text-gray-500 mt-1">Upload your OOTP CSV exports to get started.</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragOver
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-500 mb-4" />
        <p className="text-lg font-medium text-gray-300">Drag & drop CSV files here</p>
        <p className="text-sm text-gray-500 mt-1">or click to browse</p>
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ position: 'relative' }}
        />
        <label className="mt-4 inline-block">
          <input
            type="file"
            multiple
            accept=".csv"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <span className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors">
            Browse Files
          </span>
        </label>
      </div>

      {/* File status */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Expected CSV Files</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allTypes.map((type) => {
            const loaded = loadedTypes.has(type);
            const fileInfo = csvFiles.find((f) => f.type === type);
            return (
              <div
                key={type}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  loaded
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                {loaded ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${loaded ? 'text-emerald-300' : 'text-gray-400'}`}>
                    {TYPE_LABELS[type]}
                  </p>
                  {fileInfo && (
                    <p className="text-xs text-gray-500 truncate">
                      {fileInfo.fileName} ({fileInfo.rowCount} rows)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="card p-4 border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Errors</h3>
          </div>
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-300">{err}</p>
          ))}
          <button
            onClick={() => setErrors([])}
            className="text-xs text-gray-500 hover:text-gray-300 mt-2"
          >
            Clear errors
          </button>
        </div>
      )}

      {/* Summary */}
      {playerCount > 0 && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">
              {playerCount} players loaded from {csvFiles.length} CSV file(s)
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
