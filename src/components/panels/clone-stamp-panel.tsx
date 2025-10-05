
"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Replace, Layers, Copy } from "lucide-react"
import { CloneStampSettings } from "@/lib/types"
import { Button } from "../ui/button"

interface CloneStampPanelProps {
  settings: CloneStampSettings;
  onSettingsChange: (settings: Partial<CloneStampSettings>) => void;
}

export function CloneStampPanel({ settings, onSettingsChange }: CloneStampPanelProps) {

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
        
        <div className="space-y-2">
          <Label htmlFor="rotation-step">Rotation Step: {settings.rotationStep}°</Label>
          <Slider
            id="rotation-step"
            min={1}
            max={45}
            step={1}
            value={[settings.rotationStep]}
            onValueChange={(value) => onSettingsChange({ rotationStep: value[0] })}
          />
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
