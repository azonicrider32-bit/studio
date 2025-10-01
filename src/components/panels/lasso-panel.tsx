

"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Terminal, Radius, Waves, Spline, TrendingUp, MousePointerClick, Info, Wand2, Footprints, Palette, PenTool, GitCommit, Sparkles, Eye, ChevronDown } from "lucide-react";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { LassoSettings, Layer } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { LassoHoverPreview } from "../lasso-hover-preview";
import { SelectionEngine } from "@/lib/selection-engine";


interface LassoPanelProps {
  settings: LassoSettings;
  onSettingsChange: (settings: Partial<LassoSettings>) => void;
  canvas: HTMLCanvasElement | null;
  mousePos: { x: number; y: number } | null;
  selectionEngine: SelectionEngine | null;
  onHoverChange: (isHovered: boolean) => void;
}


export function LassoPanel({ settings, onSettingsChange, canvas, mousePos, selectionEngine, onHoverChange }: LassoPanelProps) {
    
  const handleToggle = (setting: keyof LassoSettings) => {
    onSettingsChange({ [setting]: !settings[setting] });
  };

  const handlePreset = (preset: 'default' | 'precise' | 'loose') => {
    let newSettings: Partial<LassoSettings>;
    switch (preset) {
      case 'precise':
        newSettings = {
          snapRadius: 5,
          snapThreshold: 0.7,
          curveStrength: 0.1,
          directionalStrength: 0.8,
          cursorInfluence: 0.1,
          traceInfluence: 0.05,
          colorInfluence: 0,
          directionalStrengthEnabled: true,
          colorInfluenceEnabled: false,
        };
        break;
      case 'loose':
        newSettings = {
          snapRadius: 40,
          snapThreshold: 0.2,
          curveStrength: 0.8,
          directionalStrength: 0.1,
          cursorInfluence: 0.8,
          traceInfluence: 0.5,
          colorInfluence: 0.5,
          directionalStrengthEnabled: true,
          colorInfluenceEnabled: true,
        };
        break;
      default: // default
        newSettings = {
          snapRadius: 20,
          snapThreshold: 0.3,
          curveStrength: 0.05,
          directionalStrength: 0.2,
          cursorInfluence: 0.1,
          traceInfluence: 0.2,
          colorInfluence: 0.25,
          directionalStrengthEnabled: false,
          colorInfluenceEnabled: true,
        };
        break;
    }
    onSettingsChange(newSettings);
  };

  const DRAW_MODES: { id: LassoSettings['drawMode']; label: string; icon: React.ElementType; description: string}[] = [
    { id: 'magic', label: 'Magic Snap', icon: Sparkles, description: 'Path snaps to detected edges as you draw.' },
    { id: 'polygon', label: 'Polygon', icon: GitCommit, description: 'Create straight lines between clicked points.' },
    { id: 'free', label: 'Free Draw', icon: PenTool, description: 'Follows your cursor movement exactly.' },
  ];

  const currentMode = DRAW_MODES.find(m => m.id === settings.drawMode);


  const SETTINGS_CONFIG: { id: keyof Omit<LassoSettings, 'useAiEnhancement' | `${string}Enabled` | 'drawMode' | 'showMouseTrace' | 'useColorAwareness' | 'showAllMasks'>; label: string; icon: React.ElementType; min: number; max: number; step: number; unit?: string; description: string; }[] = [
    { id: 'snapRadius', label: 'Snap Radius', icon: Radius, min: 1, max: 40, step: 1, unit: 'px', description: 'How far the tool looks for an edge to snap to.' },
    { id: 'snapThreshold', label: 'Edge Sensitivity', icon: Waves, min: 0.05, max: 1, step: 0.05, description: 'How strong an edge must be to be considered. Lower is more sensitive.' },
    { id: 'curveStrength', label: 'Smoothness', icon: Spline, min: 0, max: 1, step: 0.05, description: 'Higher values create smoother, more curved lines.' },
    { id: 'directionalStrength', label: 'Directional Strength', icon: TrendingUp, min: 0, max: 1, step: 0.05, description: 'How strongly the path maintains its direction. Higher values resist deviation.' },
    { id: 'cursorInfluence', label: 'Cursor Influence', icon: MousePointerClick, min: 0, max: 1, step: 0.05, description: 'How strongly the path is pulled towards the cursor. Higher is stronger.' },
    { id: 'traceInfluence', label: 'Trace Influence', icon: Footprints, min: 0, max: 1, step: 0.05, description: 'How strongly the path follows your exact mouse movement.' },
    { id: 'colorInfluence', label: 'Color Influence', icon: Palette, min: 0, max: 1, step: 0.05, description: 'How much influence color differences have on edge detection. Leverages Magic Wand tolerances.' },
  ];
  
  const HowToUseContent = () => (
     <ul className="list-disc list-inside space-y-1 mt-2 text-left p-2">
        <li>Click on the image to start your path and add points.</li>
        <li>Use the sliders and toggles to configure the intelligent pathfinding.</li>
        <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd> or Double-Click to complete the selection.</li>
        <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> to cancel.</li>
      </ul>
  );

  return (
    <div className="p-4 space-y-6">
       <TooltipProvider>
        <LassoHoverPreview 
            canvas={canvas} 
            mousePos={mousePos} 
            selectionEngine={selectionEngine} 
            onHoverChange={onHoverChange}
        />
        
        <div className={cn("space-y-4 pt-4", settings.drawMode !== 'magic' && 'opacity-50 pointer-events-none')}>
          <div className="flex justify-around items-end h-64">
              {SETTINGS_CONFIG.map(config => (
                  <VerticalSettingSlider
                      key={config.id}
                      id={config.id}
                      label={config.label}
                      icon={config.icon}
                      value={settings[config.id as keyof typeof settings] as number}
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      unit={config.unit}
                      description={config.description}
                      isEnabled={settings[`${config.id}Enabled` as keyof typeof settings] as boolean}
                      onToggle={() => onSettingsChange({ [`${config.id}Enabled`]: !settings[`${config.id}Enabled` as keyof typeof settings] } as Partial<LassoSettings>)}
                      onValueChange={(value) => onSettingsChange({ [config.id]: value } as Partial<LassoSettings>)}
                  />
              ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
             <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label htmlFor="draw-mode">Draw Mode</Label>
                    <Popover>
                        <PopoverTrigger>
                            <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </PopoverTrigger>
                        <PopoverContent side="top" className="text-sm">
                            <h4 className="font-semibold mb-2">Switching Modes</h4>
                            <p>You can quickly switch between draw modes while using the lasso tool on the canvas by using the mouse scroll wheel.</p>
                        </PopoverContent>
                    </Popover>
                </div>
                 <Select value={settings.drawMode} onValueChange={(value: LassoSettings['drawMode']) => onSettingsChange({ drawMode: value })}>
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
        </div>

        <div className="space-y-4">
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
                          <p>Use AI to enhance the final selection path upon completion.</p>
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

          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Label htmlFor="showMouseTrace" className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Show Mouse Trace
                          </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>Makes the path of your cursor visible on the canvas as you draw.</p>
                      </TooltipContent>
                  </Tooltip>
                  <Popover>
                      <PopoverTrigger>
                          <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                      </PopoverTrigger>
                      <PopoverContent side="top" className="text-sm">
                          <h4 className="font-semibold mb-2">Show Mouse Trace</h4>
                          <p>Displays a semi-transparent line that follows your exact mouse movements. This visual guide helps you understand how the 'Trace Influence' setting is pulling the snapped path towards your drawn gesture.</p>
                      </PopoverContent>
                  </Popover>
              </div>
              <Switch
                  id="showMouseTrace"
                  checked={settings.showMouseTrace}
                  onCheckedChange={(checked) => onSettingsChange({ showMouseTrace: checked })}
                  disabled={settings.drawMode !== 'magic'}
              />
          </div>
           <div className="flex items-center justify-between">
                <Label htmlFor="show-masks" className="flex items-center gap-2"><Palette className="w-4 h-4" />Show All Masks</Label>
                <Switch
                    id="show-masks"
                    checked={settings.showAllMasks}
                    onCheckedChange={(v) => onSettingsChange({ showAllMasks: v })}
                />
            </div>
        </div>
      
        <div className={cn("space-y-2", settings.drawMode !== 'magic' && 'opacity-50 pointer-events-none')}>
          <Label>Presets (Magic Snap)</Label>
          <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePreset('default')}>Default</Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset('precise')}>Precise</Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset('loose')}>Loose</Button>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full border-t pt-4">
          <AccordionItem value="how-to-use" className="border-b-0">
             <Tooltip>
                <TooltipTrigger asChild>
                    <AccordionTrigger className="py-2 hover:no-underline">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Terminal className="h-4 w-4" />
                            How to use
                        </div>
                    </AccordionTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                    <HowToUseContent />
                </TooltipContent>
             </Tooltip>
            <AccordionContent>
                <HowToUseContent />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
      </TooltipProvider>

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



    

    

    
