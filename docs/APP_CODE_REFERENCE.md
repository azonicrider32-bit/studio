# 💻 ProSegment AI: Complete Application Code Reference

> **Version**: 1.0
> **Date**: October 05, 2025
> **Status**: Live Code Snapshot & In-Progress Documentation

## 1. Introduction

This document provides an exhaustive, centralized snapshot of the source code for all major components and systems within the ProSegment AI application. It is intended to serve as a technical reference for the current state of the implementation, allowing for direct comparison with architectural blueprints and design documents.

## Table of Contents

*   [2. Core Application Structure](#2-core-application-structure)
    *   [`src/app/page.tsx`](#srcapppagetsx)
    *   [`src/components/pro-segment-ai.tsx`](#srccomponentspro-segment-aitsx)
*   [3. Core Logic & Engines](#3-core-logic--engines)
    *   [`src/lib/selection-engine.ts`](#srclibselection-enginets)
*   [4. Data Structures & Types](#4-data-structures--types)
    *   [`src/lib/types.ts`](#srclibtypests)

---

## 2. Core Application Structure

### `src/app/page.tsx`

This is the main entry point for the Next.js application. It is a simple server component that renders the primary `ProSegmentAI` client component, which contains the entire application logic.

```tsx
import { ProSegmentAI } from "@/components/pro-segment-ai";

export default function Home() {
  return (
      <ProSegmentAI />
  );
}
```

### `src/components/pro-segment-ai.tsx`

This is the main, top-level React component that orchestrates the entire user interface and application state. It is the heart of the ProSegment AI application.

#### Component Overview:
- **State Management:** Utilizes `React.useState` and `React.useCallback` to manage all application-level state, including the active tool, all tool settings (Magic Wand, Lasso, etc.), layers, history (undo/redo), and panel visibility.
- **Workspace Management:** Implements a multi-workspace system, allowing the user to work on several projects simultaneously, each with its own image, layers, and history stack.
- **Component Orchestration:** Renders and passes props to all major UI panels, including the `ToolPanel`, `ToolSettingsPanel`, `LayersPanel`, and the central `ImageCanvas`.
- **Event Handling:** Contains the top-level logic for handling keyboard shortcuts (e.g., Undo/Redo) and global UI interactions like resizing panels.
- **AI Integration:** Manages the state for the "Nano Banana" visual instruction tool and invokes the Genkit flows for generative AI operations like inpainting.

```tsx
"use client"

import * as React from "react"
import {
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  History,
  Image as ImageIcon,
  Layers as LayersIcon,
  MessageSquare,
  Palette,
  PanelLeft,
  Redo2,
  Replace,
  Microscope,
  Settings2,
  SlidersHorizontal,
  Split,
  Undo2,
  Feather as FeatherIcon,
  ZoomIn,
  Plus,
  X as XIcon,
  FolderOpen,
  Download,
  Cpu,
  User,
  Keyboard,
  ArrowBigUpDash,
  ArrowBigRightDash,
  Wand2,
  Camera,
  Scissors,
  PanelRightClose,
  Ruler,
  MoveHorizontal,
  MoveVertical,
  Volume2,
  VolumeX,
  Ear,
  Speech,
  Magnet,
  Move,
  Balloon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { ColorAnalysisPanel } from "./panels/color-analysis-panel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { ImageCanvas } from "./image-canvas"
import { AITool, LassoSettings, Layer, MagicWandSettings, FeatherSettings, CloneStampSettings, GlobalSettings, TransformSettings } from "@/lib/types"
import { LayersPanel } from "./panels/layers-panel"
import { LayerStripPanel } from "./panels/layer-strip-panel"
import { PixelZoomPanel } from "./panels/pixel-zoom-panel"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { SegmentHoverPreview } from "./segment-hover-preview"
import { SelectionEngine } from "@/lib/selection-engine"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { AiChatPanel } from "./panels/ai-chat-panel"
import { FeatherPanel } from "./panels/feather-panel"
import { cn } from "@/lib/utils"
import { useSelectionDrag } from "@/hooks/use-selection-drag"
import { useToast } from "@/hooks/use-toast"
import { ToolPanel } from "./tool-panel"
import { Slider } from "./ui/slider"
import { useAuth, useUser } from "@/firebase"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"
import { ToolSettingsPanel } from "./panels/tool-settings-panel"
import AdvancedAssetPanel from "./panels/AdvancedAssetsPanel"
import { QuaternionColorWheel } from "./panels/quaternion-color-wheel"
import { textToSpeech } from "@/ai/flows/text-to-speech-flow"
import { handleApiError } from "@/lib/error-handling"
import { inpaintWithPrompt } from "@/ai/flows/inpaint-with-prompt"
import { InstructionLayer, NanoBananaPanel } from "./panels/nano-banana-panel"

// Defines the available tools and right-hand-side panels.
type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line" | "banana" | "blemish-remover";
type RightPanel = 'zoom' | 'feather' | 'layers' | 'assets' | 'history' | 'color-analysis' | 'pixel-preview' | 'chat' | 'color-wheel';

// Defines the data structure for a single workspace.
interface WorkspaceState {
  id: string;
  name: string;
  imageUrl?: string;
  layers: Layer[];
  history: any[];
  historyIndex: number;
  activeLayerId: string | null;
  segmentationMask: string | null;
}

// Factory function to create a new, clean workspace state.
const createNewWorkspace = (id: string, name: string, imageUrl?: string): WorkspaceState => {
  const backgroundLayer: Layer = {
    id: `background-${id}`,
    name: "Background",
    type: 'background',
    subType: 'pixel',
    visible: true,
    locked: true,
    pixels: new Set(),
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    modifiers: [],
    closed: false,
  };
  return {
    id,
    name,
    imageUrl,
    layers: [backgroundLayer],
    history: [],
    historyIndex: -1,
    activeLayerId: backgroundLayer.id,
    segmentationMask: null,
  };
};

// A dedicated component for managing and displaying the zoom level controls.
function ZoomControl({
  zoomLevel,
  setZoomLevel,
  isActive,
  onClick,
  label,
  hotkey
}: {
  zoomLevel: number;
  setZoomLevel: (value: number) => void;
  isActive: boolean;
  onClick: () => void;
  label: string;
  hotkey: string;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="icon"
              className={cn("h-8 w-8 relative border", isActive && 'bg-gradient-to-br from-blue-600 to-blue-800 text-white')}
              onClick={onClick}
            >
              <ZoomIn className="w-4 h-4"/>
              {hotkey && <span className="absolute bottom-0.5 right-1 text-xs font-bold opacity-70">{hotkey}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Activate {label} ({hotkey})</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div 
          className="group relative flex items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
          <Button
            variant="ghost"
            className="text-sm font-medium px-2 py-1 text-center h-8"
            onWheel={(e) => setZoomLevel(Math.max(0.1, Math.min(10, zoomLevel + (e.deltaY > 0 ? -0.1 : 0.1))))}
          >
              {(zoomLevel * 100).toFixed(0)}%
          </Button>
          <div className={cn(
              "absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 p-2 bg-background/80 backdrop-blur-sm rounded-md border shadow-lg transition-all duration-200",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          )}>
              <Slider
                  value={[zoomLevel]}
                  onValueChange={(v) => setZoomLevel(v[0])}
                  min={0.1} max={10} step={0.1}
                  orientation="vertical"
                  className="h-24"
              />
          </div>
      </div>
    </div>
  )
}

// The main content component where all state and logic are centralized.
function ProSegmentAIContent() {
  // Tool and Panel State
  const [activeTool, setActiveTool] = React.useState<Tool>("banana")
  const [rightPanelWidth, setRightPanelWidth] = React.useState(380);
  const [isRightPanelOpen, setIsRightPanelOpen] = React.useState(true);
  const isResizingRef = React.useRef(false);
  const { toast } = useToast()
  
  // State for managing which right-hand panels are open and their order.
  const [activePanels, setActivePanels] = React.useState<RightPanel[]>(['layers']);
  
  // Canvas View State (Zoom & Pan)
  const [zoomA, setZoomA] = React.useState(1.0);
  const [zoomB, setZoomB] = React.useState(4.0);
  const [activeZoom, setActiveZoom] = React.useState<'A' | 'B'>('A');
  const mainCanvasZoom = activeZoom === 'A' ? zoomA : zoomB;
  const [pan, setPan] = React.useState({ x: 0, y: 0 });

  // Workspace and Layer State
  const [workspaces, setWorkspaces] = React.useState<WorkspaceState[]>([
    createNewWorkspace("ws-1", "Project 1", PlaceHolderImages[0]?.imageUrl)
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState<string>("ws-1");
  const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);
  const [hoveredLayerId, setHoveredLayerId] = React.useState<string | null>(null);
  
  // UI State
  const { state: sidebarState } = useSidebar();
  const [showHotkeyLabels, setShowHotkeyLabels] = React.useState(false);
  const [showHorizontalRuler, setShowHorizontalRuler] = React.useState(false);
  const [showVerticalRuler, setShowVerticalRuler] = React.useState(false);
  const [showGuides, setShowGuides] = React.useState(false);

  // Firebase and User State
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  // Accessibility and AI Voice State
  const [isTtsEnabled, setIsTtsEnabled] = React.useState(false);
  const [isSttEnabled, setIsSttEnabled] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // State for AI Tools (Nano Banana)
  const [instructionLayers, setInstructionLayers] = React.useState<InstructionLayer[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [customPrompt, setCustomPrompt] = React.useState("");
  
  // Global Application Settings
  const [globalSettings, setGlobalSettings] = React.useState<GlobalSettings>({
    snapEnabled: true,
    snapRadius: 10,
  });

  // State for Tool-Specific Settings
  const [lassoSettings, setLassoSettings] = React.useState<LassoSettings>({
    drawMode: 'magic',
    useAiEnhancement: false,
    showMouseTrace: true,
    showAllMasks: true,
    fillPath: false,
    snapRadius: 20,
    snapThreshold: 0.3,
    curveStrength: 0.5,
    curveTension: 0.5,
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
    freeDraw: {
        dropInterval: 100,
        minDistance: 5,
        maxDistance: 20
    }
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
    },
    debounceDelay: 200,
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
    debounceDelay: 200,
  });
  const [cloneStampSettings, setCloneStampSettings] = React.useState<CloneStampSettings>({
    brushSize: 50,
    opacity: 100,
    softness: 0,
    rotationStep: 5,
    sourceLayer: 'current',
    angle: 0,
    flipX: false,
    flipY: false,
    blendMode: 'normal',
    useAdvancedBlending: false,
    tolerances: {
      values: { r: 30, g: 30, b: 30, h: 15, s: 25, v: 25, l: 25, a: 15, b_lab: 15 },
      enabled: new Set(),
    },
    falloff: 50,
  });
  const [transformSettings, setTransformSettings] = React.useState<TransformSettings>({
    scope: 'layer',
    x: 0,
    y: 0,
    scaleX: 100,
    scaleY: 100,
    rotation: 0,
    skewX: 0,
    skewY: 0,
    maintainAspectRatio: true,
  });
  // ... and so on for other tools.

  // Refs for direct access to canvas and selection engine instances
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const selectionEngineRef = React.useRef<SelectionEngine | null>(null);
  const getSelectionMaskRef = React.useRef<() => string | undefined>();
  const clearSelectionRef = React.useRef<() => void>();
  
  // ... All the functions (speak, handleToolChange, setActiveWorkspaceState, addLayer, etc.) would be documented here ...
  // ... For brevity, the full function bodies are shown below without redundant comments.

  const [hoveredZoom, setHoveredZoom] = React.useState<'A' | 'B' | null>(null);
  const activeWorkspaceIndex = workspaces.findIndex(ws => ws.id === activeWorkspaceId);
  const [featherSettings, setFeatherSettings] = React.useState<FeatherSettings>({
    antiAlias: {
      enabled: true,
      method: 'gaussian',
      quality: 'balanced',
    },
    smartFeather: {
      enabled: true,
      alphaMatting: {
        enabled: true,
        method: 'closed-form',
        quality: 0.85,
      },
      backgroundAdaptation: {
        enabled: true,
        sampleRadius: 8,
        adaptationStrength: 0.6,
        colorThreshold: 20,
      },
      gradientTransparency: {
        enabled: true,
        gradientRadius: 6,
        smoothness: 0.7,
        edgeAware: true,
      },
      colorAwareProcessing: {
        enabled: false,
        haloPreventionStrength: 0,
        colorContextRadius: 0,
      },
    },
  });
  const [canvasMousePos, setCanvasMousePos] = React.useState<{ x: number, y: number } | null>(null);
  const [isLassoPreviewHovered, setIsLassoPreviewHovered] = React.useState(false);
  const hoverTimeoutRef = React.useRef<{ A: NodeJS.Timeout | null, B: NodeJS.Timeout | null }>({ A: null, B: null });


  const maxHistorySize = 100;

  const {
    draggedLayer,
    isDragging,
    handleMouseDown: handleDragMouseDown,
    handleMouseMove: handleDragMouseMove,
    handleMouseUp: handleDragMouseUp,
  } = useSelectionDrag(activeWorkspace?.layers || [], (newLayers) => setActiveWorkspaceState(ws => ({...ws, layers: newLayers})), activeTool, mainCanvasZoom);

  const handleLassoSettingsChange = (newSettings: Partial<LassoSettings>) => {
    setLassoSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleMagicWandSettingsChange = (newSettings: Partial<MagicWandSettings>) => {
    setMagicWandSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const handleCloneStampSettingsChange = (newSettings: Partial<CloneStampSettings>) => {
    setCloneStampSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const handleTransformSettingsChange = (newSettings: Partial<TransformSettings>) => {
    setTransformSettings(prev => ({ ...prev, ...newSettings }));
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
    setActiveWorkspaceState(ws => ({...ws, imageUrl: url, segmentationMask: null, history: [], historyIndex: -1 }));
    if(clearSelectionRef.current) {
        clearSelectionRef.current();
    }
  }

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

  const handleAddNewWorkspace = () => {
    const newId = `ws-${Date.now()}`;
    const newWorkspace = createNewWorkspace(newId, `Project ${workspaces.length + 1}`);
    setWorkspaces(prev => [...prev, newWorkspace]);
    setActiveWorkspaceId(newId);
  };
  
  const handleCloseWorkspace = (workspaceId: string) => {
    if (workspaces.length === 1) return;
    setWorkspaces(prev => prev.filter(ws => ws.id !== workspaceId));
    if (activeWorkspaceId === workspaceId) {
      setActiveWorkspaceId(workspaces.find(ws => ws.id !== workspaceId)?.id || '');
    }
  }

  const renderPanelContent = (panelId: RightPanel | undefined) => {
    if (!panelId) return null;
    switch(panelId) {
        case "zoom": return <PixelZoomPanel canvas={canvasRef.current} mousePos={canvasMousePos} selectionEngine={selectionEngineRef.current} onHoverChange={setIsLassoPreviewHovered} className="flex-1"/>;
        case "feather": return <FeatherPanel settings={featherSettings} onSettingsChange={handleFeatherSettingsChange} />;
        case "layers": return activeWorkspace ? 
            <LayersPanel 
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                onWorkspaceSelect={setActiveWorkspaceId}
                onLayerSelect={(id) => setActiveWorkspaceState(ws => ({...ws, activeLayerId: id}))}
                onToggleVisibility={toggleLayerVisibility}
                onToggleLock={toggleLayerLock}
                onToggleMask={toggleLayerMask}
                onDeleteLayer={deleteLayer}
                onAddLayer={() => {}}
                draggedLayerId={null} 
                setDraggedLayerId={() => {}}
                dropTargetId={null}
                setDropTargetId={() => {}}
                onDrop={(draggedId, targetId) => {
                    if (!activeWorkspace) return;
                    const draggedLayer = activeWorkspace.layers.find(l => l.id === draggedId);
                    if (!draggedLayer || draggedId === targetId || draggedLayer.parentId === targetId) return;

                    setActiveWorkspaceState(ws => {
                        const newLayers = ws.layers.map(l => {
                            if (l.id === draggedId) {
                                return { ...l, parentId: targetId, subType: 'mask' as const };
                            }
                            return l;
                        });
                        
                        const targetLayerIndex = newLayers.findIndex(l => l.id === targetId);

                        if (targetLayerIndex > -1) {
                            if (newLayers[targetLayerIndex].modifiers?.find(m => m.id === draggedId)) return ws;
                            
                            const draggedLayerWithParent = { ...draggedLayer, parentId: targetId, subType: 'mask' as const };
                            const targetLayer = newLayers[targetLayerIndex];
                            const existingModifiers = targetLayer.modifiers || [];

                            newLayers[targetLayerIndex] = { ...targetLayer, modifiers: [...existingModifiers, draggedLayerWithParent] };
                        }

                        return { ...ws, layers: newLayers };
                    });
                }}
            /> : null;
        case "assets": return <AdvancedAssetPanel onImageSelect={handleImageSelect} />;
        case "chat": return <AiChatPanel />;
        case "color-analysis": return <ColorAnalysisPanel canvas={canvasRef.current} mousePos={canvasMousePos} magicWandSettings={magicWandSettings} onMagicWandSettingsChange={handleMagicWandSettingsChange}/>;
        case "pixel-preview": return <div className="flex-1 flex flex-col min-h-0"><SegmentHoverPreview canvas={canvasRef.current} mousePos={canvasMousePos} settings={magicWandSettings}/></div>;
        case "color-wheel": return <QuaternionColorWheel />;
        default: return null;
    }
  }

  const handleAiToolClick = (tool: AITool) => {
      setActiveTool(tool.id as Tool);
  };
  
  const handleBlemishRemoverSelection = async (selectionMaskUri: string, sketchLayer: Layer) => {
    if (!activeWorkspace?.imageUrl) {
      toast({ title: 'No Image', description: 'Please select an image first.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    toast({ title: 'Blemish Remover Active', description: 'AI is analyzing the selected area.' });
    try {
      const result = await inpaintWithPrompt({
        photoDataUri: activeWorkspace.imageUrl,
        maskDataUri: selectionMaskUri,
        prompt: "Inpaint the selected area to seamlessly match the surrounding background, making it look as if the blemish or object was never there. Pay close attention to texture, lighting, and patterns to create a realistic and unnoticeable fill."
      });
      if (result.error || !result.generatedImageDataUri) {
        throw new Error(result.error || "Inpainting failed to return an image.");
      }
      
      const originalImage = new Image();
      originalImage.crossOrigin = "anonymous";
      originalImage.src = activeWorkspace.imageUrl;
      await new Promise(resolve => { originalImage.onload = resolve; });

      const generatedImage = new Image();
      generatedImage.crossOrigin = "anonymous";
      generatedImage.src = result.generatedImageDataUri;
      await new Promise(resolve => { generatedImage.onload = resolve; });

      const maskImage = new Image();
      maskImage.crossOrigin = "anonymous";
      maskImage.src = selectionMaskUri;
      await new Promise(resolve => { maskImage.onload = resolve; });
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error("Could not create canvas context");

      tempCanvas.width = originalImage.width;
      tempCanvas.height = originalImage.height;

      tempCtx.drawImage(generatedImage, 0, 0);
      tempCtx.globalCompositeOperation = 'destination-in';
      tempCtx.drawImage(maskImage, 0, 0);
      
      const finalImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const bounds = selectionEngineRef.current?.getBoundsForPixels(selectionEngineRef.current.getPixelsFromMask(finalImageData)) ?? { x: 0, y: 0, width: 0, height: 0};
      
      const newLayer: Layer = {
        id: `repair-${Date.now()}`,
        name: 'Blemish Repair',
        type: 'segmentation',
        subType: 'pixel',
        visible: true,
        locked: false,
        pixels: new Set(),
        bounds,
        imageData: finalImageData,
        closed: false,
        modifiers: [sketchLayer],
      };

      addLayer(newLayer);
      toast({ title: 'Blemish Removed', description: 'The area has been repaired on a new layer.' });

    } catch (error) {
      handleApiError(error, toast, { title: 'Blemish Remover Failed' });
    } finally {
      setIsGenerating(false);
      if (clearSelectionRef.current) clearSelectionRef.current();
    }
  };

  const handleGenerate = async (prompt?: string) => {
    const finalPrompt = prompt || customPrompt;
    const currentImageUrl = activeWorkspace?.imageUrl;

    if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No image loaded." })
      return
    }

    const maskDataUri = getSelectionMaskRef.current ? getSelectionMaskRef.current() : undefined;
    if (!maskDataUri) {
      toast({ variant: "destructive", title: "No selection made.", description: "Please use a selection tool to select an area to inpaint." })
      return
    }

    if (!finalPrompt) {
      toast({ variant: "destructive", title: "Prompt is empty.", description: "Please describe what you want to generate or select a one-click action." })
      return
    }

    setIsGenerating(true)
    toast({ title: "AI is generating...", description: "This may take a moment." })

    try {
      const result = await inpaintWithPrompt({
        photoDataUri: currentImageUrl,
        maskDataUri: maskDataUri,
        prompt: finalPrompt,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.generatedImageDataUri) {
        handleImageSelect(result.generatedImageDataUri)
        toast({ title: "Inpainting successful!", description: "The image has been updated."})
        if (clearSelectionRef.current) {
          clearSelectionRef.current();
        }
      } else {
        throw new Error("The model did not return an image.")
      }

    } catch (error: any) {
      handleApiError(error, toast, {
        title: "Inpainting Failed",
        description: "An unknown error occurred during inpainting.",
      });
    } finally {
      setIsGenerating(false)
    }
  }


  if (!activeWorkspace) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">No active workspace.</div>
  }
  
  const splitViewSecondaryIndex = isSplitView ? (activeWorkspaceIndex + 1) % workspaces.length : -1;
  const secondaryWorkspace = splitViewSecondaryIndex !== -1 ? workspaces[splitViewSecondaryIndex] : null;

  const sidebarWidthVar = sidebarState === 'expanded' ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)';
  
  const allShelfIcons: {id: RightPanel, icon: React.ElementType, label: string }[] = [
    { id: 'assets', icon: ImageIcon, label: 'Asset Library (O)' },
    { id: 'zoom', icon: ZoomIn, label: 'Zoom Panel (Z)' },
    { id: 'feather', icon: FeatherIcon, label: 'Feather & Edges (F)' },
    { id: 'layers', icon: LayersIcon, label: 'Layers (L)' },
    { id: 'color-analysis', icon: Palette, label: 'Color Analysis (C)' },
    { id: 'chat', icon: MessageSquare, label: 'AI Chat (M)' },
    { id: 'pixel-preview', icon: Microscope, label: 'Pixel Preview (P)' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'color-wheel', icon: Palette, label: 'Color Wheel' },
  ];
  const { speak, handleToolChange, addToHistory, addLayer, updateLayer, removePixelsFromLayers, toggleLayerVisibility, toggleLayerLock, toggleLayerMask, deleteLayer, handleUndo, handleRedo } = useProSegmentAI(setActiveWorkspaceState, workspaces, activeWorkspaceId, toast, isTtsEnabled, audioRef);
  React.useEffect(() => {
    if (selectionEngineRef.current) {
      selectionEngineRef.current.updateLayers(activeWorkspace.layers);
    }
  }, [activeWorkspace.layers]);
  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMoveResize);
    window.addEventListener('mouseup', handleMouseUpResize);
    const handleKeyDown = (e: KeyboardEvent) => {
        if(e.key.toLowerCase() === 'v') {
            handleToolChange('transform');
        }
        if(e.key.toLowerCase() === 'p') {
            handleToolChange('line');
        }
        if(e.key.toLowerCase() === 'c') {
            handleToolChange('clone');
        }
        if(e.key.toLowerCase() === 'n') {
            handleToolChange('banana');
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
    return () => {
        window.removeEventListener('mousemove', handleMouseMoveResize);
        window.removeEventListener('mouseup', handleMouseUpResize);
        window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleMouseMoveResize, handleMouseUpResize, handleUndo, handleRedo]);
  const handleShelfClick = (panelId: RightPanel, clickType: 'single' | 'double') => {
      setActivePanels(currentPanels => {
          let [topPanel, bottomPanel] = currentPanels;

          if (clickType === 'single') {
              if (topPanel === panelId) { // Clicked open top panel: close it
                  return bottomPanel ? [bottomPanel] : [];
              }
              if (bottomPanel === panelId) { // Clicked open bottom panel: move to top
                  return [bottomPanel, topPanel].filter(Boolean) as RightPanel[];
              }
              // Not open: open at top
              return [panelId, topPanel].filter(Boolean).slice(0, 2) as RightPanel[];
          } else { // Double click
              if (bottomPanel === panelId) { // Clicked open bottom panel: close it
                  return [topPanel];
              }
              if (topPanel === panelId) { // Clicked open top panel: move to bottom
                   return [bottomPanel, topPanel].filter(Boolean) as RightPanel[];
              }
              // Not open: open at bottom
              return [topPanel, panelId].filter(Boolean).slice(0, 2) as RightPanel[];
          }
      });
  };
  React.useEffect(() => {
      if (activePanels.length === 0 && isRightPanelOpen) {
          setIsRightPanelOpen(false);
      }
       if (activePanels.length > 0 && !isRightPanelOpen) {
          setIsRightPanelOpen(true);
      }
  }, [activePanels, isRightPanelOpen]);
}
```

---

## 3. Core Logic & Engines

### `src/lib/selection-engine.ts`

This class is the powerhouse of the application, containing the core algorithms for all selection tools. It handles the complex logic for the Magic Wand's flood-fill, the Intelligent Lasso's sophisticated pathfinding, and the creation and management of selection data.

#### Key Responsibilities:
- **Image Data Management:** It holds the raw pixel data (`ImageData`) of the source image, which is used for all color and edge calculations.
- **Tool State:** It maintains the internal state for multi-step tools like the Lasso and Line tool (e.g., storing node points as the user draws).
- **Magic Wand Algorithm:** Implements the `magicWand` method, a flood-fill algorithm that finds contiguous pixels based on color similarity. It's highly configurable through the `MagicWandSettings`.
- **Intelligent Lasso Pathfinding:** The `findEdgePath` method is the core of the "Magic Snap" feature. It uses an A* (or similar) pathfinding algorithm on a pre-computed `edgeMap` to find the optimal path between two points that follows the strongest edges.
- **Selection & Layer Creation:** Contains helper methods like `pathToSelection` (which converts a closed vector path into a pixel set) and `createLayerFromPixels` (which generates a new `Layer` object from a selection).
- **Rendering Logic:** Provides methods like `renderSelection` to draw the highlights, "marching ants" borders, and tool-specific previews (like the lasso path) onto the overlay canvas.

```typescript
import { LassoSettings, MagicWandSettings, Segment, Layer } from "./types";
import { rgbToHsv, rgbToLab } from "./color-utils";

const PRESET_HIGHLIGHT_COLORS = [
    'hsl(199, 98%, 48%)', // Blue
    'hsl(350, 98%, 55%)', // Red
    'hsl(140, 78%, 45%)', // Green
    'hsl(45, 98%, 52%)',  // Yellow
    'hsl(280, 88%, 60%)', // Purple
    'hsl(25, 95%, 55%)',  // Orange
];
let randomColorIndex = 0;


/**
 * The SelectionEngine class encapsulates all the core logic for creating and manipulating selections.
 * It operates on the image data and provides methods for tools like the Magic Wand and Lasso.
 */
export class SelectionEngine {
  // Direct references to canvas and its context for pixel manipulation.
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData | null = null;
  width: number;
  height: number;
  pixelData: Uint8ClampedArray | null = null;
  
  // A buffer to keep track of visited pixels during flood-fill operations to prevent infinite loops.
  visited: Uint8Array | null = null;
  
  // The current state of all layers in the workspace.
  layers: Layer[] = [];

  // State for the Lasso tool while it's being drawn.
  lassoNodes: [number, number][] = [];
  lassoCurrentPos: [number, number] | null = null;
  isDrawingLasso: boolean = false;
  
  // Memory for real-time path previews for the Intelligent Lasso.
  lassoPreviewPath: [number, number][] = [];
  futureLassoPath: [number, number][] = [];
  lassoMouseTrace: [number, number][] = [];
  
  // State for the Line/Path tool.
  lineNodes: [number, number][] = [];
  isDrawingLine: boolean = false;
  linePreviewPos: [number, number] | null = null;

  // A pre-computed map of edge strengths (gradients) across the image, used for edge-snapping.
  edgeMap: Float32Array | null = null;

  // Configuration settings for each tool, passed in from the main component.
  lassoSettings: LassoSettings = { /* ... default settings ... */ };
  magicWandSettings: MagicWandSettings = { /* ... default settings ... */ };
  negativeMagicWandSettings: MagicWandSettings = { /* ... default settings ... */ };


  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, layers: Layer[]) {
    this.canvas = canvas;
    this.ctx = context;
    this.width = canvas.width;
    this.height = canvas.height;
    this.layers = layers;
  }

  /**
   * Initializes the engine by grabbing the initial pixel data from the canvas
   * and pre-computing the edge map for the lasso tool.
   */
  initialize() {
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.pixelData = this.imageData.data;
    this.visited = new Uint8Array(this.width * this.height);
    this.computeEdgeMap();
  }
  
  /**
   * Updates the engine's internal copy of the layers.
   * @param layers The new array of layers.
   */
  updateLayers(layers: Layer[]) {
    this.layers = layers;
  }
  
  /**
   * Updates the settings for the various tools.
   */
  updateSettings(
    newLassoSettings: Partial<LassoSettings>,
    newWandSettings: Partial<MagicWandSettings>,
    newNegativeWandSettings: Partial<MagicWandSettings>
  ) {
    this.lassoSettings = { ...this.lassoSettings, ...newLassoSettings };
    this.magicWandSettings = { ...this.magicWandSettings, ...newWandSettings };
    this.negativeMagicWandSettings = { ...this.negativeMagicWandSettings, ...newNegativeWandSettings };
  }

  /**
   * Computes a gradient magnitude map using the Sobel operator. This map
   * represents the "strength" of edges in the image and is fundamental
   * to the Intelligent Lasso's edge-snapping capability.
   */
  computeEdgeMap() {
    // ... implementation of Sobel operator ...
  }

  /**
   * Helper to get the grayscale value of a pixel.
   */
  getGrayscale(x: number, y: number, data: Uint8ClampedArray) {
    // ... implementation ...
  }

  // #region LINE TOOL LOGIC
  // Contains methods for starting, updating, and ending a path with the Line/Pen tool.
  // #endregion

  // #region LASSO TOOL LOGIC
  
  /**
   * Starts a new lasso drawing session at the given coordinates.
   * If in 'magic' mode, it will first snap the starting point to a nearby edge.
   */
  startLasso(x: number, y: number) { /* ... */ }
  
  /**
   * Updates the preview path for the lasso as the user's mouse moves.
   * This is where the core pathfinding logic is triggered in 'magic' mode.
   */
  updateLassoPreview(x: number, y: number, mouseTrace: [number, number][]) { /* ... */ }

  /**
   * Adds a new node (or a series of points in free-draw mode) to the current lasso path.
   */
  addLassoNode(mouseTrace: [number, number][]) { /* ... */ }

  /**
   * Finalizes the lasso path, converting it into a pixel selection and creating a new layer.
   * @param activeLayerId The ID of the currently active layer.
   * @returns A new Layer object representing the selection, or null if the path was invalid.
   */
  endLasso(activeLayerId: string | null): Layer | null { /* ... */ }

  /**
   * The core pathfinding algorithm for the "Magic Snap" feature.
   * It finds the lowest-cost path between two points, where the cost is
   * a combination of distance, edge strength, and directional consistency.
   * @param p1 The starting point.
   * @param p2 The target point (current mouse position).
   * @returns An object containing the calculated `path` and a predicted `futurePath`.
   */
  findEdgePath(p1: [number, number], p2: [number, number], mouseTrace: [number, number][], withFuturePath = true): { path: [number, number][], futurePath: [number, number][] } {
    // ... A* pathfinding implementation ...
  }

  /**
   * Converts a closed vector path into a set of pixel indices using a scanline fill algorithm.
   * @param path An array of [x, y] coordinates representing the closed path.
   * @returns A Set of numbers, where each number is the index of a pixel inside the path.
   */
  pathToSelection(path: [number, number][]): Set<number> {
    // ... Scanline fill algorithm ...
  }
  // #endregion
  
  // #region MAGIC WAND LOGIC

  /**
   * The core Magic Wand algorithm. Performs a flood-fill from a starting
   * point to select all contiguous pixels that fall within a specified color tolerance.
   * @param x The starting x-coordinate.
   * @param y The starting y-coordinate.
   * @param previewOnly If true, returns the selection as a `Segment` without creating a layer.
   * @returns A `Segment` object representing the selection, or null.
   */
  magicWand(x: number, y: number, previewOnly = false): Segment | null {
    // ... Flood-fill implementation ...
  }

  /**
   * Retrieves the color of a single pixel in various color spaces (RGB, HSV, LAB).
   * @param index The index of the pixel in the `pixelData` array.
   * @returns An object containing the color values in all supported spaces.
   */
  getPixelColors(index: number): { rgb: any, hsv: any, lab: any } {
    // ... implementation ...
  }

  /**
   * Compares two colors based on the currently enabled tolerances in the settings.
   * @returns A boolean indicating if the neighbor color is within the tolerance of the seed color.
   */
  isWithinTolerance(seedColor: any, neighborColor: any): boolean {
    // ... implementation ...
  }
  // #endregion

  /**
   * Creates a new `Layer` object from a set of selected pixels.
   * This involves calculating the bounds and generating the `ImageData` for the new layer.
   * @param pixels A Set of selected pixel indices.
   * @param activeLayerId The ID of the currently active layer, used for masking.
   * @returns A new `Layer` object.
   */
  createLayerFromPixels(pixels: Set<number>, activeLayerId: string | null = null): Layer | null {
    // ... implementation ...
  }

  /**
   * Renders all visual feedback for the current selection and tools onto an overlay canvas.
   * This includes selection highlights, "marching ants" borders, and lasso path previews.
   */
  renderSelection(overlayCtx: CanvasRenderingContext2D, layers: Layer[], wandSettings: MagicWandSettings, lassoSettings: LassoSettings, hoveredSegment: Segment | null, draggedLayer: Layer | null = null, activeLayerId: string | null = null, activeTool: string) {
    // ... drawing logic for highlights, paths, and borders ...
  }
}
```

---

## 4. Data Structures & Types

### `src/lib/types.ts`

This file defines all the core data structures and TypeScript types used throughout the application. It ensures type safety and provides a single source of truth for the shape of our data, such as layers, tool settings, and AI-related inputs/outputs.

```typescript
import { z } from 'zod';

// Defines the set of all available tools in the application.
export type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line" | "banana" | "blemish-remover";

// Represents a one-click AI action, defining its UI and generative prompt.
export interface AITool {
    id: string;
    label: string;
    prompt: string;
    icon: React.ElementType;
    color: string;
    lineStyle: 'solid' | 'dashed';
    isOneClick?: boolean;
}

// The core data structure for a single layer in the layer stack.
export interface Layer {
    id: string; // Unique identifier
    name: string; // Display name in the layers panel
    type: 'segmentation' | 'background' | 'adjustment'; // The fundamental type of the layer
    subType?: 'pixel' | 'mask' | 'path'; // Specifies if it holds pixels, is a mask, or is a vector path
    parentId?: string | null; // If it's a child (e.g., a mask), this links to its parent layer
    visible: boolean; // Is the layer visible on the canvas?
    locked: boolean; // Is the layer locked from editing?
    pixels: Set<number>; // A set of pixel indices that belong to this layer's selection
    path?: [number, number][]; // An array of [x, y] coordinates for vector paths
    stroke?: string; // Stroke color for vector paths
    strokeWidth?: number; // Stroke width for vector paths
    fill?: string; // Fill color for vector paths
    closed: boolean; // Is the vector path closed?
    imageData?: ImageData; // The actual pixel data for pixel-based layers
    maskVisible?: boolean; // Is the colored highlight/mask overlay visible?
    highlightColor?: string;
    highlightOpacity?: number;
    highlightTexture?: 'solid' | 'checkerboard' | 'lines';
    modifiers?: Layer[]; // An array of child layers acting as modifiers (e.g., masks)
    bounds: { x: number; y: number; width: number; height: number }; // The bounding box of the layer content
}

// Defines all configurable settings for the Intelligent Lasso tool.
export interface LassoSettings {
    drawMode: 'magic' | 'polygon' | 'free';
    useAiEnhancement: boolean;
    showMouseTrace: boolean;
    showAllMasks: boolean;
    fillPath: boolean;
    snapRadius: number; // How close to an edge the cursor must be to snap.
    snapThreshold: number; // How strong an edge must be to be considered for snapping.
    curveStrength: number; // Controls the "curviness" of the path in polygon mode.
    curveTension: number;
    directionalStrength: number; // How much the path prefers to continue in its current direction.
    cursorInfluence: number; // How strongly the path is pulled towards the user's cursor.
    traceInfluence: number; // How much the path is influenced by the recent mouse trace.
    colorInfluence: number;
    snapRadiusEnabled: boolean;
    snapThresholdEnabled: boolean;
    curveStrengthEnabled: boolean;
    directionalStrengthEnabled: boolean;
    cursorInfluenceEnabled: boolean;
    traceInfluenceEnabled: boolean;
    colorInfluenceEnabled: boolean;
    useColorAwareness: boolean;
    freeDraw: {
        dropInterval: number; // Time in ms between automatic node drops.
        minDistance: number; // Minimum pixel distance to drop a new node.
        maxDistance: number; // Maximum pixel distance to drop a new node.
    };
}

// Defines all settings for the Clone Stamp tool.
export interface CloneStampSettings {
    brushSize: number;
    opacity: number;
    softness: number; // Feathering of the brush edge.
    rotationStep: number;
    sourceLayer: 'current' | 'all'; // Sample from the current layer or all visible layers.
    angle: number;
    flipX: boolean;
    flipY: boolean;
    blendMode: 'normal' | 'lights' | 'mids' | 'darks';
    useAdvancedBlending: boolean;
    tolerances: {
        values: MagicWandSettings['tolerances'];
        enabled: Set<keyof MagicWandSettings['tolerances']>;
    };
    falloff: number;
}

// Defines all settings for the Magic Wand tool.
export interface MagicWandSettings {
    tolerances: {
        r: number; g: number; b: number;
        h: number; s: number; v: number;
        l: number; a: number; b_lab: number;
    };
    contiguous: boolean; // Should the selection only include physically connected pixels?
    useAiAssist: boolean;
    createAsMask: boolean;
    showAllMasks: boolean;
    ignoreExistingSegments: boolean; // If true, can select pixels already in another layer.
    enabledTolerances: Set<keyof MagicWandSettings['tolerances']>; // Which color channels to consider.
    scrollAdjustTolerances: Set<keyof MagicWandSettings['tolerances']>; // Which tolerances are adjusted by scrolling.
    searchRadius: number; // For 'average' or 'dominant' sample modes.
    sampleMode: 'point' | 'average' | 'dominant';
    seedColor?: { [key: string]: number }; // The initial color sampled.
    useAntiAlias: boolean;
    useFeather: boolean;
    highlightColorMode: 'fixed' | 'random' | 'contrast';
    fixedHighlightColor: string;
    highlightOpacity: number;
    highlightTexture: 'solid' | 'checkerboard' | 'lines';
    highlightBorder: {
        enabled: boolean;
        thickness: number;
        color: string;
        colorMode: 'fixed' | 'contrast';
        pattern: 'solid' | 'dashed';
        opacity: number;
    };
    debounceDelay: number;
}

// Defines global application settings.
export interface GlobalSettings {
    snapEnabled: boolean;
    snapRadius: number;
}

// Defines all settings for the Transform tool.
export interface TransformSettings {
    scope: 'layer' | 'visible' | 'all'; // What the transformation applies to.
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX: number;
    skewY: number;
    maintainAspectRatio: boolean;
}

// Represents a temporary selection of pixels before it becomes a layer.
export interface Segment {
    id: number;
    pixels: Set<number>;
    bounds: { x: number; y: number; width: number; height: number };
}

// Defines all settings for the Feather/Edge Refinement panel.
export interface FeatherSettings {
  antiAlias: {
    enabled: boolean;
    method: 'smooth' | 'gaussian' | 'bilinear';
    quality: 'fast' | 'balanced' | 'high';
  };
  smartFeather: {
    enabled: boolean;
    alphaMatting: {
      enabled: boolean;
      method: 'closed-form' | 'knn' | 'learning-based';
      quality: number; // 0-1
    };
    backgroundAdaptation: {
      enabled: boolean;
      sampleRadius: number; // pixels
      adaptationStrength: number; // 0-1
      colorThreshold: number; // similarity threshold
    };
    gradientTransparency: {
      enabled: boolean;
      gradientRadius: number; // pixels
      smoothness: number; // 0-1
      edgeAware: boolean;
    };
    colorAwareProcessing: {
      enabled: boolean;
      haloPreventionStrength: number; // 0-1
      colorContextRadius: number; // pixels
    };
  };
}

// Zod schema for validating asset uploads to the AI flow.
export const UploadAssetInputSchema = z.object({
  userId: z.string().describe('The ID of the user uploading the asset.'),
  fileName: z.string().describe('The name of the file to be uploaded.'),
  fileDataUri: z
    .string()
    .describe(
      "The file content as a data URI. Must include a MIME type and use Base64 encoding. Format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type UploadAssetInput = z.infer<typeof UploadAssetInputSchema>;

// Zod schema for the output of the asset upload flow.
export const UploadAssetOutputSchema = z.object({
  downloadURL: z.string().optional().describe('The public URL to access the uploaded file.'),
  gcsPath: z.string().optional().describe('The path to the file in Google Cloud Storage.'),
  error: z.string().optional().describe('An error message if the upload failed.'),
});
export type UploadAssetOutput = z.infer<typeof UploadAssetOutputSchema>;
```
