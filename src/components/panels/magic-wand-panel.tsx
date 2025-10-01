

"use client"

import * as React from "react"
import { Sparkles, BrainCircuit, Info, Palette, EyeOff } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { suggestSegmentationPresets, SuggestSegmentationPresetsOutput } from "@/ai/flows/suggest-segmentation-presets"
import { magicWandAssistedSegmentation } from "@/ai/flows/magic-wand-assisted-segmentation"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "../ui/badge"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { MagicWandSettings } from "@/lib/types"
import { handleApiError } from "@/lib/error-handling"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { cn } from "@/lib/utils"
import { rgbToHsv, rgbToLab } from "@/lib/color-utils"
import { SegmentHoverPreview } from "../segment-hover-preview"

interface MagicWandPanelProps {
  settings: MagicWandSettings;
  onSettingsChange: (settings: Partial<MagicWandSettings>) => void;
  canvas: HTMLCanvasElement | null;
  mousePos: { x: number; y: number } | null;
  isExclusionPanel?: boolean;
}

interface Analysis {
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b_lab: number };
}

export function MagicWandPanel({ 
  settings, 
  onSettingsChange,
  canvas,
  mousePos,
  isExclusionPanel = false,
}: MagicWandPanelProps) {
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null)
  const { toast } = useToast()

  const image = PlaceHolderImages.find(img => img.id === "pro-segment-ai-1")

  React.useEffect(() => {
    if (isExclusionPanel && settings.seedColor) {
        setAnalysis({
            rgb: { r: settings.seedColor.r, g: settings.seedColor.g, b: settings.seedColor.b },
            hsv: { h: settings.seedColor.h, s: settings.seedColor.s, v: settings.seedColor.v },
            lab: { l: settings.seedColor.l, a: settings.seedColor.a, b_lab: settings.seedColor.b_lab },
        });

    } else if (canvas && mousePos) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const x = Math.floor(mousePos.x);
        const y = Math.floor(mousePos.y);
        
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const r = pixel[0];
          const g = pixel[1];
          const b = pixel[2];
          
          setAnalysis({
            rgb: { r, g, b },
            hsv: rgbToHsv(r, g, b),
            lab: rgbToLab(r, g, b),
          });
        } else {
          setAnalysis(null);
        }
      }
    } else {
        setAnalysis(null);
    }
  }, [canvas, mousePos, isExclusionPanel, settings.seedColor]);

  
  const handleToggleEnabled = (setting: keyof MagicWandSettings['tolerances']) => {
    const newSet = new Set(settings.enabledTolerances);
    if (newSet.has(setting)) {
      newSet.delete(setting);
    } else {
      newSet.add(setting);
    }
    onSettingsChange({ enabledTolerances: newSet });
  };
  
  const handleToggleScrollAdjust = (setting: keyof MagicWandSettings['tolerances']) => {
     const newSet = new Set(settings.scrollAdjustTolerances);
    if (newSet.has(setting)) {
      newSet.delete(setting);
    } else {
      newSet.add(setting);
    }
    onSettingsChange({ scrollAdjustTolerances: newSet });
  }

  const handleToleranceChange = (key: keyof MagicWandSettings['tolerances'], value: number) => {
      onSettingsChange({
          tolerances: {
              ...settings.tolerances,
              [key]: value
          }
      });
  }

  const handleToggleGroup = (groupKeys: (keyof MagicWandSettings['tolerances'])[]) => {
    const newEnabledTolerances = new Set(settings.enabledTolerances);
    const allEnabled = groupKeys.every(key => newEnabledTolerances.has(key));

    if (allEnabled) {
      groupKeys.forEach(key => newEnabledTolerances.delete(key));
    } else {
      groupKeys.forEach(key => newEnabledTolerances.add(key));
    }
    onSettingsChange({ enabledTolerances: newEnabledTolerances });
  };
  
  const ALL_COMPONENTS: {title: string, components: {id: keyof MagicWandSettings['tolerances'], label: string, max: number, color: string, value: number | undefined}[]}[] = [
    {
      title: 'RGB',
      components: [
        { id: 'r', label: 'R', max: 255, color: "bg-red-500", value: analysis?.rgb.r },
        { id: 'g', label: 'G', max: 255, color: "bg-green-500", value: analysis?.rgb.g },
        { id: 'b', label: 'B', max: 255, color: "bg-blue-500", value: analysis?.rgb.b },
      ]
    },
    {
      title: 'HSV',
      components: [
        { id: 'h', label: 'H', max: 360, color: "bg-gradient-to-t from-red-500 via-yellow-500 to-blue-500", value: analysis?.hsv.h },
        { id: 's', label: 'S', max: 100, color: "bg-slate-400", value: analysis?.hsv.s },
        { id: 'v', label: 'V', max: 100, color: "bg-white", value: analysis?.hsv.v },
      ]
    },
    {
      title: 'LAB',
      components: [
        { id: 'l', label: 'L', max: 100, color: "bg-gray-500", value: analysis?.lab.l },
        { id: 'a', label: 'a', max: 256, color: "bg-gradient-to-t from-green-500 to-red-500", value: (analysis?.lab.a ?? -128) + 128 },
        { id: 'b_lab', label: 'b', max: 256, color: "bg-gradient-to-t from-blue-500 to-yellow-500", value: (analysis?.lab.b_lab ?? -128) + 128 },
      ]
    }
  ]


  return (
    <div className="p-4 space-y-6">
      {!isExclusionPanel && <SegmentHoverPreview canvas={canvas} mousePos={mousePos} />}
      <div className="space-y-4">
        <TooltipProvider>
            <div className="space-y-2">
                <div className="flex justify-around bg-muted/50 p-4 rounded-md">
                    {ALL_COMPONENTS.map((group, groupIndex) => 
                        <React.Fragment key={group.title}>
                           <div className="flex flex-col items-center gap-2">
                              <Button variant="secondary" size="sm" onClick={() => handleToggleGroup(group.components.map(c => c.id))} className="font-semibold text-sm h-auto p-1 w-full">
                                {group.title}
                              </Button>
                              <div className="flex items-end h-64 gap-1">
                                {group.components.map(config => (
                                    <VerticalToleranceSlider
                                        key={config.id}
                                        id={config.id}
                                        label={config.label}
                                        tolerance={settings.tolerances[config.id]}
                                        max={config.max}
                                        color={config.color}
                                        pixelValue={config.value}
                                        description={`Adjusts the tolerance for the ${config.label} component.`}
                                        isEnabled={settings.enabledTolerances.has(config.id)}
                                        isSelectedForScroll={settings.scrollAdjustTolerances.has(config.id)}
                                        onToggleEnabled={() => handleToggleEnabled(config.id)}
                                        onToggleScrollAdjust={() => handleToggleScrollAdjust(config.id)}
                                        onToleranceChange={(value) => handleToleranceChange(config.id, value)}
                                    />
                                ))}
                              </div>
                           </div>
                           {groupIndex < ALL_COMPONENTS.length - 1 && <Separator orientation="vertical" className="h-auto bg-border/50" />}
                        </React.Fragment>
                    )}
                </div>
            </div>
        </TooltipProvider>
      </div>

      <Separator />

      {!isExclusionPanel && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <Label htmlFor="contiguous">Contiguous</Label>
                <Switch
                id="contiguous"
                checked={settings.contiguous}
                onCheckedChange={(checked) => onSettingsChange({ contiguous: checked })}
                />
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <Label htmlFor="anti-aliasing">Anti-Alias</Label>
                <Switch
                id="anti-aliasing"
                checked={settings.useAntiAlias}
                onCheckedChange={(checked) => onSettingsChange({ useAntiAlias: checked })}
                />
            </div>
             <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <Label htmlFor="feather-edges">Feather</Label>
                <Switch
                id="feather-edges"
                checked={settings.useFeather}
                onCheckedChange={(checked) => onSettingsChange({ useFeather: checked })}
                />
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <Label htmlFor="show-masks" className="flex items-center gap-2">Show All Masks</Label>
                <Switch
                    id="show-masks"
                    checked={settings.showAllMasks}
                    onCheckedChange={(v) => onSettingsChange({ showAllMasks: v })}
                />
            </div>
             <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <Label htmlFor="ignore-segments" className="flex items-center gap-2"><EyeOff className="w-4 h-4"/>Ignore Segments</Label>
                <Switch
                    id="ignore-segments"
                    checked={settings.ignoreExistingSegments}
                    onCheckedChange={(v) => onSettingsChange({ ignoreExistingSegments: v })}
                />
            </div>
          </div>
      )}

    </div>
  )
}


interface VerticalToleranceSliderProps {
    id: keyof MagicWandSettings['tolerances'];
    label: string;
    tolerance: number;
    max: number;
    color: string;
    pixelValue: number | undefined;
    description: string;
    isEnabled: boolean;
    isSelectedForScroll: boolean;
    onToggleEnabled: () => void;
    onToggleScrollAdjust: () => void;
    onToleranceChange: (value: number) => void;
}

function VerticalToleranceSlider({ id, label, tolerance, max, color, pixelValue, description, isEnabled, isSelectedForScroll, onToggleEnabled, onToggleScrollAdjust, onToleranceChange }: VerticalToleranceSliderProps) {
    const displayValue = tolerance.toFixed(0);

    let bottomPercent = 0;
    let rangeHeight = 0;

    if (pixelValue !== undefined) {
        const baseValue = (id === 'a' || id === 'b_lab') ? pixelValue : pixelValue;
        
        // Handle hue's circular nature for visualization
        if (id === 'h') {
            const hDiff = Math.abs(pixelValue - tolerance);
            const lowerBound = (pixelValue - tolerance + 360) % 360;
            const upperBound = (pixelValue + tolerance) % 360;
            
            // This is a simplification and doesn't show wrapping around the bar.
            bottomPercent = (Math.max(0, pixelValue - tolerance) / max) * 100;
            rangeHeight = (Math.min(max, pixelValue + tolerance) - Math.max(0, pixelValue - tolerance)) / max * 100;
        } else {
            bottomPercent = (Math.max(0, baseValue - tolerance) / max) * 100;
            const topValue = Math.min(max, baseValue + tolerance);
            rangeHeight = (topValue - Math.max(0, baseValue - tolerance)) / max * 100;
        }
    }


    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        let step = 1;
        if (id === 'h') step = 2;
        
        let newValue = tolerance + delta * step;
        newValue = Math.max(0, Math.min(max, newValue));
        onToleranceChange(newValue);
    };
    
    return (
        <div className={cn("flex flex-col items-center justify-end gap-2 h-full w-8 cursor-pointer p-1 rounded-md", isSelectedForScroll && "bg-primary/20")} onWheel={handleWheel} onClick={onToggleScrollAdjust}>
            <Tooltip>
                <TooltipTrigger asChild>
                     <span className="text-xs font-semibold">{label}</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label} Tolerance</p>
                </TooltipContent>
            </Tooltip>

             <div className={cn("w-4 h-full bg-muted rounded-full overflow-hidden flex flex-col justify-end relative", color)}>
                {pixelValue !== undefined && isEnabled && (
                  <div 
                      className={cn("w-full absolute bg-primary/75 border-y border-primary-foreground/50")} 
                      style={{ 
                          bottom: `${bottomPercent}%`, 
                          height: `${rangeHeight}%`
                      }}
                  ></div>
                )}
                 {pixelValue !== undefined && (
                    <div className="w-full h-0.5 bg-accent-foreground absolute" style={{ bottom: `${(pixelValue / max) * 100}%`}}></div>
                )}
            </div>
            
            <Slider
                id={id}
                min={0}
                max={max}
                step={1}
                value={[tolerance]}
                onValueChange={(v) => onToleranceChange(v[0])}
                orientation="vertical"
                className="h-full absolute top-0 left-1/2 -translate-x-1/2 opacity-0 cursor-row-resize"
                disabled={!isEnabled}
            />
            <span className="font-mono text-xs">{displayValue}</span>
             <div className="flex flex-col items-center gap-2">
                <Switch
                    id={`${id}-toggle`}
                    checked={isEnabled}
                    onCheckedChange={onToggleEnabled}
                    orientation="vertical"
                    onClick={(e) => e.stopPropagation()}
                />
                 <Popover>
                    <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors mt-2" />
                    </PopoverTrigger>
                    <PopoverContent side="top" className="text-sm">
                        <h4 className="font-semibold mb-2">{label} Tolerance</h4>
                        <p>{description}</p>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

    

    