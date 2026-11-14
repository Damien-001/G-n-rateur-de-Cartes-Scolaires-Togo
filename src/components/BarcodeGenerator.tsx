import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeGeneratorProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  value,
  width = 1,
  height = 14,
  fontSize = 6,
  displayValue = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('Barcode generation failed:', err);
      }
    }
  }, [value, width, height, fontSize, displayValue]);

  return <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%' }} />;
};
