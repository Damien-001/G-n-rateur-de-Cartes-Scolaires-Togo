import React from 'react';

interface QRGeneratorProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  value,
  size = 40,
  fgColor = '#0f172a',
  bgColor = '#ffffff',
}) => {
  // Simple hashing function to seed the random matrix
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  const hash = getHash(value || 'default');
  const gridSize = 21; // 21x21 grid

  // Finder pattern helper (top-left, top-right, bottom-left)
  const isFinderPattern = (r: number, c: number) => {
    // Top-left corner (0,0) to (6,6)
    if (r < 7 && c < 7) return true;
    // Top-right corner (0,14) to (6,20)
    if (r < 7 && c >= 14) return true;
    // Bottom-left corner (14,0) to (20,6)
    if (r >= 14 && c < 7) return true;
    return false;
  };

  // Generate matrix
  const matrix: boolean[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < gridSize; c++) {
      if (isFinderPattern(r, c)) {
        // Draw the finder patterns: outer square, inner space, center square
        const isOuter =
          (r === 0 || r === 6 || c === 0 || c === 6) && r < 7 && c < 7 || // TL
          (r === 0 || r === 6 || c === 14 || c === 20) && r < 7 && c >= 14 || // TR
          (r === 14 || r === 20 || c === 0 || c === 6) && r >= 14 && c < 7; // BL
          
        const isInner =
          (r === 2 || r === 3 || r === 4) && (c === 2 || c === 3 || c === 4) && r < 7 && c < 7 || // TL
          (r === 2 || r === 3 || r === 4) && (c === 16 || c === 17 || c === 18) && r < 7 && c >= 14 || // TR
          (r === 16 || r === 17 || r === 18) && (c === 2 || c === 3 || c === 4) && r >= 14 && c < 7; // BL

        row.push(isOuter || isInner);
      } else {
        // Deterministic pseudo-random generation based on input hash and position
        const cellSeed = hash + r * 13 + c * 37;
        const val = ((cellSeed ^ (cellSeed >> 5)) * 19) % 100;
        row.push(val > 45); // ~55% density
      }
    }
    matrix.push(row);
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${gridSize} ${gridSize}`} 
      style={{ 
        backgroundColor: bgColor, 
        padding: 1.5, 
        boxSizing: 'border-box', 
        borderRadius: 4,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
    >
      {matrix.map((row, r) =>
        row.map((active, c) => (
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1}
              height={1}
              fill={fgColor}
              shapeRendering="crispEdges"
            />
          ) : null
        ))
      )}
    </svg>
  );
};
