"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { LassoSettings } from "@/lib/types";


interface LassoPanelProps {
  settings: LassoSettings;
  onSettingsChange: (settings: Partial<LassoSettings>) => void;
  activeScrollSetting: keyof LassoSettings | null;
  onActiveScrollSettingChange: (setting: keyof LassoSettings | null) => void;
}


export function LassoPanel({ settings, onSettingsChange, activeScrollSetting, onActiveScrollSettingChange }: LassoPanelProps) {
    
  const handleToggle = (setting: keyof LassoSettings, checked: boolean) => {
    if (checked) {
      onActiveScrollSettingChange(setting);
    } else if (activeScrollSetting === setting) {
      onActiveScrollSettingChange(null);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Intelligent Lasso</h3>
        <p className="text-sm text-muted-foreground">
          Draw a freehand selection with smart edge-snapping.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="useEdgeSnapping">Enable AI Edge Snapping</Label>
          <Switch
            id="useEdgeSnapping"
            checked={settings.useEdgeSnapping}
            onCheckedChange={(checked) => onSettingsChange({ useEdgeSnapping: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Toggles the AI-powered path snapping on or off.
        </p>
      </div>
      
      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Live Adjustment Settings</h4>
        <p className="text-xs text-muted-foreground -mt-2">Toggle a setting to adjust it with the mouse wheel while drawing.</p>

        <SettingSlider 
          label="Snap Radius"
          id="snapRadius"
          value={settings.snapRadius}
          min={1} max={20} step={1}
          unit="px"
          description="How far the tool looks for an edge to snap to."
          isActive={activeScrollSetting === 'snapRadius'}
          onToggle={(checked) => handleToggle('snapRadius', checked)}
          onValueChange={(value) => onSettingsChange({ snapRadius: value })}
        />

        <SettingSlider 
          label="Edge Sensitivity"
          id="snapThreshold"
          value={settings.snapThreshold}
          min={0.05} max={1} step={0.05}
          description="How strong an edge must be to be considered. Lower is more sensitive."
          isActive={activeScrollSetting === 'snapThreshold'}
          onToggle={(checked) => handleToggle('snapThreshold', checked)}
          onValueChange={(value) => onSettingsChange({ snapThreshold: value })}
        />

        <SettingSlider 
          label="Smoothness"
          id="curveStrength"
          value={settings.curveStrength}
          min={0} max={1} step={0.05}
          description="Higher values create smoother, more curved lines."
          isActive={activeScrollSetting === 'curveStrength'}
          onToggle={(checked) => handleToggle('curveStrength', checked)}
          onValueChange={(value) => onSettingsChange({ curveStrength: value })}
        />
        
        <SettingSlider 
          label="Directional Strength"
          id="directionalStrength"
          value={settings.directionalStrength}
          min={0} max={1} step={0.05}
          description="How strongly the path maintains its direction. Higher values resist deviation."
          isActive={activeScrollSetting === 'directionalStrength'}
          onToggle={(checked) => handleToggle('directionalStrength', checked)}
          onValueChange={(value) => onSettingsChange({ directionalStrength: value })}
        />

        <SettingSlider 
          label="Cursor Influence"
          id="cursorInfluence"
          value={settings.cursorInfluence}
          min={0} max={1} step={0.05}
          description="How strongly the path is pulled towards the cursor. Higher is stronger."
          isActive={activeScrollSetting === 'cursorInfluence'}
          onToggle={(checked) => handleToggle('cursorInfluence', checked)}
          onValueChange={(value) => onSettingsChange({ cursorInfluence: value })}
        />
      </div>

       <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>How to use</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Click on the image to start your path and add points.</li>
            <li>Toggle a setting to activate scroll-wheel adjustment while drawing.</li>
            <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd> to complete the selection.</li>
            <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> to cancel.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}

interface SettingSliderProps {
    label: string;
    id: string;
    value: number;
    min: number; max: number; step: number;
    unit?: string;
    description: string;
    isActive: boolean;
    onToggle: (checked: boolean) => void;
    onValueChange: (value: number) => void;
}

function SettingSlider({ label, id, value, min, max, step, unit, description, isActive, onToggle, onValueChange }: SettingSliderProps) {
    const displayValue = Number.isInteger(step) ? value.toFixed(0) : value.toFixed(2);
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor={id}>{label}: {displayValue}{unit}</Label>
                <Switch
                    id={`${id}-toggle`}
                    checked={isActive}
                    onCheckedChange={onToggle}
                />
            </div>
            <Slider
                id={id}
                min={min} max={max} step={step}
                value={[value]}
                onValueChange={(v) => onValueChange(v[0])}
            />
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    );
}