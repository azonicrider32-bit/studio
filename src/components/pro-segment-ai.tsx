"use client"

import * as React from "react"
import {
  Bot,
  Brush,
  Eraser,
  Layers,
  Pipette,
  Settings2,
  SlidersHorizontal,
  Wand2,
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
import { LassoSettings, MagicWandSettings } from "@/lib/types"

type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "adjustments"

export function ProSegmentAI() {
  const [activeTool, setActiveTool] = React.useState<Tool>("magic-wand")
  const [isClient, setIsClient] = React.useState(false)
  const [segmentationMask, setSegmentationMask] = React.useState<string | null>(null);
  const [lassoSettings, setLassoSettings] = React.useState<LassoSettings>({
    useEdgeSnapping: true,
    snapRadius: 10,
    snapThreshold: 0.3,
  });
  const [magicWandSettings, setMagicWandSettings] = React.useState<MagicWandSettings>({
    tolerance: 30,
    colorSpace: 'hsv',
    contiguous: true,
    useAiAssist: true,
  });

  const handleLassoSettingsChange = (newSettings: Partial<LassoSettings>) => {
    setLassoSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleMagicWandSettingsChange = (newSettings: Partial<MagicWandSettings>) => {
    setMagicWandSettings(prev => ({ ...prev, ...newSettings }));
  };

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const renderToolOptions = () => {
    switch (activeTool) {
      case "magic-wand":
        return <MagicWandPanel settings={magicWandSettings} onSettingsChange={handleMagicWandSettingsChange} setSegmentationMask={setSegmentationMask} />
      case "lasso":
        return <LassoPanel settings={lassoSettings} onSettingsChange={handleLassoSettingsChange} />
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
            <div><SidebarTrigger /></div>
        </header>
        <div className="flex-1">
            <ImageCanvas 
              segmentationMask={segmentationMask}
              setSegmentationMask={setSegmentationMask}
              activeTool={activeTool}
              lassoSettings={lassoSettings}
              magicWandSettings={magicWandSettings}
            />
        </div>
      </SidebarInset>
      
      <Sidebar side="right" className="w-[380px] border-l">
        <Tabs defaultValue="options" className="flex h-full flex-col">
          <SidebarHeader>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
            </TabsList>
          </SidebarHeader>
          <Separator />
          <SidebarContent className="p-0">
            <TabsContent value="options" className="m-0 h-full">
              {renderToolOptions()}
            </TabsContent>
            <TabsContent value="layers" className="m-0">
              <LayersPanel />
            </TabsContent>
            <TabsContent value="analysis" className="m-0">
              <ColorAnalysisPanel />
            </TabsContent>
            <TabsContent value="ai" className="m-0">
                <Tabs defaultValue="models" className="flex h-full flex-col">
                    <TabsList className="m-2 grid grid-cols-2">
                        <TabsTrigger value="models">Models</TabsTrigger>
                        <TabsTrigger value="canny">Canny</TabsTrigger>
                    </TabsList>
                    <TabsContent value="models" className="m-0 flex-1">
                        <AiModelsPanel setSegmentationMask={setSegmentationMask}/>
                    </TabsContent>
                    <TabsContent value="canny" className="m-0 flex-1">
                        <CannyTuningPanel />
                    </TabsContent>
                </Tabs>
            </TabsContent>
          </SidebarContent>
        </Tabs>
      </Sidebar>
    </SidebarProvider>
  )
}

    