"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SegmentHoverPreviewProps {
  mousePos: { x: number; y: number } | null;
  canvas: HTMLCanvasElement | null;
  className?: string;
}

export function SegmentHoverPreview({ mousePos, canvas, className }: SegmentHoverPreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const size = 256; // Base size of the preview window
  const zoom = 16;   // Zoom level inside the preview

  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !mousePos || !canvas) return;

    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

    previewCtx.imageSmoothingEnabled = false;
    previewCtx.clearRect(0, 0, size, size);
    
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


    const sourceSize = size / zoom;
    const sourceX = mousePos.x - sourceSize / 2;
    const sourceY = mousePos.y - sourceSize / 2;

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

  if (!mousePos) return <div className={cn("aspect-square w-full rounded-md bg-muted animate-pulse", className)}></div>;

  return (
    <div
      className={cn(
        "relative w-full aspect-square overflow-hidden rounded-md border-2 border-border shadow-inner bg-background",
        className
      )}
    >
      <canvas ref={previewCanvasRef} width={size} height={size} className="w-full h-full" />
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-px h-full bg-white/50"></div>
        <div className="h-px w-full bg-white/50 absolute"></div>
        <div className="w-[calc(100%/16)] h-[calc(100%/16)] border-2 border-accent rounded-sm"></div>
      </div>
    </div>
  );
}
