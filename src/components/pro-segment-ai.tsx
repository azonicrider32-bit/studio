

"use client"

import * as React from "react"
import {
  Bot,
  Brush,
  Eraser,
  Feather as FeatherIcon,
  Layers as LayersIcon,
  Pipette,
  Settings2,
  SlidersHorizontal,
  Wand2,
  Image as ImageIcon,
  MinusCircle,
  AreaChart,
  BrainCircuit,
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
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { LassoIcon } from "./icons/lasso-icon"
import { MagicWandPanel } from "./panels/magic-wand-panel"
import { LassoPanel } from "./panels/lasso-panel"
import { BrushPanel } from "./panels/brush-panel"
import { LayerAdjustmentPanel } from "./panels/layer-adjustment-panel"
import { CannyTuningPanel } from "./panels/canny-tuning-panel"
import { ImageCanvas } from "./image-canvas"
import { LayersPanel } from "./panels/layers-panel"
import { ColorAnalysisPanel } from "./panels/color-analysis-panel"
import { AiModelsPanel } from "./panels/ai-models-panel"
import { InpaintingPanel } from "./panels/inpainting-panel"
import { FeatherPanel } from "./panels/feather-panel"
import { LassoSettings, MagicWandSettings, FeatherSettings, Layer } from "@/lib/types"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import Image from "next/image"
import { PipetteMinusIcon } from "./icons/pipette-minus-icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "adjustments" | "pipette-minus"

export function ProSegmentAI() {
  const [activeTool, setActiveTool] = React.useState<Tool>("magic-wand")
  const [isClient, setIsClient] = React.useState(false)
  const [segmentationMask, setSegmentationMask] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | undefined>(PlaceHolderImages[0]?.imageUrl);

  const [layers, setLayers] = React.useState<Layer[]>(() => {
    const backgroundLayer: Layer = {
      id: "background-0",
      name: "Background",
      type: 'background',
      visible: true,
      locked: true,
      pixels: new Set(),
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    };
    return [backgroundLayer];
  });
  const [activeLayerId, setActiveLayerId] = React.useState<string>(layers[0]?.id);

  const [lassoSettings, setLassoSettings] = React.useState<LassoSettings>({
    useMagicSnapping: true,
    useAiEnhancement: false,
    snapRadius: 20,
    snapThreshold: 0.3,
    curveStrength: 0.05,
    directionalStrength: 0.2,
    cursorInfluence: 0.1,
    snapRadiusEnabled: true,
    snapThresholdEnabled: true,
    curveStrengthEnabled: true,
    directionalStrengthEnabled: false,
    cursorInfluenceEnabled: true,
  });
  const [magicWandSettings, setMagicWandSettings] = React.useState<MagicWandSettings>({
    tolerances: { r: 30, g: 30, b: 30, h: 10, s: 20, v: 20, l: 20, a: 10, b_lab: 10 },
    contiguous: true,
    useAiAssist: false,
    enabledTolerances: new Set(['h', 's', 'v']),
    scrollAdjustTolerances: new Set(),
    useAntiAlias: true,
    useFeather: false,
  });
  const [negativeMagicWandSettings, setNegativeMagicWandSettings] = React.useState<MagicWandSettings>({
    tolerances: { r: 10, g: 10, b: 10, h: 5, s: 10, v: 10, l: 10, a: 5, b_lab: 5 },
    contiguous: true,
    useAiAssist: false,
    enabledTolerances: new Set(),
    scrollAdjustTolerances: new Set(),
    seedColor: undefined,
    useAntiAlias: true,
    useFeather: false,
  });
  const [featherSettings, setFeatherSettings] = React.useState<FeatherSettings>({
    antiAlias: { enabled: true, method: 'gaussian', quality: 'balanced' },
    smartFeather: {
      enabled: true,
      alphaMatting: { enabled: true, method: 'closed-form', quality: 0.85 },
      backgroundAdaptation: { enabled: true, sampleRadius: 8, adaptationStrength: 0.6, colorThreshold: 20 },
      gradientTransparency: { enabled: true, gradientRadius: 6, smoothness: 0.7, edgeAware: true },
      colorAwareProcessing: { enabled: false, haloPreventionStrength: 0, colorContextRadius: 0 }
    }
  });
  const [canvasMousePos, setCanvasMousePos] = React.useState<{ x: number, y: number } | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);


  const getSelectionMaskRef = React.useRef<() => string | undefined>();
  const clearSelectionRef = React.useRef<() => void>();

  const addLayer = (newLayer: Layer) => {
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  }

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  };
  
  const toggleLayerLock = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l));
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

  const renderToolOptions = (isExclusion = false) => {
     if (isExclusion) {
      return <MagicWandPanel 
                settings={negativeMagicWandSettings} 
                onSettingsChange={handleNegativeMagicWandSettingsChange}
                canvas={canvasRef.current}
                mousePos={canvasMousePos}
                isExclusionPanel={true}
             />
    }

    switch (activeTool) {
      case "magic-wand":
        return <MagicWandPanel 
                  settings={magicWandSettings} 
                  onSettingsChange={handleMagicWandSettingsChange}
                  canvas={canvasRef.current}
                  mousePos={canvasMousePos}
               />
      case "lasso":
        return <LassoPanel 
                    settings={lassoSettings} 
                    onSettingsChange={handleLassoSettingsChange} 
                />
      case "brush":
        return <BrushPanel />
      case "eraser":
        return <BrushPanel isEraser />
      case "adjustments":
        return <LayerAdjustmentPanel />
      default:
        return <p className="p-4 text-sm text-muted-foreground">Select a tool to see its options.</p>
    }
  }

  if (!isClient) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar side="left" collapsible="icon" className="border-r">
        <SidebarHeader>
          <div className="flex h-8 items-center justify-center p-2 group-data-[collapsible=icon]:justify-center">
            <h1 className="font-headline text-lg font-bold text-primary group-data-[collapsible=icon]:hidden">
              ProSegment
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Magic Wand (W)"
                isActive={activeTool === "magic-wand"}
                onClick={() => setActiveTool("magic-wand")}
              >
                <Wand2 />
                <span>Magic Wand</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Intelligent Lasso (L)"
                isActive={activeTool === "lasso"}
                onClick={() => setActiveTool("lasso")}
              >
                <LassoIcon />
                <span>Intelligent Lasso</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Brush (B)"
                isActive={activeTool === "brush"}
                onClick={() => setActiveTool("brush")}
              >
                <Brush />
                <span>Brush</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Eraser (E)"
                isActive={activeTool === "eraser"}
                onClick={() => setActiveTool("eraser")}
              >
                <Eraser />
                <span>Eraser</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sample Exclusion Color (I)"
                isActive={activeTool === "pipette-minus"}
                onClick={() => setActiveTool("pipette-minus")}
              >
                <PipetteMinusIcon />
                <span>Exclusion Pipette</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Adjustments (A)"
                isActive={activeTool === "adjustments"}
                onClick={() => setActiveTool("adjustments")}
              >
                <SlidersHorizontal />
                <span>Adjustments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings2 />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 items-center justify-between border-b px-4">
            <h2 className="font-headline text-xl font-semibold">Workspace</h2>
             <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Load Image
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="grid grid-cols-2 gap-2 w-[400px]">
                    {PlaceHolderImages.map(img => (
                        <button key={img.id} onClick={() => handleImageSelect(img.imageUrl)} className="block relative aspect-video w-full rounded-md overflow-hidden hover:opacity-80 transition-opacity">
                             <Image src={img.imageUrl} alt={img.description} fill className="object-cover" />
                        </button>
                    ))}
                  </PopoverContent>
                </Popover>

                <SidebarTrigger />
            </div>
        </header>
        <div className="flex-1">
            <ImageCanvas 
              imageUrl={imageUrl}
              layers={layers}
              addLayer={addLayer}
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
            />
        </div>
      </SidebarInset>
      
      <Sidebar side="right" className="w-[380px] border-l">
        <Tabs defaultValue="options" className="flex h-full flex-col">
          <SidebarHeader>
            <TooltipProvider>
                <TabsList className="grid w-full grid-cols-6">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TabsTrigger value="options" className="flex-1"><SlidersHorizontal className="h-5 w-5"/></TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Tool Options</TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <TabsTrigger value="exclusions" className="flex-1"><MinusCircle className="h-5 w-5"/></TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Exclusion Settings</TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <TabsTrigger value="feather" className="flex-1"><FeatherIcon className="h-5 w-5"/></TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Feather & Edges</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TabsTrigger value="layers" className="flex-1"><LayersIcon className="h-5 w-5"/></TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Layers</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TabsTrigger value="analysis" className="flex-1"><AreaChart className="h-5 w-5"/></TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Color Analysis</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TabsTrigger value="ai" className="flex-1"><BrainCircuit className="h-5 w-5"/></TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>AI Tools</TooltipContent>
                    </Tooltip>
                </TabsList>
            </TooltipProvider>
          </SidebarHeader>
          <Separator />
          <SidebarContent className="p-0">
            <TabsContent value="options" className="m-0 h-full">
              {renderToolOptions()}
            </TabsContent>
            <TabsContent value="exclusions" className="m-0 h-full">
              {renderToolOptions(true)}
            </TabsContent>
            <TabsContent value="feather" className="m-0 h-full">
              <FeatherPanel settings={featherSettings} onSettingsChange={handleFeatherSettingsChange} />
            </TabsContent>
            <TabsContent value="layers" className="m-0">
              <LayersPanel 
                layers={layers}
                activeLayerId={activeLayerId}
                onLayerSelect={setActiveLayerId}
                onToggleVisibility={toggleLayerVisibility}
                onToggleLock={toggleLayerLock}
              />
            </TabsContent>
            <TabsContent value="analysis" className="m-0">
              <ColorAnalysisPanel canvas={canvasRef.current} mousePos={canvasMousePos} magicWandSettings={magicWandSettings} onMagicWandSettingsChange={handleMagicWandSettingsChange} />
            </TabsContent>
            <TabsContent value="ai" className="m-0">
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
            </TabsContent>
          </SidebarContent>
        </Tabs>
      </Sidebar>
    </SidebarProvider>
  )
}
