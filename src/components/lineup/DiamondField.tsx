import type { LineupSlot } from '../../types';

interface DiamondFieldProps {
  slots: LineupSlot[];
  onSlotClick?: (playerId: string) => void;
  interactive?: boolean;
  onDrop?: (position: string, playerId: string) => void;
  highlightPositions?: Set<string>;
}

// Position coordinates in SVG viewBox (0 0 400 420)
const POS_COORDS: Record<string, { x: number; y: number }> = {
  C: { x: 200, y: 365 },
  '1B': { x: 310, y: 265 },
  '2B': { x: 245, y: 200 },
  SS: { x: 155, y: 230 },
  '3B': { x: 90, y: 265 },
  LF: { x: 60, y: 120 },
  CF: { x: 200, y: 55 },
  RF: { x: 340, y: 120 },
  DH: { x: 365, y: 365 },
};

function scoreColor(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 50) return '#3b82f6';
  if (score >= 30) return '#eab308';
  return '#ef4444';
}

export default function DiamondField({ slots, onSlotClick, interactive, onDrop, highlightPositions }: DiamondFieldProps) {
  const slotMap = new Map(slots.map((s) => [s.position, s]));

  function handleDragOver(e: React.DragEvent) {
    if (interactive) e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, position: string) {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('text/plain');
    if (playerId && onDrop) onDrop(position, playerId);
  }

  return (
    <svg viewBox="0 0 400 420" className="w-full max-w-md mx-auto" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
      {/* Grass background */}
      <rect x="0" y="0" width="400" height="420" rx="12" fill="#0f1a12" />

      {/* Outfield arc */}
      <path
        d="M 20,280 Q 30,40 200,15 Q 370,40 380,280"
        fill="none"
        stroke="#1a3a20"
        strokeWidth="2"
      />
      {/* Outfield fill */}
      <path
        d="M 20,280 Q 30,40 200,15 Q 370,40 380,280 Z"
        fill="#122417"
        opacity="0.5"
      />

      {/* Infield diamond */}
      <polygon
        points="200,310 310,250 200,185 90,250"
        fill="#1a2a1e"
        stroke="#2d4a33"
        strokeWidth="1.5"
      />

      {/* Diamond lines */}
      <line x1="200" y1="310" x2="310" y2="250" stroke="#3a5a40" strokeWidth="1" />
      <line x1="310" y1="250" x2="200" y2="185" stroke="#3a5a40" strokeWidth="1" />
      <line x1="200" y1="185" x2="90" y2="250" stroke="#3a5a40" strokeWidth="1" />
      <line x1="90" y1="250" x2="200" y2="310" stroke="#3a5a40" strokeWidth="1" />

      {/* Base markers */}
      {[
        { x: 200, y: 310 }, // home
        { x: 310, y: 250 }, // 1B
        { x: 200, y: 185 }, // 2B
        { x: 90, y: 250 },  // 3B
      ].map((b, i) => (
        <rect
          key={i}
          x={b.x - 4}
          y={b.y - 4}
          width={8}
          height={8}
          fill="#e5e7eb"
          transform={`rotate(45 ${b.x} ${b.y})`}
        />
      ))}

      {/* Pitcher mound */}
      <circle cx="200" cy="248" r="5" fill="#4a3a2a" stroke="#6a5a4a" strokeWidth="1" />

      {/* Position nodes */}
      {Object.entries(POS_COORDS).map(([pos, { x, y }]) => {
        const slot = slotMap.get(pos);
        const isHighlighted = highlightPositions?.has(pos);
        const color = slot ? scoreColor(slot.score) : '#374151';
        const lastName = slot ? (slot.player.name.split(' ').pop() || slot.player.name) : '';

        return (
          <g
            key={pos}
            className={onSlotClick || interactive ? 'cursor-pointer' : ''}
            onClick={() => slot && onSlotClick?.(slot.player.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, pos)}
          >
            {/* Drop highlight ring */}
            {isHighlighted && (
              <circle cx={x} cy={y} r="28" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 2" opacity="0.8" />
            )}

            {/* Player circle */}
            <circle
              cx={x}
              cy={y}
              r="22"
              fill={slot ? color : '#1f2937'}
              fillOpacity={slot ? 0.25 : 0.5}
              stroke={slot ? color : '#4b5563'}
              strokeWidth={slot?.outOfPosition ? 2 : 1.5}
              strokeDasharray={slot?.outOfPosition ? '3 2' : undefined}
            />

            {/* Position label */}
            <text x={x} y={y - 10} textAnchor="middle" fill="#9ca3af" fontSize="9" fontWeight="600">
              {pos}
            </text>

            {/* Player name */}
            {slot ? (
              <>
                <text x={x} y={y + 2} textAnchor="middle" fill="#e5e7eb" fontSize="8" fontWeight="500">
                  {lastName.length > 9 ? lastName.slice(0, 8) + '.' : lastName}
                </text>
                <text x={x} y={y + 13} textAnchor="middle" fill={color} fontSize="8" fontWeight="700">
                  {slot.score.toFixed(0)}
                </text>
              </>
            ) : (
              <text x={x} y={y + 4} textAnchor="middle" fill="#6b7280" fontSize="8">
                Empty
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
