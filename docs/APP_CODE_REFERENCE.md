# 💻 ProSegment AI: Complete Application Code Reference

> **Version**: 1.0
> **Date**: October 05, 2025
> **Status**: Live Code Snapshot & In-Progress Documentation

## 1. Introduction

This document provides an exhaustive, centralized snapshot of the source code for all major components and systems within the ProSegment AI application. It is intended to serve as a technical reference for the current state of the implementation, allowing for direct comparison with architectural blueprints and design documents.

---

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
  const [lassoSettings, setLassoSettings] = React.useState<LassoSettings>(/* ...initial settings... */);
  const [magicWandSettings, setMagicWandSettings] = React.useState<MagicWandSettings>(/* ...initial settings... */);
  const [cloneStampSettings, setCloneStampSettings] = React.useState<CloneStampSettings>(/* ...initial settings... */);
  const [transformSettings, setTransformSettings] = React.useState<TransformSettings>(/* ...initial settings... */);
  // ... and so on for other tools.

  // Refs for direct access to canvas and selection engine instances
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const selectionEngineRef = React.useRef<SelectionEngine | null>(null);
  const getSelectionMaskRef = React.useRef<() => string | undefined>();
  const clearSelectionRef = React.useRef<() => void>();
  
  // ... All the functions (speak, handleToolChange, setActiveWorkspaceState, addLayer, etc.) would be documented here ...
  // ... For brevity, the full function bodies are shown below without redundant comments.

  // The rest of the component's implementation...
}
```

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

type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line" | "banana" | "blemish-remover";
type RightPanel = 'zoom' | 'feather' | 'layers' | 'assets' | 'history' | 'color-analysis' | 'pixel-preview' | 'chat' | 'color-wheel';

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

function ProSegmentAIContent() {
  const [activeTool, setActiveTool] = React.useState<Tool>("banana")
  const [rightPanelWidth, setRightPanelWidth] = React.useState(380);
  const [isRightPanelOpen, setIsRightPanelOpen] = React.useState(true);
  const isResizingRef = React.useRef(false);
  const { toast } = useToast()
  
  const [activePanels, setActivePanels] = React.useState<RightPanel[]>(['layers']);
  
  const [zoomA, setZoomA] = React.useState(1.0);
  const [zoomB, setZoomB] = React.useState(4.0);
  const [activeZoom, setActiveZoom] = React.useState<'A' | 'B'>('A');
  const [hoveredZoom, setHoveredZoom] = React.useState<'A' | 'B' | null>(null);
  const [isSplitView, setIsSplitView] = React.useState(false);

  const mainCanvasZoom = activeZoom === 'A' ? zoomA : zoomB;

  const [pan, setPan] = React.useState({ x: 0, y: 0 });

  const [workspaces, setWorkspaces] = React.useState<WorkspaceState[]>([
    createNewWorkspace("ws-1", "Project 1", PlaceHolderImages[0]?.imageUrl)
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState<string>("ws-1");

  const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);
  const activeWorkspaceIndex = workspaces.findIndex(ws => ws.id === activeWorkspaceId);
  
  const [hoveredLayerId, setHoveredLayerId] = React.useState<string | null>(null);
  
  const { state: sidebarState } = useSidebar();
  const [showHotkeyLabels, setShowHotkeyLabels] = React.useState(false);
  
  const [showHorizontalRuler, setShowHorizontalRuler] = React.useState(false);
  const [showVerticalRuler, setShowVerticalRuler] = React.useState(false);
  const [showGuides, setShowGuides] = React.useState(false);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const [isTtsEnabled, setIsTtsEnabled] = React.useState(false);
  const [isSttEnabled, setIsSttEnabled] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // State for Nano Banana Tool
  const [instructionLayers, setInstructionLayers] = React.useState<InstructionLayer[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [customPrompt, setCustomPrompt] = React.useState("");
  
  const [globalSettings, setGlobalSettings] = React.useState<GlobalSettings>({
    snapEnabled: true,
    snapRadius: 10,
  });


  const speak = React.useCallback(async (text: string) => {
    if (!isTtsEnabled) return;

    try {
      const result = await textToSpeech(text);
      if (result.error || !result.audioDataUri) {
        throw new Error(result.error || "No audio data returned.");
      }
      
      if (audioRef.current) {
        audioRef.current.src = result.audioDataUri;
        audioRef.current.play();
      }

    } catch (error) {
      console.error("TTS Error:", error);
    }
  }, [isTtsEnabled]);
  
  React.useEffect(() => {
    // Create audio element once
    audioRef.current = new Audio();
  }, []);

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
    const toolName = tool.replace(/-/g, ' ');
    speak(`${toolName} selected`);
  }

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);


  const setActiveWorkspaceState = (updater: (prevState: WorkspaceState) => WorkspaceState) => {
    setWorkspaces(prevWorkspaces => 
      prevWorkspaces.map(ws => 
        ws.id === activeWorkspaceId ? updater(ws) : ws
      )
    );
  };
  
  const {
    draggedLayer,
    isDragging,
    handleMouseDown: handleDragMouseDown,
    handleMouseMove: handleDragMouseMove,
    handleMouseUp: handleDragMouseUp,
  } = useSelectionDrag(activeWorkspace?.layers || [], (newLayers) => setActiveWorkspaceState(ws => ({...ws, layers: newLayers})), activeTool, mainCanvasZoom);
  

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
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const selectionEngineRef = React.useRef<SelectionEngine | null>(null);
  const [isLassoPreviewHovered, setIsLassoPreviewHovered] = React.useState(false);
  const hoverTimeoutRef = React.useRef<{ A: NodeJS.Timeout | null, B: NodeJS.Timeout | null }>({ A: null, B: null });


  const getSelectionMaskRef = React.useRef<() => string | undefined>();
  const clearSelectionRef = React.useRef<() => void>();

  const maxHistorySize = 100;

  const addToHistory = React.useCallback((action: any) => {
    setActiveWorkspaceState(ws => {
      const newHistory = ws.history.slice(0, ws.historyIndex + 1);
      newHistory.push({
        ...action,
        timestamp: Date.now(),
        id: `action_${Date.now()}_${Math.random()}`
      });
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      return { ...ws, history: newHistory, historyIndex: newHistory.length - 1 };
    });
  }, [maxHistorySize, activeWorkspaceId]);

  const addLayer = (newLayer: Layer) => {
    setActiveWorkspaceState(ws => ({
      ...ws,
      layers: [...ws.layers, { ...newLayer, maskVisible: true }],
      activeLayerId: newLayer.id,
    }));
    addToHistory({ type: 'add_layer', layer: newLayer });
  };

  const updateLayer = React.useCallback((layerId: string, updatedPixels: Set<number>, newBounds: Layer['bounds']) => {
    const oldLayer = activeWorkspace?.layers.find(l => l.id === layerId);
    setActiveWorkspaceState(ws => ({
      ...ws,
      layers: ws.layers.map(l => {
        if (l.id === layerId) {
          const engine = selectionEngineRef.current;
          if (!engine) return l;
          const newImageData = engine.createImageDataForLayer(updatedPixels, newBounds);
          return { ...l, pixels: updatedPixels, bounds: newBounds, imageData: newImageData };
        }
        return l;
      }),
    }));
    if (oldLayer) {
        addToHistory({ type: 'update_layer', layerId, oldPixels: oldLayer.pixels, newPixels: updatedPixels });
    }
  }, [activeWorkspace?.layers, addToHistory]);

  const removePixelsFromLayers = React.useCallback((pixelsToRemove: Set<number>) => {
    const layersToUpdate: {layerId: string, oldPixels: Set<number>}[] = [];
    setActiveWorkspaceState(ws => ({
      ...ws,
      layers: ws.layers.map(layer => {
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
      })
    }));
    if (layersToUpdate.length > 0) {
        addToHistory({ type: 'remove_pixels', layers: layersToUpdate, removedPixels: pixelsToRemove });
    }
  }, [addToHistory]);

  const toggleLayerVisibility = (layerId: string) => {
    setActiveWorkspaceState(ws => ({ ...ws, layers: ws.layers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l) }));
    addToHistory({ type: 'toggle_visibility', layerId });
  };
  
  const toggleLayerLock = (layerId: string) => {
     if (layerId === `background-${activeWorkspaceId}`) return;
    setActiveWorkspaceState(ws => ({ ...ws, layers: ws.layers.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l) }));
     addToHistory({ type: 'toggle_lock', layerId });
  };

  const toggleLayerMask = (layerId: string) => {
    setActiveWorkspaceState(ws => ({ ...ws, layers: ws.layers.map(l => l.id === layerId ? { ...l, maskVisible: !(l.maskVisible ?? true) } : l) }));
  };

  const deleteLayer = (layerId: string) => {
    if (layerId === `background-${activeWorkspaceId}`) return; // Cannot delete background
    const layerToDelete = activeWorkspace?.layers.find(l => l.id === layerId);
    if (!layerToDelete) return;
    
    setActiveWorkspaceState(ws => {
      const newLayers = ws.layers.filter(l => l.id !== layerId && l.parentId !== layerId);
      const newActiveLayerId = ws.activeLayerId === layerId ? `background-${ws.id}` : ws.activeLayerId;
      return { ...ws, layers: newLayers, activeLayerId: newActiveLayerId };
    });
    addToHistory({ type: 'delete_layer', layer: layerToDelete });
  };

  const handleUndo = React.useCallback(() => {
    if (!activeWorkspace || activeWorkspace.historyIndex < 0) return;
    const action = activeWorkspace.history[activeWorkspace.historyIndex];
    toast({ title: "Undo", description: `Reverted: ${action.type}` });
    setActiveWorkspaceState(ws => ({...ws, historyIndex: ws.historyIndex - 1 }));
  }, [activeWorkspace, toast]);

  const handleRedo = React.useCallback(() => {
    if (!activeWorkspace || activeWorkspace.historyIndex >= activeWorkspace.history.length - 1) return;
    const action = activeWorkspace.history[activeWorkspace.historyIndex + 1];
    toast({ title: "Redo", description: `Re-applied: ${action.type}` });
    setActiveWorkspaceState(ws => ({...ws, historyIndex: ws.historyIndex + 1 }));
  }, [activeWorkspace, toast]);


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

  React.useEffect(() => {
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

  const handleShelfClick = (panelId: RightPanel, clickType: 'single' | 'double') => {
    setActivePanels(currentPanels => {
        const topPanel = currentPanels[0];
        const bottomPanel = currentPanels[1];

        // Panel is already open
        if (topPanel === panelId && clickType === 'single') {
            return bottomPanel ? [bottomPanel] : [];
        }
        if (bottomPanel === panelId && clickType === 'double') {
            return [topPanel];
        }
        if (topPanel === panelId && clickType === 'double') {
             return bottomPanel ? [bottomPanel, topPanel] : [undefined, topPanel] as RightPanel[];
        }
        if (bottomPanel === panelId && clickType === 'single') {
             return [bottomPanel, topPanel];
        }

        // Panel is not open, add it
        if (clickType === 'single') {
            return [panelId, topPanel].filter(Boolean).slice(0, 2) as RightPanel[];
        } else { // double click
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

  return (
    <div className="h-screen w-screen bg-background overflow-hidden relative">
      <header className="absolute top-0 left-0 right-0 h-12 flex items-center border-b border-border/50 px-4 z-40 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                    <PanelLeft />
                </Button>
            </SidebarTrigger>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <p className="font-bold text-lg text-white">Ps</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAddNewWorkspace}>
                <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 flex-1">
              <WorkspaceTabs 
                  workspaces={workspaces}
                  activeWorkspaceId={activeWorkspaceId}
                  onWorkspaceSelect={setActiveWorkspaceId}
                  onWorkspaceClose={handleCloseWorkspace}
              />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showHorizontalRuler || showVerticalRuler ? "secondary" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => {
                        const newState = !(showHorizontalRuler && showVerticalRuler);
                        setShowHorizontalRuler(newState);
                        setShowVerticalRuler(newState);
                    }}
                  >
                    <Ruler />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Toggle Rulers</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={showGuides ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setShowGuides(p => !p)}>
                    <MoveHorizontal className="w-4 h-4 absolute rotate-90" /><MoveVertical className="w-4 h-4 absolute" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Toggle Guides</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={globalSettings.snapEnabled ? "secondary" : "outline"} size="icon" className="h-8 w-8" onClick={() => setGlobalSettings(s => ({...s, snapEnabled: !s.snapEnabled}))}>
                    <Magnet />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Toggle Snapping</p></TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="h-6 mx-2" />
               <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowBigUpDash /></Button></TooltipTrigger>
                <TooltipContent><p>Fit to Height</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowBigRightDash /></Button></TooltipTrigger>
                <TooltipContent><p>Fit to Width</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ZoomControl 
              zoomLevel={zoomA}
              setZoomLevel={setZoomA}
              isActive={activeZoom === 'A'}
              onClick={() => setActiveZoom('A')}
              label="Zoom A"
              hotkey="1"
            />
            <ZoomControl 
              zoomLevel={zoomB}
              setZoomLevel={setZoomB}
              isActive={activeZoom === 'B'}
              onClick={() => setActiveZoom('B')}
              label="Zoom B"
              hotkey="2"
            />
            <Button variant="ghost" size="icon" onClick={() => setIsSplitView(p => !p)}>
                <Split className={cn("w-5 h-5", isSplitView && "text-primary")} />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="ghost" size="icon" onClick={handleUndo} disabled={activeWorkspace.historyIndex < 0}>
                <Undo2 className="w-5 h-5"/>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRedo} disabled={activeWorkspace.historyIndex >= activeWorkspace.history.length - 1}>
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
                {activeWorkspace.history.length > 0 ? activeWorkspace.history.slice().reverse().map((action, index) => (
                    <DropdownMenuItem key={action.id} onSelect={() => {}}>
                        <span>{action.type.replace(/_/g, ' ')}</span>
                    </DropdownMenuItem>
                )) : <DropdownMenuItem disabled>No history</DropdownMenuItem>}
                </DropdownMenuContent>
            </DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={isSttEnabled ? "secondary" : "outline"} size="icon" className="h-8 w-8" onClick={() => setIsSttEnabled(p => !p)}>
                    <Ear />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Enable Voice Commands (Listen)</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={isTtsEnabled ? "secondary" : "outline"} size="icon" className="h-8 w-8" onClick={() => setIsTtsEnabled(p => !p)}>
                    <Speech />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Enable AI Voice Feedback (Speak)</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
      </header>
       <main 
        className="absolute inset-y-0 right-0 flex flex-col" 
        style={{ 
          top: '3rem',
          left: '0px',
        }}
      >
        <div className="flex-1 min-h-0">
          <ImageCanvas 
              key={activeWorkspace.id}
              imageUrl={activeWorkspace.imageUrl}
              layers={activeWorkspace.layers}
              addLayer={addLayer}
              updateLayer={updateLayer}
              removePixelsFromLayers={removePixelsFromLayers}
              activeLayerId={activeWorkspace.activeLayerId}
              onLayerSelect={(id) => setActiveWorkspaceState(ws => ({ ...ws, activeLayerId: id }))}
              segmentationMask={activeWorkspace.segmentationMask}
              setSegmentationMask={(mask) => setActiveWorkspaceState(ws => ({...ws, segmentationMask: mask }))}
              activeTool={activeTool}
              lassoSettings={lassoSettings}
              magicWandSettings={magicWandSettings}
              negativeMagicWandSettings={negativeMagicWandSettings}
              cloneStampSettings={cloneStampSettings}
              onLassoSettingChange={handleLassoSettingsChange}
              onMagicWandSettingsChange={handleMagicWandSettingsChange}
              onNegativeMagicWandSettingChange={handleNegativeMagicWandSettingsChange}
              onCloneStampSettingsChange={handleCloneStampSettingsChange}
              getSelectionMaskRef={getSelectionMaskRef}
              clearSelectionRef={clearSelectionRef}
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
              showHorizontalRuler={showHorizontalRuler}
              showVerticalRuler={showVerticalRuler}
              showGuides={showGuides}
              globalSettings={globalSettings}
              />
          </div>
      </main>
       <div 
        className="absolute left-0 top-12 h-[calc(100vh-3rem)] z-20"
      >
        <Sidebar collapsible="icon">
          <SidebarHeader>
            
          </SidebarHeader>
          <SidebarContent>
              <ToolSettingsPanel
                magicWandSettings={magicWandSettings}
                onMagicWandSettingsChange={handleMagicWandSettingsChange}
                lassoSettings={lassoSettings}
                onLassoSettingsChange={handleLassoSettingsChange}
                cloneStampSettings={cloneStampSettings}
                onCloneStampSettingsChange={handleCloneStampSettingsChange}
                transformSettings={transformSettings}
                onTransformSettingsChange={setTransformSettings}
                activeTool={activeTool}
                showHotkeys={showHotkeyLabels}
                onShowHotkeysChange={setShowHotkeyLabels}
                globalSettings={globalSettings}
                onGlobalSettingsChange={setGlobalSettings}
                // AI Panel Props
                instructionLayers={instructionLayers}
                onInstructionChange={(id, prompt) => setInstructionLayers(layers => layers.map(l => l.id === id ? {...l, prompt} : l))}
                onLayerDelete={(id) => setInstructionLayers(layers => layers.filter(l => l.id !== id))}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
              />
          </SidebarContent>
        </Sidebar>
      </div>
      <div 
        className="absolute top-12 h-[calc(100vh-3rem)] z-30"
        style={{
          left: sidebarWidthVar,
          transition: 'left 0.2s ease-in-out',
        }}
      >
        <ToolPanel
          activeTool={activeTool}
          setActiveTool={handleToolChange}
          showHotkeys={showHotkeyLabels}
          onAiToolClick={handleAiToolClick}
        />
      </div>
      
      <div 
        className="absolute top-12 h-[calc(100vh-3rem)] z-20 transition-all"
        style={{
            right: isRightPanelOpen ? `${rightPanelWidth + 56}px` : '56px',
        }}
      >
          {activeWorkspace && 
            <LayerStripPanel 
                layers={activeWorkspace.layers}
                activeLayerId={activeWorkspace.activeLayerId}
                hoveredLayerId={hoveredLayerId}
                onLayerSelect={(id) => setActiveWorkspaceState(ws => ({...ws, activeLayerId: id}))}
                onHoverLayer={setHoveredLayerId}
                onAddLayer={() => {}}
                imageUrl={activeWorkspace.imageUrl}
            />}
      </div>

      <div className="fixed right-0 top-12 flex h-[calc(100vh-3rem)]">
        <div 
          className={cn(
            "h-full flex flex-col border-l bg-background/80 backdrop-blur-sm transition-all",
            isRightPanelOpen ? "w-auto" : "w-0"
          )}
          style={{ width: isRightPanelOpen ? `${rightPanelWidth}px` : '0px'}}
        >
             {isRightPanelOpen && (
                 <div className="flex-1 flex flex-col min-h-0">
                    {activePanels.length === 0 ? null :
                     activePanels.length === 1 ? (
                        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                            {renderPanelContent(activePanels[0])}
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                                {renderPanelContent(activePanels[0])}
                            </div>
                            <Separator />
                            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                                {renderPanelContent(activePanels[1])}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
        <div className="h-full w-14 flex flex-col items-center justify-between border-l bg-background/80 backdrop-blur-sm p-2 z-10">
          <div className="flex flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsRightPanelOpen(p => !p)}>
                    {isRightPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>{isRightPanelOpen ? 'Close Panel' : 'Open Panel'}</p></TooltipContent>
              </Tooltip>
              <Separator />
               <div className="space-y-1 flex flex-col">
                {allShelfIcons.map(({id, icon: Icon, label}) => {
                  const isActive = activePanels.includes(id);
                  return (
                    <Tooltip key={id}>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={isActive && isRightPanelOpen ? "secondary" : "ghost"} 
                          size="icon" 
                          onClick={() => handleShelfClick(id, 'single')}
                          onDoubleClick={() => handleShelfClick(id, 'double')}>
                          <Icon className="h-5 w-5"/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left"><p>{label}</p></TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>
          </div>
      </div>
      </div>
    </div>
  )
}

function WorkspaceTabs({ 
  workspaces, 
  activeWorkspaceId, 
  onWorkspaceSelect, 
  onWorkspaceClose,
}: {
  workspaces: WorkspaceState[];
  activeWorkspaceId: string;
  onWorkspaceSelect: (id: string) => void;
  onWorkspaceClose: (id: string) => void;
}) {
  return (
    <div className="flex-1 flex items-end -mb-px">
      {workspaces.map(ws => (
        <div
          key={ws.id}
          onClick={() => onWorkspaceSelect(ws.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 cursor-pointer text-sm font-medium transition-colors rounded-t-md",
            activeWorkspaceId === ws.id 
              ? "bg-background border-border/50 border-x border-t text-foreground"
              : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <span>{ws.name}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onWorkspaceClose(ws.id) }}>
            <XIcon className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}


export function ProSegmentAI() {
  return (
    <SidebarProvider>
      <ProSegmentAIContent />
    </SidebarProvider>
  )
}
```

---

## 3. Core Logic & Engines

### `src/lib/selection-engine.ts`

This class contains the core algorithms for all selection tools, including the Magic Wand flood-fill and the Intelligent Lasso pathfinding.

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
 * Advanced Selection Engine
 */
export class SelectionEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData | null = null;
  width: number;
  height: number;
  pixelData: Uint8ClampedArray | null = null;
  visited: Uint8Array | null = null;
  layers: Layer[] = [];

  // Lasso State
  lassoNodes: [number, number][] = [];
  lassoCurrentPos: [number, number] | null = null;
  isDrawingLasso: boolean = false;
  
  // New Lasso Path Memory
  lassoPreviewPath: [number, number][] = [];
  futureLassoPath: [number, number][] = [];
  lassoMouseTrace: [number, number][] = [];
  
  // Line State
  lineNodes: [number, number][] = [];
  isDrawingLine: boolean = false;
  linePreviewPos: [number, number] | null = null;

  // Edge Detection
  edgeMap: Float32Array | null = null;

  // Settings
  lassoSettings: LassoSettings = {
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
  };
  magicWandSettings: MagicWandSettings = {
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
  };
   negativeMagicWandSettings: MagicWandSettings = {
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
  };


  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, layers: Layer[]) {
    this.canvas = canvas;
    this.ctx = context;
    this.width = canvas.width;
    this.height = canvas.height;
    this.layers = layers;
  }

  initialize() {
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.pixelData = this.imageData.data;
    this.visited = new Uint8Array(this.width * this.height);
    this.computeEdgeMap();
  }
  
  updateLayers(layers: Layer[]) {
    this.layers = layers;
  }
  
  updateSettings(
    newLassoSettings: Partial<LassoSettings>,
    newWandSettings: Partial<MagicWandSettings>,
    newNegativeWandSettings: Partial<MagicWandSettings>
  ) {
    this.lassoSettings = { ...this.lassoSettings, ...newLassoSettings };
    this.magicWandSettings = { ...this.magicWandSettings, ...newWandSettings };
    this.negativeMagicWandSettings = { ...this.negativeMagicWandSettings, ...newNegativeWandSettings };
  }

  computeEdgeMap() {
    if (!this.imageData) return;

    this.edgeMap = new Float32Array(this.width * this.height);
    const data = this.imageData.data;

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const idx = y * this.width + x;

        const gx =
          -1 * this.getGrayscale(x - 1, y - 1, data) +
          1 * this.getGrayscale(x + 1, y - 1, data) +
          -2 * this.getGrayscale(x - 1, y, data) +
          2 * this.getGrayscale(x + 1, y, data) +
          -1 * this.getGrayscale(x - 1, y + 1, data) +
          1 * this.getGrayscale(x + 1, y + 1, data);

        const gy =
          -1 * this.getGrayscale(x - 1, y - 1, data) +
          -2 * this.getGrayscale(x, y - 1, data) +
          -1 * this.getGrayscale(x + 1, y - 1, data) +
          1 * this.getGrayscale(x - 1, y + 1, data) +
          2 * this.getGrayscale(x, y + 1, data) +
          1 * this.getGrayscale(x + 1, y + 1, data);

        this.edgeMap[idx] = Math.sqrt(gx * gx + gy * gy);
      }
    }
  }

  getGrayscale(x: number, y: number, data: Uint8ClampedArray) {
    const idx = (y * this.width + x) * 4;
    return (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
  }

  // #region LINE
  startLine(x: number, y: number) {
    this.cancelLine();
    this.lineNodes = [[x, y]];
    this.isDrawingLine = true;
  }

  cancelLine() {
    this.lineNodes = [];
    this.linePreviewPos = null;
    this.isDrawingLine = false;
  }
  
  updateLinePreview(x: number, y: number) {
      if (!this.isDrawingLine) return;
      this.linePreviewPos = [x, y];
  }

  addNodeToLine() {
      if (!this.isDrawingLine || !this.linePreviewPos) return;
      this.lineNodes.push(this.linePreviewPos);
  }

  endLine(activeLayerId: string | null, closed: boolean, fill: boolean): Layer | null {
    if (!this.isDrawingLine || this.lineNodes.length < 2) {
      this.cancelLine();
      return null;
    }

    const pathPoints = [...this.lineNodes];
    if (this.linePreviewPos && this.lassoSettings.drawMode !== 'free') {
      pathPoints.push(this.linePreviewPos);
    }
    
    const finalPath = this.lassoSettings.drawMode === 'free' ? 
        this.generateSplinePath(pathPoints, false, 0.05) : // Use a smaller step for free draw
        this.generateSplinePath(pathPoints, closed);

    let pixels = new Set<number>();
    if (closed && fill) {
      pixels = this.pathToSelection(finalPath);
    }

    const bounds = this.getBoundsForPixels(pixels, finalPath);

    const newLayer: Layer = {
      id: `path-${Date.now()}`,
      name: `Path ${this.layers.filter(l => l.subType === 'path').length + 1}`,
      type: 'segmentation',
      subType: 'path',
      visible: true,
      locked: false,
      pixels: pixels,
      path: finalPath,
      bounds: bounds,
      stroke: 'hsl(var(--primary))',
      strokeWidth: 2,
      closed: closed,
      fill: closed && fill ? 'hsla(var(--primary), 0.2)' : undefined,
    };
    
    this.cancelLine();
    return newLayer;
  }
  
  removeLastNode() {
      if (this.isDrawingLasso) this.removeLastLassoNode();
      if (this.isDrawingLine) this.removeLastLineNode();
  }

  removeLastLineNode() {
    if (this.lineNodes.length > 1) {
      this.lineNodes.pop();
    } else if (this.lineNodes.length === 1) {
      this.cancelLine();
    }
  }
  // #endregion

  // #region LASSO
  startLasso(x: number, y: number) {
    this.cancelLasso();
    const startPoint: [number, number] = this.lassoSettings.drawMode === 'magic' ? this.snapToEdge(x, y) : [x, y];
    this.lassoNodes = [startPoint];
    this.lassoCurrentPos = startPoint;
    this.isDrawingLasso = true;
  }
  
  cancelLasso() {
    this.lassoNodes = [];
    this.lassoCurrentPos = null;
    this.isDrawingLasso = false;
    this.lassoPreviewPath = [];
    this.futureLassoPath = [];
    this.lassoMouseTrace = [];
  }

  updateLassoPreview(x: number, y: number, mouseTrace: [number, number][]) {
    if (!this.isDrawingLasso || !this.lassoNodes.length) return;
    
    this.lassoCurrentPos = [x, y];
    this.lassoMouseTrace = mouseTrace;
    const lastNode = this.lassoNodes[this.lassoNodes.length - 1];
    
    let previewPath: [number, number][];
    let futurePath: [number, number][] = [];

    switch(this.lassoSettings.drawMode) {
      case 'magic':
        const result = this.findEdgePath(lastNode, [x, y], this.lassoMouseTrace);
        previewPath = result.path;
        futurePath = result.futurePath;
        break;
      case 'polygon':
        previewPath = [[x, y]];
        break;
      case 'free':
        previewPath = [...mouseTrace];
        break;
      default:
        previewPath = [];
    }
    
    this.lassoPreviewPath = previewPath;
    this.futureLassoPath = futurePath;
  }


  addLassoNode(mouseTrace: [number, number][]) {
    if (!this.isDrawingLasso || !this.lassoCurrentPos) return;

    const newNodes = this.lassoSettings.drawMode === 'free' ? mouseTrace : this.lassoPreviewPath;

    const fullPath = [...this.lassoNodes, ...newNodes];
    
    this.lassoNodes = fullPath;
    this.lassoPreviewPath = [];
    this.futureLassoPath = [];
    this.lassoMouseTrace = [];
    
    const newAnchor = this.lassoNodes[this.lassoNodes.length-1];
    this.updateLassoPreview(newAnchor[0], newAnchor[1], []);
  }

  removeLastLassoNode() {
    if (this.lassoNodes.length > 1) {
      this.lassoNodes.pop();
    } else if (this.lassoNodes.length === 1) {
      this.cancelLasso();
    }
  }
  
  endLassoWithEnhancedPath(enhancedPath: {x:number, y:number}[]): Layer | null {
      if (!this.isDrawingLasso) return null;

      const pathAsTuples: [number, number][] = enhancedPath.map(p => [p.x, p.y]);
      
      if (pathAsTuples.length > 2) {
          const first = pathAsTuples[0];
          const last = pathAsTuples[pathAsTuples.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
              pathAsTuples.push(first);
          }
      }
      
      const pixels = this.pathToSelection(pathAsTuples);
      const layer = this.createLayerFromPixels(pixels);
      this.cancelLasso();
      return layer;
  }

  endLasso(activeLayerId: string | null): Layer | null {
    if (!this.isDrawingLasso || this.lassoNodes.length < 2) {
      this.cancelLasso();
      return null;
    }

    const fullPath = this.getLassoPath(true);
    let newLayer: Layer | null = null;
    if(fullPath.length > 2) {
        const pixels = this.pathToSelection(fullPath);
        newLayer = this.createLayerFromPixels(pixels, activeLayerId);
    }
    
    this.cancelLasso();
    return newLayer;
  }

  getLassoPath(closed = false) {
    if (!this.isDrawingLasso) return [];

    let rawPath = [...this.lassoNodes, ...this.lassoPreviewPath];
    
    if (this.lassoSettings.drawMode !== 'magic' && this.lassoSettings.curveStrength > 0 && this.lassoNodes.length > 1) {
        let pathForSpline = [...this.lassoNodes];
        if (this.lassoCurrentPos) {
            pathForSpline.push(this.lassoCurrentPos);
        }
        rawPath = this.generateSplinePath(pathForSpline, closed);
    }
    
    if (closed && rawPath.length > 1) {
        const firstNode = rawPath[0];
        const lastNode = rawPath[rawPath.length - 1];
        if (Math.hypot(firstNode[0] - lastNode[0], firstNode[1] - lastNode[1]) > 1) {
            if (this.lassoSettings.drawMode === 'magic') {
                const closingPath = this.findEdgePath(lastNode, firstNode, [], false).path;
                rawPath.push(...closingPath);
            } else {
                 rawPath.push(firstNode);
            }
        }
    }
    
    return rawPath;
  }

  generateSplinePath(points: [number, number][], closed: boolean, step = 0.1): [number, number][] {
      if (points.length < 2) return points;

      const tension = this.lassoSettings.curveTension;
      if (tension === 0) return points; // Straight lines

      const path: [number, number][] = [];
      const numSegments = Math.floor(1 / step);

      let p = [...points];
      if (closed && p.length > 2) {
          p.unshift(points[points.length - 1]);
          p.push(points[1]);
      } else {
          p.unshift(points[0]);
          p.push(points[points.length - 1]);
      }

      for (let i = 1; i < p.length - 2; i++) {
          const p0 = p[i - 1];
          const p1 = p[i];
          const p2 = p[i + 1];
          const p3 = p[i + 2];

          for (let j = 0; j <= numSegments; j++) {
              const t = j / numSegments;
              const t2 = t * t;
              const t3 = t2 * t;

              // Catmull-Rom spline formula
              const c1 = -tension * t3 + 2 * tension * t2 - tension * t;
              const c2 = (2 - tension) * t3 + (tension - 3) * t2 + 1;
              const c3 = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * t;
              const c4 = tension * t3 - tension * t2;

              const x = c1 * p0[0] + c2 * p1[0] + c3 * p2[0] + c4 * p3[0];
              const y = c1 * p0[1] + c2 * p1[1] + c3 * p2[1] + c4 * p3[1];
              path.push([x, y]);
          }
      }

      return path;
  }
  
  findEdgePath(p1: [number, number], p2: [number, number], mouseTrace: [number, number][], withFuturePath = true): { path: [number, number][], futurePath: [number, number][] } {
    if (this.lassoSettings.drawMode !== 'magic' || !this.edgeMap) {
        return { path: [p2], futurePath: [] };
    }

    const path: [number, number][] = [];
    const futurePath: [number, number][] = [];
    let currentPoint = p1;
    const visitedInPath = new Set<number>();
    visitedInPath.add(Math.round(p1[1]) * this.width + Math.round(p1[0]));

    const initialDistToTarget = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const maxSteps = initialDistToTarget * 2 + (withFuturePath ? 50 : 0);
    let steps = 0;
    
    let lastDirection: [number, number] | null = null;
    const falloffDistance = 50; 

    while (steps < maxSteps) {
        steps++;
        const targetPoint = p2;
        
        const distToTarget = Math.hypot(targetPoint[0] - currentPoint[0], targetPoint[1] - currentPoint[1]);
        if (withFuturePath && distToTarget < 1) {
            withFuturePath = false; 
            const futureTarget: [number, number] = [
                targetPoint[0] + (lastDirection ? lastDirection[0] : 0) * 50,
                targetPoint[1] + (lastDirection ? lastDirection[1] : 0) * 50
            ];
            const futureResult = this.findEdgePath(targetPoint, futureTarget, [], false);
            futurePath.push(...futureResult.path);
            path.push(p2);
            break;
        } else if (!withFuturePath && steps > initialDistToTarget * 2) {
             break;
        }
        else if (distToTarget < (this.lassoSettings.snapRadiusEnabled ? this.lassoSettings.snapRadius : 1)) {
            path.push(p2);
            break;
        }

        let bestNextPoint: [number, number] | null = null;
        let minCost = Infinity;
        
        const searchRadius = Math.max(1, Math.min((this.lassoSettings.snapRadiusEnabled ? this.lassoSettings.snapRadius : 1), Math.floor(distToTarget / 4) + 1));

        const startY = Math.max(0, Math.round(currentPoint[1]) - searchRadius);
        const endY = Math.min(this.height - 1, Math.round(currentPoint[1]) + searchRadius);
        const startX = Math.max(0, Math.round(currentPoint[0]) - searchRadius);
        const endX = Math.min(this.width - 1, Math.round(currentPoint[0]) + searchRadius);

        const vectorToTarget = [targetPoint[0] - currentPoint[0], targetPoint[1] - currentPoint[1]];
        const magToTarget = Math.hypot(vectorToTarget[0], vectorToTarget[1]);
        const dirToTarget = [vectorToTarget[0] / magToTarget, vectorToTarget[1] / magToTarget];

        const currentCursorInfluence = this.lassoSettings.cursorInfluenceEnabled ? this.lassoSettings.cursorInfluence : 0;
        const currentTraceInfluence = this.lassoSettings.traceInfluenceEnabled ? this.lassoSettings.traceInfluence : 0;
        const currentColorInfluence = this.lassoSettings.colorInfluenceEnabled ? this.lassoSettings.colorInfluence : 0;
        const currentDirectionalStrength = this.lassoSettings.directionalStrengthEnabled ? this.lassoSettings.directionalStrength : 0;

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const idx = y * this.width + x;
                if (visitedInPath.has(idx)) continue;

                const distSq = (x - currentPoint[0])**2 + (y - currentPoint[1])**2;
                if (distSq === 0 || distSq > searchRadius * searchRadius) continue;
                
                const vectorToCandidate = [x - currentPoint[0], y - currentPoint[1]];
                const magToCandidate = Math.hypot(vectorToCandidate[0], vectorToCandidate[1]);
                const dirToCandidate = [vectorToCandidate[0] / magToCandidate, vectorToCandidate[1] / magToCandidate];

                const directionSimilarity = (dirToCandidate[0] * dirToTarget[0] + dirToCandidate[1] * dirToTarget[1] + 1) / 2;
                
                const edgeStrength = (this.edgeMap[idx] || 0) > (this.lassoSettings.snapThresholdEnabled ? this.lassoSettings.snapThreshold : 1) ? this.edgeMap[idx] : 0;
                
                let traceCost = 0;
                if (currentTraceInfluence > 0 && mouseTrace.length > 0) {
                    let minTraceDistSq = Infinity;
                    for(const tracePoint of mouseTrace) {
                        const distSq = (x - tracePoint[0])**2 + (y - tracePoint[1])**2;
                        if (distSq < minTraceDistSq) {
                            minTraceDistSq = distSq;
                        }
                    }
                    traceCost = Math.sqrt(minTraceDistSq) * 10 * currentTraceInfluence;
                }

                const cursorCost = (1 - directionSimilarity) * 500 * (withFuturePath ? currentCursorInfluence : 0);
                const edgeCost = (1 / (edgeStrength + 1)) * 1000;

                let colorCost = 0;
                if (currentColorInfluence > 0) {
                    const lastPathPointColor = this.getPixelColors(Math.round(currentPoint[1]) * this.width + Math.round(currentPoint[0]));
                    const candidateColor = this.getPixelColors(idx);
                    const colorDifference = this.getColorDifference(lastPathPointColor, candidateColor, this.magicWandSettings);
                    colorCost = (1 - colorDifference) * 500 * currentColorInfluence;
                }
                
                let curvatureCost = 0;
                let directionalCost = 0;

                if (lastDirection) {
                    const dot = dirToCandidate[0] * lastDirection[0] + dirToCandidate[1] * lastDirection[1];
                    const angleChange = Math.acos(Math.max(-1, Math.min(1, dot)));
                    
                    const stepsFromAnchor = path.length;
                    const falloff = Math.min(1, stepsFromAnchor / falloffDistance);
                    
                    directionalCost = (1 - dot) * 500 * currentDirectionalStrength * falloff;
                }

                const cost = cursorCost + edgeCost + curvatureCost + directionalCost + traceCost + colorCost;

                if (cost < minCost) {
                    minCost = cost;
                    bestNextPoint = [x, y];
                }
            }
        }

        if (bestNextPoint) {
            const newDirection = [bestNextPoint[0] - currentPoint[0], bestNextPoint[1] - currentPoint[1]];
            const mag = Math.hypot(newDirection[0], newDirection[1]);
            if (mag > 0) {
              lastDirection = [newDirection[0] / mag, newDirection[1] / mag];
            }

            path.push(bestNextPoint);
            currentPoint = bestNextPoint;
            visitedInPath.add(Math.round(bestNextPoint[1]) * this.width + Math.round(bestNextPoint[0]));
        } else {
            const jumpDist = Math.min((this.lassoSettings.snapRadiusEnabled ? this.lassoSettings.snapRadius : 1), distToTarget);
            const nextX = Math.round(currentPoint[0] + dirToTarget[0] * jumpDist);
            const nextY = Math.round(currentPoint[1] + dirToTarget[1] * jumpDist);
            const nextPoint: [number, number] = [nextX, nextY];
            path.push(nextPoint);
            currentPoint = nextPoint;
            lastDirection = null;
        }
    }
    return { path, futurePath };
}


  snapToEdge(x: number, y: number): [number, number] {
    if (!this.edgeMap || this.lassoSettings.drawMode !== 'magic') return [Math.round(x), Math.round(y)];
    
    const radius = this.lassoSettings.snapRadiusEnabled ? this.lassoSettings.snapRadius : 1;
    let maxEdge = -1;
    let bestX = Math.round(x);
    let bestY = Math.round(y);

    const startY = Math.max(0, Math.round(y) - radius);
    const endY = Math.min(this.height - 1, Math.round(y) + radius);
    const startX = Math.max(0, Math.round(x) - radius);
    const endX = Math.min(this.width - 1, Math.round(x) - radius);

    for (let sy = startY; sy <= endY; sy++) {
      for (let sx = startX; sx <= endX; sx++) {
        const distSq = (sx - x) * (sx - x) + (sy - y) * (sy - y);
        if (distSq > radius * radius) continue;

        const idx = sy * this.width + sx;
        const edgeStrength = this.edgeMap[idx];

        if (edgeStrength > maxEdge && edgeStrength > ((this.lassoSettings.snapThresholdEnabled ? this.lassoSettings.snapThreshold : 1) * 255)) {
            maxEdge = edgeStrength;
            bestX = sx;
            bestY = sy;
        }
      }
    }
    return [bestX, bestY];
  }

  pathToSelection(path: [number, number][]): Set<number> {
    const selected = new Set<number>();
    if(path.length < 3) return selected;
  
    const minX = Math.floor(Math.min(...path.map(p => p[0])));
    const maxX = Math.ceil(Math.max(...path.map(p => p[0])));
    const minY = Math.floor(Math.min(...path.map(p => p[1])));
    const maxY = Math.ceil(Math.max(...path.map(p => p[1])));
  
    for (let y = minY; y <= maxY; y++) {
      const intersections: number[] = [];
      for (let i = 0; i < path.length; i++) {
        const p1 = path[i];
        const p2 = path[(i + 1) % path.length];
  
        if ((p1[1] <= y && p2[1] > y) || (p2[1] <= y && p1[1] > y)) {
          const x_intersect = (y - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]) + p1[0];
          intersections.push(x_intersect);
        }
      }
  
      intersections.sort((a, b) => a - b);
  
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          const startX = Math.ceil(intersections[i]);
          const endX = Math.floor(intersections[i + 1]);
          for (let x = startX; x <= endX; x++) {
              if (x >= minX && x <= maxX) {
                 const idx = y * this.width + x;
                 selected.add(idx);
              }
          }
        }
      }
    }
    return selected;
  }
  // #endregion
}
```

---

## 4. Data Structures & Types

### `src/lib/types.ts`

This file defines all the core data structures used throughout the application, such as `Layer`, `LassoSettings`, and `MagicWandSettings`.

```typescript
import { z } from 'zod';

export type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line" | "banana" | "blemish-remover";

export interface AITool {
    id: string;
    label: string;
    prompt: string;
    icon: React.ElementType;
    color: string;
    lineStyle: 'solid' | 'dashed';
    isOneClick?: boolean;
}

export interface Layer {
    id: string;
    name: string;
    type: 'segmentation' | 'background' | 'adjustment';
    subType?: 'pixel' | 'mask' | 'path';
    parentId?: string | null;
    visible: boolean;
    locked: boolean;
    pixels: Set<number>;
    path?: [number, number][];
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    closed: boolean;
    imageData?: ImageData;
    maskVisible?: boolean;
    highlightColor?: string; // e.g., 'hsl(210, 40%, 96.1%)'
    highlightOpacity?: number; // 0-1
    highlightTexture?: 'solid' | 'checkerboard' | 'lines';
    modifiers?: Layer[];
    bounds: { x: number; y: number; width: number; height: number };
}

export interface LassoSettings {
    drawMode: 'magic' | 'polygon' | 'free';
    useAiEnhancement: boolean;
    showMouseTrace: boolean;
    showAllMasks: boolean;
    fillPath: boolean;
    snapRadius: number;
    snapThreshold: number;
    curveStrength: number; // 0-1, for Catmull-Rom tension
    curveTension: number;
    directionalStrength: number;
    cursorInfluence: number;
    traceInfluence: number;
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
        dropInterval: number; // ms
        minDistance: number; // px
        maxDistance: number; // px
    };
}

export interface CloneStampSettings {
    brushSize: number;
    opacity: number;
    softness: number;
    rotationStep: number;
    sourceLayer: 'current' | 'all';
    angle: number;
    flipX: boolean;
    flipY: boolean;
    blendMode: 'normal' | 'lights' | 'mids' | 'darks';
    useAdvancedBlending: boolean;
    tolerances: {
        values: MagicWandSettings['tolerances'];
        enabled: Set<keyof MagicWandSettings['tolerances']>;
    };
    falloff: number; // 0-100%
}

export interface MagicWandSettings {
    tolerances: {
        r: number; g: number; b: number;
        h: number; s: number; v: number;
        l: number; a: number; b_lab: number;
    };
    contiguous: boolean;
    useAiAssist: boolean;
    createAsMask: boolean;
    showAllMasks: boolean;
    ignoreExistingSegments: boolean;
    enabledTolerances: Set<keyof MagicWandSettings['tolerances']>;
    scrollAdjustTolerances: Set<keyof MagicWandSettings['tolerances']>;
    searchRadius: number;
    sampleMode: 'point' | 'average' | 'dominant';
    seedColor?: { [key: string]: number };
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

export interface GlobalSettings {
    snapEnabled: boolean;
    snapRadius: number;
}

export interface TransformSettings {
    scope: 'layer' | 'visible' | 'all';
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX: number;
    skewY: number;
    maintainAspectRatio: boolean;
}


export interface Segment {
    id: number;
    pixels: Set<number>;
    bounds: { x: number; y: number; width: number; height: number };
}

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

export const UploadAssetOutputSchema = z.object({
  downloadURL: z.string().optional().describe('The public URL to access the uploaded file.'),
  gcsPath: z.string().optional().describe('The path to the file in Google Cloud Storage.'),
  error: z.string().optional().describe('An error message if the upload failed.'),
});
export type UploadAssetOutput = z.infer<typeof UploadAssetOutputSchema>;
```