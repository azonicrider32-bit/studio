
"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Replace, Layers, Copy, RotateCcw, FlipHorizontal, FlipVertical, HelpCircle, Blend } from "lucide-react"
import { CloneStampSettings, MagicWandSettings } from "@/lib/types"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

interface CloneStampPanelProps {
  settings: CloneStampSettings;
  onSettingsChange: (settings: Partial<CloneStampSettings>) => void;
}

export function CloneStampPanel({ settings, onSettingsChange }: CloneStampPanelProps) {

  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAngle = parseInt(e.target.value, 10);
    if (!isNaN(newAngle)) {
        onSettingsChange({ angle: (newAngle % 360 + 360) % 360 });
    }
  }
  
  const handleToggleTolerance = (key: keyof MagicWandSettings['tolerances']) => {
    const newEnabledTolerances = new Set(settings.tolerances.enabled);
    if (newEnabledTolerances.has(key)) {
      newEnabledTolerances.delete(key);
    } else {
      newEnabledTolerances.add(key);
    }
    onSettingsChange({ tolerances: { ...settings.tolerances, enabled: newEnabledTolerances } });
  };
  
  const handleToleranceValueChange = (key: keyof MagicWandSettings['tolerances'], value: number) => {
     onSettingsChange({ tolerances: { ...settings.tolerances, values: { ...settings.tolerances.values, [key]: value } } });
  }

  return (
    <div className="p-4 space-y-4 flex flex-col h-full">
      <div className="space-y-2">
        <h3 className="font-headline text-lg flex items-center gap-2">
            <Replace className="w-5 h-5"/>
            Clone Stamp Tool
        </h3>
        <p className="text-sm text-muted-foreground">
          Paint with pixels from another part of the image.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4 no-scrollbar">
          <div className="space-y-2">
            <Label htmlFor="brush-size">Brush Size: {settings.brushSize}px</Label>
            <Slider
              id="brush-size"
              min={1}
              max={500}
              step={1}
              value={[settings.brushSize]}
              onValueChange={(value) => onSettingsChange({ brushSize: value[0] })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opacity">Opacity: {settings.opacity}%</Label>
            <Slider
              id="opacity"
              min={0}
              max={100}
              step={1}
              value={[settings.opacity]}
              onValueChange={(value) => onSettingsChange({ opacity: value[0] })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="softness">Edge Softness: {settings.softness}%</Label>
            <Slider
              id="softness"
              min={0}
              max={100}
              step={1}
              value={[settings.softness]}
              onValueChange={(value) => onSettingsChange({ softness: value[0] })}
            />
          </div>
          
          <Separator />
        
          <div className="space-y-4">
              <h4 className="font-semibold text-sm">Rotation</h4>
              <div className="space-y-2">
                <Label htmlFor="rotation-step">Scroll Step: {settings.rotationStep}°</Label>
                <Slider
                    id="rotation-step"
                    min={1}
                    max={45}
                    step={1}
                    value={[settings.rotationStep]}
                    onValueChange={(value) => onSettingsChange({ rotationStep: value[0] })}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Input
                        type="number"
                        value={settings.angle}
                        onChange={handleAngleChange}
                        className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">°</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onSettingsChange({ angle: 0 })}>
                          <RotateCcw className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset Rotation</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => onSettingsChange({ flipX: !settings.flipX })} data-state={settings.flipX ? 'on' : 'off'} className="data-[state=on]:bg-accent">
                            <FlipHorizontal className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Flip Horizontal</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => onSettingsChange({ flipY: !settings.flipY })} data-state={settings.flipY ? 'on' : 'off'} className="data-[state=on]:bg-accent">
                            <FlipVertical className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Flip Vertical</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Source Layer</Label>
            <div className="grid grid-cols-2 gap-2">
                <Button 
                    variant={settings.sourceLayer === 'current' ? 'default' : 'outline'}
                    onClick={() => onSettingsChange({ sourceLayer: 'current' })}
                >
                    <Copy className="w-4 h-4 mr-2"/>
                    Current
                </Button>
                <Button 
                    variant={settings.sourceLayer === 'all' ? 'default' : 'outline'}
                    onClick={() => onSettingsChange({ sourceLayer: 'all' })}
                >
                    <Layers className="w-4 h-4 mr-2"/>
                    All Layers
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">Choose whether to sample pixels from only the active layer or all visible layers combined.</p>
          </div>
        </TabsContent>
        <TabsContent value="advanced" className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4 no-scrollbar">
            <div className="space-y-2">
              <Label htmlFor="blend-mode">Target Tones</Label>
              <Select value={settings.blendMode} onValueChange={(v) => onSettingsChange({blendMode: v as any})}>
                <SelectTrigger id="blend-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="lights">Lights Only</SelectItem>
                  <SelectItem value="mids">Mid-tones Only</SelectItem>
                  <SelectItem value="darks">Darks Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="advanced-blending" className="flex items-center gap-2">Advanced Blending</Label>
              <Switch
                id="advanced-blending"
                checked={settings.useAdvancedBlending}
                onCheckedChange={(checked) => onSettingsChange({ useAdvancedBlending: checked })}
              />
            </div>

            {settings.useAdvancedBlending && (
              <div className="p-4 border rounded-lg space-y-4">
                  <div className="space-y-2">
                    <Label>Enabled Tolerances:</Label>
                    <div className="flex flex-wrap gap-1">
                      {['r','g','b','h','s','v','l','a','b_lab'].map(key => (
                        <Button key={key} size="sm" variant={settings.tolerances.enabled.has(key as any) ? 'secondary' : 'outline'} onClick={() => handleToggleTolerance(key as any)} className="h-6 text-xs px-2">
                          {key.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Separator/>
                  <div className="space-y-2">
                    <Label htmlFor="falloff">Tolerance Falloff: {settings.falloff}%</Label>
                    <Slider
                      id="falloff"
                      min={0} max={100} step={1}
                      value={[settings.falloff]}
                      onValueChange={(v) => onSettingsChange({ falloff: v[0]})}
                    />
                  </div>
              </div>
            )}
        </TabsContent>
      </Tabs>
        
      <Separator />

      <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
          <h4 className="font-semibold text-sm flex items-center gap-2"><HelpCircle className="w-4 h-4"/>How It Works</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><span className="font-bold">Alt + Click:</span> Set the source point to clone from.</li>
              <li><span className="font-bold">Scroll Wheel:</span> Adjusts angle.</li>
              <li><span className="font-bold">Shift + Scroll:</span> Adjusts brush size.</li>
              <li><span className="font-bold">Ctrl + Scroll:</span> Adjusts edge softness.</li>
              <li><span className="font-bold">Alt + Scroll:</span> Adjusts opacity.</li>
              <li><span className="font-bold">Click + Drag:</span> Paint with the cloned pixels.</li>
          </ul>
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  )
}
