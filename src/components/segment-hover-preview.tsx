
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MagicWandSettings } from '@/lib/types';
import { Button } from './ui/button';
import { Minus, Plus, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

interface SegmentHoverPreviewProps {
  mousePos: { x: number; y: number } | null;
  canvas: HTMLCanvasElement | null;
  settings: MagicWandSettings;
  className?: string;
}

export function SegmentHoverPreview({ mousePos, canvas, settings, className }: SegmentHoverPreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(16);
  const [deadZone, setDeadZone] = useState(80);
  const [panSpeed, setPanSpeed] = useState(0.1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const viewPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const size = 256; 

  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !mousePos || !canvas) return;

    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

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
    const deadZoneSize = sourceSize * (deadZone / 100);

    const viewCenterX = viewPositionRef.current.x + sourceSize / 2;
    const viewCenterY = viewPositionRef.current.y + sourceSize / 2;
    
    const dx = mousePos.x - viewCenterX;
    const dy = mousePos.y - viewCenterY;

    if (Math.abs(dx) > deadZoneSize / 2) {
      viewPositionRef.current.x += (dx - (Math.sign(dx) * deadZoneSize / 2)) * panSpeed;
    }
    if (Math.abs(dy) > deadZoneSize / 2) {
      viewPositionRef.current.y += (dy - (Math.sign(dy) * deadZoneSize / 2)) * panSpeed;
    }
    
    viewPositionRef.current.x = Math.max(0, Math.min(canvas.width - sourceSize, viewPositionRef.current.x));
    viewPositionRef.current.y = Math.max(0, Math.min(canvas.height - sourceSize, viewPositionRef.current.y));

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

    previewCtx.save();
    previewCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    previewCtx.lineWidth = 1;
    previewCtx.beginPath();
    previewCtx.moveTo(size / 2, 0);
    previewCtx.lineTo(size / 2, size);
    previewCtx.moveTo(0, size / 2);
    previewCtx.lineTo(size, size / 2);
    previewCtx.stroke();
    previewCtx.restore();

  }, [mousePos, canvas, size, zoom, settings, deadZone, panSpeed]);

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
        {isSettingsOpen && (
          <div 
            className="absolute rounded-sm border border-dashed border-white/50"
            style={{
                width: `${deadZone}%`, 
                height: `${deadZone}%`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            }}
          ></div>
        )}
      </div>
      <div className="absolute top-2 left-2 flex gap-1">
         <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-6 w-6">
              <Settings className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" side="bottom" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deadzone-slider">Dead Zone Buffer: {deadZone}%</Label>
                <Slider
                  id="deadzone-slider"
                  min={0}
                  max={100}
                  step={5}
                  value={[deadZone]}
                  onValueChange={(value) => setDeadZone(value[0])}
                />
                <p className='text-xs text-muted-foreground'>Controls how far the cursor moves before the preview pans.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="panspeed-slider">Pan Speed: {panSpeed.toFixed(2)}</Label>
                <Slider
                  id="panspeed-slider"
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  value={[panSpeed]}
                  onValueChange={(value) => setPanSpeed(value[0])}
                />
                <p className='text-xs text-muted-foreground'>Controls how fast the preview pans to catch up.</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
