
"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SelectionEngine } from '@/lib/selection-engine';

interface LassoHoverPreviewProps {
  mousePos: { x: number; y: number } | null;
  canvas: HTMLCanvasElement | null;
  selectionEngine: SelectionEngine | null;
  className?: string;
}

export function LassoHoverPreview({ mousePos, canvas, selectionEngine, className }: LassoHoverPreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const size = 256; // Base size of the preview window
  const zoom = 16;   // Zoom level inside the preview

  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !mousePos || !canvas || !selectionEngine) return;

    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

    previewCtx.imageSmoothingEnabled = false;
    previewCtx.clearRect(0, 0, size, size);
    
    // Draw checkerboard background
    previewCtx.fillStyle = '#666';
    previewCtx.fillRect(0, 0, size, size);
    previewCtx.fillStyle = '#999';
    const checkerSize = 8;
    for (let i = 0; i < size; i += checkerSize) {
        for (let j = 0; j < size; j += checkerSize) {
            if ((i / checkerSize + j / checkerSize) % 2 === 0) {
                previewCtx.fillRect(i, j, checkerSize, checkerSize);
            }
        }
    }

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

    // Draw the lasso path on top
    if (selectionEngine.isDrawingLasso) {
        previewCtx.save();
        previewCtx.scale(zoom, zoom);
        previewCtx.translate(-sourceX, -sourceY);

        const { lassoNodes, lassoPreviewPath, futureLassoPath, lassoMouseTrace, lassoSettings } = selectionEngine;

        // Draw mouse trace if enabled
        if (lassoSettings.showMouseTrace && lassoMouseTrace.length > 1) {
            previewCtx.strokeStyle = 'hsla(0, 0%, 100%, 0.4)';
            previewCtx.lineWidth = 1 / zoom;
            previewCtx.setLineDash([2 / zoom, 3 / zoom]);
            previewCtx.beginPath();
            previewCtx.moveTo(lassoMouseTrace[0][0], lassoMouseTrace[0][1]);
            for (let i = 1; i < lassoMouseTrace.length; i++) {
                previewCtx.lineTo(lassoMouseTrace[i][0], lassoMouseTrace[i][1]);
            }
            previewCtx.stroke();
            previewCtx.setLineDash([]);
        }
        
        const mainPath = [...lassoNodes, ...lassoPreviewPath];
        if (mainPath.length > 0) {
            previewCtx.strokeStyle = 'hsl(var(--accent))';
            previewCtx.lineWidth = 2 / zoom;
            previewCtx.lineJoin = 'round';
            previewCtx.lineCap = 'round';
            previewCtx.beginPath();
            previewCtx.moveTo(mainPath[0][0], mainPath[0][1]);
            for (let i = 1; i < mainPath.length; i++) {
                previewCtx.lineTo(mainPath[i][0], mainPath[i][1]);
            }
            previewCtx.stroke();
        }
        
        if (futureLassoPath.length > 0) {
            previewCtx.strokeStyle = 'hsla(var(--accent), 0.5)';
            previewCtx.lineWidth = 2 / zoom;
            previewCtx.beginPath();
            const lastMainPoint = mainPath[mainPath.length - 1];
            if(lastMainPoint) previewCtx.moveTo(lastMainPoint[0], lastMainPoint[1]);
            for (let i = 0; i < futureLassoPath.length; i++) {
                previewCtx.lineTo(futureLassoPath[i][0], futureLassoPath[i][1]);
            }
            previewCtx.stroke();
        }

        lassoNodes.forEach(([x, y], index) => {
            previewCtx.beginPath();
            previewCtx.arc(x, y, 3 / zoom, 0, Math.PI * 2);
            previewCtx.fillStyle = index === 0 ? 'hsl(var(--accent))' : '#fff';
            previewCtx.fill();
        });

        previewCtx.restore();
    }


  }, [mousePos, canvas, selectionEngine, size, zoom]);

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
