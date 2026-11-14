import React, { useMemo } from 'react';
import QRCode from 'qrcode';

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
  // Generate real standard QR Code matrix with error correction level M
  const qrData = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'CARTE-SCOLAIRE', {
        errorCorrectionLevel: 'M',
      });
      const gridSize = qr.modules.size;
      const matrix: boolean[][] = [];
      for (let r = 0; r < gridSize; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < gridSize; c++) {
          row.push(Boolean(qr.modules.get(r, c)));
        }
        matrix.push(row);
      }
      return { gridSize, matrix };
    } catch {
      return { gridSize: 0, matrix: [] };
    }
  }, [value]);

  if (!qrData.gridSize) {
    return null;
  }

  const { gridSize, matrix } = qrData;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${gridSize} ${gridSize}`} 
      style={{ 
        backgroundColor: bgColor, 
        padding: 1.5, 
        boxSizing: 'border-box', 
        borderRadius: 3,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        display: 'block'
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
