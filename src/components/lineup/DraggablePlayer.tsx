import type { Player } from '../../types';
import ScoreBadge from '../common/ScoreBadge';

interface Props {
  player: Player;
  onClick?: () => void;
}

export default function DraggablePlayer({ player, onClick }: Props) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', player.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onClick}
      className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-700 transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{player.name}</p>
          <p className="text-[10px] text-gray-500">
            {player.eligiblePositions.join('/')} | Age {player.age}
          </p>
        </div>
      </div>
      <ScoreBadge score={player.scores.overallValue} size="sm" />
    </div>
  );
}
