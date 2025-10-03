
"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { MagicWandSettings } from "@/lib/types"
import { Button } from "../ui/button"
import { EyeOff, Layers, Link, Palette, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

const VerticalToleranceSlider = ({
    id,
    label,
    tolerance,
    max,
    color,
    pixelValue,
    description,
    isEnabled,
    isSelectedForScroll,
    onToggleEnabled,
    onToggleScrollAdjust,
    onToleranceChange,
}: {
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
}) => {
    const displayValue = tolerance.toFixed(0);

    let bottomPercent = 0;
    let rangeHeight = 0;

    if (pixelValue !== undefined) {
        const baseValue = (id === 'a' || id === 'b_lab') ? pixelValue : pixelValue;
        
        if (id === 'h') {
            const hDiff = Math.abs(pixelValue - tolerance);
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

             <div className={cn("w-2 h-full bg-muted rounded-full overflow-hidden flex flex-col justify-end relative", color)}>
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
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};

export function MagicWandCompactSettings({ settings, onSettingsChange }: { settings: MagicWandSettings, onSettingsChange: (s: Partial<MagicWandSettings>) => void}) {

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

    const RGB_COMPONENTS: {id: keyof MagicWandSettings['tolerances'], label: string, max: number, color: string, description: string}[] = [
        { id: 'r', label: 'R', max: 255, color: "bg-red-500", description: "Red channel tolerance" },
        { id: 'g', label: 'G', max: 255, color: "bg-green-500", description: "Green channel tolerance" },
        { id: 'b', label: 'B', max: 255, color: "bg-blue-500", description: "Blue channel tolerance" },
    ]
    const HSV_COMPONENTS: {id: keyof MagicWandSettings['tolerances'], label: string, max: number, color: string, description: string}[] = [
        { id: 'h', label: 'H', max: 360, color: "bg-gradient-to-t from-red-500 via-yellow-500 to-blue-500", description: "Hue tolerance (color type)" },
        { id: 's', label: 'S', max: 100, color: "bg-slate-400", description: "Saturation tolerance (color intensity)" },
        { id: 'v', label: 'V', max: 100, color: "bg-white", description: "Value/Brightness tolerance" },
    ]
    const LAB_COMPONENTS: {id: keyof MagicWandSettings['tolerances'], label: string, max: number, color: string, description: string}[] = [
        { id: 'l', label: 'L', max: 100, color: "bg-gray-500", description: "Lightness tolerance" },
        { id: 'a', label: 'a', max: 256, color: "bg-gradient-to-t from-green-500 to-red-500", description: "Green-Red axis tolerance" },
        { id: 'b_lab', label: 'b', max: 256, color: "bg-gradient-to-t from-blue-500 to-yellow-500", description: "Blue-Yellow axis tolerance" },
    ]

  return (
    <div className="flex flex-col h-full items-center justify-start py-2 px-2 gap-4">
      <TooltipProvider>
        <div className="flex flex-col items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={settings.contiguous ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => onSettingsChange({ contiguous: !settings.contiguous })}>
                        <Layers className="w-4 h-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Contiguous</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={settings.createAsMask ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => onSettingsChange({ createAsMask: !settings.createAsMask })}>
                        <Link className="w-4 h-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Create as Mask</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={settings.showAllMasks ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => onSettingsChange({ showAllMasks: !settings.showAllMasks })}>
                        <Palette className="w-4 h-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Show All Masks</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={settings.ignoreExistingSegments ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => onSettingsChange({ ignoreExistingSegments: !settings.ignoreExistingSegments })}>
                        <EyeOff className="w-4 h-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Ignore Existing Segments</p></TooltipContent>
            </Tooltip>
        </div>
        
        <div className="flex flex-col items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleToggleGroup(HSV_COMPONENTS.map(c => c.id))} className="font-semibold text-xs h-auto p-1">HSV</Button>
            <div className="flex items-end h-32 gap-px">
              {HSV_COMPONENTS.map(config => (
                  <VerticalToleranceSlider
                      key={config.id}
                      id={config.id}
                      label={config.label}
                      tolerance={settings.tolerances[config.id]}
                      max={config.max}
                      color={config.color}
                      pixelValue={undefined}
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
        
        <div className="flex flex-col items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleToggleGroup(RGB_COMPONENTS.map(c => c.id))} className="font-semibold text-xs h-auto p-1">RGB</Button>
            <div className="flex items-end h-32 gap-px">
              {RGB_COMPONENTS.map(config => (
                  <VerticalToleranceSlider
                      key={config.id}
                      id={config.id}
                      label={config.label}
                      tolerance={settings.tolerances[config.id]}
                      max={config.max}
                      color={config.color}
                      pixelValue={undefined}
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

        <div className="flex flex-col items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleToggleGroup(LAB_COMPONENTS.map(c => c.id))} className="font-semibold text-xs h-auto p-1">LAB</Button>
            <div className="flex items-end h-32 gap-px">
              {LAB_COMPONENTS.map(config => (
                  <VerticalToleranceSlider
                      key={config.id}
                      id={config.id}
                      label={config.label}
                      tolerance={settings.tolerances[config.id]}
                      max={config.max}
                      color={config.color}
                      pixelValue={undefined}
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
      </TooltipProvider>
    </div>
  )
}
