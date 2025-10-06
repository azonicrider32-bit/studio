
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
import { cn, debounce } from "@/lib/utils"
import { useSelectionDrag } from "@/hooks/use-selection-drag"
import { useToast } from "@/hooks/use-toast"
import { ToolPanel } from "./tool-panel"
import { Slider } from "./ui/slider"
import { useAuth, useUser, useFirebase, addDocumentNonBlocking } from "@/firebase"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"
import { ToolSettingsPanel } from "./panels/tool-settings-panel"
import AdvancedAssetPanel from "./panels/AdvancedAssetsPanel"
import { QuaternionColorWheel } from "./panels/quaternion-color-wheel"
import { textToSpeech } from "@/ai/flows/text-to-speech-flow"
import { handleApiError } from "@/lib/error-handling"
import { inpaintWithPrompt } from "@/ai/flows/inpaint-with-prompt"
import { InstructionLayer, NanoBananaPanel } from "./panels/nano-banana-panel"
import { PerformanceMetrics, ApiPerformanceMetrics } from "./panels/telemetry-panel"
import { collection, serverTimestamp } from "firebase/firestore"
import { summarizeAppEvent } from "@/ai/flows/summarize-app-event"
import { UltraFastFloodFill } from "@/lib/ultrafast-flood-fill"

type Tool = "magic-wand" | "wand-v2" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line" | "banana" | "blemish-remover";
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

  const { auth, firestore } = useFirebase();
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

  const [performanceMetrics, setPerformanceMetrics] = React.useState<PerformanceMetrics>({ lastDuration: 0, avgDuration: 0, lagEvents: 0, history: [] });
  const [apiPerf, setApiPerf] = React.useState<ApiPerformanceMetrics>({ lastCall: 0, avgCall: 0, errors: 0 });

  const logAppEvent = React.useCallback(async (
    type: 'performance' | 'ai_call' | 'error',
    data: {
      tool?: string;
      operation?: string;
      duration?: number;
      error?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    if (!user || !firestore) return;

    const context = {
      image: activeWorkspace?.imageUrl,
      layerCount: activeWorkspace?.layers.length || 0,
      activeTool,
      ...data.metadata,
    };

    try {
      const summary = await summarizeAppEvent({ eventType: type, ...data, context });
      const logData = {
        userId: user.uid,
        timestamp: serverTimestamp(),
        type,
        ...data,
        context,
        description: summary.description,
      };
      addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'performanceLogs'), logData);
    } catch (e) {
      console.error("Failed to generate log summary:", e);
      const logData = {
        userId: user.uid,
        timestamp: serverTimestamp(),
        type,
        ...data,
        context,
        description: `Event: ${type} - ${data.operation || 'N/A'}. Duration: ${data.duration?.toFixed(2) || 'N/A'}ms.`,
      };
      addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'performanceLogs'), logData);
    }
  }, [user, firestore, activeWorkspace, activeTool]);
  
  const measurePerformance = React.useCallback((op: () => void, tool: string, operation: string) => {
    const start = performance.now();
    op();
    const duration = performance.now() - start;

    setPerformanceMetrics(prev => {
        const newHistory = [duration, ...prev.history.slice(0, 49)];
        const newAvg = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
        const newLagEvents = duration > 100 ? prev.lagEvents + 1 : prev.lagEvents;
        
        if (duration > 100) {
            logAppEvent('performance', { tool, operation, duration });
        }
        
        return {
            lastDuration: duration,
            avgDuration: newAvg,
            lagEvents: newLagEvents,
            history: newHistory
        };
    });
  }, [logAppEvent]);


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
    enabledTolerances: new Set(['r', 'g', 'b']),
    scrollAdjustTolerances: new Set(['r', 'g', 'b']),
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
    previewMode: 'real-time',
  });
  const [wandV2Settings, setWandV2Settings] = React.useState<MagicWandSettings>({
    tolerances: { r: 30, g: 30, b: 30, h: 10, s: 20, v: 20, l: 20, a: 10, b_lab: 10 },
    contiguous: true,
    useAiAssist: false,
    createAsMask: false,
    showAllMasks: true,
    ignoreExistingSegments: false,
    enabledTolerances: new Set(['r', 'g', 'b']),
    scrollAdjustTolerances: new Set(['r', 'g', 'b']),
    searchRadius: 1,
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
    previewMode: 'real-time',
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
    previewMode: 'real-time',
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

  const mouseStopTimerRef = React.useRef<NodeJS.Timeout | null>(null);


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
  const handleWandV2SettingsChange = (newSettings: Partial<MagicWandSettings>) => {
    setWandV2Settings(prev => ({ ...prev, ...newSettings }));
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
    
    const startTime = performance.now();
    try {
      const result = await inpaintWithPrompt({
        photoDataUri: activeWorkspace.imageUrl,
        maskDataUri: selectionMaskUri,
        prompt: "Inpaint the selected area to seamlessly match the surrounding background, making it look as if the blemish or object was never there. Pay close attention to texture, lighting, and patterns to create a realistic and unnoticeable fill."
      });
      
      const duration = performance.now() - startTime;
      logAppEvent('ai_call', { tool: 'blemish-remover', operation: 'inpaintWithPrompt', duration });

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
      const duration = performance.now() - startTime;
      logAppEvent('error', { tool: 'blemish-remover', operation: 'inpaintWithPrompt', duration, error: (error as Error).message });
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

    const startTime = performance.now();
    try {
      const result = await inpaintWithPrompt({
        photoDataUri: currentImageUrl,
        maskDataUri: maskDataUri,
        prompt: finalPrompt,
      })
      
      const duration = performance.now() - startTime;
      logAppEvent('ai_call', { tool: 'banana', operation: 'inpaintWithPrompt', duration, metadata: { prompt: finalPrompt } });


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
      const duration = performance.now() - startTime;
      logAppEvent('error', { tool: 'banana', operation: 'inpaintWithPrompt', duration, error: (error as Error).message });
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
              magicWandSettings={activeTool === 'wand-v2' ? wandV2Settings : magicWandSettings}
              negativeMagicWandSettings={negativeMagicWandSettings}
              cloneStampSettings={cloneStampSettings}
              onLassoSettingChange={handleLassoSettingsChange}
              onMagicWandSettingsChange={activeTool === 'wand-v2' ? handleWandV2SettingsChange : handleMagicWandSettingsChange}
              onNegativeMagicWandSettingsChange={handleNegativeMagicWandSettingsChange}
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
            <div>
              <ToolSettingsPanel
                magicWandSettings={magicWandSettings}
                onMagicWandSettingsChange={handleMagicWandSettingsChange}
                wandV2Settings={wandV2Settings}
                onWandV2SettingsChange={handleWandV2SettingsChange}
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
                canvas={canvasRef.current}
                mousePos={canvasMousePos}
                negativeMagicWandSettings={negativeMagicWandSettings}
                onNegativeMagicWandSettingsChange={handleNegativeMagicWandSettingsChange}
                performanceMetrics={performanceMetrics}
                apiPerf={apiPerf}
                imageData={selectionEngineRef.current?.imageData ?? null}
                layers={activeWorkspace.layers}
              />
            </div>
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
                    {isRightPanelOpen ? <PanelRightClose className="h-5 h-5" /> : <PanelLeft className="h-5 h-5" />}
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
                          <Icon className="h-5 h-5"/>
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

    