"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export function DynamicColorSpherePanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(300);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [equatorColors, setEquatorColors] = useState(['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff']);
  const [poleTop, setPoleTop] = useState('#ffffff');
  const [poleBottom, setPoleBottom] = useState('#000000');
  const [lightness, setLightness] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setSize(canvas.parentElement?.clientWidth || 300);
    canvas.width = size;
    canvas.height = size;

    const center = size / 2;
    const radius = size / 2 * 0.9;

    ctx.clearRect(0, 0, size, size);
    
    // Draw sphere body
    for (let i = -radius; i <= radius; i++) {
        const y = center + i;
        const r = Math.sqrt(radius * radius - i * i);

        const lat = Math.asin(i / radius); // latitude
        
        const grad = ctx.createLinearGradient(center - r, y, center + r, y);
        
        for (let j = 0; j <= 10; j++) {
            const lon = (j / 10) * 2 * Math.PI - rotation.x;
            const hue = (lon * 180 / Math.PI + 360) % 360;

            const sat = 100 - Math.abs(lat * 200 / Math.PI);
            const lit = 50 + lightness + (lat * (50 + lightness) / (Math.PI / 2));

            grad.addColorStop(j/10, `hsl(${hue}, ${sat}%, ${lit}%)`);
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(center, y, r, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Simulate lighting
    const lightGradient = ctx.createRadialGradient(center - radius/2, center - radius/2, 0, center, center, radius);
    lightGradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    lightGradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = lightGradient;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2*Math.PI);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';


  }, [size, rotation, equatorColors, poleTop, poleBottom, lightness]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) * 0.01;
    const dy = (e.clientY - dragStart.y) * 0.01;
    setRotation(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...equatorColors];
    newColors[index] = color;
    setEquatorColors(newColors);
  }

  return (
    <div className="p-4 flex flex-col h-full items-center">
      <canvas
        ref={canvasRef}
        className="cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="w-full space-y-4 mt-4">
        <div className="space-y-2">
            <Label>Lightness: {lightness.toFixed(0)}%</Label>
            <Slider value={[lightness]} onValueChange={(v) => setLightness(v[0])} min={-50} max={50} step={1} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            {equatorColors.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Label htmlFor={`color-${index}`} className="text-xs">Node {index+1}</Label>
                    <Input id={`color-${index}`} type="color" value={color} onChange={e => handleColorChange(index, e.target.value)} className="w-12 h-8 p-1" />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
