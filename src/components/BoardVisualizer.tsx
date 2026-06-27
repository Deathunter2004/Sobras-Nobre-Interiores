import React from 'react';

interface BoardVisualizerProps {
  length: number; // in mm
  width: number; // in mm
  type: 'Chapa' | 'Sobra';
}

export const BoardVisualizer: React.FC<BoardVisualizerProps> = ({ length, width, type }) => {
  // Standard MDF board dimensions in Brazil are usually 2750mm x 1840mm
  const STANDARD_LENGTH = 2750;
  const STANDARD_WIDTH = 1840;

  // Let's determine which is larger for rendering inside a bounding box
  // We will normalize so that the larger dimension is aligned properly.
  // We'll use a fixed box size, say 120px wide by 80px high
  const maxRenderDim = 120;
  
  // Keep dimensions positive
  const safeLength = Math.max(10, length);
  const safeWidth = Math.max(10, width);

  // We want to scale our piece to fit within the box, preserving aspect ratio.
  // Standard ratio is 2750 / 1840 = ~1.49
  // Let's scale relative to the standard board size if it's a Sobra, so we can see how small it is!
  // If it's a "Chapa" (full board) or if it exceeds standard dimensions, we'll scale it to fill the box.
  
  const isSobra = type === 'Sobra';
  
  let scale = 1;
  if (isSobra) {
    // Scale relative to a standard sheet to show actual remaining proportion
    // If somehow the remnant is larger than standard, scale to fit itself
    const maxDimension = Math.max(safeLength, safeWidth);
    const standardMax = Math.max(STANDARD_LENGTH, STANDARD_WIDTH);
    
    if (maxDimension > standardMax) {
      scale = maxRenderDim / maxDimension;
    } else {
      // Scale based on the standard board size being maxRenderDim
      scale = maxRenderDim / standardMax;
    }
  } else {
    // Full sheet - scale to fit the box
    const maxDimension = Math.max(safeLength, safeWidth);
    scale = maxRenderDim / maxDimension;
  }

  const renderWidth = Math.round(safeLength * scale);
  const renderHeight = Math.round(safeWidth * scale);

  // Calculate percentage of a full board
  const areaM2 = (safeLength * safeWidth) / 1000000;
  const standardAreaM2 = (STANDARD_LENGTH * STANDARD_WIDTH) / 1000000; // ~5.06 m²
  const percentage = Math.min(100, Math.round((areaM2 / standardAreaM2) * 100));

  return (
    <div className="flex items-center gap-3 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800 w-fit" id="board-visualizer">
      {/* Visual representation */}
      <div 
        className="relative flex items-center justify-center bg-zinc-950/80 rounded border border-zinc-800"
        style={{ width: `${maxRenderDim + 12}px`, height: `${Math.round(maxRenderDim * (STANDARD_WIDTH/STANDARD_LENGTH)) + 12}px` }}
      >
        {/* Background container of standard sheet for Sobras */}
        {isSobra && (
          <div 
            className="absolute border border-dashed border-zinc-700/40 rounded opacity-20 bg-zinc-800"
            style={{ 
              width: `${Math.round(STANDARD_LENGTH * (maxRenderDim / STANDARD_LENGTH))}px`, 
              height: `${Math.round(STANDARD_WIDTH * (maxRenderDim / STANDARD_LENGTH))}px` 
            }}
          />
        )}
        
        {/* The actual item */}
        <div 
          className={`rounded transition-all duration-300 flex items-center justify-center ${
            type === 'Chapa' 
              ? 'bg-amber-600/80 border border-amber-500' 
              : 'bg-orange-500/60 border border-orange-400'
          }`}
          style={{ 
            width: `${Math.max(4, renderWidth)}px`, 
            height: `${Math.max(4, renderHeight)}px` 
          }}
          title={`${length}x${width} mm`}
        >
          {/* Subtle line pattern on the wood */}
          <div className="w-full h-full opacity-10 bg-[linear-gradient(45deg,transparent_45%,#fff_45%,#fff_55%,transparent_55%)] bg-[length:6px_6px] rounded-sm" />
        </div>
      </div>

      {/* Numerical quick specs */}
      <div className="flex flex-col text-xs">
        <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">Proporção</span>
        <span className="text-zinc-200 font-semibold font-mono">
          {percentage}% <span className="text-zinc-500 font-normal">da chapa</span>
        </span>
        <span className="text-zinc-400 font-mono text-[11px] mt-0.5">
          {areaM2.toFixed(2)} m²
        </span>
      </div>
    </div>
  );
};
