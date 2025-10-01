
"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal, Radius, Waves, Spline, TrendingUp, MousePointerClick, Info, Wand2 } from "lucide-react";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { LassoSettings } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";


interface LassoPanelProps {
  settings: LassoSettings;
  onSettingsChange: (settings: Partial<LassoSettings>) => void;
}


export function LassoPanel({ settings, onSettingsChange }: LassoPanelProps) {
    
  const handleToggle = (setting: keyof LassoSettings) => {
    onSettingsChange({ [setting]: !settings[setting] });
  };

  const handlePreset = (preset: 'default' | 'precise' | 'loose') => {
    let newSettings: Partial<LassoSettings>;
    switch (preset) {
      case 'precise':
        newSettings = {
          snapRadius: 5,
          snapThreshold: 0.50,
          curveStrength: 0.00,
          directionalStrength: 0.00,
          cursorInfluence: 0.25,
          snapRadiusEnabled: true,
          snapThresholdEnabled: true,
          curveStrengthEnabled: false,
          directionalStrengthEnabled: false,
          cursorInfluenceEnabled: true,
        };
        break;
      case 'loose':
        newSettings = {
          snapRadius: 30,
          snapThreshold: 0.2,
          curveStrength: 0.4,
          directionalStrength: 0.5,
          cursorInfluence: 0.05,
          snapRadiusEnabled: true,
          snapThresholdEnabled: true,
          curveStrengthEnabled: true,
          directionalStrengthEnabled: true,
          cursorInfluenceEnabled: false,
        };
        break;
      default: // default
        newSettings = {
          snapRadius: 20,
          snapThreshold: 0.3,
          curveStrength: 0.05,
          directionalStrength: 0.2,
          cursorInfluence: 0.1,
          snapRadiusEnabled: true,
          snapThresholdEnabled: true,
          curveStrengthEnabled: true,
          directionalStrengthEnabled: false,
          cursorInfluenceEnabled: true,
        };
        break;
    }
    onSettingsChange(newSettings);
  };

  const SETTINGS_CONFIG: { id: keyof Omit<LassoSettings, 'useMagicSnapping' | 'useAiEnhancement' | `${string}Enabled`>; label: string; icon: React.ElementType; min: number; max: number; step: number; unit?: string; description: string; }[] = [
    { id: 'snapRadius', label: 'Snap Radius', icon: Radius, min: 1, max: 40, step: 1, unit: 'px', description: 'How far the tool looks for an edge to snap to.' },
    { id: 'snapThreshold', label: 'Edge Sensitivity', icon: Waves, min: 0.05, max: 1, step: 0.05, description: 'How strong an edge must be to be considered. Lower is more sensitive.' },
    { id: 'curveStrength', label: 'Smoothness', icon: Spline, min: 0, max: 1, step: 0.05, description: 'Higher values create smoother, more curved lines.' },
    { id: 'directionalStrength', label: 'Directional Strength', icon: TrendingUp, min: 0, max: 1, step: 0.05, description: 'How strongly the path maintains its direction. Higher values resist deviation.' },
    { id: 'cursorInfluence', label: 'Cursor Influence', icon: MousePointerClick, min: 0, max: 1, step: 0.05, description: 'How strongly the path is pulled towards the cursor. Higher is stronger.' },
  ];

  return (
    <div className="p-4 space-y-6">
       <TooltipProvider>
      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Label htmlFor="useMagicSnapping" className="flex items-center gap-2">
                            <Wand2 className="h-4 w-4" />
                            Magic Snapping
                        </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Enable real-time path snapping to detected edges as you draw.</p>
                    </TooltipContent>
                </Tooltip>
                 <Popover>
                    <PopoverTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </PopoverTrigger>
                    <PopoverContent side="top" className="text-sm">
                        <h4 className="font-semibold mb-2">Magic Snapping</h4>
                        <p>Enables the real-time, non-AI pathfinding that automatically snaps the lasso line to the strongest nearby edge as you draw. This provides live feedback and helps guide your selection.</p>
                    </PopoverContent>
                </Popover>
              </div>
              <Switch
                id="useMagicSnapping"
                checked={settings.useMagicSnapping}
                onCheckedChange={(checked) => onSettingsChange({ useMagicSnapping: checked })}
              />
          </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Label htmlFor="useAiEnhancement" className="flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-primary" />
                            AI Enhancement
                        </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Use AI to analyze and enhance the final selection path upon completion.</p>
                    </TooltipContent>
                </Tooltip>
                 <Popover>
                    <PopoverTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </PopoverTrigger>
                    <PopoverContent side="top" className="text-sm">
                        <h4 className="font-semibold mb-2">AI Enhancement</h4>
                        <p>When you complete the selection (by pressing Enter or double-clicking), a powerful GenAI model will analyze the image content within your path and intelligently refine it to create a more accurate and professional final selection.</p>
                    </PopoverContent>
                </Popover>
            </div>
            <Switch
                id="useAiEnhancement"
                checked={settings.useAiEnhancement}
                onCheckedChange={(checked) => onSettingsChange({ useAiEnhancement: checked })}
            />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Presets</Label>
        <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePreset('default')}>Default</Button>
            <Button variant="outline" size="sm" onClick={() => handlePreset('precise')}>Precise</Button>
            <Button variant="outline" size="sm" onClick={() => handlePreset('loose')}>Loose</Button>
        </div>
      </div>
      
      <Separator />

      <div className="space-y-4">
        <div className="flex justify-around items-end h-64">
            {SETTINGS_CONFIG.map(config => (
                <VerticalSettingSlider
                    key={config.id}
                    id={config.id}
                    label={config.label}
                    icon={config.icon}
                    value={settings[config.id] as number}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    unit={config.unit}
                    description={config.description}
                    isEnabled={settings[`${config.id}Enabled`]}
                    onToggle={() => onSettingsChange({ [`${config.id}Enabled`]: !settings[`${config.id}Enabled`] })}
                    onValueChange={(value) => onSettingsChange({ [config.id]: value })}
                />
            ))}
        </div>
      </div>
      </TooltipProvider>

       <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>How to use</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Click on the image to start your path and add points.</li>
            <li>Use the sliders and toggles to configure the intelligent pathfinding.</li>
            <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd> or Double-Click to complete the selection.</li>
            <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> to cancel.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}

interface VerticalSettingSliderProps {
    id: string;
    label: string;
    icon: React.ElementType;
    value: number;
    min: number; max: number; step: number;
    unit?: string;
    description: string;
    isEnabled: boolean;
    onToggle: () => void;
    onValueChange: (value: number) => void;
}

function VerticalSettingSlider({ id, label, icon: Icon, value, min, max, step, unit, description, isEnabled, onToggle, onValueChange }: VerticalSettingSliderProps) {
    const displayValue = Number.isInteger(step) ? value.toFixed(0) : value.toFixed(2);
    
    return (
        <div className="flex flex-col items-center justify-between gap-2 h-full">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-mono w-10 text-center">{displayValue}{unit}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
            
            <Slider
                id={id}
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={(v) => onValueChange(v[0])}
                orientation="vertical"
                className="h-full"
                disabled={!isEnabled}
            />
             <div className="flex flex-col items-center gap-2">
                <Switch
                    id={`${id}-toggle`}
                    checked={isEnabled}
                    onCheckedChange={onToggle}
                    orientation="vertical"
                />
                 <Popover>
                    <PopoverTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors mt-2" />
                    </PopoverTrigger>
                    <PopoverContent side="top" className="text-sm">
                        <h4 className="font-semibold mb-2">{label}</h4>
                        <p>{description}</p>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
