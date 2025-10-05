
"use client";

import React, { useRef, useEffect } from 'react';

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function QuaternionColorWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    const center = size / 2;

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) / (2 * Math.PI) + 0.5;

        let r, g, b;

        if (dist > center) {
          [r, g, b] = [255, 255, 255];
        } else {
          const saturation = dist / center;
          const value = 1.0;
          [r, g, b] = hsvToRgb(angle, saturation, value);
        }
        
        const index = (y * size + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

  }, []);

  return (
    <div className="p-4">
        <h3 className="font-headline text-lg">Quaternion Color Wheel</h3>
        <p className="text-sm text-muted-foreground mb-4">A projection of the RGB color space.</p>
        <canvas ref={canvasRef} width="300" height="300" className="rounded-full border shadow-inner"></canvas>
    </div>
  );
}
