"use client";

import Image from "next/image";
import * as React from 'react';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SelectionEngine } from "@/lib/selection-engine";
import { intelligentLassoAssistedPathSnapping } from "@/ai/flows/intelligent-lasso-assisted-path-snapping";
import { magicWandAssistedSegmentation, MagicWandAssistedSegmentationInput } from "@/ai/flows/magic-wand-assisted-segmentation";
import { LassoSettings, MagicWandSettings, Segment } from "@/lib/types";
import { SegmentHoverPreview } from "./segment-hover-preview";
import { debounce } from "@/lib/utils";


interface ImageCanvasProps {
  segmentationMask: string | null;
  setSegmentationMask: (mask: string | null) => void;
  activeTool: string;
  lassoSettings: LassoSettings;
  magicWandSettings: MagicWandSettings;
}

export function ImageCanvas({ segmentationMask, setSegmentationMask, activeTool, lassoSettings, magicWandSettings }: ImageCanvasProps) {
  const image = PlaceHolderImages.find(img => img.id === "pro-segment-ai-1");
  const imageRef = React.useRef<HTMLImageElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const selectionEngineRef = React.useRef<SelectionEngine | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [hoveredSegment, setHoveredSegment] = React.useState<Segment | null>(null);
  const [mousePos, setMousePos] = React.useState<{ x: number, y: number } | null>(null);


  const { toast } = useToast();
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const drawOverlay = React.useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;
    if (!overlayCanvas || !engine) return;

    const overlayCtx = overlayCanvas.getContext('2d');
    if (overlayCtx) {
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      engine.renderSelection(overlayCtx);
      if (hoveredSegment && activeTool === 'magic-wand') {
        engine.renderHoverSegment(overlayCtx, hoveredSegment);
      }
    }
  }, [hoveredSegment, activeTool]);


  const initEngine = React.useCallback(() => {
    if (!imageRef.current) return;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas || !image) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const img = imageRef.current;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    overlayCanvas.width = img.naturalWidth;
    overlayCanvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

    selectionEngineRef.current = new SelectionEngine(canvas, ctx);
    selectionEngineRef.current.initialize();
    console.log("Selection Engine Initialized");
  }, [image]);

  const handleImageLoad = () => {
    initEngine();
  }
  
  React.useEffect(() => {
    if (selectionEngineRef.current) {
        selectionEngineRef.current.updateSettings(lassoSettings, magicWandSettings);
    }
  }, [lassoSettings, magicWandSettings]);


  const endLassoAndProcess = React.useCallback(async () => {
    const engine = selectionEngineRef.current;
    if (!engine || !engine.isDrawingLasso) return;

    try {
        const path = engine.getLassoPath(true);
        if (path.length < 3) {
            engine.cancelLasso();
            drawOverlay();
            return;
        }

        setIsProcessing(true);
        toast({ title: 'Intelligent Lasso is thinking...', description: 'Please wait for the AI to enhance the path.' });

        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Canvas not found");

        const response = await intelligentLassoAssistedPathSnapping({
            photoDataUri: canvas.toDataURL(),
            lassoPath: engine.lassoNodes.map(n => ({x: n[0], y: n[1]})),
            prompt: 'the main subject'
        });

        if (response.enhancedPath && response.enhancedPath.length > 2) {
            engine.endLassoWithEnhancedPath(response.enhancedPath);
            toast({ title: 'Lasso path enhanced by AI!' });
        } else {
            engine.endLasso();
            toast({ title: 'Lasso path completed.', description: 'AI could not enhance path, used manual path.' });
        }
    } catch (error) {
        console.error("Lasso enhancement failed:", error);
        toast({ variant: 'destructive', title: 'Lasso AI Failed', description: 'Using manual path instead.' });
        engine.endLasso();
    } finally {
        setIsProcessing(false);
        drawOverlay();
    }
  }, [drawOverlay, toast]);


  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = selectionEngineRef.current;
      if (!engine || !engine.isDrawingLasso) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        if (settings.useEdgeSnapping) {
            endLassoAndProcess();
        } else {
            engine.endLasso();
            drawOverlay();
            toast({ title: 'Lasso path completed.' });
        }
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        engine.cancelLasso();
        drawOverlay();
        toast({ title: 'Lasso cancelled.' });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, toast, drawOverlay, endLassoAndProcess, lassoSettings.useEdgeSnapping]);


  const getMousePos = (canvasEl: HTMLCanvasElement, evt: React.MouseEvent) => {
    const rect = canvasEl.getBoundingClientRect();
    const imageEl = imageRef.current;
    if (!imageEl) return { x: 0, y: 0 };

    const imageAspectRatio = imageEl.naturalWidth / imageEl.naturalHeight;
    const canvasAspectRatio = rect.width / rect.height;

    let renderWidth = rect.width;
    let renderHeight = rect.height;
    let xOffset = 0;
    let yOffset = 0;

    if (imageAspectRatio > canvasAspectRatio) {
        renderHeight = rect.width / imageAspectRatio;
        yOffset = (rect.height - renderHeight) / 2;
    } else {
        renderWidth = rect.height * imageAspectRatio;
        xOffset = (rect.width - renderWidth) / 2;
    }
    
    const clientX = evt.clientX - rect.left - xOffset;
    const clientY = evt.clientY - rect.top - yOffset;

    const imageX = (clientX / renderWidth) * imageEl.naturalWidth;
    const imageY = (clientY / renderHeight) * imageEl.naturalHeight;

    return { x: imageX, y: imageY };
  };

  const handleMagicWandClick = async (pos: { x: number, y: number }, contentType?: string) => {
    const engine = selectionEngineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;
    
    setIsProcessing(true);
    setSegmentationMask(null);
    toast({ title: "Magic Wand is thinking...", description: "AI is refining the selection." });

    try {
        const initialSelection = engine.magicWand(pos.x, pos.y);
        drawOverlay();

        const input: MagicWandAssistedSegmentationInput = {
            photoDataUri: canvas.toDataURL(),
            contentType: contentType || 'object',
            modelId: 'googleai/gemini-2.5-flash-segment-it-preview',
            initialSelectionMask: engine.selectionToMaskData(initialSelection),
        };
        
        const result = await magicWandAssistedSegmentation(input);

        if (result.maskDataUri) {
            setSegmentationMask(result.maskDataUri);
            toast({ title: "AI Segmentation successful!" });
        } else {
            throw new Error(result.message || "AI failed to produce a mask.");
        }
    } catch (error: any) {
        console.error("Magic Wand segmentation failed:", error);
        toast({
            variant: "destructive",
            title: "Magic Wand Failed",
            description: error.message || "Could not perform segmentation."
        });
        engine.clearSelection();
        drawOverlay();
    } finally {
        setIsProcessing(false);
    }
};

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;
    if (!canvas || !engine || isProcessing) return;

    const pos = getMousePos(canvas, e);
    
    if (activeTool === 'lasso') {
      if (!engine.isDrawingLasso) {
        engine.startLasso(pos.x, pos.y);
        toast({ title: 'Lasso started', description: 'Click to add points. Press Enter to complete or Escape to cancel.' });
      } else {
        engine.addLassoNode(); 
      }
      drawOverlay();
    } else if (activeTool === 'magic-wand') {
        handleMagicWandClick(pos);
    }
  };
  
  const debouncedWandPreview = React.useCallback(
    debounce((x: number, y: number) => {
      const engine = selectionEngineRef.current;
      if (!engine) return;
      const segment = engine.magicWand(x, y, true); // Preview only
      setHoveredSegment(segment);
      drawOverlay();
    }, 50),
    [drawOverlay] 
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;
    if (!canvas || !engine || isProcessing) return;

    const pos = getMousePos(canvas, e);
    setMousePos({ x: e.clientX, y: e.clientY });

    if (activeTool === 'lasso') {
      if (engine.isDrawingLasso) {
        engine.updateLassoPreview(pos.x, pos.y);
        drawOverlay();
      }
    } else if (activeTool === 'magic-wand') {
        debouncedWandPreview(pos.x, pos.y);
    }
  };
  
  const handleMouseLeave = () => {
    setHoveredSegment(null);
    setMousePos(null);
    drawOverlay();
  }

  const handleMouseUp = () => {
    // With the node-based lasso, mouse up doesn't end the drawing.
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
        {isClient && (
             <Image
                ref={imageRef}
                src={image.imageUrl}
                alt={image.description}
                fill
                className="object-contain"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
            />
        )}
       
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 h-full w-full object-contain opacity-0 pointer-events-none"
        />
        <canvas
          ref={overlayCanvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="absolute top-0 left-0 h-full w-full object-contain"
          style={{ cursor: activeTool === 'magic-wand' ? 'crosshair' : activeTool === 'lasso' ? 'crosshair' : 'default' }}
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
      {hoveredSegment && mousePos && activeTool === 'magic-wand' && (
        <SegmentHoverPreview
            canvas={canvasRef.current}
            segment={hoveredSegment}
        />
      )}
    </div>
  );
}

    