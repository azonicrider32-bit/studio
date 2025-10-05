
"use client"

import * as React from "react"
import { Info, MinusCircle, Scan, Sigma, Droplets, RefreshCw } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { MagicWandSettings } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { cn } from "@/lib/utils"
import { rgbToHsv, rgbToLab } from "@/lib/color-utils"
import { Button } from "../ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Label } from "../ui/label"
import { ProgressiveHover } from "../ui/progressive-hover"

interface MagicWandPanelProps {
  settings: MagicWandSettings;
  onSettingsChange: (settings: Partial<MagicWandSettings>) => void;
  exclusionSettings: MagicWandSettings;
  onExclusionSettingsChange: (settings: Partial<MagicWandSettings>) => void;
  canvas: HTMLCanvasElement | null;
  mousePos: { x: number; y: number } | null;
}

interface Analysis {
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b_lab: number };
}

export function MagicWandPanel({ 
  settings, 
  onSettingsChange,
  exclusionSettings,
  onExclusionSettingsChange,
  canvas,
  mousePos,
}: MagicWandPanelProps) {
  
  const ToleranceSection = ({ title, settings, onSettingsChange }: { title: string, settings: MagicWandSettings, onSettingsChange: (s: Partial<MagicWandSettings>) => void}) => {
    const [analysis, setAnalysis] = React.useState<Analysis | null>(null)
    
    React.useEffect(() => {
      if (title === 'Exclusion' && settings && settings.seedColor) {
          setAnalysis({
              rgb: { r: settings.seedColor.r, g: settings.seedColor.g, b: settings.seedColor.b },
              hsv: { h: settings.seedColor.h, s: settings.seedColor.s, v: settings.seedColor.v },
              lab: { l: settings.seedColor.l, a: settings.seedColor.a, b_lab: settings.seedColor.b_lab },
          });

      } else if (title !== 'Exclusion' && canvas && mousePos) {
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
      } else if (title !== 'Exclusion') {
          setAnalysis(null);
      }
    }, [canvas, mousePos, settings?.seedColor, title]);

    
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
    
    const ALL_COMPONENTS: {title: string, components: {id: keyof MagicWandSettings['tolerances'], label: string, max: number, color: string, value: number | undefined, description: string}[]}[] = [
      {
        title: 'RGB',
        components: [
          { id: 'r', label: 'R', max: 255, color: "bg-red-500", value: analysis?.rgb.r, description: "Red channel" },
          { id: 'g', label: 'G', max: 255, color: "bg-green-500", value: analysis?.rgb.g, description: "Green channel" },
          { id: 'b', label: 'B', max: 255, color: "bg-blue-500", value: analysis?.rgb.b, description: "Blue channel" },
        ]
      },
      {
        title: 'HSV',
        components: [
          { id: 'h', label: 'H', max: 360, color: "bg-gradient-to-t from-red-500 via-yellow-500 to-blue-500", value: analysis?.hsv.h, description: "Hue (color type)" },
          { id: 's', label: 'S', max: 100, color: "bg-slate-400", value: analysis?.hsv.s, description: "Saturation (intensity)" },
          { id: 'v', label: 'V', max: 100, color: "bg-white", value: analysis?.hsv.v, description: "Value (brightness)" },
        ]
      },
      {
        title: 'LAB',
        components: [
          { id: 'l', label: 'L', max: 100, color: "bg-gray-500", value: analysis?.lab.l, description: "Lightness" },
          { id: 'a', label: 'a', max: 256, color: "bg-gradient-to-t from-green-500 to-red-500", value: (analysis?.lab.a ?? -128) + 128, description: "Green-Red axis" },
          { id: 'b_lab', label: 'b', max: 256, color: "bg-gradient-to-t from-blue-500 to-yellow-500", value: (analysis?.lab.b_lab ?? -128) + 128, description: "Blue-Yellow axis" },
        ]
      }
    ]

    return (
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
                                        description={config.description}
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
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <Accordion type="single" collapsible defaultValue="sample-area">
          <AccordionItem value="sample-area">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5"/>
                <h4 className="font-semibold">Sample Area</h4>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <ProgressiveHover
                initialContent="Search Radius"
                summaryContent="Defines the size of the area to sample when determining the initial color for the Magic Wand."
              >
                <div className="space-y-2">
                  <Label htmlFor="search-radius">Search Radius: {settings.searchRadius}px</Label>
                  <Slider
                    id="search-radius"
                    min={1}
                    max={100}
                    step={1}
                    value={[settings.searchRadius]}
                    onValueChange={(v) => onSettingsChange({ searchRadius: v[0] })}
                  />
                </div>
              </ProgressiveHover>
              <ProgressiveHover
                initialContent="Sample Mode"
                summaryContent="Determines how the tool calculates the starting color from the sample area."
                detailedContent="Point: Uses the single pixel you click. Average: Averages all colors in the radius. Dominant: Finds the most frequent color in the radius."
              >
                <div className="space-y-2">
                  <Label>Sample Mode</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={settings.sampleMode === 'point' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSettingsChange({ sampleMode: 'point' })}
                    >
                      Point
                    </Button>
                    <Button
                      variant={settings.sampleMode === 'average' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSettingsChange({ sampleMode: 'average' })}
                    >
                      <Sigma className="w-4 h-4 mr-1"/> Average
                    </Button>
                    <Button
                      variant={settings.sampleMode === 'dominant' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSettingsChange({ sampleMode: 'dominant' })}
                    >
                      <Droplets className="w-4 h-4 mr-1"/> Dominant
                    </Button>
                  </div>
                </div>
              </ProgressiveHover>
               <ProgressiveHover
                initialContent="Refresh Rate"
                summaryContent="Controls how often the preview updates while moving the mouse."
                detailedContent="Lower values give a more responsive preview but may impact performance. Higher values are more performant."
              >
                <div className="space-y-2">
                  <Label htmlFor="debounce-delay">Preview Refresh Rate: {settings.debounceDelay}ms</Label>
                  <Slider
                    id="debounce-delay"
                    min={10}
                    max={1000}
                    step={10}
                    value={[settings.debounceDelay]}
                    onValueChange={(v) => onSettingsChange({ debounceDelay: v[0] })}
                  />
                </div>
              </ProgressiveHover>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <ToleranceSection title="Inclusion" settings={settings} onSettingsChange={onSettingsChange} />
        <Accordion type="single" collapsible>
            <AccordionItem value="exclusions">
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <MinusCircle className="w-5 h-5"/>
                        <h4 className="font-semibold">Exclusion Settings</h4>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                   <ToleranceSection title="Exclusion" settings={exclusionSettings} onSettingsChange={onExclusionSettingsChange} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
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
        
        if (id === 'h') {
            const hDiff = Math.abs(pixelValue - tolerance);
            const lowerBound = (pixelValue - tolerance + 360) % 360;
            const upperBound = (pixelValue + tolerance) % 360;
            
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
