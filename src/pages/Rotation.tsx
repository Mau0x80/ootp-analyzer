import { useStore } from '../store/useStore';
import ScoreBadge from '../components/common/ScoreBadge';
import RatingBar from '../components/common/RatingBar';
import type { Player } from '../types';

function PitcherCard({ player, role, onClick }: { player: Player; role: string; onClick: () => void }) {
  const pr = player.pitchingRatings;
  const ps = player.pitchingStats;

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer border border-gray-700/50 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{player.name}</p>
          <p className="text-xs text-gray-500">
            #{player.number} | T:{player.throws} | Age {player.age} | {role}
          </p>
        </div>
        <ScoreBadge score={player.scores.pitchingScore} size="sm" />
      </div>

      {pr && (
        <div className="grid grid-cols-2 gap-1">
          <RatingBar label="STU" value={pr.stu} />
          <RatingBar label="MOV" value={pr.mov} />
          <RatingBar label="CON" value={pr.con} />
          <RatingBar label="STM" value={pr.stm} max={100} />
        </div>
      )}

      {ps && ps.ip > 0 && (
        <div className="flex gap-3 text-xs text-gray-400">
          <span>ERA {ps.era.toFixed(2)}</span>
          <span>FIP {ps.fip.toFixed(2)}</span>
          <span>WHIP {ps.whip.toFixed(2)}</span>
          <span>K/9 {ps.k9.toFixed(1)}</span>
          <span>{ps.ip.toFixed(1)} IP</span>
        </div>
      )}

      {pr && (
        <p className="text-[10px] text-gray-500">
          VELO: {pr.velo} | G/F: {pr.gf} | STU vL: {pr.stuVL} / vR: {pr.stuVR}
        </p>
      )}
    </div>
  );
}

export default function Rotation() {
  const pitchingStaff = useStore((s) => s.pitchingStaff);
  const players = useStore((s) => s.players);
  const setSelectedPlayer = useStore((s) => s.setSelectedPlayer);

  if (!pitchingStaff || players.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No pitching data. Import CSV files first.</p>
      </div>
    );
  }

  const { rotation, closer, setupMen, middleRelievers, longReliever } = pitchingStaff;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rotation & Bullpen</h1>

      {/* Rotation */}
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Starting Rotation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rotation.map((p, i) => (
            <PitcherCard key={p.id} player={p} role={`SP${i + 1}`} onClick={() => setSelectedPlayer(p.id)} />
          ))}
          {rotation.length === 0 && <p className="text-sm text-gray-500">No starters available</p>}
        </div>
      </div>

      {/* Closer */}
      {closer && (
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Closer
          </h2>
          <div className="max-w-md">
            <PitcherCard player={closer} role="CL" onClick={() => setSelectedPlayer(closer.id)} />
          </div>
        </div>
      )}

      {/* Setup */}
      {setupMen.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Setup Men
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {setupMen.map((p) => (
              <PitcherCard key={p.id} player={p} role="SU" onClick={() => setSelectedPlayer(p.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Long Reliever */}
      {longReliever && (
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Long Reliever
          </h2>
          <div className="max-w-md">
            <PitcherCard player={longReliever} role="LR" onClick={() => setSelectedPlayer(longReliever.id)} />
          </div>
        </div>
      )}

      {/* Middle Relievers */}
      {middleRelievers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            Middle Relievers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {middleRelievers.map((p) => (
              <PitcherCard key={p.id} player={p} role="MR" onClick={() => setSelectedPlayer(p.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
