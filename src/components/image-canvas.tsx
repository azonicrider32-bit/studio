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
import { debounce } from "@/lib/utils";
import { handleApiError } from "@/lib/error-handling";
import { SegmentHoverPreview } from "./segment-hover-preview";
import { rgbToHsv, rgbToLab } from "@/lib/color-utils";


interface ImageCanvasProps {
  imageUrl: string | undefined;
  segmentationMask: string | null;
  setSegmentationMask: (mask: string | null) => void;
  activeTool: string;
  lassoSettings: LassoSettings;
  magicWandSettings: MagicWandSettings;
  negativeMagicWandSettings: MagicWandSettings;
  onLassoSettingChange: (settings: Partial<LassoSettings>) => void;
  onMagicWandSettingChange: (settings: Partial<MagicWandSettings>) => void;
  onNegativeMagicWandSettingChange: (settings: Partial<MagicWandSettings>) => void;
  activeLassoScrollSetting: keyof LassoSettings | null;
  activeWandScrollSetting: keyof MagicWandSettings['tolerances'] | null;
  canvasMousePos: { x: number; y: number } | null;
  setCanvasMousePos: (pos: { x: number; y: number } | null) => void;
  getCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  getSelectionMaskRef: React.MutableRefObject<(() => string | undefined) | undefined>;
  clearSelectionRef: React.MutableRefObject<(() => void) | undefined>;
}

export function ImageCanvas({
  imageUrl,
  segmentationMask,
  setSegmentationMask,
  activeTool,
  lassoSettings,
  magicWandSettings,
  negativeMagicWandSettings,
  onLassoSettingChange,
  onMagicWandSettingChange,
  onNegativeMagicWandSettingChange,
  activeLassoScrollSetting,
  activeWandScrollSetting,
  canvasMousePos,
  setCanvasMousePos,
  getCanvasRef,
  getSelectionMaskRef,
  clearSelectionRef,
}: ImageCanvasProps) {
  const image = PlaceHolderImages.find(img => img.imageUrl === imageUrl);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const selectionEngineRef = React.useRef<SelectionEngine | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [hoveredSegment, setHoveredSegment] = React.useState<Segment | null>(null);


  const { toast } = useToast();
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    if (getSelectionMaskRef) {
      getSelectionMaskRef.current = () => selectionEngineRef.current?.selectionToMaskData();
    }
    if (clearSelectionRef) {
      clearSelectionRef.current = () => {
        selectionEngineRef.current?.clearSelection();
        drawOverlay();
      }
    }
  }, [getSelectionMaskRef, clearSelectionRef]);


  const drawOverlay = React.useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;
    if (!overlayCanvas || !engine) return;

    const overlayCtx = overlayCanvas.getContext('2d');
    if (overlayCtx) {
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      engine.renderSelection(overlayCtx);
      if (hoveredSegment && activeTool === 'magic-wand' && !magicWandSettings.useAiAssist) {
        engine.renderHoverSegment(overlayCtx, hoveredSegment);
      }
    }
  }, [hoveredSegment, activeTool, magicWandSettings.useAiAssist]);


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
    getCanvasRef.current = canvas;
    console.log("Selection Engine Initialized");
  }, [image, getCanvasRef]);

  const handleImageLoad = () => {
    initEngine();
  }
  
  React.useEffect(() => {
    if (selectionEngineRef.current) {
        selectionEngineRef.current.updateSettings(lassoSettings, magicWandSettings, negativeMagicWandSettings);
    }
  }, [lassoSettings, magicWandSettings, negativeMagicWandSettings]);


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
    } catch (error: any) {
        handleApiError(error, toast, {
            title: "Lasso AI Failed",
            description: 'Using manual path instead.'
        });
        if (engine.isDrawingLasso) {
            engine.endLasso();
        }
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
        if (lassoSettings.useEdgeSnapping) {
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


  const getMousePos = (canvasEl: HTMLCanvasElement, evt: React.MouseEvent | React.WheelEvent) => {
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

  const handleMagicWandClick = async (pos: { x: number, y: number }) => {
    const engine = selectionEngineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;
    
    setIsProcessing(true);
    setSegmentationMask(null);
    engine.clearSelection();

    try {
        if (!magicWandSettings.useAiAssist) {
            toast({ title: "Creating selection..." });
            engine.magicWand(pos.x, pos.y);
            drawOverlay();
            toast({ title: "Selection created." });
            setIsProcessing(false);
            return;
        }

        toast({ title: "Magic Wand is thinking...", description: "AI is analyzing the pattern." });

        const searchRadius = 15;
        const initialSelectionMask = engine.createCircularMask(pos.x, pos.y, searchRadius);

        const input: MagicWandAssistedSegmentationInput = {
            photoDataUri: canvas.toDataURL(),
            initialSelectionMask: initialSelectionMask,
            contentType: 'region with similar texture and pattern'
        };
        
        const result = await magicWandAssistedSegmentation(input);

        if (result.isSuccessful && result.maskDataUri) {
            setSegmentationMask(result.maskDataUri);
            toast({ title: "AI Segmentation successful!" });
        } else {
             throw new Error(result.message || "AI failed to produce a mask.");
        }
    } catch (error: any) {
        handleApiError(error, toast, {
            title: "Magic Wand Failed",
            description: "Could not perform segmentation."
        });
        engine.clearSelection();
        drawOverlay();
    } finally {
        setIsProcessing(false);
    }
  };

  const sampleExclusionColor = (pos: { x: number, y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    const x = Math.floor(pos.x);
    const y = Math.floor(pos.y);
    
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const hsv = rgbToHsv(r, g, b);
    const lab = rgbToLab(r, g, b);
    
    onNegativeMagicWandSettingChange({
        ...negativeMagicWandSettings,
        seedColor: { r,g,b, ...hsv, ...lab }
    })


    toast({
        title: "Exclusion Color Sampled",
        description: `RGB: (${r}, ${g}, ${b})`,
    });
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
    } else if (activeTool === 'pipette-minus') {
        sampleExclusionColor(pos);
    }
  };
  
  const debouncedWandPreview = React.useCallback(
    debounce((x: number, y: number) => {
      const engine = selectionEngineRef.current;
      if (!engine || magicWandSettings.useAiAssist) {
        setHoveredSegment(null);
        drawOverlay();
        return;
      };
      const segment = engine.magicWand(x, y, true); // Preview only
      setHoveredSegment(segment);
      drawOverlay();
    }, 50),
    [drawOverlay, magicWandSettings.useAiAssist] 
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;
    if (!canvas || !engine || isProcessing) return;

    const pos = getMousePos(canvas, e);
    setCanvasMousePos(pos);

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
    setCanvasMousePos(null);
    drawOverlay();
  }

  const handleMouseUp = () => {
    // With the node-based lasso, mouse up doesn't end the drawing.
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1; // Invert scroll for natural feel (scroll up = increase)
    const engine = selectionEngineRef.current;

    if (activeTool === 'lasso' && engine && engine.isDrawingLasso && activeLassoScrollSetting) {
        let step = 0.05;
        if (activeLassoScrollSetting === 'snapRadius') step = 1;

        let currentValue = lassoSettings[activeLassoScrollSetting];
        let min = 0, max = 1;

        switch(activeLassoScrollSetting) {
            case 'snapRadius': min = 1; max = 20; break;
            case 'snapThreshold': min = 0.05; max = 1; break;
            case 'curveStrength': min = 0; max = 1; break;
            case 'directionalStrength': min = 0; max = 1; break;
            case 'cursorInfluence': min = 0; max = 1; break;
        }
        
        let newValue = currentValue + delta * step;
        newValue = Math.max(min, Math.min(max, newValue));

        onLassoSettingChange({ [activeLassoScrollSetting]: newValue });

        const pos = getMousePos(e.currentTarget, e);
        engine.updateLassoPreview(pos.x, pos.y);
        drawOverlay();

    } else if (activeTool === 'magic-wand' && activeWandScrollSetting) {
        const key = activeWandScrollSetting;
        const currentTolerance = magicWandSettings.tolerances[key];
        let step = 1;
        if (key === 'h') step = 2; // Hue is more sensitive
        if (key === 's' || key === 'v' || key === 'l') step = 2;

        let newValue = currentTolerance + delta * step;
        
        let max = 100;
        if (key === 'r' || key === 'g' || key === 'b') max = 255;
        if (key === 'h') max = 180;
        if (key === 'a' || key === 'b_lab') max = 128;


        newValue = Math.max(0, Math.min(max, newValue));

        onMagicWandSettingChange({
            tolerances: {
                ...magicWandSettings.tolerances,
                [key]: newValue,
            }
        });
    }
  };


  if (!imageUrl) {
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
                src={imageUrl}
                alt={image?.description || "Workspace image"}
                fill
                className="object-contain"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
                key={imageUrl} 
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
          onWheel={handleWheel}
          className="absolute top-0 left-0 h-full w-full object-contain"
          style={{ cursor: activeTool === 'magic-wand' ? 'crosshair' : activeTool === 'lasso' ? 'crosshair' : activeTool === 'pipette-minus' ? 'copy' : 'default' }}
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

    