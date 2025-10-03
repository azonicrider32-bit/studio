
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { SelectionEngine } from '@/lib/selection-engine';
import { Button } from '../ui/button';
import { Minus, Plus, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';

interface PixelZoomPanelProps {
  mousePos: { x: number; y: number } | null;
  canvas: HTMLCanvasElement | null;
  selectionEngine: SelectionEngine | null;
  onHoverChange: (isHovered: boolean) => void;
  className?: string;
}

export function PixelZoomPanel({ mousePos, canvas, selectionEngine, onHoverChange, className }: PixelZoomPanelProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(4);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    onHoverChange(isHovered);
  }, [isHovered, onHoverChange]);
  
  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !canvas || !selectionEngine || !mousePos || size.width === 0 || size.height === 0) return;

    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

    previewCtx.imageSmoothingEnabled = false;
    previewCtx.clearRect(0, 0, size.width, size.height);
    
    // Background
    previewCtx.fillStyle = '#666';
    previewCtx.fillRect(0, 0, size.width, size.height);
    previewCtx.fillStyle = '#999';
    const checkerSize = 8;
    for (let i = 0; i < size.width; i += checkerSize) {
        for (let j = 0; j < size.height; j += checkerSize) {
            if ((i / checkerSize + j / checkerSize) % 2 === 0) {
                previewCtx.fillRect(i, j, checkerSize, checkerSize);
            }
        }
    }

    const sourceSizeX = size.width / zoom;
    const sourceSizeY = size.height / zoom;
    const sourceX = mousePos.x - sourceSizeX / 2;
    const sourceY = mousePos.y - sourceSizeY / 2;

    previewCtx.drawImage(
      canvas,
      sourceX,
      sourceY,
      sourceSizeX,
      sourceSizeY,
      0,
      0,
      size.width,
      size.height
    );

    if (selectionEngine.isDrawingLasso) {
        previewCtx.save();
        previewCtx.scale(zoom, zoom);
        previewCtx.translate(-sourceX, -sourceY);

        const { lassoNodes, lassoPreviewPath, futureLassoPath, lassoMouseTrace, lassoSettings } = selectionEngine;

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

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const newZoom = zoom - e.deltaY / 100;
    setZoom(Math.max(1, Math.min(128, newZoom)));
  };

  const changeZoom = (amount: number) => {
    setZoom(prev => Math.max(1, Math.min(128, prev + amount)));
  }

  return (
    <div className={cn("p-4 flex flex-col h-full", className)}>
        <div
            ref={containerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onWheel={handleWheel}
            className={cn(
                "relative w-full h-full overflow-hidden rounded-md border-2 border-border shadow-inner bg-background",
                className
            )}
            >
            <canvas ref={previewCanvasRef} width={size.width} height={size.height} className="w-full h-full" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {mousePos && (
                <div
                    className="absolute w-px h-full bg-white/30"
                />
                )}
                 {mousePos && (
                <div
                    className="absolute h-px w-full bg-white/30"
                />
                )}
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1">
                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => changeZoom(-1)}><Minus className="w-4 h-4"/></Button>
                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => changeZoom(1)}><Plus className="w-4 h-4"/></Button>
            </div>
            <div className="absolute top-2 right-2 bg-background/50 text-foreground text-xs px-2 py-1 rounded-md">
                {zoom.toFixed(1)}x
            </div>
        </div>
    </div>
  );
}
