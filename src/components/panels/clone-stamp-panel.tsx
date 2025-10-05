
"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Replace, Layers, Copy, RotateCcw, FlipHorizontal, FlipVertical } from "lucide-react"
import { CloneStampSettings } from "@/lib/types"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

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

  return (
    <div className="p-4 space-y-6">
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

      <div className="space-y-4">
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
    </div>
  )
}
