import { useStore } from '../../store/useStore';
import { PT27_META_PROFILE, CLASSIC_PROFILE } from '../../utils/scoringProfiles';
import type { ScoringProfile } from '../../types';

function WeightRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-300 w-28">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-purple-400 w-10 text-right">{pct}%</span>
    </div>
  );
}

function ProfileSection({ profile, title }: { profile: ScoringProfile; title: string }) {
  const ow = profile.offensiveWeights;
  const dw = profile.defensiveWeights;
  const pw = profile.pitchingWeights;
  const rw = profile.relieverWeights;

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-xs text-gray-500 mt-1">{profile.description}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Batting Weights</h3>
        <WeightRow label="Eye" value={ow.eye} />
        <WeightRow label="Contact" value={ow.con} />
        <WeightRow label="Power" value={ow.pow} />
        <WeightRow label="Gap" value={ow.gap} />
        <WeightRow label="Speed" value={ow.spe} />
        <WeightRow label="Steal" value={ow.ste} />
        <WeightRow label="BABIP" value={ow.babip} />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Defensive Weights</h3>
        <p className="text-[10px] text-gray-500">Catcher</p>
        <WeightRow label="C Ability" value={dw.catcher.cAbi} />
        <WeightRow label="C Arm" value={dw.catcher.cArm} />
        <p className="text-[10px] text-gray-500 mt-2">Infield</p>
        <WeightRow label="IF Range" value={dw.infield.ifRng} />
        <WeightRow label="IF Error" value={dw.infield.ifErr} />
        <WeightRow label="IF Arm" value={dw.infield.ifArm} />
        <WeightRow label="Turn DP" value={dw.infield.tdp} />
        <p className="text-[10px] text-gray-500 mt-2">Outfield</p>
        <WeightRow label="OF Range" value={dw.outfield.ofRng} />
        <WeightRow label="OF Error" value={dw.outfield.ofErr} />
        <WeightRow label="OF Arm" value={dw.outfield.ofArm} />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">SP Pitching</h3>
        <WeightRow label="Stuff" value={pw.stu} />
        <WeightRow label="Movement" value={pw.mov} />
        <WeightRow label="Control" value={pw.con} />
        <WeightRow label="HR Allow" value={pw.hra} />
        <WeightRow label="PBABIP" value={pw.pbabip} />
        <WeightRow label="Hold" value={pw.hld} />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">RP Pitching</h3>
        <WeightRow label="Stuff" value={rw.stu} />
        <WeightRow label="Movement" value={rw.mov} />
        <WeightRow label="Control" value={rw.con} />
        <WeightRow label="Hold" value={rw.hld} />
        <WeightRow label="HR Allow" value={rw.hra} />
        <WeightRow label="PBABIP" value={rw.pbabip} />
      </div>
    </div>
  );
}

export default function PTSettings() {
  const artifactConfigs = useStore((s) => s.artifactConfigs);
  const removeArtifactConfig = useStore((s) => s.removeArtifactConfig);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Perfect Team Settings</h1>

      {/* Meta weights comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileSection profile={PT27_META_PROFILE} title="PT27 Meta Weights (Active)" />
        <ProfileSection profile={CLASSIC_PROFILE} title="Classic Weights (Reference)" />
      </div>

      {/* Key differences */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">PT27 Meta Key Insights</h2>
        <div className="text-xs text-gray-400 space-y-2">
          <p>
            <strong className="text-purple-400">Batting:</strong> Eye (28%) + Contact (25%) = 53% of batting value.
            Power drops to just 12%. The OOTP 27 sim engine rewards plate discipline far more than raw power at competitive tiers.
          </p>
          <p>
            <strong className="text-purple-400">Pitching:</strong> Starters live on Stuff+Movement (70% combined).
            Control is nearly ignorable at 8% — if STU and MOV are elite, command doesn't matter much.
            Relievers are even more extreme: Stuff alone is 45% of their value.
          </p>
          <p>
            <strong className="text-purple-400">Defense:</strong> Catcher Ability jumps from 50% to 65%.
            Range up the middle (SS, 2B, CF) goes from 35-40% to 50%. Position importance for C, SS, CF all increase.
          </p>
        </div>
      </div>

      {/* Artifact presets */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Saved Artifact Presets</h2>
        {artifactConfigs.length === 0 ? (
          <p className="text-xs text-gray-500">
            No presets saved. Apply artifacts to a card in the Sleepers page and save them as a preset.
          </p>
        ) : (
          <div className="space-y-2">
            {artifactConfigs.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-white">{config.name}</p>
                  <p className="text-[10px] text-gray-500">
                    {config.boosts.map((b) => `${b.attribute} +${b.boost}`).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => removeArtifactConfig(config.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
