

"use client";

import Image from "next/image";
import * as React from 'react';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SelectionEngine } from "@/lib/selection-engine";
import { intelligentLassoAssistedPathSnapping } from "@/ai/flows/intelligent-lasso-assisted-path-snapping";
import { magicWandAssistedSegmentation, MagicWandAssistedSegmentationInput } from "@/ai/flows/magic-wand-assisted-segmentation";
import { LassoSettings, MagicWandSettings, Segment, Layer } from "@/lib/types";
import { handleApiError } from "@/lib/error-handling";
import { rgbToHsv, rgbToLab } from "@/lib/color-utils";


interface ImageCanvasProps {
  imageUrl: string | undefined;
  layers: Layer[];
  addLayer: (layer: Layer) => void;
  updateLayer: (layerId: string, updatedPixels: Set<number>, newBounds: Layer['bounds']) => void;
  removePixelsFromLayers: (pixelsToRemove: Set<number>) => void;
  activeLayerId: string | null;
  onLayerSelect: (id: string) => void;
  segmentationMask: string | null;
  setSegmentationMask: (mask: string | null) => void;
  activeTool: string;
  lassoSettings: LassoSettings;
  magicWandSettings: MagicWandSettings;
  negativeMagicWandSettings: MagicWandSettings;
  onLassoSettingChange: (settings: Partial<LassoSettings>) => void;
  onMagicWandSettingChange: (settings: Partial<MagicWandSettings>) => void;
  onNegativeMagicWandSettingChange: (settings: Partial<MagicWandSettings>) => void;
  canvasMousePos: { x: number; y: number } | null;
  setCanvasMousePos: (pos: { x: number; y: number } | null) => void;
  getCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  getSelectionEngineRef: React.MutableRefObject<SelectionEngine | null>;
  getSelectionMaskRef: React.MutableRefObject<(() => string | undefined) | undefined>;
  clearSelectionRef: React.MutableRefObject<(() => void) | undefined>;
  isLassoPreviewHovered: boolean;
  mainCanvasZoom: number;
  pan: {x: number, y: number};
  setPan: (pan: {x: number, y: number}) => void;
  onDragMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDragMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDragMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draggedLayer: Layer | null;
}

export function ImageCanvas({
  imageUrl,
  layers,
  addLayer,
  updateLayer,
  removePixelsFromLayers,
  activeLayerId,
  onLayerSelect,
  segmentationMask,
  setSegmentationMask,
  activeTool,
  lassoSettings,
  magicWandSettings,
  negativeMagicWandSettings,
  onLassoSettingChange,
  onMagicWandSettingChange,
  onNegativeMagicWandSettingChange,
  canvasMousePos,
  setCanvasMousePos,
  getCanvasRef,
  getSelectionEngineRef,
  getSelectionMaskRef,
  clearSelectionRef,
  isLassoPreviewHovered,
  mainCanvasZoom,
  pan,
  setPan,
  onDragMouseDown,
  onDragMouseMove,
  onDragMouseUp,
  draggedLayer,
}: ImageCanvasProps) {
  const image = PlaceHolderImages.find(img => img.imageUrl === imageUrl);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const layersCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const selectionEngineRef = React.useRef<SelectionEngine | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [hoveredSegment, setHoveredSegment] = React.useState<Segment | null>(null);
  const lassoMouseTraceRef = React.useRef<[number, number][]>([]);

  const [isPanning, setIsPanning] = React.useState(false);
  const lastPanPointRef = React.useRef({ x: 0, y: 0 });

  // Refs for throttling wand preview
  const lastPreviewTimeRef = React.useRef(0);
  const wandPreviewTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastMousePosRef = React.useRef<{x: number, y: number} | null>(null);
  const [cursorStyle, setCursorStyle] = React.useState('default');


  const { toast } = useToast();
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    if (getSelectionMaskRef) {
      getSelectionMaskRef.current = () => selectionEngineRef.current?.selectionToMaskData(layers);
    }
    if (clearSelectionRef) {
      clearSelectionRef.current = () => {
        drawOverlay();
      }
    }
  }, [getSelectionMaskRef, clearSelectionRef, layers]);


const drawLayers = React.useCallback(() => {
    const layersCanvas = layersCanvasRef.current;
    const mainImage = imageRef.current;
    if (!layersCanvas || !mainImage) return;

    const layersCtx = layersCanvas.getContext('2d');
    if (!layersCtx) return;

    layersCtx.clearRect(0, 0, layersCanvas.width, layersCanvas.height);

    const layerTree = layers.reduce((acc, layer) => {
        const currentLayer = draggedLayer?.id === layer.id ? draggedLayer : layer;
        
        const parentId = currentLayer.parentId || currentLayer.id;
        let parentGroup = acc.find(p => p.parent.id === parentId);

        if (currentLayer.parentId) { // It's a child mask
             if (parentGroup) {
                parentGroup.children.push(currentLayer);
            }
        } else { // It's a parent
             if (!parentGroup) {
                acc.push({ parent: currentLayer, children: [] });
            }
        }
        return acc;
    }, [] as { parent: Layer; children: Layer[] }[]);


    layerTree.forEach(({ parent: parentLayer, children: childMasks }) => {
        if (!parentLayer.visible) return;
        
        const tempParentCanvas = document.createElement('canvas');
        tempParentCanvas.width = layersCanvas.width;
        tempParentCanvas.height = layersCanvas.height;
        const tempParentCtx = tempParentCanvas.getContext('2d');
        if (!tempParentCtx) return;

        if (parentLayer.subType === 'path') {
            tempParentCtx.save();
            if (parentLayer.path && parentLayer.path.length > 1) {
                tempParentCtx.beginPath();
                tempParentCtx.moveTo(parentLayer.path[0][0], parentLayer.path[0][1]);
                for (let i = 1; i < parentLayer.path.length; i++) {
                    tempParentCtx.lineTo(parentLayer.path[i][0], parentLayer.path[i][1]);
                }
                if (parentLayer.closed) {
                    tempParentCtx.closePath();
                    if (parentLayer.fill) {
                        tempParentCtx.fillStyle = parentLayer.fill;
                        tempParentCtx.fill();
                    }
                }
                if (parentLayer.stroke && parentLayer.strokeWidth) {
                    tempParentCtx.strokeStyle = parentLayer.stroke;
                    tempParentCtx.lineWidth = parentLayer.strokeWidth;
                    tempParentCtx.stroke();
                }
            }
            tempParentCtx.restore();

        } else {
            const { x, y, width, height } = parentLayer.bounds;

            if (parentLayer.type === 'background') {
                tempParentCtx.drawImage(mainImage, 0, 0, layersCanvas.width, layersCanvas.height);
            } else if (parentLayer.imageData) {
                 const tempImageCanvas = document.createElement('canvas');
                tempImageCanvas.width = parentLayer.imageData.width;
                tempImageCanvas.height = parentLayer.imageData.height;
                const tempImageCtx = tempImageCanvas.getContext('2d');
                if(tempImageCtx) {
                    tempImageCtx.putImageData(parentLayer.imageData, 0, 0);
                    tempParentCtx.drawImage(tempImageCanvas, x, y, width, height);
                }
            }
            
            const visibleMasks = childMasks.filter(m => m.subType === 'mask' && m.visible);
            if (visibleMasks.length > 0) {
                const tempMaskCanvas = document.createElement('canvas');
                tempMaskCanvas.width = layersCanvas.width;
                tempMaskCanvas.height = layersCanvas.height;
                const tempMaskCtx = tempMaskCanvas.getContext('2d');
                if(tempMaskCtx) {
                    tempMaskCtx.fillStyle = 'black'; 
                    tempMaskCtx.fillRect(0, 0, tempMaskCanvas.width, tempMaskCanvas.height);
                    
                    tempMaskCtx.globalCompositeOperation = 'destination-out';
                    visibleMasks.forEach(mask => {
                        mask.pixels.forEach(pixelIndex => {
                            const x = pixelIndex % layersCanvas.width;
                            const y = Math.floor(pixelIndex / layersCanvas.width);
                            tempMaskCtx.fillStyle = 'white'; 
                            tempMaskCtx.fillRect(x, y, 1, 1);
                        });
                    });
                    tempMaskCtx.globalCompositeOperation = 'source-over';
                    
                    tempParentCtx.globalCompositeOperation = 'destination-in';
                    tempParentCtx.drawImage(tempMaskCanvas, 0, 0);
                    tempParentCtx.globalCompositeOperation = 'source-over'; 
                }
            }
        }

        layersCtx.drawImage(tempParentCanvas, 0, 0);
    });
}, [layers, draggedLayer]);


  const drawOverlay = React.useCallback((currentHoverSegment: Segment | null = hoveredSegment) => {
    const overlayCanvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;
    if (!overlayCanvas || !engine) return;

    const overlayCtx = overlayCanvas.getContext('2d');
    if (overlayCtx) {
      engine.renderSelection(overlayCtx, layers, magicWandSettings, lassoSettings, currentHoverSegment, draggedLayer, activeLayerId, activeTool);
    }
  }, [magicWandSettings, lassoSettings, layers, hoveredSegment, draggedLayer, activeLayerId, activeTool]);

  React.useEffect(() => {
    drawLayers();
    drawOverlay();
  }, [layers, drawLayers, drawOverlay, magicWandSettings.showAllMasks, lassoSettings.showAllMasks, draggedLayer]);


  const initEngine = React.useCallback(() => {
    if (!imageRef.current) return;
    const canvas = canvasRef.current;
    const layersCanvas = layersCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas || !image || !layersCanvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const img = imageRef.current;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    overlayCanvas.width = img.naturalWidth;
    overlayCanvas.height = img.naturalHeight;
    layersCanvas.width = img.naturalWidth;
    layersCanvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

    selectionEngineRef.current = new SelectionEngine(canvas, ctx, layers);
    getSelectionEngineRef.current = selectionEngineRef.current;
    selectionEngineRef.current.initialize();
    getCanvasRef.current = canvas;
    console.log("Selection Engine Initialized");
  }, [image, getCanvasRef, getSelectionEngineRef, layers]);

  const handleImageLoad = () => {
    initEngine();
  }
  
  React.useEffect(() => {
    if (selectionEngineRef.current) {
        selectionEngineRef.current.updateSettings(lassoSettings, magicWandSettings, negativeMagicWandSettings);
        selectionEngineRef.current.updateLayers(layers);
    }
  }, [lassoSettings, magicWandSettings, negativeMagicWandSettings, layers]);


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
            const newLayer = engine.endLassoWithEnhancedPath(response.enhancedPath);
            if (newLayer) addLayer(newLayer);
            toast({ title: 'Lasso path enhanced by AI!' });
        } else {
            const newLayer = engine.endLasso(activeLayerId);
            if (newLayer) addLayer(newLayer);
            toast({ title: 'Lasso path completed.', description: 'AI could not enhance path, used manual path.' });
        }
    } catch (error: any) {
        handleApiError(error, toast, {
            title: "Lasso AI Failed",
            description: 'Using manual path instead.'
        });
        if (engine.isDrawingLasso) {
            const newLayer = engine.endLasso(activeLayerId);
            if (newLayer) addLayer(newLayer);
        }
    } finally {
        setIsProcessing(false);
        drawOverlay();
    }
  }, [drawOverlay, toast, addLayer, activeLayerId]);

  const endLineAndProcess = React.useCallback(async () => {
    const engine = selectionEngineRef.current;
    if (!engine || !engine.isDrawingLine) return;

    const newLayer = engine.endLine(activeLayerId);
    if (newLayer) addLayer(newLayer);
    drawOverlay();
    toast({ title: 'Line path completed.' });
  }, [addLayer, activeLayerId, drawOverlay, toast]);


  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = selectionEngineRef.current;
      if (!engine) return;
      
      if (e.key === 'Enter') {
          e.preventDefault();
          if (engine.isDrawingLasso) {
            if (lassoSettings.useAiEnhancement) {
                endLassoAndProcess();
            } else {
                const newLayer = engine.endLasso(activeLayerId);
                if (newLayer) addLayer(newLayer);
                drawOverlay();
                toast({ title: 'Lasso path completed.' });
            }
          } else if(engine.isDrawingLine) {
            endLineAndProcess();
          }
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        if (engine.isDrawingLasso) {
            engine.cancelLasso();
            drawOverlay();
            toast({ title: 'Lasso cancelled.' });
        } else if (engine.isDrawingLine) {
            engine.cancelLine();
            drawOverlay();
            toast({ title: 'Line cancelled.' });
        }
      }

      if (e.key === 'Backspace' && (engine.isDrawingLasso || engine.isDrawingLine)) {
        e.preventDefault();
        engine.removeLastNode();
        drawOverlay();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, toast, drawOverlay, endLassoAndProcess, endLineAndProcess, lassoSettings.useAiEnhancement, addLayer, activeLayerId]);


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

  const handleMagicWandClick = async (pos: { x: number, y: number }, e: React.MouseEvent<HTMLCanvasElement>) => {
    const engine = selectionEngineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const shiftKey = e.shiftKey;
    const ctrlKey = e.ctrlKey || e.metaKey;
    
    setIsProcessing(true);
    setSegmentationMask(null);

    try {
        if (!magicWandSettings.ignoreExistingSegments) {
            const clickedPixelIndex = Math.floor(pos.y) * engine.width + Math.floor(pos.x);
            const clickedLayer = layers.find(l => l.visible && (l.type === 'segmentation' || l.subType === 'mask') && l.pixels.has(clickedPixelIndex));

            if (clickedLayer) {
                onLayerSelect(clickedLayer.id);
                 if (shiftKey && activeLayerId && activeLayerId === clickedLayer.id) {
                    // Continue to add to this already selected layer
                } else if (!shiftKey && !ctrlKey) {
                    toast({ title: `Layer "${clickedLayer.name}" selected.` });
                    setIsProcessing(false);
                    drawOverlay(); // Redraw to show selection
                    return;
                }
            }
        }

        if (magicWandSettings.useAiAssist) {
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
        } else {
            const segment = engine.magicWand(pos.x, pos.y, true);
            if (!segment || segment.pixels.size === 0) {
              toast({ title: "Selection empty", description: "Magic Wand could not find any matching pixels."});
              setIsProcessing(false);
              return;
            };

            if(ctrlKey) {
              toast({ title: "Subtracting from selection..." });
              removePixelsFromLayers(segment.pixels);
              toast({ title: "Subtraction complete."});

            } else if (shiftKey && activeLayerId && activeLayerId !== 'background-0') {
              const activeLayer = layers.find(l => l.id === activeLayerId);
              if (activeLayer) {
                toast({ title: "Adding to selection..." });
                const combinedPixels = new Set([...activeLayer.pixels, ...segment.pixels]);
                
                let minX = activeLayer.bounds.x, minY = activeLayer.bounds.y;
                let maxX = activeLayer.bounds.x + activeLayer.bounds.width;
                let maxY = activeLayer.bounds.y + activeLayer.bounds.height;

                segment.pixels.forEach(p => {
                    const x = p % engine.width;
                    const y = Math.floor(p / engine.width);
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                })

                const newBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                updateLayer(activeLayerId, combinedPixels, newBounds);
                toast({ title: "Addition complete." });
              }
            } else {
              toast({ title: "Creating new selection..." });
              const newLayer = engine.createLayerFromPixels(segment.pixels, activeLayerId);
              if (newLayer) addLayer(newLayer);
              toast({ title: "New selection created." });
            }
            drawOverlay();
        }
    } catch (error: any) {
        handleApiError(error, toast, {
            title: "Magic Wand Failed",
            description: "Could not perform segmentation."
        });
    } finally {
        setIsProcessing(false);
        drawOverlay();
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
    
    if (e.button === 2 || (activeTool === 'pan' && e.button === 0)) {
        setIsPanning(true);
        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        return;
    }
    
    if (activeTool === 'transform' && e.button === 0) {
        onDragMouseDown(e);
        return;
    }


    if (e.button === 0) {
      if (activeTool === 'lasso') {
        if (!engine.isDrawingLasso) {
          engine.startLasso(pos.x, pos.y);
          lassoMouseTraceRef.current = [[pos.x, pos.y]];
          toast({ title: 'Lasso started', description: 'Click to add points. Double-click or Press Enter to complete.' });
        } else {
          engine.addLassoNode(lassoMouseTraceRef.current);
          lassoMouseTraceRef.current = [];
        }
      } else if (activeTool === 'line') {
        if (!engine.isDrawingLine) {
          engine.startLine(pos.x, pos.y);
        } else {
          engine.addNodeToLine();
        }
      } else if (activeTool === 'magic-wand') {
          handleMagicWandClick(pos, e);
      } else if (activeTool === 'pipette-minus') {
          sampleExclusionColor(pos);
      }
      drawOverlay();
    }
  };
  
  const triggerWandPreview = React.useCallback((x: number, y: number) => {
      const engine = selectionEngineRef.current;
      if (!engine || magicWandSettings.useAiAssist) {
        setHoveredSegment(null);
        drawOverlay(null);
        return;
      };
      const segment = engine.magicWand(x, y, true); // Preview only
      setHoveredSegment(segment as Segment | null);
      drawOverlay(segment as Segment | null);
  }, [drawOverlay, magicWandSettings.useAiAssist]);

  const throttledWandPreview = (x: number, y: number) => {
    const now = Date.now();
    const lastExecution = lastPreviewTimeRef.current;
    const throttleDelay = 200;

    if (now - lastExecution > throttleDelay) {
      if (!lastMousePosRef.current || lastMousePosRef.current.x !== x || lastMousePosRef.current.y !== y) {
        triggerWandPreview(x, y);
        lastPreviewTimeRef.current = now;
        lastMousePosRef.current = { x, y };
      }
    } else {
      if (wandPreviewTimeoutRef.current) {
        clearTimeout(wandPreviewTimeoutRef.current);
      }
      wandPreviewTimeoutRef.current = setTimeout(() => {
        if (!lastMousePosRef.current || lastMousePosRef.current.x !== x || lastMousePosRef.current.y !== y) {
            triggerWandPreview(x, y);
            lastPreviewTimeRef.current = Date.now();
            lastMousePosRef.current = { x, y };
        }
      }, throttleDelay - (now - lastExecution));
    }
  };


  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;

    if (isPanning) {
        const deltaX = e.clientX - lastPanPointRef.current.x;
        const deltaY = e.clientY - lastPanPointRef.current.y;
        setPan({
            x: pan.x + deltaX / mainCanvasZoom,
            y: pan.y + deltaY / mainCanvasZoom
        });
        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        return;
    }
    
    if (activeTool === 'transform') {
        onDragMouseMove(e);
    }

    if (!canvas || !engine || isProcessing) return;

    const pos = getMousePos(canvas, e);
    setCanvasMousePos(pos);

    // Dynamic cursor update
    const mainCanvas = canvasRef.current;
    const mainCtx = mainCanvas?.getContext('2d', { willReadFrequently: true });
    if(mainCtx) {
        const R = 8; // cursor radius
        const startX = Math.max(0, Math.floor(pos.x - R));
        const startY = Math.max(0, Math.floor(pos.y - R));
        const width = Math.min(mainCanvas.width - startX, 2 * R);
        const height = Math.min(mainCanvas.height - startY, 2 * R);
        
        if (width > 0 && height > 0) {
          const imageData = mainCtx.getImageData(startX, startY, width, height);
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < imageData.data.length; i += 4) {
              r += imageData.data[i];
              g += imageData.data[i + 1];
              b += imageData.data[i + 2];
              count++;
          }
          const avgR = r / count;
          const avgG = g / count;
          const avgB = b / count;
          const luminance = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;
          const contrastColor = luminance > 0.5 ? 'black' : 'white';
          
          const circleRadius = 8;
          const dotRadius = 1;
          const svg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="${circleRadius}" stroke="${contrastColor}" stroke-width="2" stroke-opacity="0.5" fill="none" />
              <circle cx="12" cy="${12 - circleRadius/2}" r="${dotRadius}" fill="${contrastColor}" />
              <circle cx="12" cy="${12 + circleRadius/2}" r="${dotRadius}" fill="${contrastColor}" />
              <circle cx="${12 - circleRadius/2}" cy="12" r="${dotRadius}" fill="${contrastColor}" />
              <circle cx="${12 + circleRadius/2}" cy="12" r="${dotRadius}" fill="${contrastColor}" />
          </svg>`;
          setCursorStyle(`url("data:image/svg+xml;base64,${btoa(svg)}") 12 12, crosshair`);
        }
    }

    if (activeTool === 'lasso') {
      if (engine.isDrawingLasso) {
        lassoMouseTraceRef.current.push([pos.x, pos.y]);
        engine.updateLassoPreview(pos.x, pos.y, lassoMouseTraceRef.current);
        drawOverlay();
      }
    } else if (activeTool === 'line') {
      if (engine.isDrawingLine) {
        engine.updateLinePreview(pos.x, pos.y);
        drawOverlay();
      }
    } else if (activeTool === 'magic-wand') {
        throttledWandPreview(pos.x, pos.y);
    }
  };
  
  const handleMouseLeave = () => {
    setHoveredSegment(null);
    drawOverlay(null);
    setIsPanning(false);
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'transform') {
        onDragMouseUp(e);
    }
    if (e.button === 2 || activeTool === 'pan') {
      setIsPanning(false);
    }
  };

  const handleDoubleClick = () => {
    const engine = selectionEngineRef.current;
    if (!engine) return;
    
    if (activeTool === 'lasso' && engine.isDrawingLasso) {
      if (lassoSettings.useAiEnhancement) {
        endLassoAndProcess();
      } else {
        const newLayer = engine.endLasso(activeLayerId);
        if (newLayer) addLayer(newLayer);
        drawOverlay();
        toast({ title: 'Lasso path completed.' });
      }
    } else if (activeTool === 'line' && engine.isDrawingLine) {
      endLineAndProcess();
    }
  };


  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (isLassoPreviewHovered) {
        return;
    }
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const engine = selectionEngineRef.current;

    if (activeTool === 'lasso' && engine && engine.isDrawingLasso) {
        const modes: LassoSettings['drawMode'][] = ['magic', 'polygon', 'free'];
        const currentIndex = modes.indexOf(lassoSettings.drawMode);
        let nextIndex = currentIndex + delta;
        if (nextIndex < 0) nextIndex = modes.length - 1;
        if (nextIndex >= modes.length) nextIndex = 0;
        
        onLassoSettingChange({ drawMode: modes[nextIndex] });

        const pos = getMousePos(e.currentTarget, e);
        engine.updateLassoPreview(pos.x, pos.y, lassoMouseTraceRef.current);
        drawOverlay();

    } else if (activeTool === 'magic-wand') {
        
        const newTolerances = { ...magicWandSettings.tolerances };
        let changed = false;

        magicWandSettings.scrollAdjustTolerances.forEach(key => {
            const currentTolerance = newTolerances[key];
            let step = 1;
            if (key === 'h') step = 2;
            if (key === 's' || key === 'v' || key === 'l') step = 2;

            let newValue = currentTolerance + delta * step;
            
            let max = 100;
            if (key === 'r' || key === 'g' || key === 'b') max = 255;
            if (key === 'h') max = 180;
            if (key === 'a' || key === 'b_lab') max = 128;

            newValue = Math.max(0, Math.min(max, newValue));
            newTolerances[key] = newValue;
            changed = true;
        });

        if (changed) {
            onMagicWandSettingChange({ tolerances: newTolerances });
        }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }
  
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'pan') return 'grab';
    if (activeTool === 'transform') return 'move';
    return cursorStyle;
  }
  
  const isBackgroundVisible = layers.find(l => l.type === 'background')?.visible ?? true;


  if (!imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <p>Image not found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-full h-full overflow-hidden" style={{ cursor: getCursor() }}>
        <div 
          className="relative w-full h-full" 
          style={{ 
            transform: `scale(${mainCanvasZoom}) translate(${pan.x}px, ${pan.y}px)`, 
            transformOrigin: 'center center' 
          }}
        >
            {isClient && (
                <Image
                    ref={imageRef}
                    src={imageUrl}
                    alt={image?.description || "Workspace image"}
                    fill
                    className="object-contain pointer-events-none"
                    style={{ opacity: isBackgroundVisible ? 1 : 0 }}
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
            ref={layersCanvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain pointer-events-none"
            />
            <canvas
            ref={overlayCanvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className="absolute top-0 left-0 h-full w-full object-contain"
            />
            {segmentationMask && (
            <Image
                src={segmentationMask}
                alt="Segmentation Mask"
                fill
                className="object-contain opacity-50 pointer-events-none"
            />
            )}
        </div>
      </div>
    </div>
  );
}

