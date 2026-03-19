import { useCallback, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export default function PTImport() {
  const ptCsvFiles = useStore((s) => s.ptCsvFiles);
  const ptLoadCsvFile = useStore((s) => s.ptLoadCsvFile);
  const ptResetData = useStore((s) => s.ptResetData);
  const ptPlayers = useStore((s) => s.ptPlayers);
  const [dragOver, setDragOver] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (files: FileList) => {
      setLastError(null);
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const result = ptLoadCsvFile(file.name, text);
          if (!result.success && result.error) {
            setLastError(result.error);
          }
        };
        reader.readAsText(file);
      });
    },
    [ptLoadCsvFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Cards</h1>
        <p className="text-sm text-gray-400 mt-1">
          Import CSV files exported from OOTP Perfect Team. Same format as franchise mode exports.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-purple-400 bg-purple-500/5' : 'border-gray-700 hover:border-gray-500'
        }`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = '.csv';
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFiles(files);
          };
          input.click();
        }}
      >
        <Upload className="w-10 h-10 mx-auto text-gray-500 mb-3" />
        <p className="text-gray-300 font-medium">Drop CSV files here or click to browse</p>
        <p className="text-xs text-gray-500 mt-2">
          Supports: Batting Ratings, Pitching Ratings, Fielding Ratings, Position Ratings, Stats
        </p>
      </div>

      {lastError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {lastError}
        </div>
      )}

      {/* Loaded files */}
      {ptCsvFiles.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Loaded Files</h2>
            <button
              onClick={ptResetData}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {ptCsvFiles.map((f) => (
              <div
                key={f.type}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <FileText className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{f.fileName}</p>
                  <p className="text-xs text-gray-500">{f.type.replace(/_/g, ' ')} — {f.rowCount} rows</p>
                </div>
              </div>
            ))}
          </div>
          {ptPlayers.length > 0 && (
            <p className="text-xs text-purple-400 font-medium">
              {ptPlayers.length} cards merged and scored with PT27 meta weights.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
