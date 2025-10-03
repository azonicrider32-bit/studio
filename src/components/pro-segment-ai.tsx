

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

type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "adjustments" | "pipette-minus" | "clone" | "transform";
type TopPanel = 'tools' | 'feather' | 'layers' | 'ai';
type BottomPanel = 'telemetry' | 'history' | 'color-analysis' | 'pixel-preview';


export function ProSegmentAI() {
  const [activeTool, setActiveTool] = React.useState<Tool>("lasso")
  const [isClient, setIsClient] = React.useState(false)
  const [segmentationMask, setSegmentationMask] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | undefined>(PlaceHolderImages[0]?.imageUrl);
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = React.useState(false);
  const [rightPanelWidth, setRightPanelWidth] = React.useState(380);
  const isResizingRef = React.useRef(false);
  
  const [activeTopPanel, setActiveTopPanel] = React.useState<TopPanel | null>('tools');
  const [activeBottomPanel, setActiveBottomPanel] = React.useState<BottomPanel | null>(null);


  const [layers, setLayers] = React.useState<Layer[]>(() => {
    const backgroundLayer: Layer = {
      id: "background-0",
      name: "Background",
      type: 'background',
      subType: 'pixel',
      visible: true,
      locked: true,
      pixels: new Set(),
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    };
    return [backgroundLayer];
  });
  const [activeLayerId, setActiveLayerId] = React.useState<string | null>(layers[0]?.id);

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


  const getSelectionMaskRef = React.useRef<() => string | undefined>();
  const clearSelectionRef = React.useRef<() => void>();

  const addLayer = (newLayer: Layer) => {
    setLayers(prev => [...prev, { ...newLayer, maskVisible: true }]);
    setActiveLayerId(newLayer.id);
  };

  const updateLayer = React.useCallback((layerId: string, updatedPixels: Set<number>, newBounds: Layer['bounds']) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        const engine = selectionEngineRef.current;
        if (!engine) return l;
        const newImageData = engine.createImageDataForLayer(updatedPixels, newBounds);
        return { ...l, pixels: updatedPixels, bounds: newBounds, imageData: newImageData };
      }
      return l;
    }));
  }, []);

  const removePixelsFromLayers = React.useCallback((pixelsToRemove: Set<number>) => {
    setLayers(prevLayers => {
      return prevLayers.map(layer => {
        if ((layer.type === 'segmentation' || layer.subType === 'mask') && layer.visible) {
          const newPixels = new Set([...layer.pixels].filter(p => !pixelsToRemove.has(p)));
          if (newPixels.size < layer.pixels.size) {
            const engine = selectionEngineRef.current;
            if (!engine) return layer;
            // Recalculate bounds and update imageData
            const newBounds = engine.getBoundsForPixels(newPixels);
            const newImageData = layer.subType === 'pixel' ? engine.createImageDataForLayer(newPixels, newBounds) : undefined;
            return { ...layer, pixels: newPixels, bounds: newBounds, imageData: newImageData };
          }
        }
        return layer;
      });
    });
  }, []);

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  };
  
  const toggleLayerLock = (layerId: string) => {
     if (layerId === "background-0") return;
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l));
  };

  const toggleLayerMask = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, maskVisible: !(l.maskVisible ?? true) } : l));
  };

  const deleteLayer = (layerId: string) => {
    if (layerId === "background-0") return; // Cannot delete background

    setLayers(prev => prev.filter(l => l.id !== layerId));

    if (activeLayerId === layerId) {
      setActiveLayerId("background-0");
    }
  };


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
  }


  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
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

  const renderLeftPanelContent = () => {
    switch(activeTool) {
      case 'magic-wand':
      case 'lasso':
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
        case "tools":
          switch (activeTool) {
            case "lasso":
              return <PixelZoomPanel
                canvas={canvasRef.current}
                mousePos={canvasMousePos}
                selectionEngine={selectionEngineRef.current}
                onHoverChange={setIsLassoPreviewHovered}
                className="flex-1"
              />;
            case "magic-wand":
              return <MagicWandPanel 
                        settings={magicWandSettings} 
                        onSettingsChange={handleMagicWandSettingsChange}
                        exclusionSettings={negativeMagicWandSettings}
                        onExclusionSettingsChange={handleNegativeMagicWandSettingsChange}
                        canvas={canvasRef.current}
                        mousePos={canvasMousePos}
                     />;
            case "brush":
              return <BrushPanel />;
            case "eraser":
              return <BrushPanel isEraser />;
            case "adjustments":
              return <LayerAdjustmentPanel />;
            default:
              return <p className="p-4 text-sm text-muted-foreground">Select a tool to see its options.</p>;
          }
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
                <div className="flex-1 flex flex-col min-h-0 p-4">
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
  
  const rightPanelVisible = activeTopPanel || activeBottomPanel;

  if (!isClient) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-screen items-stretch overflow-hidden bg-background text-foreground">
        <Sidebar side="left" collapsible="icon" className="border-r">
          <SidebarContent>
            <SidebarHeader>
              {/* This space is intentionally left blank for now */}
            </SidebarHeader>
            <SidebarSeparator />
            <div className="flex-1 overflow-y-auto">
              {renderLeftPanelContent()}
            </div>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" className="justify-center">
                  <Settings2 />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
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
                    <h2 className="font-headline text-xl font-semibold">Workspace</h2>
                </div>
                <div className="flex items-center gap-2">
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
                    onMagicWandSettingChange={handleMagicWandSettingsChange}
                    onNegativeMagicWandSettingChange={handleNegativeMagicWandSettingsChange}
                    canvasMousePos={canvasMousePos}
                    setCanvasMousePos={setCanvasMousePos}
                    getCanvasRef={canvasRef}
                    getSelectionEngineRef={selectionEngineRef}
                    isLassoPreviewHovered={isLassoPreviewHovered}
                />
            </main>
             <AssetDrawer
                isOpen={isAssetDrawerOpen}
                onToggle={() => setIsAssetDrawerOpen(prev => !prev)}
                onImageSelect={handleImageSelect}
                rightPanelWidth={rightPanelVisible ? rightPanelWidth : 0}
             />
        </div>

        {rightPanelVisible && (
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
                              <TooltipTrigger asChild><TabsTrigger value="tools" className="flex-1" onClick={() => setActiveTopPanel(p => p === 'tools' ? null : 'tools')}><Wand2 className="h-5 w-5"/></TabsTrigger></TooltipTrigger>
                              <TooltipContent>Tool Options</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                              <TooltipTrigger asChild><TabsTrigger value="feather" className="flex-1" onClick={() => setActiveTopPanel(p => p === 'feather' ? null : 'feather')}><FeatherIcon className="h-5 w-5"/></TabsTrigger></TooltipTrigger>
                              <TooltipContent>Feather & Edges</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                              <TooltipTrigger asChild><TabsTrigger value="layers" className="flex-1" onClick={() => setActiveTopPanel(p => p === 'layers' ? null : 'layers')}><LayersIcon className="h-5 w-5"/></TabsTrigger></TooltipTrigger>
                              <TooltipContent>Layers</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                              <TooltipTrigger asChild><TabsTrigger value="ai" className="flex-1" onClick={() => setActiveTopPanel(p => p === 'ai' ? null : 'ai')}><BrainCircuit className="h-5 w-5"/></TabsTrigger></TooltipTrigger>
                              <TooltipContent>AI Tools</TooltipContent>
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
                      <TooltipTrigger asChild><TabsTrigger value="telemetry" className="flex-1" onClick={() => setActiveBottomPanel(p => p === 'telemetry' ? null : 'telemetry')}><AreaChart className="h-5 w-5"/></TabsTrigger></TooltipTrigger>
                      <TooltipContent>Telemetry</TooltipContent>
                    </Tooltip>
                     <Tooltip>
                      <TooltipTrigger asChild><TabsTrigger value="color-analysis" className="flex-1" onClick={() => setActiveBottomPanel(p => p === 'color-analysis' ? null : 'color-analysis')}><Palette className="h-5 w-5"/></TabsTrigger></TooltipTrigger>
                      <TooltipContent>Color Analysis</TooltipContent>
                    </Tooltip>
                     <Tooltip>
                      <TooltipTrigger asChild><TabsTrigger value="pixel-preview" className="flex-1" onClick={() => setActiveBottomPanel(p => p === 'pixel-preview' ? null : 'pixel-preview')}><Scan className="h-5 w-5"/></TabsTrigger></TooltipTrigger>
                      <TooltipContent>Pixel Preview</TooltipContent>
                    </Tooltip>
                  </TabsList>
                </TooltipProvider>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  )
}
