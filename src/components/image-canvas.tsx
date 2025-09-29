"use client";

import Image from "next/image";
import * as React from 'react';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SelectionEngine } from "@/lib/selection-engine";

interface ImageCanvasProps {
  segmentationMask: string | null;
  activeTool: string;
}

export function ImageCanvas({ segmentationMask, activeTool }: ImageCanvasProps) {
  const image = PlaceHolderImages.find(img => img.id === "pro-segment-ai-1");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const selectionEngineRef = React.useRef<SelectionEngine | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const { toast } = useToast();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = image.imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      overlayCanvas.width = img.width;
      overlayCanvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      selectionEngineRef.current = new SelectionEngine(canvas, ctx);
      selectionEngineRef.current.initialize();
    };
  }, [image]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTool !== 'lasso' || !selectionEngineRef.current) return;
      
      if (e.key === 'Enter' && selectionEngineRef.current.isDrawingLasso) {
        selectionEngineRef.current.endLasso();
        const overlayCtx = overlay.getContext('2d');
        if (overlayCtx) selectionEngineRef.current.renderSelection(overlayCtx);
        toast({ title: 'Lasso path completed!' });
      }
      
      if (e.key === 'Escape' && selectionEngineRef.current.isDrawingLasso) {
        selectionEngineRef.current.cancelLasso();
        const overlayCtx = overlay.getContext('2d');
        if (overlayCtx) selectionEngineRef.current.renderSelection(overlayCtx);
        toast({ title: 'Lasso cancelled.' });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, toast]);


  const getMousePos = (canvas: HTMLCanvasElement, evt: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;
    if (!canvas || !engine) return;

    const pos = getMousePos(canvas, e);
    
    if (activeTool === 'lasso') {
      if (!engine.isDrawingLasso) {
        engine.startLasso(pos.x, pos.y);
        toast({ title: 'Lasso started', description: 'Click to add points. Press Enter to complete or Escape to cancel.' });
      } else {
        engine.addLassoNode(pos.x, pos.y);
      }
      setIsDrawing(true);
      const overlayCtx = canvas.getContext('2d');
      if (overlayCtx) engine.renderSelection(overlayCtx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;
    if (!canvas || !engine || activeTool !== 'lasso' || !engine.isDrawingLasso) return;

    const pos = getMousePos(canvas, e);
    engine.updateLassoPreview(pos.x, pos.y);
    const overlayCtx = canvas.getContext('2d');
    if (overlayCtx) engine.renderSelection(overlayCtx);
  };
  
  const handleMouseUp = () => {
    // With the node-based lasso, mouse up doesn't end the drawing.
    // Kept for other potential tools.
  };

  if (!image) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <p>Image not found</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-background p-4 md:p-8">
      <Card className="relative aspect-[4/3] w-full max-w-5xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 h-full w-full object-cover"
        />
        <canvas
          ref={overlayCanvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="absolute top-0 left-0 h-full w-full object-cover"
          style={{ cursor: activeTool === 'lasso' ? 'crosshair' : 'default' }}
        />
        {segmentationMask && (
          <Image
            src={segmentationMask}
            alt="Segmentation Mask"
            fill
            className="object-contain opacity-50 pointer-events-none"
          />
        )}
      </Card>
    </div>
  );
}
