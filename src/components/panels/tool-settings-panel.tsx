

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
} from "lucide-react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { MagicWandSettings, LassoSettings } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

interface ToolSettingsPanelProps {
  magicWandSettings: MagicWandSettings
  onMagicWandSettingsChange: (settings: Partial<MagicWandSettings>) => void
  lassoSettings: LassoSettings
  onLassoSettingsChange: (settings: Partial<LassoSettings>) => void
  activeTool: 'magic-wand' | 'lasso'
}

export function ToolSettingsPanel({ 
    magicWandSettings, 
    onMagicWandSettingsChange,
    lassoSettings,
    onLassoSettingsChange,
    activeTool 
}: ToolSettingsPanelProps) {
  
  const isWand = activeTool === 'magic-wand';
  
    const DRAW_MODES: { id: LassoSettings['drawMode']; label: string; icon: React.ElementType; description: string}[] = [
        { id: 'magic', label: 'Magic Snap', icon: Sparkles, description: 'Path snaps to detected edges as you draw.' },
        { id: 'polygon', label: 'Polygon', icon: GitCommit, description: 'Create straight lines between clicked points.' },
        { id: 'free', label: 'Free Draw', icon: PenTool, description: 'Follows your cursor movement exactly.' },
    ];
    const currentMode = DRAW_MODES.find(m => m.id === lassoSettings.drawMode);

  const VerticalLassoSlider = ({
    settingKey,
    label,
    max,
    step,
    unit = '',
  }: {
    settingKey: keyof LassoSettings;
    label: string;
    max: number;
    step: number;
    unit?: string;
  }) => {
    const isEnabled = lassoSettings[`${settingKey}Enabled` as keyof LassoSettings] as boolean;
    const value = lassoSettings[settingKey] as number;

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!isEnabled) return;
        const delta = e.deltaY > 0 ? -1 : 1;
        let newValue = value + delta * step;
        newValue = Math.max(0, Math.min(max, newValue));
        onLassoSettingsChange({ [settingKey]: newValue } as Partial<LassoSettings>);
    };

    return (
        <div className="flex flex-col items-center gap-2 flex-1 p-1 rounded-md" onWheel={handleWheel}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="text-xs font-semibold">{label}</span>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
            <div className="relative h-24 w-full flex items-center justify-center">
                 <Slider
                    id={`${settingKey}-slider`}
                    min={0}
                    max={max}
                    step={step}
                    value={[value]}
                    onValueChange={(v) => onLassoSettingsChange({ [settingKey]: v[0] } as Partial<LassoSettings>)}
                    orientation="vertical"
                    className="h-full"
                    disabled={!isEnabled}
                />
            </div>
            <span className="font-mono text-xs">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
             <Switch
                id={`${settingKey}-toggle`}
                size="sm"
                checked={isEnabled}
                onCheckedChange={(checked) => onLassoSettingsChange({ [`${settingKey}Enabled`]: checked } as Partial<LassoSettings>)}
            />
        </div>
    );
  };


  return (
    <div className="p-2 space-y-4">
      <div className="space-y-1 px-2">
        <h3 className="font-headline text-base flex items-center gap-2">
            {isWand ? <Sparkles className="w-4 h-4"/> : <Lasso className="w-4 h-4"/>}
            Tool Settings
        </h3>
      </div>
      <Separator />

      {isWand ? (
         <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="m-0 space-y-4 px-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="contiguous" className="flex items-center gap-2"><Layers className="w-4 h-4"/>Contiguous</Label>
                    <Switch
                    id="contiguous"
                    checked={magicWandSettings.contiguous}
                    onCheckedChange={(v) => onMagicWandSettingsChange({ contiguous: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="create-as-mask" className="flex items-center gap-2"><Link className="w-4 h-4" />Create as Mask</Label>
                    <Switch
                        id="create-as-mask"
                        checked={magicWandSettings.createAsMask}
                        onCheckedChange={(v) => onMagicWandSettingsChange({ createAsMask: v })}
                    />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-masks" className="flex items-center gap-2"><Palette className="w-4 h-4" />Show All Masks</Label>
                    <Switch
                        id="show-masks"
                        checked={magicWandSettings.showAllMasks}
                        onCheckedChange={(v) => onMagicWandSettingsChange({ showAllMasks: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="ignore-segments" className="flex items-center gap-2"><EyeOff className="w-4 h-4"/>Ignore Segments</Label>
                    <Switch
                        id="ignore-segments"
                        checked={magicWandSettings.ignoreExistingSegments}
                        onCheckedChange={(v) => onMagicWandSettingsChange({ ignoreExistingSegments: v })}
                    />
                </div>
                <Separator />
                <Accordion type="multiple" defaultValue={['highlight-style']} className="w-full">
                    <AccordionItem value="highlight-style" className="border-b-0">
                        <AccordionTrigger className="text-sm font-semibold flex items-center gap-2 py-2 -my-2 hover:no-underline">
                            <Paintbrush className="w-4 h-4"/> Highlight Style
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="highlight-opacity" className="text-xs">Opacity: {magicWandSettings.highlightOpacity.toFixed(2)}</Label>
                                <Slider 
                                    id="highlight-opacity"
                                    min={0} max={1} step={0.05}
                                    value={[magicWandSettings.highlightOpacity]}
                                    onValueChange={(v) => onMagicWandSettingsChange({ highlightOpacity: v[0]})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Texture</Label>
                                <div className="grid grid-cols-3 gap-1">
                                    <Button 
                                        size="sm" 
                                        variant={magicWandSettings.highlightTexture === 'solid' ? 'default': 'outline'}
                                        onClick={() => onMagicWandSettingsChange({highlightTexture: 'solid'})}>
                                        <CaseSensitive className="h-4 w-4"/>
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant={magicWandSettings.highlightTexture === 'checkerboard' ? 'default': 'outline'}
                                        onClick={() => onMagicWandSettingsChange({highlightTexture: 'checkerboard'})}>
                                        <LayoutGrid className="h-4 w-4"/>
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant={magicWandSettings.highlightTexture === 'lines' ? 'default': 'outline'}
                                        onClick={() => onMagicWandSettingsChange({highlightTexture: 'lines'})}>
                                        <Minus className="h-4 w-4 -rotate-45"/>
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Color</Label>
                                <div className="flex gap-1">
                                    <Button 
                                        size="sm" 
                                        variant={magicWandSettings.highlightColorMode === 'random' ? 'default': 'outline'}
                                        onClick={() => onMagicWandSettingsChange({highlightColorMode: 'random'})}
                                        className="flex-1"
                                    >
                                        Random
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant={magicWandSettings.highlightColorMode === 'fixed' ? 'default': 'outline'}
                                        onClick={() => onMagicWandSettingsChange({highlightColorMode: 'fixed'})}
                                        className="flex-1"
                                    >
                                        Fixed
                                    </Button>
                                     <Button 
                                        size="sm" 
                                        variant={magicWandSettings.highlightColorMode === 'contrast' ? 'default': 'outline'}
                                        onClick={() => onMagicWandSettingsChange({highlightColorMode: 'contrast'})}
                                        className="flex-1"
                                    >
                                        <Contrast className="w-4 h-4"/>
                                    </Button>
                                    {magicWandSettings.highlightColorMode === 'fixed' && (
                                        <div className="relative h-9 w-9">
                                            <input 
                                            type="color" 
                                            value={magicWandSettings.fixedHighlightColor}
                                            onChange={(e) => onMagicWandSettingsChange({ fixedHighlightColor: e.target.value })}
                                            className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer opacity-0"
                                            />
                                            <div 
                                                className="h-full w-full rounded-md border border-input"
                                                style={{ backgroundColor: magicWandSettings.fixedHighlightColor }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="highlight-border" className="border-b-0">
                         <AccordionTrigger className="text-sm font-semibold flex items-center gap-2 py-2 -my-2 hover:no-underline">
                            <Frame className="w-4 h-4"/> Highlight Border
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                             <div className="flex items-center justify-between">
                                <Label htmlFor="border-enabled" className="text-xs">Show Border</Label>
                                <Switch
                                id="border-enabled"
                                checked={magicWandSettings.highlightBorder.enabled}
                                onCheckedChange={(enabled) => onMagicWandSettingsChange({ highlightBorder: {...magicWandSettings.highlightBorder, enabled }})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="border-thickness" className="text-xs">Thickness: {magicWandSettings.highlightBorder.thickness}px</Label>
                                <Slider 
                                    id="border-thickness"
                                    min={1} max={10} step={1}
                                    value={[magicWandSettings.highlightBorder.thickness]}
                                    onValueChange={(v) => onMagicWandSettingsChange({ highlightBorder: {...magicWandSettings.highlightBorder, thickness: v[0] }})}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="border-opacity" className="text-xs">Opacity: {magicWandSettings.highlightBorder.opacity.toFixed(2)}</Label>
                                <Slider 
                                    id="border-opacity"
                                    min={0} max={1} step={0.05}
                                    value={[magicWandSettings.highlightBorder.opacity]}
                                    onValueChange={(v) => onMagicWandSettingsChange({ highlightBorder: {...magicWandSettings.highlightBorder, opacity: v[0] }})}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label className="text-xs">Pattern & Color</Label>
                                <div className="grid grid-cols-2 gap-1">
                                    <Button 
                                        size="sm" 
                                        variant={magicWandSettings.highlightBorder.pattern === 'solid' ? 'default': 'outline'}
                                        onClick={() => onMagicWandSettingsChange({ highlightBorder: {...magicWandSettings.highlightBorder, pattern: 'solid' }})}>
                                        Solid
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant={magicWandSettings.highlightBorder.pattern === 'dashed' ? 'default': 'outline'}
                                        onClick={() => onMagicWandSettingsChange({ highlightBorder: {...magicWandSettings.highlightBorder, pattern: 'dashed' }})}>
                                        Dashed
                                    </Button>
                                </div>
                                <div className="flex gap-1 mt-1">
                                     <Button 
                                        size="sm" 
                                        variant={magicWandSettings.highlightBorder.colorMode === 'contrast' ? 'default' : 'outline'}
                                        onClick={() => onMagicWandSettingsChange({ highlightBorder: {...magicWandSettings.highlightBorder, colorMode: 'contrast' }})}
                                        className="flex-1"
                                    >
                                        <Contrast className="w-4 h-4" />
                                    </Button>
                                    {magicWandSettings.highlightBorder.colorMode === 'fixed' ? (
                                        <div className="relative h-9 w-9">
                                            <input 
                                                type="color" 
                                                value={magicWandSettings.highlightBorder.color}
                                                onChange={(e) => onMagicWandSettingsChange({ highlightBorder: {...magicWandSettings.highlightBorder, color: e.target.value }})}
                                                className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer opacity-0"
                                            />
                                            <Button 
                                                asChild 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-full w-full rounded-md border border-input p-0"
                                                onClick={() => onMagicWandSettingsChange({ highlightBorder: {...magicWandSettings.highlightBorder, colorMode: 'fixed' }})}
                                            >
                                                <div 
                                                    className="h-full w-full"
                                                    style={{ backgroundColor: magicWandSettings.highlightBorder.color }}
                                                />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onMagicWandSettingsChange({ highlightBorder: {...magicWandSettings.highlightBorder, colorMode: 'fixed' }})}
                                            className="h-9 w-9"
                                        >
                                            <div 
                                                className="h-5 w-5 rounded-sm"
                                                style={{ backgroundColor: magicWandSettings.highlightBorder.color }}
                                            />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </TabsContent>
        </Tabs>
      ) : (
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
                                {currentMode && <currentMode.icon className="h-4 w-4" />}
                                <SelectValue placeholder="Select mode..." />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {DRAW_MODES.map(mode => (
                                <SelectItem key={mode.id} value={mode.id}>
                                    <div className="flex items-center gap-2">
                                        <mode.icon className="h-4 w-4" />
                                        <span>{mode.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

                <div className="space-y-2">
                    <Label>Presets (Magic Snap)</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" onClick={() => {}}>Default</Button>
                        <Button variant="outline" size="sm" onClick={() => {}}>Precise</Button>
                        <Button variant="outline" size="sm" onClick={() => {}}>Loose</Button>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="magic-snap" className="m-0 space-y-2 px-2">
               <div className="space-y-2">
                <TooltipProvider>
                    <div className="flex justify-around gap-1 bg-muted/50 p-2 rounded-md">
                        <VerticalLassoSlider settingKey="snapRadius" label="Radius" max={50} step={1} unit="px"/>
                        <VerticalLassoSlider settingKey="snapThreshold" label="Thresh" max={1} step={0.05} />
                        <VerticalLassoSlider settingKey="curveStrength" label="Curve" max={1} step={0.05} />
                        <VerticalLassoSlider settingKey="directionalStrength" label="Direction" max={1} step={0.05} />
                    </div>
                    <div className="flex justify-around gap-1 bg-muted/50 p-2 rounded-md mt-2">
                        <VerticalLassoSlider settingKey="cursorInfluence" label="Cursor" max={1} step={0.05} />
                        <VerticalLassoSlider settingKey="traceInfluence" label="Trace" max={1} step={0.05} />
                        <VerticalLassoSlider settingKey="colorInfluence" label="Color" max={1} step={0.05} />
                    </div>
                </TooltipProvider>
                 <div className="flex items-center justify-between mt-4 px-2">
                    <Label htmlFor="useColorAwareness" className="flex items-center gap-2 text-sm">Use Color Awareness</Label>
                    <Switch
                        id="useColorAwareness"
                        checked={lassoSettings.useColorAwareness}
                        onCheckedChange={(checked) => onLassoSettingsChange({ useColorAwareness: checked })}
                    />
                </div>
               </div>
            </TabsContent>

        </Tabs>
      )}
    </div>
  )
}
