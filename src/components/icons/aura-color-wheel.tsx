
"use client";

import React, { useRef, useEffect } from 'react';

export interface AuraColorWheelProps {
  size: number;
  onColorSelect?: (color: string) => void;
  constructionLayers?: {
    showBase?: boolean;
    showWhiteAura?: boolean;
    showColorFields?: boolean;
    showSeparators?: boolean;
    showVignette?: boolean;
  }
}

export const AuraColorWheel: React.FC<AuraColorWheelProps> = ({ size = 400, onColorSelect, constructionLayers }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const center = size / 2;
    const innerRadius = size * 0.1;
    const outerRadius = size / 2;

    // 1. Black background base
    if (constructionLayers?.showBase !== false) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, size, size);
    } else {
      ctx.clearRect(0,0,size,size);
    }


    // 2. White center aura with soft glow
    if (constructionLayers?.showWhiteAura !== false) {
        const whiteGrad = ctx.createRadialGradient(center, center, 0, center, center, outerRadius);
        whiteGrad.addColorStop(0, 'white');
        whiteGrad.addColorStop(0.3, 'rgba(255,255,255,0.5)'); // Glow fade
        whiteGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = whiteGrad;
        ctx.beginPath();
        ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
        ctx.fill();
    }


    // 3. 4 color fields (90° each, clockwise from top)
    if (constructionLayers?.showColorFields !== false) {
        const colorFields = [
          { start: -Math.PI / 2, colors: ['purple', 'orange'], middle: 'red' },       // Top
          { start: 0, colors: ['orange', 'green'], middle: 'yellow' },        // Right
          { start: Math.PI / 2, colors: ['green', 'blue'], middle: 'turquoise' },  // Bottom
          { start: Math.PI, colors: ['blue', 'purple'], middle: 'blueviolet' } // Left
        ];

        ctx.globalCompositeOperation = 'screen'; // Aura-like glow blend

        colorFields.forEach((field) => {
          const grad = ctx.createConicGradient(field.start, center, center);
          
          grad.addColorStop(0, field.colors[0]);
          grad.addColorStop(0.125, field.middle);
          grad.addColorStop(0.25, field.colors[1]);
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(center, center);
          ctx.arc(center, center, outerRadius, field.start, field.start + Math.PI / 2);
          ctx.closePath();
          ctx.fill();
        });
    }


    // 4. Thinner black separations (45° arcs, with hueless/gray fades)
    if (constructionLayers?.showSeparators !== false) {
        const separations = [-Math.PI / 4, Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4];
        
        ctx.globalCompositeOperation = 'multiply'; // Darken for separation
        
        separations.forEach((angle) => {
          const desatGrad = ctx.createRadialGradient(center, center, innerRadius, center, center, outerRadius);
          desatGrad.addColorStop(0, 'white'); // Inner white
          desatGrad.addColorStop(0.5, 'gray'); // Mid desaturation (hueless)
          desatGrad.addColorStop(1, 'black'); // Outer black

          ctx.fillStyle = desatGrad;
          ctx.beginPath();
          ctx.moveTo(center, center);
          ctx.arc(center, center, outerRadius, angle - Math.PI / 8, angle + Math.PI / 8); // Thinner arc
          ctx.closePath();
          ctx.fill();
        });
    }

    // 5. Fade to black at the outer edge (vignette)
    if (constructionLayers?.showVignette !== false) {
        ctx.globalCompositeOperation = 'multiply';
        const vignette = ctx.createRadialGradient(center, center, innerRadius * 2, center, center, outerRadius);
        vignette.addColorStop(0, 'rgba(255,255,255,1)');
        vignette.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, size, size);
    }


    ctx.globalCompositeOperation = 'source-over'; // Reset

    // Interaction: Pick color on click
    const handleClick = (e: MouseEvent) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const data = ctx.getImageData(x, y, 1, 1).data;
        const color = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
        if (onColorSelect) onColorSelect(color);
    };

    canvas.addEventListener('click', handleClick);
    
    return () => {
        if (canvas) {
          canvas.removeEventListener('click', handleClick);
        }
    }
  }, [size, onColorSelect, constructionLayers]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ cursor: 'crosshair' }} />;
};

// For backward compatibility if other files import QuaternionLogo
export const QuaternionLogo = AuraColorWheel;
