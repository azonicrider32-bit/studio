
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { SelectionEngine } from '@/lib/selection-engine';
import { Button } from './ui/button';
import { Minus, Plus } from 'lucide-react';

interface LassoHoverPreviewProps {
  mousePos: { x: number; y: number } | null;
  canvas: HTMLCanvasElement | null;
  selectionEngine: SelectionEngine | null;
  onHoverChange: (isHovered: boolean) => void;
  className?: string;
}

export function LassoHoverPreview({ mousePos, canvas, selectionEngine, onHoverChange, className }: LassoHoverPreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const size = 256; 
  const [zoom, setZoom] = useState(16);
  const [isHovered, setIsHovered] = useState(false);
  const viewPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    onHoverChange(isHovered);
  }, [isHovered, onHoverChange]);
  
  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !canvas || !selectionEngine || !mousePos) return;
    
    let sourceX = viewPositionRef.current.x;
    let sourceY = viewPositionRef.current.y;
    const sourceSize = size / zoom;

    // Initialize view position on first render with a mouse position
    if (sourceX === 0 && sourceY === 0) {
        sourceX = mousePos.x - sourceSize / 2;
        sourceY = mousePos.y - sourceSize / 2;
    }

    // Edge-panning logic
    const edgeThreshold = sourceSize / 8; // Start panning when cursor is within 1/8th of the edge
    const rightEdge = sourceX + sourceSize;
    const bottomEdge = sourceY + sourceSize;

    if (mousePos.x > rightEdge - edgeThreshold) {
        sourceX = mousePos.x - sourceSize + edgeThreshold;
    } else if (mousePos.x < sourceX + edgeThreshold) {
        sourceX = mousePos.x - edgeThreshold;
    }

    if (mousePos.y > bottomEdge - edgeThreshold) {
        sourceY = mousePos.y - sourceSize + edgeThreshold;
    } else if (mousePos.y < sourceY + edgeThreshold) {
        sourceY = mousePos.y - edgeThreshold;
    }
    
    viewPositionRef.current = { x: sourceX, y: sourceY };


    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

    previewCtx.imageSmoothingEnabled = false;
    previewCtx.clearRect(0, 0, size, size);
    
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

    // Draw the zoomed-in image content from the calculated source position
    previewCtx.drawImage(
      canvas,
      viewPositionRef.current.x,
      viewPositionRef.current.y,
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
        previewCtx.translate(-viewPositionRef.current.x, -viewPositionRef.current.y);

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
  
  useEffect(() => {
    // Reset view position when mouse leaves the canvas
    if (!mousePos) {
      viewPositionRef.current = { x: 0, y: 0 };
    }
  }, [mousePos]);


  if (!mousePos) return <div className={cn("aspect-square w-full rounded-md bg-muted animate-pulse", className)}></div>;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
      className={cn(
        "relative w-full aspect-square overflow-hidden rounded-md border-2 border-border shadow-inner bg-background",
        className
      )}
    >
      <canvas ref={previewCanvasRef} width={size} height={size} className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Crosshair */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '1px',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          transform: 'translateX(-50%)'
        }}></div>
         <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '100%',
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          transform: 'translateY(-50%)'
        }}></div>
        {/* Center dot for the actual cursor position relative to the panned view */}
        <div
          className="absolute w-1 h-1 bg-accent rounded-full pointer-events-none"
          style={{
            left: `${((mousePos.x - viewPositionRef.current.x) / (size/zoom)) * 100}%`,
            top: `${((mousePos.y - viewPositionRef.current.y) / (size/zoom)) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        ></div>
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
