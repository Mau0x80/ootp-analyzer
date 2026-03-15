import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../../store/useStore';
import { RATINGS_SCALES } from '../../types';
import type { Player } from '../../types';
import { normRating } from '../../utils/scoringEngine';

interface Props {
  player: Player;
}

export default function PlayerRadarChart({ player }: Props) {
  const scale = useStore((s) => RATINGS_SCALES[s.settings.currentRatingsScale]);

  const isBatter = player.isPositionPlayer || player.isTwoWay;
  const isPitcher = player.isPitcher;

  const batterData =
    isBatter && player.battingRatings
      ? [
          { axis: 'Offense', value: player.scores.offensiveScore },
          { axis: 'Defense', value: player.scores.defensiveScore },
          { axis: 'Speed', value: normRating(player.battingRatings.spe, scale) },
          { axis: 'Eye', value: normRating(player.battingRatings.eye, scale) },
          { axis: 'Power', value: normRating(player.battingRatings.pow, scale) },
        ]
      : null;

  const pitcherData =
    isPitcher && player.pitchingRatings
      ? [
          { axis: 'Stuff', value: normRating(player.pitchingRatings.stu, scale) },
          { axis: 'Movement', value: normRating(player.pitchingRatings.mov, scale) },
          { axis: 'Control', value: normRating(player.pitchingRatings.con, scale) },
          { axis: 'Stamina', value: Math.min(100, player.pitchingRatings.stm) },
          { axis: 'Hold', value: normRating(player.pitchingRatings.hld, scale) },
        ]
      : null;

  if (!batterData && !pitcherData) return null;

  const twoWide = batterData && pitcherData;

  return (
    <div className={`grid ${twoWide ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
      {batterData && (
        <div>
          <p className="text-[10px] text-center text-gray-500 uppercase tracking-wide mb-1">Hitting Profile</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={batterData} outerRadius="75%">
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
      {pitcherData && (
        <div>
          <p className="text-[10px] text-center text-gray-500 uppercase tracking-wide mb-1">Pitching Profile</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={pitcherData} outerRadius="75%">
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
