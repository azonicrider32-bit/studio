
"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MagicWandSettings } from '@/lib/types';
import { rgbToHsv, rgbToLab } from '@/lib/color-utils';

interface SegmentHoverPreviewProps {
  mousePos: { x: number; y: number } | null;
  canvas: HTMLCanvasElement | null;
  settings: MagicWandSettings;
  className?: string;
}

export function SegmentHoverPreview({ mousePos, canvas, settings, className }: SegmentHoverPreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const size = 256; 
  const zoom = 16;  

  const isColorSimilar = (
    r1: number, g1: number, b1: number,
    r2: number, g2: number, b2: number,
    settings: MagicWandSettings
  ) => {
    const { tolerances, enabledTolerances } = settings;
    if (enabledTolerances.size === 0) return true;

    const seedColor = {
      rgb: { r: r1, g: g1, b: b1 },
      hsv: rgbToHsv(r1, g1, b1),
      lab: rgbToLab(r1, g1, b1),
    };

    const neighborColor = {
      rgb: { r: r2, g: g2, b: b2 },
      hsv: rgbToHsv(r2, g2, b2),
      lab: rgbToLab(r2, g2, b2),
    };

    const colorSpaces: (keyof typeof seedColor)[] = ['rgb', 'hsv', 'lab'];

    for (const space of colorSpaces) {
        const components = Object.keys(seedColor[space]);
        for (const key of components) {
            const toleranceKey = key === 'b_lab' ? 'b_lab' : (key as keyof typeof tolerances);
            if (!enabledTolerances.has(toleranceKey)) continue;

            const tolerance = tolerances[toleranceKey];
            const c1 = seedColor[space];
            const c2 = neighborColor[space];
            let diff: number;

            if (key === 'h') {
                const hDiff = Math.abs(c1.h - c2.h);
                diff = Math.min(hDiff, 360 - hDiff);
            } else {
                diff = Math.abs(c1[key] - c2[key]);
            }

            if (diff > tolerance) {
                return false;
            }
        }
    }
    return true;
  };

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

    // Draw the selection highlight overlay
    const mainCtx = canvas.getContext('2d', { willReadFrequently: true });
    if (!mainCtx) return;

    const centerX = Math.floor(mousePos.x);
    const centerY = Math.floor(mousePos.y);

    if (centerX >= 0 && centerX < canvas.width && centerY >= 0 && centerY < canvas.height) {
        const seedPixel = mainCtx.getImageData(centerX, centerY, 1, 1).data;
        const [seedR, seedG, seedB] = seedPixel;

        previewCtx.strokeStyle = 'hsl(var(--accent))';
        previewCtx.lineWidth = 1;

        for (let j = 0; j < sourceSize; j++) {
            for (let i = 0; i < sourceSize; i++) {
                const canvasX = Math.floor(sourceX + i);
                const canvasY = Math.floor(sourceY + j);

                if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
                    const currentPixel = mainCtx.getImageData(canvasX, canvasY, 1, 1).data;
                    const [r, g, b] = currentPixel;
                    
                    if (isColorSimilar(seedR, seedG, seedB, r, g, b, settings)) {
                        previewCtx.strokeRect(i * zoom, j * zoom, zoom, zoom);
                    }
                }
            }
        }
    }
    
    // Draw search radius outline
    if (settings.searchRadius > 1) {
        const radiusInPreview = settings.searchRadius * zoom;
        previewCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        previewCtx.lineWidth = 2;
        previewCtx.beginPath();
        previewCtx.arc(size / 2, size / 2, radiusInPreview / 2, 0, 2 * Math.PI);
        previewCtx.stroke();
    }


  }, [mousePos, canvas, size, zoom, settings]);

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
