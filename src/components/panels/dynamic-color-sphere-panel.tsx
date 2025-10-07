
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { hsvToRgbString, rgbToHsv } from '@/lib/color-utils';

interface DynamicColorSpherePanelProps {}

export function DynamicColorSpherePanel({}: DynamicColorSpherePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(200);
  const [selectedHsv, setSelectedHsv] = useState({ h: 0, s: 100, v: 100 });
  const [isDragging, setIsDragging] = useState<null | 'hue' | 'sv'>(null);

  const drawSphere = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const center = size / 2;
    const hueRingOuterRadius = size / 2;
    const hueRingInnerRadius = size * 0.35;
    const svRadius = hueRingInnerRadius - (size * 0.05);

    ctx.clearRect(0, 0, size, size);

    // 1. Draw Hue Ring (Equator)
    const hueGradient = ctx.createConicGradient(0, center, center);
    for (let i = 0; i <= 360; i++) {
      hueGradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }
    ctx.strokeStyle = hueGradient;
    ctx.lineWidth = hueRingOuterRadius - hueRingInnerRadius;
    ctx.beginPath();
    ctx.arc(center, center, (hueRingOuterRadius + hueRingInnerRadius) / 2, 0, 2 * Math.PI);
    ctx.stroke();

    // 2. Draw Saturation/Value Triangle inside a circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, svRadius, 0, 2 * Math.PI);
    ctx.clip(); // Clip all drawing to the inner circle

    const pureHueColor = `hsl(${selectedHsv.h}, 100%, 50%)`;

    // Saturation gradient (from white to pure hue)
    const satGradient = ctx.createLinearGradient(center - svRadius, center, center + svRadius, center);
    satGradient.addColorStop(0, 'white');
    satGradient.addColorStop(1, pureHueColor);
    ctx.fillStyle = satGradient;
    ctx.fillRect(center - svRadius, center - svRadius, svRadius * 2, svRadius * 2);

    // Value gradient (from transparent to black)
    const valGradient = ctx.createLinearGradient(center, center - svRadius, center, center + svRadius);
    valGradient.addColorStop(0, 'rgba(0,0,0,0)');
    valGradient.addColorStop(1, 'black');
    ctx.fillStyle = valGradient;
    ctx.fillRect(center - svRadius, center - svRadius, svRadius * 2, svRadius * 2);
    
    ctx.restore(); // Restore from clipping

    // 3. Draw cursors
    // Hue cursor on the ring
    const hueAngle = (selectedHsv.h * Math.PI) / 180;
    const hueCursorRadius = (hueRingOuterRadius + hueRingInnerRadius) / 2;
    const hueX = center + hueCursorRadius * Math.cos(hueAngle);
    const hueY = center + hueCursorRadius * Math.sin(hueAngle);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hueX, hueY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // SV cursor in the triangle
    const svAngle = (selectedHsv.h * Math.PI) / 180;
    const svDist = (selectedHsv.s / 100) * svRadius;
    const svX = center + svDist * Math.cos(svAngle);
    const svY = center + svDist * Math.sin(svAngle);
    // This is a simplified representation. A true triangular picker would be more complex.
    // For now, let's map S/V to X/Y inside the circle.
    const finalSvX = center - svRadius + (selectedHsv.s / 100) * (svRadius * 2);
    const finalSvY = center + svRadius - (selectedHsv.v / 100) * (svRadius * 2);
    ctx.fillStyle = selectedHsv.v > 50 ? 'black' : 'white';
    ctx.strokeStyle = selectedHsv.v > 50 ? 'white' : 'black';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(finalSvX, finalSvY, 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();

  }, [size, selectedHsv]);

  useEffect(() => {
    drawSphere();
  }, [drawSphere]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setSize(width > 0 ? Math.floor(width) : 200);
      }
    });

    observer.observe(container);
    return () => {
      if (container) {
        observer.unobserve(container);
      }
    };
  }, []);

  const handleInteraction = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const center = size / 2;

    if (isDragging === 'hue') {
        const angle = Math.atan2(y - center, x - center);
        let hue = (angle * 180) / Math.PI;
        if (hue < 0) hue += 360;
        setSelectedHsv(prev => ({ ...prev, h: hue }));
    } else if (isDragging === 'sv') {
        const svRadius = size * 0.35 - (size * 0.05);
        const svBoxLeft = center - svRadius;
        const svBoxTop = center - svRadius;

        let s = ((x - svBoxLeft) / (svRadius * 2)) * 100;
        let v = 100 - ((y - svBoxTop) / (svRadius * 2)) * 100;
        s = Math.max(0, Math.min(100, s));
        v = Math.max(0, Math.min(100, v));

        setSelectedHsv(prev => ({ ...prev, s, v }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const center = size / 2;

    const dist = Math.hypot(x - center, y - center);
    const hueRingOuterRadius = size / 2;
    const hueRingInnerRadius = size * 0.35;
    const svRadius = hueRingInnerRadius - (size * 0.05);

    if (dist > hueRingInnerRadius && dist < hueRingOuterRadius) {
      setIsDragging('hue');
    } else if (dist <= svRadius) {
      setIsDragging('sv');
    }
    
    handleInteraction(e); // Handle initial click
  };
  
  const handleMouseUp = () => {
    setIsDragging(null);
  };


  const selectedColorRgb = hsvToRgbString(selectedHsv.h, selectedHsv.s, selectedHsv.v);

  return (
    <div className="p-4 flex flex-col h-full items-center">
      <h3 className="font-headline text-lg mb-2">Dynamic Color Sphere</h3>
      
      <div 
        ref={containerRef} 
        className="w-full aspect-square mb-4 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => isDragging && handleInteraction(e)}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
          <canvas ref={canvasRef} width={size} height={size} />
      </div>
      
      <div className="w-full space-y-4">
        <div className="flex items-center gap-4 p-2 rounded-md bg-muted/50">
            <div className="w-10 h-10 rounded-full border-2 border-border" style={{ backgroundColor: selectedColorRgb }}></div>
            <div className="font-mono text-sm">
                <div>H: {selectedHsv.h.toFixed(0)}°</div>
                <div>S: {selectedHsv.s.toFixed(0)}%</div>
                <div>V: {selectedHsv.v.toFixed(0)}%</div>
            </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Hue: {selectedHsv.h.toFixed(0)}°</Label>
            <Slider value={[selectedHsv.h]} onValueChange={([val]) => setSelectedHsv(p => ({...p, h: val}))} min={0} max={360} step={1} />
          </div>
          <div>
            <Label>Saturation: {selectedHsv.s.toFixed(0)}%</Label>
            <Slider value={[selectedHsv.s]} onValueChange={([val]) => setSelectedHsv(p => ({...p, s: val}))} min={0} max={100} step={1} />
          </div>
          <div>
            <Label>Value/Brightness: {selectedHsv.v.toFixed(0)}%</Label>
            <Slider value={[selectedHsv.v]} onValueChange={([val]) => setSelectedHsv(p => ({...p, v: val}))} min={0} max={100} step={1} />
          </div>
        </div>
      </div>
    </div>
  );
}
