

"use client";

import Image from "next/image";
import * as React from 'react';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SelectionEngine } from "@/lib/selection-engine";
import { intelligentLassoAssistedPathSnapping } from "@/ai/flows/intelligent-lasso-assisted-path-snapping";
import { magicWandAssistedSegmentation, MagicWandAssistedSegmentationInput } from "@/ai/flows/magic-wand-assisted-segmentation";
import { LassoSettings, MagicWandSettings, Segment, Layer, CloneStampSettings } from "@/lib/types";
import { handleApiError } from "@/lib/error-handling";
import { rgbToHsv, rgbToLab } from "@/lib/color-utils";
import { debounce } from "@/lib/utils";


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
  cloneStampSettings: CloneStampSettings;
  onLassoSettingChange: (settings: Partial<LassoSettings>) => void;
  onMagicWandSettingChange: (settings: Partial<MagicWandSettings>) => void;
  onNegativeMagicWandSettingChange: (settings: Partial<MagicWandSettings>) => void;
  onCloneStampSettingsChange: (settings: Partial<CloneStampSettings>) => void; // Added this prop
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
  showHorizontalRuler: boolean;
  showVerticalRuler: boolean;
  showGuides: boolean;
}

const HorizontalRuler = ({ width, zoom, panX }: { width: number, zoom: number, panX: number }) => {
    const rulerRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = rulerRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rulerHeight = 30;
        canvas.width = canvas.offsetWidth;
        canvas.height = rulerHeight;

        ctx.clearRect(0, 0, canvas.width, rulerHeight);
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, rulerHeight);
        ctx.strokeStyle = '#4b5563';
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        const panOffset = panX * zoom;

        for (let i = 0; i < width * zoom; i += 10) {
            const x = i + panOffset;
            if (x < 0 || x > canvas.width) continue;
            
            let tickHeight = 5;
            if (i % 50 === 0) tickHeight = 10;
            if (i % 100 === 0) tickHeight = 15;

            ctx.beginPath();
            ctx.moveTo(x, rulerHeight);
            ctx.lineTo(x, rulerHeight - tickHeight);
            ctx.stroke();

            if (i % 100 === 0) {
                ctx.fillText(Math.round(i / zoom).toString(), x, rulerHeight - tickHeight - 2);
            }
        }
    }, [width, zoom, panX]);

    return <canvas ref={rulerRef} className="absolute top-0 left-0 w-full h-[30px]" style={{ zIndex: 50}}/>
}


const VerticalRuler = ({ height, zoom, panY }: { height: number, zoom: number, panY: number }) => {
    const rulerRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = rulerRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rulerWidth = 30;
        canvas.width = rulerWidth;
        canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, rulerWidth, canvas.height);
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, rulerWidth, canvas.height);
        ctx.strokeStyle = '#4b5563';
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';

        const panOffset = panY * zoom;

        for (let i = 0; i < height * zoom; i += 10) {
            const y = i + panOffset;
            if (y < 0 || y > canvas.height) continue;
            
            let tickWidth = 5;
            if (i % 50 === 0) tickWidth = 10;
            if (i % 100 === 0) tickWidth = 15;

            ctx.beginPath();
            ctx.moveTo(rulerWidth, y);
            ctx.lineTo(rulerWidth - tickWidth, y);
            ctx.stroke();

            if (i % 100 === 0) {
                ctx.save();
                ctx.translate(rulerWidth - tickWidth - 2, y);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(Math.round(i / zoom).toString(), 0, 0);
                ctx.restore();
            }
        }
    }, [height, zoom, panY]);

    return <canvas ref={rulerRef} className="absolute top-0 left-0 w-[30px] h-full" style={{ zIndex: 50}}/>
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
  cloneStampSettings,
  onLassoSettingChange,
  onMagicWandSettingChange,
  onNegativeMagicWandSettingChange,
  onCloneStampSettingsChange,
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
  showHorizontalRuler,
  showVerticalRuler,
  showGuides,
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
  const lastDropTimeRef = React.useRef(0);

  // Clone Stamp State
  const [cloneSource, setCloneSource] = React.useState<{x: number, y: number} | null>(null);
  const [ghostPreview, setGhostPreview] = React.useState<HTMLCanvasElement | null>(null);
  const [isSampling, setIsSampling] = React.useState(false);
  const [isCloning, setIsCloning] = React.useState(false);
  const lastStampPosRef = React.useRef<{ x: number, y: number } | null>(null);

  // Animated Cursor state
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
      
      if (activeTool === 'clone' && ghostPreview && canvasMousePos) {
          overlayCtx.save();
          overlayCtx.globalAlpha = 0.5;
          overlayCtx.drawImage(
              ghostPreview,
              canvasMousePos.x - cloneStampSettings.brushSize / 2,
              canvasMousePos.y - cloneStampSettings.brushSize / 2,
              cloneStampSettings.brushSize,
              cloneStampSettings.brushSize
          );
          overlayCtx.restore();
      }

      if(showGuides && canvasMousePos) {
          overlayCtx.save();
          overlayCtx.strokeStyle = 'hsla(var(--primary), 0.5)';
          overlayCtx.lineWidth = 1;
          overlayCtx.setLineDash([4, 4]);

          // Horizontal guide
          overlayCtx.beginPath();
          overlayCtx.moveTo(0, canvasMousePos.y);
          overlayCtx.lineTo(overlayCanvas.width, canvasMousePos.y);
          overlayCtx.stroke();

          // Vertical guide
          overlayCtx.beginPath();
          overlayCtx.moveTo(canvasMousePos.x, 0);
          overlayCtx.lineTo(canvasMousePos.x, overlayCanvas.y);
          overlayCtx.stroke();
          
          overlayCtx.restore();
      }
    }
  }, [magicWandSettings, lassoSettings, layers, hoveredSegment, draggedLayer, activeLayerId, activeTool, showGuides, canvasMousePos, ghostPreview, cloneStampSettings]);

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
            prompt: 'the main subject',
            cost_function: 'sobel',
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

  const endLineAndProcess = React.useCallback(async (closed: boolean) => {
    const engine = selectionEngineRef.current;
    if (!engine || !engine.isDrawingLine) return;

    const newLayer = engine.endLine(activeLayerId, closed, lassoSettings.fillPath);
    if (newLayer) addLayer(newLayer);
    drawOverlay();
    toast({ title: 'Line path completed.' });
  }, [addLayer, activeLayerId, drawOverlay, toast, lassoSettings.fillPath]);


  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = selectionEngineRef.current;
      
      if (e.key === 'Alt') {
        setIsSampling(true);
      }

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
            endLineAndProcess(false);
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
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsSampling(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    }
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

  const updateGhostPreview = React.useCallback(() => {
    const sourceCanvas = layersCanvasRef.current;
    if (!sourceCanvas || !cloneSource) return;

    const { brushSize, angle, sourceLayer, flipX, flipY } = cloneStampSettings;
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = brushSize;
    tempCanvas.height = brushSize;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.save();
    tempCtx.translate(brushSize / 2, brushSize / 2);
    tempCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    tempCtx.rotate(angle * Math.PI / 180);
    tempCtx.translate(-brushSize / 2, -brushSize / 2);
    
    tempCtx.drawImage(
      sourceCanvas,
      cloneSource.x - brushSize / 2,
      cloneSource.y - brushSize / 2,
      brushSize,
      brushSize,
      0,
      0,
      brushSize,
      brushSize
    );
    
    tempCtx.restore();
    setGhostPreview(tempCanvas);
    
  }, [cloneSource, cloneStampSettings]);

  React.useEffect(() => {
    if (activeTool === 'clone' && cloneSource) {
      updateGhostPreview();
    }
  }, [cloneSource, cloneStampSettings, activeTool, updateGhostPreview]);
  
  const stampClone = (x: number, y: number) => {
    const targetCanvas = layersCanvasRef.current;
    if (!targetCanvas || !ghostPreview || !cloneSource) return;

    const targetCtx = targetCanvas.getContext('2d');
    if (!targetCtx) return;

    const dx = x - (lastStampPosRef.current?.x || x);
    const dy = y - (lastStampPosRef.current?.y || y);

    setCloneSource(prev => prev ? { x: prev.x + dx, y: prev.y + dy } : null);
    
    targetCtx.save();
    targetCtx.globalAlpha = cloneStampSettings.opacity / 100;
    targetCtx.drawImage(
        ghostPreview,
        x - cloneStampSettings.brushSize / 2,
        y - cloneStampSettings.brushSize / 2,
        cloneStampSettings.brushSize,
        cloneStampSettings.brushSize
    );
    targetCtx.restore();

    lastStampPosRef.current = { x, y };
  }


  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    const engine = selectionEngineRef.current;
    if (!canvas || isProcessing) return;

    const pos = getMousePos(canvas, e);
    
    if (activeTool === 'clone' && isSampling) {
        setCloneSource(pos);
        lastStampPosRef.current = null;
        toast({ title: "Clone source set!" });
        return;
    }
    
    if (activeTool === 'clone' && cloneSource) {
        setIsCloning(true);
        stampClone(pos.x, pos.y);
        return;
    }
    
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

    if (!engine) return;

    if (e.button === 0) {
      if (activeTool === 'lasso') {
        if (!engine.isDrawingLasso) {
          engine.startLasso(pos.x, pos.y);
          lassoMouseTraceRef.current = [[pos.x, pos.y]];
          lastDropTimeRef.current = Date.now();
          toast({ title: 'Lasso started', description: 'Click to add points. Double-click or Press Enter to complete.' });
        } else if (lassoSettings.drawMode !== 'free') {
          engine.addLassoNode(lassoMouseTraceRef.current);
          lassoMouseTraceRef.current = [];
        }
      } else if (activeTool === 'line') {
        if (!engine.isDrawingLine) {
          engine.startLine(pos.x, pos.y);
          lastDropTimeRef.current = Date.now();
        } else if (lassoSettings.drawMode !== 'free') {
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

  const debouncedWandPreview = React.useMemo(
    () => debounce(triggerWandPreview, magicWandSettings.debounceDelay),
    [triggerWandPreview, magicWandSettings.debounceDelay]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;

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

    if (!canvas || isProcessing) return;
    const engine = selectionEngineRef.current;
    
    const pos = getMousePos(canvas, e);
    setCanvasMousePos(pos);
    
    if (isCloning && activeTool === 'clone') {
        stampClone(pos.x, pos.y);
    }
    
    if (!engine) return;
    
    const isFreeDraw = (activeTool === 'lasso' || activeTool === 'line') && lassoSettings.drawMode === 'free';

    if (isFreeDraw && (engine.isDrawingLasso || engine.isDrawingLine)) {
        const lastNode = engine.isDrawingLasso ? engine.lassoNodes[engine.lassoNodes.length-1] : engine.lineNodes[engine.lineNodes.length-1];
        if(!lastNode) return;
        
        const dist = Math.hypot(pos.x - lastNode[0], pos.y - lastNode[1]);
        const timePassed = Date.now() - lastDropTimeRef.current;
        const { minDistance, maxDistance, dropInterval } = lassoSettings.freeDraw;

        if (dist > minDistance && (timePassed > dropInterval || dist > maxDistance)) {
            if (activeTool === 'lasso') engine.addLassoNode([]);
            if (activeTool === 'line') engine.addNodeToLine();
            lastDropTimeRef.current = Date.now();
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
        debouncedWandPreview(pos.x, pos.y);
    }
  };
  
  const handleMouseLeave = () => {
    setHoveredSegment(null);
    drawOverlay(null);
    setIsPanning(false);
    setIsCloning(false);
    lastStampPosRef.current = null;
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'transform') {
        onDragMouseUp(e);
    }
    if (e.button === 2 || activeTool === 'pan') {
      setIsPanning(false);
    }
    if (activeTool === 'clone') {
      setIsCloning(false);
      lastStampPosRef.current = null;
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
        const pos = getMousePos(e.currentTarget, e);
        let isClosed = false;

        for(let i = 0; i < engine.lineNodes.length - 1; i++) {
            const node = engine.lineNodes[i];
            const dist = Math.hypot(pos.x - node[0], pos.y - node[1]);
            if (dist < (globalSettings.snapRadius / mainCanvasZoom)) {
                isClosed = true;
                break;
            }
        }
        
        endLineAndProcess(isClosed);
    }
  };


  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (isLassoPreviewHovered) {
        return;
    }
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;

    if (activeTool === 'clone' && cloneSource) {
      if(e.shiftKey) {
          onCloneStampSettingsChange({ brushSize: Math.max(1, cloneStampSettings.brushSize + delta * 5) });
      } else if (e.ctrlKey) {
          onCloneStampSettingsChange({ softness: Math.max(0, Math.min(100, cloneStampSettings.softness + delta * 5)) });
      } else if (e.altKey) {
          onCloneStampSettingsChange({ opacity: Math.max(0, Math.min(100, cloneStampSettings.opacity + delta * 5)) });
      } else {
          onCloneStampSettingsChange({ angle: (cloneStampSettings.angle + delta * cloneStampSettings.rotationStep + 360) % 360 });
      }
      return;
    }

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
            onMagicWandSettingsChange({ tolerances: newTolerances });
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
    if (activeTool === 'clone' && isSampling) return 'crosshair';
    if (activeTool === 'clone' && cloneSource) {
      const size = cloneStampSettings.brushSize * mainCanvasZoom;
      const cursorCanvas = document.createElement('canvas');
      cursorCanvas.width = size;
      cursorCanvas.height = size;
      const cursorCtx = cursorCanvas.getContext('2d');
      if (cursorCtx) {
        cursorCtx.strokeStyle = 'white';
        cursorCtx.lineWidth = 2;
        cursorCtx.setLineDash([2, 2]);
        cursorCtx.beginPath();
        cursorCtx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI);
        cursorCtx.stroke();
        cursorCtx.strokeStyle = 'black';
        cursorCtx.setLineDash([]);
        cursorCtx.stroke();
      }
      return `url(${cursorCanvas.toDataURL()}) ${size/2} ${size/2}, crosshair`;
    }
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
            transformOrigin: 'center center',
            paddingTop: showHorizontalRuler ? 30 : 0,
            paddingLeft: showVerticalRuler ? 30 : 0,
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
        {showHorizontalRuler && canvasRef.current && (
            <HorizontalRuler width={canvasRef.current.width} zoom={mainCanvasZoom} panX={pan.x} />
        )}
        {showVerticalRuler && canvasRef.current && (
            <VerticalRuler height={canvasRef.current.height} zoom={mainCanvasZoom} panY={pan.y} />
        )}
      </div>
    </div>
  );
}
    

