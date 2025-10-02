
"use client";

import React, { useEffect, useRef, useState } from 'react';
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
    seedColor: { rgb: {r:number, g:number, b:number} },
    r2: number, g2: number, b2: number,
    settings: MagicWandSettings
  ) => {
    const { tolerances, enabledTolerances } = settings;
    if (enabledTolerances.size === 0) return true;

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
    const mainCtx = canvas.getContext('2d', { willReadFrequently: true });
    if (!previewCtx || !mainCtx) return;

    previewCtx.imageSmoothingEnabled = false;
    
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

    const centerX = Math.floor(mousePos.x);
    const centerY = Math.floor(mousePos.y);

    if (centerX < 0 || centerX >= canvas.width || centerY < 0 || centerY >= canvas.height) {
        return;
    }

    // Determine the seed color based on settings
    const samplePixels: { r: number, g: number, b: number, x: number, y: number }[] = [];
    const searchRadius = settings.sampleMode === 'point' ? 0 : settings.searchRadius;
    let seedColor: { rgb: {r:number, g:number, b:number}, hsv: any, lab: any };

    const startSampleX = Math.max(0, centerX - searchRadius);
    const endSampleX = Math.min(canvas.width - 1, centerX + searchRadius);
    const startSampleY = Math.max(0, centerY - searchRadius);
    const endSampleY = Math.min(canvas.height - 1, centerY + searchRadius);

    for (let j = startSampleY; j <= endSampleY; j++) {
      for (let i = startSampleX; i <= endSampleX; i++) {
        const distSq = (i - centerX)**2 + (j - centerY)**2;
        if (distSq <= searchRadius**2) {
          const pixelData = mainCtx.getImageData(i, j, 1, 1).data;
          samplePixels.push({ r: pixelData[0], g: pixelData[1], b: pixelData[2], x: i, y: j });
        }
      }
    }

    if(samplePixels.length === 0) {
       const pixelData = mainCtx.getImageData(centerX, centerY, 1, 1).data;
       samplePixels.push({ r: pixelData[0], g: pixelData[1], b: pixelData[2], x: centerX, y: centerY });
    }

    let dominantColorKey: string | null = null;
    if (settings.sampleMode === 'average') {
      let totalR = 0, totalG = 0, totalB = 0;
      for (const p of samplePixels) { totalR += p.r; totalG += p.g; totalB += p.b; }
      const avgR = totalR / samplePixels.length;
      const avgG = totalG / samplePixels.length;
      const avgB = totalB / samplePixels.length;
      seedColor = { rgb: {r: avgR, g: avgG, b: avgB}, hsv: rgbToHsv(avgR, avgG, avgB), lab: rgbToLab(avgR, avgG, avgB) };
    } else if (settings.sampleMode === 'dominant' && samplePixels.length > 0) {
        const counts = new Map<string, number>();
        for (const p of samplePixels) {
            const key = `${p.r},${p.g},${p.b}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        }
        let maxCount = 0;
        let dominantColor = { r: 0, g: 0, b: 0 };
        for (const [key, count] of counts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                const [r,g,b] = key.split(',').map(Number);
                dominantColor = { r,g,b };
                dominantColorKey = key;
            }
        }
        seedColor = { rgb: dominantColor, hsv: rgbToHsv(dominantColor.r, dominantColor.g, dominantColor.b), lab: rgbToLab(dominantColor.r, dominantColor.g, dominantColor.b) };
    } else { // point
      const p = mainCtx.getImageData(centerX, centerY, 1, 1).data;
      seedColor = { rgb: {r: p[0], g: p[1], b: p[2]}, hsv: rgbToHsv(p[0], p[1], p[2]), lab: rgbToLab(p[0], p[1], p[2]) };
    }


    // Draw overlays
    previewCtx.save();
    
    // 1. Draw thin accent border for all pixels that would be selected
    previewCtx.strokeStyle = 'hsl(var(--accent))';
    previewCtx.lineWidth = 1;
    for (let j = 0; j < sourceSize; j++) {
        for (let i = 0; i < sourceSize; i++) {
            const canvasX = Math.floor(sourceX + i);
            const canvasY = Math.floor(sourceY + j);
            if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
                const pixel = mainCtx.getImageData(canvasX, canvasY, 1, 1).data;
                if (isColorSimilar(seedColor, pixel[0], pixel[1], pixel[2], settings)) {
                    previewCtx.strokeRect(i * zoom, j * zoom, zoom, zoom);
                }
            }
        }
    }

    // 2. Draw thick green border for pixels used in the search
    previewCtx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
    previewCtx.lineWidth = 2;
    for (const p of samplePixels) {
        const previewX = (p.x - sourceX) * zoom;
        const previewY = (p.y - sourceY) * zoom;
        if (previewX >= 0 && previewX < size && previewY >= 0 && previewY < size) {
           previewCtx.strokeRect(previewX, previewY, zoom, zoom);
        }
    }
    
    // 3. If dominant, highlight the dominant pixels even more
    if (settings.sampleMode === 'dominant' && dominantColorKey) {
        previewCtx.strokeStyle = 'rgba(0, 255, 255, 1)'; // Bright cyan
        previewCtx.lineWidth = 2;
        for (const p of samplePixels) {
            const key = `${p.r},${p.g},${p.b}`;
            if (key === dominantColorKey) {
                 const previewX = (p.x - sourceX) * zoom;
                 const previewY = (p.y - sourceY) * zoom;
                 if (previewX >= 0 && previewX < size && previewY >= 0 && previewY < size) {
                    previewCtx.strokeRect(previewX - 1, previewY - 1, zoom + 2, zoom + 2);
                 }
            }
        }
    }

    previewCtx.restore();

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
    </div>
  );
}

    