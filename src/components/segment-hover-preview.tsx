"use client";

import React, { useEffect, useRef } from 'react';
import { Segment } from '@/lib/types';

interface SegmentHoverPreviewProps {
  segment: Segment | null;
  mousePos: { x: number; y: number } | null;
  canvas: HTMLCanvasElement | null;
}

export function SegmentHoverPreview({ segment, mousePos, canvas }: SegmentHoverPreviewProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const size = 128; // Size of the preview window
  const zoom = 4;   // Zoom level inside the preview

  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas || !segment || !canvas) return;

    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

    previewCtx.imageSmoothingEnabled = false;
    previewCtx.clearRect(0, 0, size, size);

    // Calculate the source rectangle on the main canvas
    const sourceSize = size / zoom;
    const sourceX = segment.bounds.x + segment.bounds.width / 2 - sourceSize / 2;
    const sourceY = segment.bounds.y + segment.bounds.height / 2 - sourceSize / 2;

    // Draw the zoomed-in image content
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

    // Draw the segment overlay
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if(tempCtx) {
        tempCtx.fillStyle = 'rgba(3, 169, 244, 0.5)';
        segment.pixels.forEach(idx => {
            const x = idx % canvas.width;
            const y = Math.floor(idx / canvas.width);
            tempCtx.fillRect(x, y, 1, 1);
        });

        previewCtx.drawImage(
            tempCanvas,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            size,
            size
        );
    }
    

  }, [segment, canvas, size, zoom]);

  if (!segment || !mousePos) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-full border-2 border-white shadow-2xl overflow-hidden"
      style={{
        left: mousePos.x - size / 2,
        top: mousePos.y - size / 2,
        width: size,
        height: size,
      }}
    >
      <canvas ref={previewCanvasRef} width={size} height={size} />
       <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-px h-full bg-white/50"></div>
        <div className="h-px w-full bg-white/50 absolute"></div>
      </div>
    </div>
  );
}

    