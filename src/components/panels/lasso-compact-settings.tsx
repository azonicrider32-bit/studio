
"use client";

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { LassoSettings } from "@/lib/types"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"

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


export function LassoCompactSettings({ settings, onSettingsChange }: { settings: LassoSettings, onSettingsChange: (s: Partial<LassoSettings>) => void }) {
  if (settings.drawMode !== 'magic') {
    return (
      <div className="p-2 text-center text-xs text-muted-foreground">
        Compact settings available for Magic Snap mode only.
      </div>
    )
  }
  
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

  return (
    <div className="flex flex-col h-full items-center justify-start py-2 px-1">
      <TooltipProvider>
        <div className="flex flex-col items-center space-y-2">
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
        </div>
      </TooltipProvider>
    </div>
  )
}
