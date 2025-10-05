

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
  BrainCircuit,
  Scissors,
  Camera,
  GitCompareArrows,
  Trash2,
  Glasses,
} from "lucide-react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { MagicWandSettings, LassoSettings, CloneStampSettings, GlobalSettings } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { useSidebar } from "../ui/sidebar"
import { MagicWandCompactSettings } from "./magic-wand-compact-settings"
import { LassoCompactSettings } from "./lasso-compact-settings"
import { ProgressiveHover } from "../ui/progressive-hover"
import { CloneStampPanel, CloneStampCompactSettings } from "./clone-stamp-panel"
import { GlobalSettingsPanel, GlobalSettingsCompactPanel } from "./global-settings-panel"
import { NanoBananaPanel, InstructionLayer } from "./nano-banana-panel"
import { compareAiModels, CompareAiModelsOutput } from "@/ai/flows/compare-ai-models"
import { magicWandAssistedSegmentation } from "@/ai/flows/magic-wand-assisted-segmentation"
import { handleApiError } from "@/lib/error-handling"
import { useToast } from "@/hooks/use-toast"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { Textarea } from "../ui/textarea"
import { inpaintWithPrompt } from "@/ai/flows/inpaint-with-prompt"

interface ToolSettingsPanelProps {
  magicWandSettings: MagicWandSettings
  onMagicWandSettingsChange: (settings: Partial<MagicWandSettings>) => void
  lassoSettings: LassoSettings
  onLassoSettingsChange: (settings: Partial<LassoSettings>) => void
  cloneStampSettings: CloneStampSettings
  onCloneStampSettingsChange: (settings: Partial<CloneStampSettings>) => void
  activeTool: Tool
  showHotkeys: boolean
  onShowHotkeysChange: (value: boolean) => void
  globalSettings: GlobalSettings;
  onGlobalSettingsChange: (settings: Partial<GlobalSettings>) => void;
  onBlemishRemoverSelection: (selectionMask: string) => void;
  onToolChange: (tool: Tool) => void;
  imageUrl?: string;
  setSegmentationMask: (mask: string | null) => void;
  onImageSelect: (url: string) => void;
  getSelectionMask: () => string | undefined;
  onGenerationComplete: (newImageUrl: string) => void;
  clearSelection: () => void;
}

type Tool = "magic-wand" | "lasso" | "line" | "clone" | "settings" | "banana" | "blemish-remover" | "transform" | "pan" | "brush" | "eraser";

const oneClickPrompts = [
  {
    id: "remove-object",
    label: "Remove Object",
    prompt: "Inpaint the selected area to seamlessly match the surrounding background, making it look as if the object was never there. Pay close attention to texture, lighting, and patterns to create a realistic and unnoticeable fill.",
    icon: Trash2,
  },
  {
    id: "add-sunglasses",
    label: "Add Sunglasses",
    prompt: "Add a pair of stylish, modern sunglasses to the selected person's face. The sunglasses should fit naturally on the face, with realistic reflections on the lenses and appropriate shadows cast on the skin.",
    icon: Glasses,
  },
  {
    id: "change-color-red",
    label: "Change to Red",
    prompt: "Change the color of the selected object to a vibrant, realistic red. Maintain the original texture, shadows, and highlights of the object, ensuring only the color is altered.",
    icon: Palette,
  },
];

export function ToolSettingsPanel({ 
    magicWandSettings, 
    onMagicWandSettingsChange,
    lassoSettings,
    onLassoSettingsChange,
    cloneStampSettings,
    onCloneStampSettingsChange,
    activeTool,
    showHotkeys,
    onShowHotkeysChange,
    globalSettings,
    onGlobalSettingsChange,
    onBlemishRemoverSelection,
    onToolChange,
    imageUrl,
    setSegmentationMask,
    onImageSelect,
    getSelectionMask,
    onGenerationComplete,
    clearSelection,
}: ToolSettingsPanelProps) {
  
  const [view, setView] = React.useState<'settings' | 'info'>('settings');
  
  const isWand = activeTool === 'magic-wand';
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


  if (sidebarState === 'collapsed') {
    switch (activeTool) {
        case 'magic-wand':
            return <MagicWandCompactSettings 
                      settings={magicWandSettings}
                      onSettingsChange={onMagicWandSettingsChange}
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

  if (view === 'info') {
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
      case 'magic-wand': return <Sparkles className="w-4 h-4" />;
      case 'lasso':
      case 'line':
        return <Lasso className="w-4 h-4" />;
      case 'clone': return <Replace className="w-4 h-4" />;
      case 'banana': return <BrainCircuit className="w-4 h-4" />;
      case 'blemish-remover': return <Sparkles className="w-4 h-4" />;
      case 'settings': return <SlidersHorizontal className="w-4 h-4" />;
      default: return null;
    }
  };

  const renderLeftPanelContent = () => {
    switch(activeTool) {
      case 'magic-wand':
      case 'blemish-remover':
        return <AIPanel
                  onBlemishRemoverSelection={onBlemishRemoverSelection}
                  imageUrl={imageUrl}
                  setSegmentationMask={setSegmentationMask}
                  onImageSelect={onImageSelect}
                  getSelectionMask={getSelectionMask}
                  onGenerationComplete={onGenerationComplete}
                  clearSelection={clearSelection}
                />
      case 'lasso':
      case 'line':
          return (
           <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="magic-snap" disabled={lassoSettings.drawMode !== 'magic'}>Magic Snap</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="m-0 space-y-6 px-2">
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
                              onCheckedChange={(v) => onLassoSettingsChange({ showAllMasks: v })}
                          />
                      </div>
                  </div>
              </TabsContent>
              <TabsContent value="magic-snap" className="m-0 space-y-2 px-2">
                 {/* Magic Snap sliders would go here */}
              </TabsContent>
          </Tabs>
        )
      case 'clone':
        return <CloneStampPanel 
                  settings={cloneStampSettings} 
                  onSettingsChange={onCloneStampSettingsChange} 
                />
      case 'banana':
        return <NanoBananaPanel 
                  instructionLayers={[]}
                  onInstructionChange={() => {}}
                  onLayerDelete={() => {}}
                  onGenerate={() => {}}
                  isGenerating={isGenerating}
                />
      case 'settings':
        return <GlobalSettingsPanel showHotkeys={showHotkeyLabels} onShowHotkeysChange={setShowHotkeyLabels} settings={globalSettings} onSettingsChange={onGlobalSettingsChange} />;
      default:
        return <div className="p-4 text-sm text-muted-foreground">No settings for this tool.</div>
    }
  }

  const [isGenerating, setIsGenerating] = React.useState(false);
  const isBlemishTool = activeTool === 'blemish-remover';

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
       
       {isBlemishTool && (
         <div className="px-2">
           <AIPanel
              onBlemishRemoverSelection={onBlemishRemoverSelection}
              imageUrl={imageUrl}
              setSegmentationMask={setSegmentationMask}
              onImageSelect={onImageSelect}
              getSelectionMask={getSelectionMask}
              onGenerationComplete={onGenerationComplete}
              clearSelection={clearSelection}
           />
         </div>
       )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {renderLeftPanelContent()}
      </div>
      {activeTool !== 'settings' && currentToolInfo && (
          <div className="px-2 pb-2">
            <Separator className="mb-2"/>
            <div className="bg-muted/50 rounded-md p-2 text-center text-xs text-muted-foreground">
                Pro-Tip: Use <span className="font-bold font-mono px-1 py-0.5 bg-background rounded">{currentToolInfo.shortcut}</span> to quickly select this tool.
            </div>
          </div>
      )}
    </div>
  )
}

const AIPanel = ({ onBlemishRemoverSelection, imageUrl, setSegmentationMask, onImageSelect, getSelectionMask, onGenerationComplete, clearSelection }: any) => {
  type AIModel = "googleai/gemini-2.5-flash-image-preview" | "bodypix" | "deeplab" | "sam" | "sam2";
  const [selectedModel, setSelectedModel] = React.useState<AIModel>("googleai/gemini-2.5-flash-image-preview")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isComparing, setIsComparing] = React.useState(false)
  const [comparison, setComparison] = React.useState<CompareAiModelsOutput | null>(null)
  const { toast } = useToast()
  const [prompt, setPrompt] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleRunAI = async () => {
    if (!imageUrl) {
        toast({ title: "No Image", description: "Please select an image from the asset library.", variant: 'destructive'})
        return;
    };
    setIsProcessing(true)
    setComparison(null)
    setSegmentationMask(null);
    toast({ title: "AI is thinking...", description: `Running segmentation with ${selectedModel}.`})
    try {
      const res = await magicWandAssistedSegmentation({
        photoDataUri: imageUrl,
        modelId: selectedModel,
      })
      if (res.isSuccessful && res.maskDataUri) {
        setSegmentationMask(res.maskDataUri);
        toast({ title: "AI Segmentation Complete", description: res.message })
      } else {
        throw new Error(res.message || "AI Segmentation failed to produce a mask.")
      }
    } catch (error: any) {
      handleApiError(error, toast, {
        title: "AI Segmentation Failed",
        description: "Could not process the image with the selected model.",
      });
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCompare = async () => {
    if (!imageUrl) {
        toast({ title: "No Image", description: "Please select an image from the asset library.", variant: 'destructive'})
        return;
    }
    setIsComparing(true)
    setComparison(null)
    setSegmentationMask(null);
    toast({ title: "Comparing AI Models..." })
    try {
      const res = await compareAiModels({
        photoDataUri: imageUrl,
        modelIds: ["googleai/gemini-2.5-flash-image-preview", "bodypix", "deeplab"],
      })
      setComparison(res)
      toast({ title: "AI Model Comparison Complete" })
    } catch (error: any) {
      handleApiError(error, toast, {
        title: "AI Comparison Failed",
        description: "Could not compare the AI models.",
      });
    } finally {
      setIsComparing(false)
    }
  }
  
  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    const currentImageUrl = imageUrl;

    if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No image loaded." })
      return
    }

    const maskDataUri = getSelectionMask()
    if (!maskDataUri) {
      toast({ variant: "destructive", title: "No selection made.", description: "Please use the lasso or magic wand tool to select an area to inpaint." })
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
        onGenerationComplete(result.generatedImageDataUri)
        toast({ title: "Inpainting successful!", description: "The image has been updated."})
        clearSelection();
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

  const renderComparisonResults = () => (
    <div className="grid grid-cols-2 gap-4 pt-4">
      {comparison?.results.map(res => (
        <Card key={res.modelId} onClick={() => res.segmentationDataUri && setSegmentationMask(res.segmentationDataUri)} className="cursor-pointer">
          <CardHeader className="p-2">
            <CardTitle className="text-sm">{res.modelName}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 text-xs text-muted-foreground">
            {res.error ? (
              <p className="text-destructive">{res.error}</p>
            ) : (
              <p>{res.inferenceTime ? `${res.inferenceTime.toFixed(2)}s` : "Success"}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-4 px-2">
      <div className="space-y-2">
          <Label>AI Presets</Label>
          <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" onClick={() => onToolChange('blemish-remover')} disabled={isProcessing}>
                  <Sparkles className="w-4 h-4 mr-2"/> Blemish Remover
              </Button>
          </div>
      </div>
      <Separator />
      <Tabs defaultValue="segment" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="segment">Segment</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="enhance">Enhance</TabsTrigger>
        </TabsList>
        <TabsContent value="segment" className="mt-4 space-y-4">
          <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModel)}>
            <SelectTrigger>
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="googleai/gemini-2.5-flash-image-preview">Segment Anything (Google)</SelectItem>
              <SelectItem value="bodypix">BodyPix (Human)</SelectItem>
              <SelectItem value="deeplab">DeepLab (Semantic)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRunAI} disabled={isProcessing || isComparing} className="w-full">
            <BrainCircuit className="mr-2 h-4 w-4" />
            {isProcessing ? "Segmenting..." : `Run Segmentation`}
          </Button>
          <Button onClick={handleCompare} disabled={isProcessing || isComparing} variant="secondary" className="w-full">
            <GitCompareArrows className="mr-2 h-4 w-4" />
            {isComparing ? "Comparing..." : "Compare All Models"}
          </Button>
          {(isProcessing || isComparing) && (
            <div className="space-y-2 pt-4">
                <Skeleton className="h-8 w-full" />
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
          )}
          {comparison && !isComparing && renderComparisonResults()}
        </TabsContent>
        <TabsContent value="generate" className="mt-4 space-y-4">
            <div className="space-y-2">
                <Label className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary"/> One-Click Actions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {oneClickPrompts.map(p => (
                    <Button key={p.id} variant="outline" size="sm" onClick={() => handleGenerate(p.prompt)} disabled={isGenerating}>
                      <p.icon className="w-4 h-4 mr-2"/>
                      {p.label}
                    </Button>
                  ))}
                </div>
            </div>
            <Separator/>
            <div className="space-y-2">
                <Label htmlFor="inpainting-prompt">Custom Prompt</Label>
                <Textarea
                  id="inpainting-prompt"
                  placeholder="A majestic eagle soaring..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
            </div>
            <Button onClick={() => handleGenerate()} disabled={isGenerating} className="w-full">
              <Wand2 className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate with Custom Prompt"}
            </Button>
        </TabsContent>
        <TabsContent value="enhance" className="mt-4 text-center text-sm text-muted-foreground">
          Upscaling and enhancement tools coming soon.
        </TabsContent>
      </Tabs>
    </div>
  )
}
