

"use client"

import * as React from "react"
import Image from "next/image"
import {
  Bot,
  Brush,
  Eraser,
  Feather as FeatherIcon,
  Layers as LayersIcon,
  Palette,
  Settings2,
  SlidersHorizontal,
  Wand2,
  Image as ImageIcon,
  MinusCircle,
  AreaChart,
  BrainCircuit,
  Link,
  Replace,
  Move,
  Frame,
  Contrast,
  GripVertical,
  Scan,
  ZoomIn,
  Hand,
  MessageSquare,
  PenTool,
  History,
  Undo2,
  Redo2,
  ChevronDown,
} from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { LassoIcon } from "./icons/lasso-icon"
import { MagicWandPanel } from "./panels/magic-wand-panel"
import { BrushPanel } from "./panels/brush-panel"
import { LayerAdjustmentPanel } from "./panels/layer-adjustment-panel"
import { CannyTuningPanel } from "./panels/canny-tuning-panel"
import { ImageCanvas } from "./image-canvas"
import { LayersPanel } from "./panels/layers-panel"
import { AiModelsPanel } from "./panels/ai-models-panel"
import { InpaintingPanel } from "./panels/inpainting-panel"
import { FeatherPanel } from "./panels/feather-panel"
import { LassoSettings, MagicWandSettings, FeatherSettings, Layer } from "@/lib/types"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { PipetteMinusIcon } from "./icons/pipette-minus-icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { SelectionEngine } from "@/lib/selection-engine"
import { ToolSettingsPanel } from "./panels/tool-settings-panel"
import { TelemetryPanel } from "./panels/telemetry-panel"
import { ColorAnalysisPanel } from "./panels/color-analysis-panel"
import { AssetDrawer } from "./asset-drawer"
import { ToolPanel } from "./tool-panel"
import { cn } from "@/lib/utils"
import { PixelZoomPanel } from "./panels/pixel-zoom-panel"
import { SegmentHoverPreview } from "./segment-hover-preview"
import { Slider } from "./ui/slider"
import { AiChatPanel } from "./panels/ai-chat-panel"
import { useSelectionDrag } from "@/hooks/use-selection-drag"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "adjustments" | "pipette-minus" | "clone" | "transform" | "pan" | "line";
type TopPanel = 'zoom' | 'feather' | 'layers' | 'ai';
type BottomPanel = 'telemetry' | 'history' | 'color-analysis' | 'pixel-preview' | 'chat';

function ProSegmentAIContent() {
  const [activeTool, setActiveTool] = React.useState<Tool>("line")
  const [segmentationMask, setSegmentationMask] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | undefined>(PlaceHolderImages[0]?.imageUrl);
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = React.useState(false);
  const [rightPanelWidth, setRightPanelWidth] = React.useState(380);
  const isResizingRef = React.useRef(false);
  const { toast } = useToast()
  
  const [activeTopPanel, setActiveTopPanel] = React.useState<TopPanel | null>('layers');
  const [activeBottomPanel, setActiveBottomPanel] = React.useState<BottomPanel | null>(null);
  
  const [zoomA, setZoomA] = React.useState(1.0);
  const [zoomB, setZoomB] = React.useState(4.0);
  const [activeZoom, setActiveZoom] = React.useState<'A' | 'B'>('A');
  const [hoveredZoom, setHoveredZoom] = React.useState<'A' | 'B' | null>(null);

  const mainCanvasZoom = activeZoom === 'A' ? zoomA : zoomB;

  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [history, setHistory] = React.useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const maxHistorySize = 100;

  const [layers, setLayers] = React.useState<Layer[]>(() => {
    const backgroundLayer: Layer = {
      id: "background-0",
      name: "Background",
      type: 'background',
      subType: 'pixel',
      visible: true,
      locked: true,
      pixels: new Set(),
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      modifiers: [],
    };
    return [backgroundLayer];
  });
  const [activeLayerId, setActiveLayerId] = React.useState<string | null>(layers[0]?.id);

  const [draggedLayerId, setDraggedLayerId] = React.useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);

  const {
    draggedLayer,
    isDragging,
    handleMouseDown: handleDragMouseDown,
    handleMouseMove: handleDragMouseMove,
    handleMouseUp: handleDragMouseUp,
  } = useSelectionDrag(layers, setLayers, activeTool, mainCanvasZoom);
  
  const [lassoSettings, setLassoSettings] = React.useState<LassoSettings>({
    drawMode: 'magic',
    useAiEnhancement: false,
    showMouseTrace: true,
    showAllMasks: true,
    snapRadius: 20,
    snapThreshold: 0.3,
    curveStrength: 0.05,
    directionalStrength: 0.2,
    cursorInfluence: 0.1,
    traceInfluence: 0.2,
    colorInfluence: 0.0,
    snapRadiusEnabled: true,
    snapThresholdEnabled: true,
    curveStrengthEnabled: true,
    directionalStrengthEnabled: false,
    cursorInfluenceEnabled: true,
    traceInfluenceEnabled: true,
    colorInfluenceEnabled: false,
    useColorAwareness: false,
  });
  const [magicWandSettings, setMagicWandSettings] = React.useState<MagicWandSettings>({
    tolerances: { r: 30, g: 30, b: 30, h: 10, s: 20, v: 20, l: 20, a: 10, b_lab: 10 },
    contiguous: true,
    useAiAssist: false,
    createAsMask: false,
    showAllMasks: true,
    ignoreExistingSegments: false,
    enabledTolerances: new Set(['h', 's', 'v']),
    scrollAdjustTolerances: new Set(),
    searchRadius: 15,
    sampleMode: 'point',
    useAntiAlias: true,
    useFeather: false,
    highlightColorMode: 'contrast',
    fixedHighlightColor: '#00aaff',
    highlightOpacity: 0.5,
    highlightTexture: 'lines',
    highlightBorder: {
        enabled: true,
        thickness: 1,
        color: '#ffffff',
        colorMode: 'contrast',
        pattern: 'dashed',
        opacity: 1,
    }
  });
  const [negativeMagicWandSettings, setNegativeMagicWandSettings] = React.useState<MagicWandSettings>({
    tolerances: { r: 10, g: 10, b: 10, h: 5, s: 10, v: 10, l: 10, a: 5, b_lab: 5 },
    contiguous: true,
    useAiAssist: false,
    createAsMask: false,
    showAllMasks: true,
    ignoreExistingSegments: false,
    enabledTolerances: new Set(),
    scrollAdjustTolerances: new Set(),
    searchRadius: 1,
    sampleMode: 'point',
    seedColor: undefined,
    useAntiAlias: true,
    useFeather: false,
    highlightColorMode: 'fixed',
    fixedHighlightColor: '#ff0000',
    highlightOpacity: 0.5,
    highlightTexture: 'solid',
    highlightBorder: {
        enabled: false,
        thickness: 1,
        color: '#ffffff',
        colorMode: 'fixed',
        pattern: 'solid',
        opacity: 1,
    },
  });
  const [featherSettings, setFeatherSettings] = React.useState<FeatherSettings>({
    antiAlias: { enabled: true, method: 'gaussian', quality: 'balanced' },
    smartFeather: {
      enabled: true,
      alphaMatting: { enabled: true, method: 'closed-form', quality: 0.85 },
      backgroundAdaptation: { enabled: true, sampleRadius: 8, adaptationStrength: 0.6, colorThreshold: 20 },
      gradientTransparency: { enabled: true, gradientRadius: 6, smoothness: 0.7, edgeAware: true },
      colorAwareProcessing: { enabled: true, haloPreventionStrength: 0.9, colorContextRadius: 10 }
    }
  });
  const [canvasMousePos, setCanvasMousePos] = React.useState<{ x: number, y: number } | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const selectionEngineRef = React.useRef<SelectionEngine | null>(null);
  const [isLassoPreviewHovered, setIsLassoPreviewHovered] = React.useState(false);
  const hoverTimeoutRef = React.useRef<{ A: NodeJS.Timeout | null, B: NodeJS.Timeout | null }>({ A: null, B: null });


  const getSelectionMaskRef = React.useRef<() => string | undefined>();
  const clearSelectionRef = React.useRef<() => void>();

  const addToHistory = React.useCallback((action: any) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        ...action,
        timestamp: Date.now(),
        id: `action_${Date.now()}_${Math.random()}`
      });

      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }

      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex, maxHistorySize]);

  const addLayer = (newLayer: Layer) => {
    setLayers(prev => [...prev, { ...newLayer, maskVisible: true }]);
    setActiveLayerId(newLayer.id);
    addToHistory({ type: 'add_layer', layer: newLayer });
  };

  const updateLayer = React.useCallback((layerId: string, updatedPixels: Set<number>, newBounds: Layer['bounds']) => {
    const oldLayer = layers.find(l => l.id === layerId);
    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        const engine = selectionEngineRef.current;
        if (!engine) return l;
        const newImageData = engine.createImageDataForLayer(updatedPixels, newBounds);
        return { ...l, pixels: updatedPixels, bounds: newBounds, imageData: newImageData };
      }
      return l;
    }));
    if (oldLayer) {
        addToHistory({ type: 'update_layer', layerId, oldPixels: oldLayer.pixels, newPixels: updatedPixels });
    }
  }, [layers, addToHistory]);

  const removePixelsFromLayers = React.useCallback((pixelsToRemove: Set<number>) => {
    const layersToUpdate: {layerId: string, oldPixels: Set<number>}[] = [];
    setLayers(prevLayers => {
      return prevLayers.map(layer => {
        if ((layer.type === 'segmentation' || layer.subType === 'mask') && layer.visible) {
          const originalSize = layer.pixels.size;
          const newPixels = new Set([...layer.pixels].filter(p => !pixelsToRemove.has(p)));
          if (newPixels.size < originalSize) {
            layersToUpdate.push({layerId: layer.id, oldPixels: layer.pixels});
            const engine = selectionEngineRef.current;
            if (!engine) return layer;
            const newBounds = engine.getBoundsForPixels(newPixels);
            const newImageData = layer.subType === 'pixel' ? engine.createImageDataForLayer(newPixels, newBounds) : undefined;
            return { ...layer, pixels: newPixels, bounds: newBounds, imageData: newImageData };
          }
        }
        return layer;
      });
    });
    if (layersToUpdate.length > 0) {
        addToHistory({ type: 'remove_pixels', layers: layersToUpdate, removedPixels: pixelsToRemove });
    }
  }, [addToHistory]);

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
    addToHistory({ type: 'toggle_visibility', layerId });
  };
  
  const toggleLayerLock = (layerId: string) => {
     if (layerId === "background-0") return;
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l));
     addToHistory({ type: 'toggle_lock', layerId });
  };

  const toggleLayerMask = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, maskVisible: !(l.maskVisible ?? true) } : l));
  };

  const deleteLayer = (layerId: string) => {
    if (layerId === "background-0") return; // Cannot delete background
    const layerToDelete = layers.find(l => l.id === layerId);
    if (!layerToDelete) return;

    setLayers(prev => prev.filter(l => l.id !== layerId && l.parentId !== layerId));
    addToHistory({ type: 'delete_layer', layer: layerToDelete });

    if (activeLayerId === layerId) {
      setActiveLayerId("background-0");
    }
  };

  const handleUndo = React.useCallback(() => {
    if (historyIndex < 0) return;
    const action = history[historyIndex];

    // TODO: Implement state reversal for different actions
    toast({ title: "Undo", description: `Reverted: ${action.type}` });

    setHistoryIndex(prev => prev - 1);
  }, [history, historyIndex, toast]);

  const handleRedo = React.useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const action = history[historyIndex + 1];

    // TODO: Implement state re-application for different actions
    toast({ title: "Redo", description: `Re-applied: ${action.type}` });

    setHistoryIndex(prev => prev + 1);
  }, [history, historyIndex, toast]);


  const handleLassoSettingsChange = (newSettings: Partial<LassoSettings>) => {
    setLassoSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleMagicWandSettingsChange = (newSettings: Partial<MagicWandSettings>) => {
    setMagicWandSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleNegativeMagicWandSettingsChange = (newSettings: Partial<MagicWandSettings>) => {
    setNegativeMagicWandSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const handleFeatherSettingsChange = (newSettings: Partial<FeatherSettings>) => {
    setFeatherSettings(prev => {
        const updated = { ...prev };
        if (newSettings.antiAlias) updated.antiAlias = { ...prev.antiAlias, ...newSettings.antiAlias };
        if (newSettings.smartFeather) {
            updated.smartFeather = { ...prev.smartFeather, ...newSettings.smartFeather };
            if (newSettings.smartFeather.alphaMatting) updated.smartFeather.alphaMatting = { ...prev.smartFeather.alphaMatting, ...newSettings.smartFeather.alphaMatting };
            if (newSettings.smartFeather.backgroundAdaptation) updated.smartFeather.backgroundAdaptation = { ...prev.smartFeather.backgroundAdaptation, ...newSettings.smartFeather.backgroundAdaptation };
            if (newSettings.smartFeather.gradientTransparency) updated.smartFeather.gradientTransparency = { ...prev.smartFeather.gradientTransparency, ...newSettings.smartFeather.gradientTransparency };
            if (newSettings.smartFeather.colorAwareProcessing) updated.smartFeather.colorAwareProcessing = { ...prev.smartFeather.colorAwareProcessing, ...newSettings.smartFeather.colorAwareProcessing };
        }
        return { ...updated, ...newSettings };
    });
  };

  const handleImageSelect = (url: string) => {
    setImageUrl(url);
    setSegmentationMask(null);
    if(clearSelectionRef.current) {
        clearSelectionRef.current();
    }
    setHistory([]);
    setHistoryIndex(-1);
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if(e.key.toLowerCase() === 'v') {
            setActiveTool('transform');
        }
        if(e.key.toLowerCase() === 'p') {
            setActiveTool('line');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            handleUndo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            handleRedo();
        }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);
  
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'ew-resize';
  };

  const handleMouseMoveResize = React.useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    setRightPanelWidth(prevWidth => {
      const newWidth = prevWidth - e.movementX;
      if (newWidth > 280 && newWidth < 600) {
        return newWidth;
      }
      return prevWidth;
    });
  }, []);

  const handleMouseUpResize = React.useCallback(() => {
    isResizingRef.current = false;
    document.body.style.cursor = 'default';
  }, []);

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMoveResize);
    window.addEventListener('mouseup', handleMouseUpResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveResize);
      window.removeEventListener('mouseup', handleMouseUpResize);
    };
  }, [handleMouseMoveResize, handleMouseUpResize]);

  const { toggleSidebar, state: sidebarState } = useSidebar();

  const renderLeftPanelContent = () => {
    switch(activeTool) {
      case 'magic-wand':
      case 'lasso':
      case 'line':
        return <ToolSettingsPanel 
                  magicWandSettings={magicWandSettings}
                  onMagicWandSettingsChange={handleMagicWandSettingsChange}
                  lassoSettings={lassoSettings}
                  onLassoSettingsChange={handleLassoSettingsChange}
                  activeTool={activeTool}
                />
      default:
        return <div className="p-4 text-sm text-muted-foreground">No settings for this tool.</div>
    }
  }

  const renderTopPanelContent = () => {
    if (!activeTopPanel) return null;

    const content = () => {
      switch (activeTopPanel) {
        case "zoom":
          return <PixelZoomPanel
            canvas={canvasRef.current}
            mousePos={canvasMousePos}
            selectionEngine={selectionEngineRef.current}
            onHoverChange={setIsLassoPreviewHovered}
            className="flex-1"
          />;
        case "feather":
          return <FeatherPanel settings={featherSettings} onSettingsChange={handleFeatherSettingsChange} />;
        case "layers":
          return <LayersPanel 
                  layers={layers}
                  activeLayerId={activeLayerId}
                  onLayerSelect={setActiveLayerId}
                  onToggleVisibility={toggleLayerVisibility}
                  onToggleLock={toggleLayerLock}
                  onToggleMask={toggleLayerMask}
                  onDeleteLayer={deleteLayer}
                  draggedLayerId={draggedLayerId}
                  setDraggedLayerId={setDraggedLayerId}
                  dropTargetId={dropTargetId}
                  setDropTargetId={setDropTargetId}
                  onDrop={(draggedId, targetId) => {
                    const draggedLayer = layers.find(l => l.id === draggedId);
                    if (!draggedLayer || draggedId === targetId || draggedLayer.parentId === targetId) return;

                    setLayers(currentLayers => {
                        const newLayers = currentLayers.map(l => {
                            // Detach from old parent
                            if (l.id === draggedId) {
                                return { ...l, parentId: targetId, subType: 'mask' as const };
                            }
                            return l;
                        }).filter(l => l.id !== draggedId); // remove from top level if it was there

                        const targetLayerIndex = newLayers.findIndex(l => l.id === targetId);
                        
                        if (targetLayerIndex > -1) {
                            // Don't add to itself.
                            if (newLayers[targetLayerIndex].modifiers?.find(m => m.id === draggedId)) return currentLayers;
                            
                             const draggedLayerWithParent = { ...draggedLayer, parentId: targetId, subType: 'mask' as const };
                             
                             const targetLayer = newLayers[targetLayerIndex];
                             const existingModifiers = targetLayer.modifiers || [];

                             newLayers[targetLayerIndex] = {
                                ...targetLayer,
                                modifiers: [...existingModifiers, draggedLayerWithParent]
                             };
                             
                             // Also update the layer in the main array
                             const draggedIndexInMain = newLayers.findIndex(l => l.id === draggedId);
                             if (draggedIndexInMain > -1) {
                                newLayers[draggedIndexInMain] = draggedLayerWithParent;
                             } else {
                                // If it wasn't a modifier before, it might not be in the main list anymore
                                // It should be part of its new parent's modifier list
                             }

                        }
                        
                        // return newLayers.filter(l => !l.parentId);
                        return newLayers;
                    });
                  }}
                />;
        case "ai":
          return (
            <Tabs defaultValue="models" className="flex h-full flex-col">
              <TabsList className="m-2 grid grid-cols-3">
                  <TabsTrigger value="models">Models</TabsTrigger>
                  <TabsTrigger value="canny">Canny</TabsTrigger>
                  <TabsTrigger value="inpaint">Inpainting</TabsTrigger>
              </TabsList>
              <TabsContent value="models" className="m-0 flex-1">
                  <AiModelsPanel setSegmentationMask={setSegmentationMask} setImageUrl={setImageUrl} />
              </TabsContent>
              <TabsContent value="canny" className="m-0 flex-1">
                  <CannyTuningPanel />
              </TabsContent>
              <TabsContent value="inpaint" className="m-0 flex-1">
                  <InpaintingPanel
                    imageUrl={imageUrl}
                    getSelectionMask={() => getSelectionMaskRef.current ? getSelectionMaskRef.current() : undefined}
                    onGenerationComplete={(newUrl) => handleImageSelect(newUrl)}
                    clearSelection={() => clearSelectionRef.current ? clearSelectionRef.current() : undefined}
                  />
              </TabsContent>
            </Tabs>
          );
        default:
          return null;
      }
    };
    
    return <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">{content()}</div>;
  };

  const renderBottomPanelContent = () => {
    if (!activeBottomPanel) return null;

    const content = () => {
        switch (activeBottomPanel) {
        case "telemetry":
            return <TelemetryPanel />;
        case "chat":
            return <AiChatPanel />;
        case "color-analysis":
            return (
            <ColorAnalysisPanel
                canvas={canvasRef.current}
                mousePos={canvasMousePos}
                magicWandSettings={magicWandSettings}
                onMagicWandSettingsChange={handleMagicWandSettingsChange}
            />
            );
        case "pixel-preview":
            return (
                <div className="flex-1 flex flex-col min-h-0">
                    <SegmentHoverPreview
                        canvas={canvasRef.current}
                        mousePos={canvasMousePos}
                        settings={magicWandSettings}
                    />
                </div>
            );
        default:
            return null;
        }
    };
    return <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">{content()}</div>;
  };
  
  const handleHoverZoom = (preset: 'A' | 'B' | null) => {
    const clearTimers = () => {
      if (hoverTimeoutRef.current.A) clearTimeout(hoverTimeoutRef.current.A);
      if (hoverTimeoutRef.current.B) clearTimeout(hoverTimeoutRef.current.B);
    };

    clearTimers();
    setHoveredZoom(null); // Hide immediately on leave or new enter

    if (preset) {
      hoverTimeoutRef.current[preset] = setTimeout(() => {
        setHoveredZoom(preset);
      }, 200);
    }
  };

  return (
    <div className="flex h-screen w-screen items-stretch overflow-hidden bg-background text-foreground">
        <Sidebar side="left" collapsible="icon" className="border-r">
          <SidebarContent>
            <SidebarHeader>
              <Button variant="ghost" size="icon" className="h-12 w-12" onClick={toggleSidebar}>
                <Settings2 />
              </Button>
            </SidebarHeader>
            <SidebarSeparator />
            <div className="flex-1 overflow-y-auto">
              {renderLeftPanelContent()}
            </div>
          </SidebarContent>
        </Sidebar>

        <ToolPanel 
          activeTool={activeTool} 
          setActiveTool={setActiveTool}
          onToggleAssetDrawer={() => setIsAssetDrawerOpen(prev => !prev)}
        />

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="flex h-12 flex-shrink-0 items-center justify-between border-b px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex < 0}>
                        <Undo2 className="w-5 h-5"/>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                        <Redo2 className="w-5 h-5"/>
                      </Button>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <History className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuSeparator />
                          {history.length > 0 ? history.slice().reverse().map((action, index) => (
                            <DropdownMenuItem key={action.id} onSelect={() => {}}>
                               <span>{action.type.replace(/_/g, ' ')}</span>
                            </DropdownMenuItem>
                          )) : <DropdownMenuItem disabled>No history</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={activeZoom === 'A' ? "default" : "ghost"}
                                        size="icon"
                                        className={cn("h-9 w-9 relative border", activeZoom === 'A' && 'bg-gradient-to-br from-blue-600 to-blue-800 text-white')}
                                        onClick={() => setActiveZoom('A')}
                                    >
                                        <ZoomIn className="w-4 h-4"/>
                                        <span className="absolute bottom-0.5 right-1 text-xs font-bold opacity-70">1</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Activate Zoom A (1)</TooltipContent>
                            </Tooltip>
                             <div 
                                className="group flex items-center"
                                onMouseEnter={() => handleHoverZoom('A')}
                                onMouseLeave={() => handleHoverZoom(null)}
                            >
                                <span 
                                    className="text-sm font-medium px-2 py-1 text-center bg-background"
                                    onWheel={(e) => setZoomA(prev => Math.max(0.1, Math.min(10, prev + (e.deltaY > 0 ? -0.1 : 0.1))))}
                                >
                                    {(zoomA * 100).toFixed(0)}%
                                </span>
                                <div className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                    hoveredZoom === 'A' ? "w-20 opacity-100" : "w-0 opacity-0"
                                )}>
                                    <Slider 
                                        value={[zoomA]}
                                        onValueChange={(v) => setZoomA(v[0])}
                                        min={0.1} max={10} step={0.1}
                                    />
                                </div>
                            </div>
                        </div>

                         <div className="flex items-center gap-2">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                     <Button
                                        variant={activeZoom === 'B' ? "default" : "ghost"}
                                        size="icon"
                                        className={cn("h-9 w-9 relative border", activeZoom === 'B' && 'bg-gradient-to-br from-blue-600 to-blue-800 text-white')}
                                        onClick={() => setActiveZoom('B')}
                                    >
                                        <ZoomIn className="w-4 h-4"/>
                                        <span className="absolute bottom-0.5 right-1 text-xs font-bold opacity-70">2</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Activate Zoom B (2)</TooltipContent>
                            </Tooltip>
                            <div 
                                className="group flex items-center"
                                onMouseEnter={() => handleHoverZoom('B')}
                                onMouseLeave={() => handleHoverZoom(null)}
                            >
                                <span 
                                    className="text-sm font-medium px-2 py-1 text-center bg-background"
                                    onWheel={(e) => setZoomB(prev => Math.max(0.1, Math.min(10, prev + (e.deltaY > 0 ? -0.1 : 0.1))))}
                                >
                                    {(zoomB * 100).toFixed(0)}%
                                </span>
                                <div className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                    hoveredZoom === 'B' ? "w-20 opacity-100" : "w-0 opacity-0"
                                )}>
                                    <Slider 
                                        value={[zoomB]}
                                        onValueChange={(v) => setZoomB(v[0])}
                                        min={0.1} max={10} step={0.1}
                                    />
                                </div>
                            </div>
                        </div>
                    </TooltipProvider>
                </div>
            </header>
            <main className="flex-1 overflow-auto bg-muted/30 flex flex-col">
                 <ImageCanvas 
                    imageUrl={imageUrl}
                    layers={layers}
                    addLayer={addLayer}
                    updateLayer={updateLayer}
                    removePixelsFromLayers={removePixelsFromLayers}
                    activeLayerId={activeLayerId}
                    onLayerSelect={setActiveLayerId}
                    segmentationMask={segmentationMask}
                    setSegmentationMask={setSegmentationMask}
                    activeTool={activeTool}
                    lassoSettings={lassoSettings}
                    magicWandSettings={magicWandSettings}
                    negativeMagicWandSettings={negativeMagicWandSettings}
                    getSelectionMaskRef={getSelectionMaskRef}
                    clearSelectionRef={clearSelectionRef}
                    onLassoSettingChange={handleLassoSettingsChange}
                    onMagicWandSettingsChange={handleMagicWandSettingsChange}
                    onNegativeMagicWandSettingsChange={handleNegativeMagicWandSettingsChange}
                    canvasMousePos={canvasMousePos}
                    setCanvasMousePos={setCanvasMousePos}
                    getCanvasRef={canvasRef}
                    getSelectionEngineRef={selectionEngineRef}
                    isLassoPreviewHovered={isLassoPreviewHovered}
                    mainCanvasZoom={mainCanvasZoom}
                    pan={pan}
                    setPan={setPan}
                    onDragMouseDown={handleDragMouseDown}
                    onDragMouseMove={handleDragMouseMove}
                    onDragMouseUp={handleDragMouseUp}
                    draggedLayer={draggedLayer}
                />
            </main>
             <AssetDrawer
                isOpen={isAssetDrawerOpen}
                onToggle={() => setIsAssetDrawerOpen(prev => !prev)}
                onImageSelect={handleImageSelect}
                rightPanelWidth={rightPanelWidth}
             />
        </div>

        <div className="relative flex h-screen flex-col border-l" style={{ width: rightPanelWidth }}>
          <div 
            onMouseDown={handleMouseDownResize}
            className="absolute -left-1.5 top-0 h-full w-3 cursor-ew-resize group"
          >
            <div className="w-0.5 h-full bg-border group-hover:bg-primary transition-colors mx-auto"></div>
          </div>
            
          <div className="flex h-12 items-center border-b px-2">
              <Tabs value={activeTopPanel || 'none'} className="w-full">
                <TooltipProvider>
                    <TabsList className="grid w-full grid-cols-4">
                        <Tooltip>
                            <TooltipTrigger asChild><TabsTrigger value="zoom" className="flex-1 relative" onClick={() => setActiveTopPanel(p => p === 'zoom' ? null : 'zoom')}><ZoomIn className="h-5 w-5"/><span className="absolute bottom-0 right-1 text-xs font-bold opacity-50">Z</span></TabsTrigger></TooltipTrigger>
                            <TooltipContent>Zoom Panel (Z)</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><TabsTrigger value="feather" className="flex-1 relative" onClick={() => setActiveTopPanel(p => p === 'feather' ? null : 'feather')}><FeatherIcon className="h-5 w-5"/><span className="absolute bottom-0 right-1 text-xs font-bold opacity-50">F</span></TabsTrigger></TooltipTrigger>
                            <TooltipContent>Feather & Edges (F)</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><TabsTrigger value="layers" className="flex-1 relative" onClick={() => setActiveTopPanel(p => p === 'layers' ? null : 'layers')}><LayersIcon className="h-5 w-5"/><span className="absolute bottom-0 right-1 text-xs font-bold opacity-50">L</span></TabsTrigger></TooltipTrigger>
                            <TooltipContent>Layers (L)</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><TabsTrigger value="ai" className="flex-1 relative" onClick={() => setActiveTopPanel(p => p === 'ai' ? null : 'ai')}><BrainCircuit className="h-5 w-5"/><span className="absolute bottom-0 right-1 text-xs font-bold opacity-50">A</span></TabsTrigger></TooltipTrigger>
                            <TooltipContent>AI Tools (A)</TooltipContent>
                        </Tooltip>
                    </TabsList>
                </TooltipProvider>
            </Tabs>
          </div>
            
          <div className="flex-1 flex flex-col min-h-0">
              {renderTopPanelContent()}
            
            {activeTopPanel && activeBottomPanel && <Separator />}

              {renderBottomPanelContent()}
          </div>

          <div className="flex h-12 items-center border-t px-2">
            <Tabs value={activeBottomPanel || 'none'} className="w-full">
              <TooltipProvider>
                <TabsList className="grid w-full grid-cols-4">
                  <Tooltip>
                    <TooltipTrigger asChild><TabsTrigger value="telemetry" className="flex-1 relative" onClick={() => setActiveBottomPanel(p => p === 'telemetry' ? null : 'telemetry')}><AreaChart className="h-5 w-5"/><span className="absolute bottom-0 right-1 text-xs font-bold opacity-50">T</span></TabsTrigger></TooltipTrigger>
                    <TooltipContent>Telemetry (T)</TooltipContent>
                  </Tooltip>
                    <Tooltip>
                    <TooltipTrigger asChild><TabsTrigger value="color-analysis" className="flex-1 relative" onClick={() => setActiveBottomPanel(p => p === 'color-analysis' ? null : 'color-analysis')}><Palette className="h-5 w-5"/><span className="absolute bottom-0 right-1 text-xs font-bold opacity-50">C</span></TabsTrigger></TooltipTrigger>
                    <TooltipContent>Color Analysis (C)</TooltipContent>
                  </Tooltip>
                    <Tooltip>
                    <TooltipTrigger asChild><TabsTrigger value="chat" className="flex-1 relative" onClick={() => setActiveBottomPanel(p => p === 'chat' ? null : 'chat')}><MessageSquare className="h-5 w-5"/><span className="absolute bottom-0 right-1 text-xs font-bold opacity-50">M</span></TabsTrigger></TooltipTrigger>
                    <TooltipContent>AI Chat (M)</TooltipContent>
                  </Tooltip>
                    <Tooltip>
                    <TooltipTrigger asChild><TabsTrigger value="pixel-preview" className="flex-1 relative" onClick={() => setActiveBottomPanel(p => p === 'pixel-preview' ? null : 'pixel-preview')}><Scan className="h-5 w-5"/><span className="absolute bottom-0 right-1 text-xs font-bold opacity-50">P</span></TabsTrigger></TooltipTrigger>
                    <TooltipContent>Pixel Preview (P)</TooltipContent>
                  </Tooltip>
                </TabsList>
              </TooltipProvider>
            </Tabs>
          </div>
        </div>
      </div>
  )
}


export function ProSegmentAI() {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null;
  }
  
  return (
    <SidebarProvider>
      <ProSegmentAIContent />
    </SidebarProvider>
  )
}
