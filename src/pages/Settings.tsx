import { useStore } from '../store/useStore';
import { RotateCcw } from 'lucide-react';
import { DEFAULT_SETTINGS, RATINGS_SCALES } from '../types';
import type { RatingsScale } from '../types';

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-xs font-mono text-brand-400">{value.toFixed(2)}</span>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
      />
    </div>
  );
}

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={() => updateSettings(DEFAULT_SETTINGS)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Defaults
        </button>
      </div>

      {/* General */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300">General</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Dark Mode</p>
            <p className="text-xs text-gray-500">Toggle dark/light theme</p>
          </div>
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.darkMode ? 'bg-brand-500' : 'bg-gray-600'
            } relative`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                settings.darkMode ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Use Designated Hitter</p>
            <p className="text-xs text-gray-500">Include DH slot in lineups</p>
          </div>
          <button
            onClick={() => updateSettings({ useDH: !settings.useDH })}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.useDH ? 'bg-brand-500' : 'bg-gray-600'
            } relative`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                settings.useDH ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Allow Out-of-Position</p>
            <p className="text-xs text-gray-500">Let optimizer place players at non-eligible positions</p>
          </div>
          <button
            onClick={() => updateSettings({ allowOutOfPosition: !settings.allowOutOfPosition })}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.allowOutOfPosition ? 'bg-brand-500' : 'bg-gray-600'
            } relative`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                settings.allowOutOfPosition ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-sm text-gray-300">Recommended Pitcher Count</label>
          <input
            type="number"
            min={8}
            max={15}
            value={settings.rosterPitcherCount}
            onChange={(e) => updateSettings({ rosterPitcherCount: parseInt(e.target.value) || 13 })}
            className="ml-3 w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
      </div>

      {/* Ratings Scales */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300">Ratings Scales</h2>
        <p className="text-xs text-gray-500">
          Match these to your OOTP game settings so ratings display and scoring calculate correctly.
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Current Ratings Scale</p>
            <p className="text-xs text-gray-500">Scale used for current ability ratings</p>
          </div>
          <select
            value={settings.currentRatingsScale}
            onChange={(e) => updateSettings({ currentRatingsScale: e.target.value as RatingsScale })}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            {Object.entries(RATINGS_SCALES).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Potential Ratings Scale</p>
            <p className="text-xs text-gray-500">Scale used for potential ability ratings</p>
          </div>
          <select
            value={settings.potentialRatingsScale}
            onChange={(e) => updateSettings({ potentialRatingsScale: e.target.value as RatingsScale })}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            {Object.entries(RATINGS_SCALES).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scoring Weights */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300">Scoring Weights</h2>
        <p className="text-xs text-gray-500">
          Adjust how the optimizer weighs different factors when calculating player scores and generating lineups.
        </p>

        <Slider
          label="Offensive Weight"
          value={settings.offensiveWeight}
          onChange={(v) => updateSettings({ offensiveWeight: v })}
          description="How much offense matters in overall lineup fit (vs defense)"
        />
        <Slider
          label="Defensive Weight"
          value={settings.defensiveWeight}
          onChange={(v) => updateSettings({ defensiveWeight: v })}
          description="How much defense matters in overall lineup fit"
        />
        <Slider
          label="Ratings Weight"
          value={settings.ratingsWeight}
          onChange={(v) => updateSettings({ ratingsWeight: v })}
          description="How much OOTP ratings matter vs real stats (when both are available)"
        />
        <Slider
          label="Stats Weight"
          value={settings.statsWeight}
          onChange={(v) => updateSettings({ statsWeight: v })}
          description="How much real stats matter vs ratings"
        />
        <Slider
          label="Versatility Weight"
          value={settings.versatilityWeight}
          onChange={(v) => updateSettings({ versatilityWeight: v })}
          description="Bonus for positional flexibility"
        />
        <Slider
          label="Out-of-Position Penalty"
          value={settings.outOfPositionPenalty}
          onChange={(v) => updateSettings({ outOfPositionPenalty: v })}
          description="Score penalty when playing a player out of their natural position"
        />
      </div>

      {/* Score Formulas */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">How Scores Are Calculated</h2>
        <div className="text-xs text-gray-400 space-y-2">
          <p>
            <strong className="text-gray-300">Offensive Score (0-100):</strong> Ratings: CON (20%), POW (20%),
            EYE (20%), GAP (15%), SPE (10%), STE (5%), BABIP (10%).
            <strong className="text-blue-400"> With Advanced Stats:</strong> wRC+ (30%), wOBA (25%), WAR (20%),
            wRAA (15%), UBR (5%), wSB (5%). Both are blended using Ratings/Stats weight ratio.
          </p>
          <p>
            <strong className="text-gray-300">Pitching Score (0-100):</strong> Ratings: STU (30%), MOV (25%), CON (20%),
            HRA (10%), PBABIP (10%), HLD (5%).
            <strong className="text-blue-400"> With Advanced Stats:</strong> K-BB% (20%), SIERA (15%), FIP- (15%),
            ERA (10%), WAR+rWAR avg (20%), WPA (10%), K% (10%).
          </p>
          <p>
            <strong className="text-gray-300">Starter Score:</strong> Ratings-based + QS% bonus (up to +15 pts).
          </p>
          <p>
            <strong className="text-gray-300">Reliever Score:</strong> Ratings-based + SD/MD ratio adjustment +
            IRS% bonus + high-leverage (pLi) bonus.
          </p>
          <p>
            <strong className="text-gray-300">Defensive Score (0-100):</strong> Position-dependent.
            C: ABI + ARM. IF: RNG, ERR, ARM, TDP. OF: RNG, ERR, ARM.
          </p>
          <p>
            <strong className="text-gray-300">Hitter Archetypes:</strong> Patient Slugger (BB%+wOBA+ISO),
            OBP Machine (OBP+BB%, no power), Contact Hitter (AVG+low K%),
            Power Masher (SLG+ISO+high K), Run Producer (RBI+WPA+SLG),
            Speed Threat (SB+SPE), Empty Average (AVG-SLG), Balanced, Bench Bat.
          </p>
          <p>
            <strong className="text-gray-300">Pitcher Archetypes:</strong> Ace (K-BB%&ge;20+FIP&le;3),
            No.2/3 (K-BB%&ge;15 or FIP&le;3.5+QS%), Innings Eater (high IP+decent ERA),
            Back-End (command+durability), Setup/Closer (K%+K-BB%),
            Fireman (high pLi+low IRS%), Middle Reliever, Mop-Up.
          </p>
        </div>
      </div>
    </div>
  );
}
