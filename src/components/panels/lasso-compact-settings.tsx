
"use client";

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { LassoSettings } from "@/lib/types"

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
      <div className="flex flex-col items-center gap-2 flex-1 p-1 rounded-md" onWheel={handleWheel}>
          <Tooltip>
              <TooltipTrigger asChild>
                  <span className="text-xs font-semibold">{label}</span>
              </TooltipTrigger>
              <TooltipContent side="right">
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


export function LassoCompactSettings({ settings, onSettingsChange }: { settings: LassoSettings, onSettingsChange: (s: Partial<LassoSettings>) => void }) {
  if (settings.drawMode !== 'magic') {
    return (
      <div className="p-2 text-center text-xs text-muted-foreground">
        Compact settings available for Magic Snap mode only.
      </div>
    )
  }
  
  return (
    <div className="p-2 space-y-4 h-full flex flex-col justify-around">
      <TooltipProvider>
        <div className="flex justify-around gap-1">
            <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onSettingsChange} settingKey="snapRadius" label="R" max={50} step={1} unit="px"/>
            <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onSettingsChange} settingKey="snapThreshold" label="T" max={1} step={0.05} />
            <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onSettingsChange} settingKey="directionalStrength" label="D" max={1} step={0.05} />
        </div>
        <div className="flex justify-around gap-1">
            <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onSettingsChange} settingKey="cursorInfluence" label="C" max={1} step={0.05} />
            <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onSettingsChange} settingKey="traceInfluence" label="T" max={1} step={0.05} />
            <VerticalLassoSlider lassoSettings={settings} onLassoSettingsChange={onSettingsChange} settingKey="colorInfluence" label="Co" max={1} step={0.05} />
        </div>
      </TooltipProvider>
    </div>
  )
}
