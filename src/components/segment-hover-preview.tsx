"use client";

import React, { useEffect, useRef } from 'react';

interface SegmentHoverPreviewProps {
  mousePos: { x: number; y: number } | null;
  canvas: HTMLCanvasElement | null;
}

export function SegmentHoverPreview({ mousePos, canvas }: SegmentHoverPreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const size = 128; // Size of the preview window
  const zoom = 8;   // Zoom level inside the preview

  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !mousePos || !canvas) return;

    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

    previewCtx.imageSmoothingEnabled = false;
    previewCtx.clearRect(0, 0, size, size);
    
    // Fill with a checkerboard pattern for transparency
    previewCtx.fillStyle = '#666';
    previewCtx.fillRect(0, 0, size, size);
    previewCtx.fillStyle = '#999';
    for (let i = 0; i < size; i += 8) {
        for (let j = 0; j < size; j += 8) {
            if ((i / 8 + j / 8) % 2 == 0) {
                previewCtx.fillRect(i, j, 8, 8);
            }
        }
    }


    // Calculate the source rectangle on the main canvas
    const sourceSize = size / zoom;
    const sourceX = mousePos.x - sourceSize / 2;
    const sourceY = mousePos.y - sourceSize / 2;

    // Draw the zoomed-in image content
    previewCtx.drawImage(
      canvas,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size
    );
    

  }, [mousePos, canvas, size, zoom]);

  if (!mousePos) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-md border-2 border-white shadow-2xl overflow-hidden bg-background"
      style={{
        left: 20,
        bottom: 20,
        width: size,
        height: size,
      }}
    >
      <canvas ref={previewCanvasRef} width={size} height={size} />
       <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-px h-full bg-white/50"></div>
        <div className="h-px w-full bg-white/50 absolute"></div>
      </div>
    </div>
  );
}
