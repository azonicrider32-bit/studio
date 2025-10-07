"use client";

import React, { useRef, useEffect, useState } from 'react';

interface DynamicColorCircleProps {
    size: number;
    equatorColors: string[];
    poleInner: string;
    poleOuter: string;
    onColorSelect?: (color: string) => void;
}

export const DynamicColorCircle: React.FC<DynamicColorCircleProps> = ({ 
    size = 400, 
    equatorColors, 
    poleInner, 
    poleOuter,
    onColorSelect 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const center = size / 2;
    const eqRadius = center * 0.7; // Equator ring radius
    const ringWidth = 40;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // 1. Fill background (optional, for context)
    ctx.fillStyle = '#1f2937'; // slate-800
    ctx.fillRect(0,0,size,size);

    // 2. Inner pole gradient (to white/lum)
    const innerGrad = ctx.createRadialGradient(center, center, 0, center, center, eqRadius - ringWidth / 2);
    innerGrad.addColorStop(0, poleInner);
    innerGrad.addColorStop(1, 'transparent');
    ctx.globalCompositeOperation = 'lighten';
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(center, center, eqRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';


    // 3. Equator hue ring with gradients
    if (equatorColors.length > 0) {
        const hueGrad = ctx.createConicGradient(0, center, center);
        equatorColors.forEach((col, i) => {
            hueGrad.addColorStop(i / equatorColors.length, col)
        });
        // Close the loop
        hueGrad.addColorStop(1, equatorColors[0]);

        ctx.strokeStyle = hueGrad;
        ctx.lineWidth = ringWidth;
        ctx.beginPath();
        ctx.arc(center, center, eqRadius, 0, Math.PI * 2);
        ctx.stroke();
    }


    // 4. Outer pole fade (to black/sat)
    const outerGrad = ctx.createRadialGradient(center, center, eqRadius + ringWidth / 2, center, center, center);
    outerGrad.addColorStop(0, 'transparent');
    outerGrad.addColorStop(1, poleOuter);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(center, center, center, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';


    // Interaction to pick color
     const handleClick = (e: MouseEvent) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        if (onColorSelect) {
            onColorSelect(color);
        }
    };

    canvas.addEventListener('click', handleClick);
    
    return () => {
        if (canvas) {
          canvas.removeEventListener('click', handleClick);
        }
    }


  }, [size, poleInner, poleOuter, equatorColors, onColorSelect]);


  return <canvas ref={canvasRef} width={size} height={size} style={{ cursor: 'crosshair'}} />;
};
