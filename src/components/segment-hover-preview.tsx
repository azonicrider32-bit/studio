
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MagicWandSettings } from '@/lib/types';
import { Button } from './ui/button';
import { Minus, Plus } from 'lucide-react';

interface SegmentHoverPreviewProps {
  mousePos: { x: number; y: number } | null;
  canvas: HTMLCanvasElement | null;
  settings: MagicWandSettings;
  className?: string;
}

export function SegmentHoverPreview({ mousePos, canvas, settings, className }: SegmentHoverPreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(16);
  const size = 256; 

  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !mousePos || !canvas) return;

    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

    previewCtx.imageSmoothingEnabled = false;
    
    // Draw checkerboard background
    previewCtx.fillStyle = '#666';
    previewCtx.fillRect(0, 0, size, size);
    previewCtx.fillStyle = '#999';
    for (let i = 0; i < size; i += 8) {
        for (let j = 0; j < size; j += 8) {
            if ((i / 8 + j / 8) % 2 === 0) {
                previewCtx.fillRect(i, j, 8, 8);
            }
        }
    }

    const sourceSize = size / zoom;
    const sourceX = mousePos.x - sourceSize / 2;
    const sourceY = mousePos.y - sourceSize / 2;

    // Draw the zoomed-in portion of the main canvas
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

    // Draw overlays
    previewCtx.save();
    
    // Center crosshair
    previewCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    previewCtx.lineWidth = 1;
    previewCtx.beginPath();
    previewCtx.moveTo(size / 2, 0);
    previewCtx.lineTo(size / 2, size);
    previewCtx.moveTo(0, size / 2);
    previewCtx.lineTo(size, size / 2);
    previewCtx.stroke();
    
    previewCtx.restore();

  }, [mousePos, canvas, size, zoom, settings]);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const newZoom = zoom - e.deltaY / 100;
    setZoom(Math.max(1, Math.min(128, newZoom)));
  };

  const changeZoom = (amount: number) => {
    setZoom(prev => Math.max(1, Math.min(128, prev + amount)));
  }

  if (!mousePos) return <div className={cn("aspect-square w-full rounded-md bg-muted animate-pulse", className)}></div>;

  return (
    <div
      onWheel={handleWheel}
      className={cn(
        "relative w-full aspect-square overflow-hidden rounded-md border-2 border-border shadow-inner bg-background",
        className
      )}
    >
      <canvas ref={previewCanvasRef} width={size} height={size} className="w-full h-full" />
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {settings.sampleMode !== 'point' && settings.searchRadius > 0 && (
          <div
            className="border-2 border-dashed border-white/70 rounded-full"
            style={{
                width: `${settings.searchRadius * 2 * zoom}px`,
                height: `${settings.searchRadius * 2 * zoom}px`,
            }}
          />
        )}
        <div className="w-px h-full bg-white/50 absolute"></div>
        <div className="h-px w-full bg-white/50 absolute"></div>
        <div className="w-[calc(100%/16)] h-[calc(100%/16)] border-2 border-accent rounded-sm"></div>
      </div>
      <div className="absolute bottom-2 right-2 flex gap-1">
        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => changeZoom(-4)}><Minus className="w-4 h-4"/></Button>
        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => changeZoom(4)}><Plus className="w-4 h-4"/></Button>
      </div>
      <div className="absolute top-2 right-2 bg-background/50 text-foreground text-xs px-2 py-1 rounded-md">
        {zoom.toFixed(1)}x
      </div>
    </div>
  );
}

    
