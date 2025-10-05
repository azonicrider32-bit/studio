
"use client";

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { LassoSettings } from "@/lib/types"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { GitCommit, PenTool, Sparkles, Wand2 } from "lucide-react"

const VerticalLassoSlider = ({
  settingKey,
  label,
  max,
  step,
  unit = '',
  lassoSettings,
  onLassoSettingsChange,
}: {
  settingKey: keyof LassoSettings;
  label: string;
  max: number;
  step: number;
  unit?: string;
  lassoSettings: LassoSettings;
  onLassoSettingsChange: (settings: Partial<LassoSettings>) => void;
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
      <div className={cn("flex flex-col items-center justify-end gap-2 h-full cursor-pointer rounded-md p-px")} onWheel={handleWheel}>
          <Tooltip>
              <TooltipTrigger asChild>
                   <div className="w-full h-full flex flex-col items-center gap-2 justify-end">
                      <div className={cn("w-3 h-full bg-muted rounded-full overflow-hidden flex flex-col justify-end relative")}>
                        <div 
                          className={cn("w-full bg-primary/75", { "bg-muted": !isEnabled })}
                          style={{ height: `${(value/max)*100}%`}}
                        ></div>
                      </div>
                      <Slider
                          id={`${settingKey}-slider`}
                          min={0}
                          max={max}
                          step={step}
                          value={[value]}
                          onValueChange={(v) => onLassoSettingsChange({ [settingKey]: v[0] } as Partial<LassoSettings>)}
                          orientation="vertical"
                          className="h-full absolute top-0 left-1/2 -translate-x-1/2 opacity-0 cursor-row-resize"
                          disabled={!isEnabled}
                      />
                  </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                  <p>{label}: {value.toFixed(step < 1 ? 2 : 0)}{unit}</p>
              </TooltipContent>
          </Tooltip>
           <div className="flex flex-col items-center gap-2">
                <Switch
                    id={`${settingKey}-toggle`}
                    size="sm"
                    checked={isEnabled}
                    onCheckedChange={(checked) => onLassoSettingsChange({ [`${settingKey}Enabled`]: checked } as Partial<LassoSettings>)}
                    orientation="vertical"
                />
            </div>
      </div>
  );
};


export function LassoCompactSettings({ settings, onLassoSettingsChange }: { settings: LassoSettings, onLassoSettingsChange: (s: Partial<LassoSettings>) => void }) {
  
  const handleToggleGroup = (keys: (keyof LassoSettings)[]) => {
    const allEnabled = keys.every(k => settings[`${k}Enabled` as keyof LassoSettings]);
    const changes: Partial<LassoSettings> = {};
    keys.forEach(key => {
        changes[`${key}Enabled` as keyof LassoSettings] = !allEnabled;
    });
    onLassoSettingsChange(changes);
  }

  const snapKeys: (keyof LassoSettings)[] = ['snapRadius', 'snapThreshold', 'directionalStrength'];
  const influenceKeys: (keyof LassoSettings)[] = ['cursorInfluence', 'traceInfluence', 'colorInfluence'];
  
  const DRAW_MODES: { id: LassoSettings['drawMode']; label: string; icon: React.ElementType }[] = [
    { id: 'magic', label: 'Magic Snap', icon: Sparkles },
    { id: 'polygon', label: 'Polygon', icon: GitCommit },
    { id: 'free', label: 'Free Draw', icon: PenTool },
  ];

  const cycleDrawMode = () => {
    const currentIndex = DRAW_MODES.findIndex(m => m.id === settings.drawMode);
    const nextIndex = (currentIndex + 1) % DRAW_MODES.length;
    onLassoSettingsChange({ drawMode: DRAW_MODES[nextIndex].id });
  };
  
  const CurrentModeIcon = DRAW_MODES.find(m => m.id === settings.drawMode)?.icon || Sparkles;

  return (
    <div className="flex flex-col h-full items-center justify-start py-2 px-1">
      <TooltipProvider>
        <div className="flex flex-col items-center space-y-2">

          {/* General Settings */}
          <div className="flex flex-col items-center gap-2 mb-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={cycleDrawMode}>
                      <CurrentModeIcon className="w-5 h-5"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Draw Mode: {settings.drawMode}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button 
                      variant={settings.useAiEnhancement ? "secondary" : "ghost"} 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => onLassoSettingsChange({ useAiEnhancement: !settings.useAiEnhancement })}
                    >
                      <Wand2 className="w-4 h-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>AI Enhancement</p></TooltipContent>
              </Tooltip>
          </div>


          {/* Magic Snap Specific Settings */}
          {settings.drawMode === 'magic' ? (
            <>
              <div className="flex flex-col items-center gap-1 my-2">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleGroup(snapKeys)} className="font-semibold text-xs h-auto p-1">Snap</Button>
                  <div className="flex items-end h-32">
                      <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onLassoSettingsChange} settingKey="snapRadius" label="Radius" max={50} step={1} unit="px"/>
                      <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onLassoSettingsChange} settingKey="snapThreshold" label="Thresh" max={1} step={0.05} />
                      <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onLassoSettingsChange} settingKey="directionalStrength" label="Direction" max={1} step={0.05} />
                  </div>
              </div>

              <div className="flex flex-col items-center gap-1 my-2">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleGroup(influenceKeys)} className="font-semibold text-xs h-auto p-1">Influence</Button>
                  <div className="flex items-end h-32">
                      <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onLassoSettingsChange} settingKey="cursorInfluence" label="Cursor" max={1} step={0.05} />
                      <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onLassoSettingsChange} settingKey="traceInfluence" label="Trace" max={1} step={0.05} />
                      <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onLassoSettingsChange} settingKey="colorInfluence" label="Color" max={1} step={0.05} />
                  </div>
              </div>
            </>
          ) : (
            <div className="p-2 text-center text-xs text-muted-foreground flex-1 flex items-center">
              <p>Magic Snap settings are only available in Magic Snap draw mode.</p>
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}
