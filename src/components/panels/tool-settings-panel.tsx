

"use client"

import * as React from "react"
import {
  Link,
  Palette,
  EyeOff,
  Paintbrush,
  Layers,
  Sparkles,
  Lasso,
  Info,
  Wand2,
  GitCommit,
  PenTool,
  LayoutGrid,
  Minus,
  CaseSensitive,
  Frame,
  Contrast,
  X,
  Replace,
  SlidersHorizontal,
  Move,
  BrainCircuit,
} from "lucide-react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { MagicWandSettings, LassoSettings, CloneStampSettings, GlobalSettings, AITool, TransformSettings, Layer } from "@/lib/types"
import { Button } from "../ui/button"
import { useSidebar } from "../ui/sidebar"
import { MagicWandCompactSettings } from "./magic-wand-compact-settings"
import { MagicWandPanel } from "./magic-wand-panel"
import { LassoCompactSettings } from "./lasso-compact-settings"
import { CloneStampPanel, CloneStampCompactSettings } from "./clone-stamp-panel"
import { GlobalSettingsPanel, GlobalSettingsCompactPanel } from "./global-settings-panel"
import { NanoBananaPanel, InstructionLayer, NanoBananaCompactPanel } from "./nano-banana-panel"
import { TransformPanel } from "./transform-panel"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { PerformanceMetrics, ApiPerformanceMetrics } from "./telemetry-panel"
import AdvancedAnalyticsPanel from "./AdvancedAnalyticsPanel"

interface ToolSettingsPanelProps {
  magicWandSettings: MagicWandSettings
  onMagicWandSettingsChange: (settings: Partial<MagicWandSettings>) => void
  wandV2Settings: MagicWandSettings
  onWandV2SettingsChange: (settings: Partial<MagicWandSettings>) => void
  negativeMagicWandSettings: MagicWandSettings
  onNegativeMagicWandSettingsChange: (settings: Partial<MagicWandSettings>) => void
  lassoSettings: LassoSettings
  onLassoSettingsChange: (settings: Partial<LassoSettings>) => void
  cloneStampSettings: CloneStampSettings
  onCloneStampSettingsChange: (settings: Partial<CloneStampSettings>) => void
  transformSettings: TransformSettings;
  onTransformSettingsChange: (settings: Partial<TransformSettings>) => void;
  activeTool: Tool
  showHotkeys: boolean
  onShowHotkeysChange: (value: boolean) => void
  globalSettings: GlobalSettings;
  onGlobalSettingsChange: (settings: Partial<GlobalSettings>) => void;
  // AI Panel Props
  instructionLayers: InstructionLayer[];
  onInstructionChange: (id: string, prompt: string) => void;
  onLayerDelete: (id: string) => void;
  onGenerate: (prompt?: string) => void;
  onAiToolClick: (tool: AITool) => void;
  isGenerating: boolean;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  canvas: HTMLCanvasElement | null;
  mousePos: { x: number, y: number } | null;
  // Performance Metrics
  performanceMetrics: PerformanceMetrics;
  apiPerf: ApiPerformanceMetrics;
  imageData: ImageData | null;
  layers: Layer[];
}

type Tool = "magic-wand" | "wand-v2" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line" | "banana" | "blemish-remover";


export function ToolSettingsPanel({ 
    magicWandSettings, 
    onMagicWandSettingsChange,
    wandV2Settings,
    onWandV2SettingsChange,
    lassoSettings,
    onLassoSettingsChange,
    cloneStampSettings,
    onCloneStampSettingsChange,
    transformSettings,
    onTransformSettingsChange,
    activeTool,
    showHotkeys,
    onShowHotkeysChange,
    globalSettings,
    onGlobalSettingsChange,
    // AI Panel Props
    instructionLayers,
    onInstructionChange,
    onLayerDelete,
    onGenerate,
    onAiToolClick,
    isGenerating,
    customPrompt,
    setCustomPrompt,
    canvas,
    mousePos,
    negativeMagicWandSettings,
    onNegativeMagicWandSettingsChange,
    // Performance
    performanceMetrics,
    apiPerf,
    imageData,
    layers,
}: ToolSettingsPanelProps) {
  
  const [view, setView] = React.useState<'settings' | 'info'>('settings');
  
  const { state: sidebarState } = useSidebar();
  
    const DRAW_MODES: { id: LassoSettings['drawMode']; label: string; icon: React.ElementType; description: string}[] = [
        { id: 'magic', label: 'Magic Snap', icon: Sparkles, description: 'Path snaps to detected edges as you draw.' },
        { id: 'polygon', label: 'Polygon', icon: GitCommit, description: 'Create straight lines between clicked points.' },
        { id: 'free', label: 'Free Draw', icon: PenTool, description: 'Follows your cursor movement exactly.' },
    ];
    const currentMode = DRAW_MODES.find(m => m.id === lassoSettings.drawMode);
    
    const toolInfo = {
        'magic-wand': {
            title: 'Magic Wand Tool',
            description: 'The Magic Wand selects similarly colored pixels based on a set tolerance. Click on an area of the image to create a selection. Hold Shift to add to an existing selection, or Ctrl to subtract.',
            shortcut: 'W'
        },
        'wand-v2': {
            title: 'Magic Wand V2',
            description: 'A high-performance version of the Magic Wand tool using an optimized flood-fill algorithm.',
            shortcut: 'W'
        },
        'lasso': {
            title: 'Intelligent Lasso Tool',
            description: 'The Lasso tool allows for creating freehand selections. In Magic Snap mode, the path will intelligently cling to object edges. Other modes like Polygon and Free Draw are available.',
            shortcut: 'L'
        },
        'line': {
            title: 'Line Tool',
            description: 'The Line tool creates straight or curved paths by placing anchor points. It is ideal for precise, geometric selections or for creating vector paths. Press Enter to complete the path.',
            shortcut: 'P'
        },
        'clone': {
            title: 'Clone Stamp Tool',
            description: 'The Clone Stamp tool allows you to duplicate part of an image. Alt-click to define a source point, then click and drag to paint with the sampled pixels.',
            shortcut: 'C'
        },
        'banana': {
            title: 'Nano Banana Tool',
            description: 'Visually instruct the AI to perform edits by drawing and writing directly on the canvas.',
            shortcut: 'N'
        },
        'blemish-remover': {
            title: 'Blemish Remover',
            description: 'Quickly remove small imperfections. Click and drag over an area to automatically select, inpaint, and replace it.',
            shortcut: 'J' // Common hotkey for healing/spot removal tools
        },
        'settings': {
            title: 'Global Settings',
            description: 'Configure application-wide preferences for UI, performance, and more.',
            shortcut: ''
        },
         'transform': {
            title: 'Transform Tool',
            description: 'Move, scale, and rotate layers or selections.',
            shortcut: 'V'
        },
        'pan': {
            title: 'Pan Tool',
            description: 'Move the canvas view.',
            shortcut: 'H'
        },
        'brush': {
            title: 'Brush Tool',
            description: 'Paint on a layer or a mask.',
            shortcut: 'B'
        },
        'eraser': {
            title: 'Eraser Tool',
            description: 'Erase pixels from a layer.',
            shortcut: 'E'
        }
    };
    
    const currentToolInfo = toolInfo[activeTool as keyof typeof toolInfo];

  const handlePresetChange = (preset: 'default' | 'precise' | 'loose') => {
    let newSettings: Partial<LassoSettings> = {};
    switch(preset) {
        case 'precise':
            newSettings = {
                snapRadius: 10,
                snapThreshold: 0.5,
                directionalStrength: 0.8,
                cursorInfluence: 0.05,
                traceInfluence: 0.1,
                colorInfluence: 0.3,
            };
            break;
        case 'loose':
             newSettings = {
                snapRadius: 40,
                snapThreshold: 0.2,
                directionalStrength: 0.1,
                cursorInfluence: 0.5,
                traceInfluence: 0.5,
                colorInfluence: 0.0,
            };
            break;
        case 'default':
        default:
             newSettings = {
                snapRadius: 20,
                snapThreshold: 0.3,
                directionalStrength: 0.2,
                cursorInfluence: 0.1,
                traceInfluence: 0.2,
                colorInfluence: 0.0,
            };
            break;
    }
    onLassoSettingsChange(newSettings);
  };

 const isAiToolActive = ['banana', 'blemish-remover', 'remove-object', 'add-object', 'change-color'].includes(activeTool);

  if (sidebarState === 'collapsed') {
    if (isAiToolActive) {
      return <NanoBananaCompactPanel onAiToolClick={onAiToolClick} />;
    }
    switch (activeTool) {
        case 'magic-wand':
            return <MagicWandCompactSettings 
                      settings={magicWandSettings}
                      onSettingsChange={onMagicWandSettingsChange}
                    />
        case 'wand-v2':
            return <MagicWandCompactSettings 
                      settings={wandV2Settings}
                      onSettingsChange={onWandV2SettingsChange}
                    />
        case 'lasso':
        case 'line':
             return <LassoCompactSettings 
                      settings={lassoSettings}
                      onLassoSettingsChange={onLassoSettingsChange}
                    />
        case 'clone':
            return <CloneStampCompactSettings 
                        settings={cloneStampSettings} 
                        onSettingsChange={onCloneStampSettingsChange} 
                    />
        case 'settings':
            return <GlobalSettingsCompactPanel onShowHotkeysChange={onShowHotkeysChange} showHotkeys={showHotkeys} />
        default:
            return null;
    }
  }

  if (view === 'info' && currentToolInfo) {
    return (
        <div className="p-4 space-y-4 h-full flex flex-col">
             <div className="flex items-center justify-between">
                <h3 className="font-headline text-base flex items-center gap-2">
                    <Info className="w-4 h-4"/>
                    {currentToolInfo.title}
                </h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView('settings')}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
            <Separator/>
            <div className="text-sm text-muted-foreground space-y-4 flex-1">
                <p>{currentToolInfo.description}</p>
                {currentToolInfo.shortcut && (
                    <p>
                        <strong>Keyboard Shortcut:</strong>
                        <span className="ml-2 inline-block px-2 py-1 text-xs font-mono font-bold bg-muted rounded">{currentToolInfo.shortcut}</span>
                    </p>
                )}
            </div>
        </div>
    );
  }
  
  const getActiveToolIcon = () => {
    switch(activeTool) {
      case 'magic-wand': return <Wand2 className="w-4 h-4" />;
      case 'wand-v2': return <Sparkles className="w-4 h-4" />;
      case 'lasso':
      case 'line':
        return <Lasso className="w-4 h-4" />;
      case 'clone': return <Replace className="w-4 h-4" />;
      case 'transform': return <Move className="w-4 h-4" />;
      case 'settings': return <SlidersHorizontal className="w-4 h-4" />;
      default: return isAiToolActive ? <BrainCircuit className="w-4 h-4" /> : null;
    }
  };

  const renderLeftPanelContent = () => {
    if (isAiToolActive) {
      return (
          <NanoBananaPanel 
            instructionLayers={instructionLayers}
            onInstructionChange={onInstructionChange}
            onLayerDelete={onLayerDelete}
            onGenerate={onGenerate}
            onAiToolClick={onAiToolClick}
            isGenerating={isGenerating}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
          />
      );
    }
    
    return (
      <div className="p-2 space-y-4 h-full flex flex-col">
        <div className="space-y-1 px-2 flex items-center justify-between">
          <h3 className="font-headline text-base flex items-center gap-2">
              {getActiveToolIcon()}
              Tool Settings
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView('info')}>
              <Info className="w-4 h-4" />
          </Button>
        </div>
        <Separator />
         
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeTool === 'transform' ? (
              <TransformPanel
                  settings={transformSettings}
                  onSettingsChange={onTransformSettingsChange}
              />
          ) : activeTool === 'magic-wand' ? (
              <MagicWandPanel 
                settings={magicWandSettings} 
                onSettingsChange={onMagicWandSettingsChange}
                exclusionSettings={negativeMagicWandSettings}
                onExclusionSettingsChange={onNegativeMagicWandSettingsChange}
                canvas={canvas}
                mousePos={mousePos}
              />
          ) : activeTool === 'wand-v2' ? (
              <MagicWandPanel 
                settings={wandV2Settings} 
                onSettingsChange={onWandV2SettingsChange}
                exclusionSettings={negativeMagicWandSettings} // Can share or have its own
                onExclusionSettingsChange={onNegativeMagicWandSettingsChange}
                canvas={canvas}
                mousePos={mousePos}
              />
          ) : activeTool === 'lasso' || activeTool === 'line' ? (
             <div className="space-y-4 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="draw-mode">Draw Mode</Label>
                        <Popover>
                            <PopoverTrigger>
                                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                            </PopoverTrigger>
                            <PopoverContent side="right" className="text-sm">
                                <h4 className="font-semibold mb-2">Switching Modes</h4>
                                <p>You can quickly switch between draw modes while using the lasso tool on the canvas by using the mouse scroll wheel.</p>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Select value={lassoSettings.drawMode} onValueChange={(value: LassoSettings['drawMode']) => onLassoSettingsChange({ drawMode: value })}>
                        <SelectTrigger id="draw-mode">
                            <div className="flex items-center gap-2">
                                {currentMode && <currentMode.icon className="h-4 h-4" />}
                                <SelectValue placeholder="Select mode..." />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {DRAW_MODES.map(mode => (
                                <SelectItem key={mode.id} value={mode.id}>
                                    <div className="flex items-center gap-2">
                                        <mode.icon className="h-4 h-4" />
                                        <span>{mode.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Presets</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePresetChange('default')}>Default</Button>
                        <Button variant="outline" size="sm" onClick={() => handlePresetChange('precise')}>Precise</Button>
                        <Button variant="outline" size="sm" onClick={() => handlePresetChange('loose')}>Loose</Button>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="curve-tension" className="flex items-center gap-2">Curve Tension: {lassoSettings.curveTension.toFixed(2)}</Label>
                    <Slider 
                        id="curve-tension"
                        min={0} max={1} step={0.05}
                        value={[lassoSettings.curveTension]}
                        onValueChange={(v) => onLassoSettingsChange({ curveTension: v[0]})}
                        disabled={lassoSettings.drawMode === 'magic'}
                    />
                    <p className="text-xs text-muted-foreground">Smooths the line between nodes. 0 is straight, 1 is max curve. Only for Polygon & Free Draw.</p>
                </div>
                
                {lassoSettings.drawMode === 'magic' && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Advanced Snap Settings</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="snapRadius">Snap Radius: {lassoSettings.snapRadius.toFixed(0)}px</Label>
                            <Switch id="snapRadius-enabled" checked={lassoSettings.snapRadiusEnabled} onCheckedChange={(c) => onLassoSettingsChange({ snapRadiusEnabled: c })}/>
                        </div>
                        <Slider id="snapRadius" min={1} max={50} step={1} value={[lassoSettings.snapRadius]} onValueChange={v => onLassoSettingsChange({ snapRadius: v[0]})} disabled={!lassoSettings.snapRadiusEnabled}/>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="snapThreshold">Edge Threshold: {lassoSettings.snapThreshold.toFixed(2)}</Label>
                          <Switch id="snapThreshold-enabled" checked={lassoSettings.snapThresholdEnabled} onCheckedChange={(c) => onLassoSettingsChange({ snapThresholdEnabled: c })}/>
                        </div>
                        <Slider id="snapThreshold" min={0} max={1} step={0.05} value={[lassoSettings.snapThreshold]} onValueChange={v => onLassoSettingsChange({ snapThreshold: v[0]})} disabled={!lassoSettings.snapThresholdEnabled}/>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="directionalStrength">Directional Strength: {lassoSettings.directionalStrength.toFixed(2)}</Label>
                          <Switch id="directionalStrength-enabled" checked={lassoSettings.directionalStrengthEnabled} onCheckedChange={(c) => onLassoSettingsChange({ directionalStrengthEnabled: c })}/>
                        </div>
                        <Slider id="directionalStrength" min={0} max={1} step={0.05} value={[lassoSettings.directionalStrength]} onValueChange={v => onLassoSettingsChange({ directionalStrength: v[0]})} disabled={!lassoSettings.directionalStrengthEnabled}/>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <Label htmlFor="cursorInfluence">Cursor Influence: {lassoSettings.cursorInfluence.toFixed(2)}</Label>
                           <Switch id="cursorInfluence-enabled" checked={lassoSettings.cursorInfluenceEnabled} onCheckedChange={(c) => onLassoSettingsChange({ cursorInfluenceEnabled: c })}/>
                        </div>
                        <Slider id="cursorInfluence" min={0} max={1} step={0.05} value={[lassoSettings.cursorInfluence]} onValueChange={v => onLassoSettingsChange({ cursorInfluence: v[0]})} disabled={!lassoSettings.cursorInfluenceEnabled}/>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <Label htmlFor="traceInfluence">Trace Influence: {lassoSettings.traceInfluence.toFixed(2)}</Label>
                            <Switch id="traceInfluence-enabled" checked={lassoSettings.traceInfluenceEnabled} onCheckedChange={(c) => onLassoSettingsChange({ traceInfluenceEnabled: c })}/>
                        </div>
                        <Slider id="traceInfluence" min={0} max={1} step={0.05} value={[lassoSettings.traceInfluence]} onValueChange={v => onLassoSettingsChange({ traceInfluence: v[0]})} disabled={!lassoSettings.traceInfluenceEnabled}/>
                      </div>

                       <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <Label htmlFor="colorInfluence">Color Influence: {lassoSettings.colorInfluence.toFixed(2)}</Label>
                            <Switch id="colorInfluence-enabled" checked={lassoSettings.colorInfluenceEnabled} onCheckedChange={(c) => onLassoSettingsChange({ colorInfluenceEnabled: c })}/>
                        </div>
                        <Slider id="colorInfluence" min={0} max={1} step={0.05} value={[lassoSettings.colorInfluence]} onValueChange={v => onLassoSettingsChange({ colorInfluence: v[0]})} disabled={!lassoSettings.colorInfluenceEnabled}/>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="useAiEnhancement" className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-primary" />AI Enhancement</Label>
                        <Switch
                            id="useAiEnhancement"
                            checked={lassoSettings.useAiEnhancement}
                            onCheckedChange={(checked) => onLassoSettingsChange({ useAiEnhancement: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="showMouseTrace" className="flex items-center gap-2"><Paintbrush className="w-4 h-4" />Show Mouse Trace</Label>
                        <Switch
                            id="showMouseTrace"
                            checked={lassoSettings.showMouseTrace}
                            onCheckedChange={(checked) => onLassoSettingsChange({ showMouseTrace: checked })}
                            disabled={lassoSettings.drawMode !== 'magic'}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="show-masks" className="flex items-center gap-2"><Palette className="w-4 h-4" />Show All Masks</Label>
                        <Switch
                            id="show-masks"
                            checked={lassoSettings.showAllMasks}
                            onValueChange={(v) => onLassoSettingsChange({ showAllMasks: v })}
                        />
                    </div>
                </div>
            </div>
          ) : activeTool === 'clone' ? (
            <CloneStampPanel 
                settings={cloneStampSettings} 
                onSettingsChange={onCloneStampSettingsChange} 
            />
          ) : activeTool === 'settings' ? (
            <GlobalSettingsPanel 
                showHotkeys={showHotkeys} 
                onShowHotkeysChange={onShowHotkeysChange} 
                settings={globalSettings} 
                onSettingsChange={onGlobalSettingsChange} 
                wandPerf={performanceMetrics}
                lassoPerf={performanceMetrics}
                apiPerf={apiPerf}
                imageData={imageData}
                layers={layers}
            />
          ) : (
             <div className="p-4 text-sm text-muted-foreground">No settings for this tool.</div>
          )}
        </div>
        {activeTool !== 'settings' && !isAiToolActive && currentToolInfo && (
            <div className="px-2 pb-2">
              <Separator className="mb-2"/>
              <div className="bg-muted/50 rounded-md p-2 text-center text-xs text-muted-foreground">
                  Pro-Tip: Use <span className="font-bold font-mono px-1 py-0.5 bg-background rounded">{currentToolInfo.shortcut}</span> to quickly select this tool.
              </div>
            </div>
        )}
      </div>
    );
  }

  return renderLeftPanelContent();
}
