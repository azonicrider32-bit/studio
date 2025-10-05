
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { TransformSettings } from "@/lib/types"
import { Button } from "../ui/button"
import { RotateCcw, Link, Link2Off, Layers, Eye, Globe } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface TransformPanelProps {
  settings: TransformSettings
  onSettingsChange: (settings: Partial<TransformSettings>) => void
}

export function TransformPanel({ settings, onSettingsChange }: TransformPanelProps) {

  const handleInputChange = (key: keyof TransformSettings, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onSettingsChange({ [key]: numValue });
    }
  };
  
  const handleScaleChange = (key: 'scaleX' | 'scaleY', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
        if(settings.maintainAspectRatio) {
            const oldValue = settings[key];
            if(oldValue === 0) return;
            const ratio = numValue / oldValue;
            const otherKey = key === 'scaleX' ? 'scaleY' : 'scaleX';
            const otherValue = settings[otherKey] * ratio;
            onSettingsChange({ [key]: numValue, [otherKey]: otherValue });
        } else {
             onSettingsChange({ [key]: numValue });
        }
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Scope</Label>
        <ToggleGroup 
          type="single" 
          value={settings.scope} 
          onValueChange={(value: TransformSettings['scope']) => value && onSettingsChange({ scope: value })}
          className="w-full grid grid-cols-3"
        >
          <ToggleGroupItem value="layer" aria-label="Current Layer">
            <Layers className="h-4 w-4 mr-2"/>
            Layer
          </ToggleGroupItem>
          <ToggleGroupItem value="visible" aria-label="Visible Layers">
            <Eye className="h-4 w-4 mr-2"/>
            Visible
          </ToggleGroupItem>
          <ToggleGroupItem value="all" aria-label="All Layers">
            <Globe className="h-4 w-4 mr-2"/>
            All
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <Separator/>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pos-x">Position X</Label>
          <Input id="pos-x" type="number" value={settings.x.toFixed(2)} onChange={(e) => handleInputChange('x', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pos-y">Position Y</Label>
          <Input id="pos-y" type="number" value={settings.y.toFixed(2)} onChange={(e) => handleInputChange('y', e.target.value)} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="scale-w">Scale W (%)</Label>
          <Input id="scale-w" type="number" value={settings.scaleX.toFixed(2)} onChange={(e) => handleScaleChange('scaleX', e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
            <div className="space-y-2 flex-1">
              <Label htmlFor="scale-h">Scale H (%)</Label>
              <Input id="scale-h" type="number" value={settings.scaleY.toFixed(2)} onChange={(e) => handleScaleChange('scaleY', e.target.value)} />
            </div>
            <Button 
                variant={settings.maintainAspectRatio ? "secondary" : "outline"} 
                size="icon" 
                className="h-10 w-10 mb-px"
                onClick={() => onSettingsChange({ maintainAspectRatio: !settings.maintainAspectRatio })}
            >
              {settings.maintainAspectRatio ? <Link className="h-4 w-4"/> : <Link2Off className="h-4 w-4"/>}
            </Button>
        </div>
      </div>
      
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rotation">Rotation (°)</Label>
          <Input id="rotation" type="number" value={settings.rotation.toFixed(2)} onChange={(e) => handleInputChange('rotation', e.target.value)} />
        </div>
      </div>
      
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="skew-x">Skew X (°)</Label>
          <Input id="skew-x" type="number" value={settings.skewX.toFixed(2)} onChange={(e) => handleInputChange('skewX', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skew-y">Skew Y (°)</Label>
          <Input id="skew-y" type="number" value={settings.skewY.toFixed(2)} onChange={(e) => handleInputChange('skewY', e.target.value)} />
        </div>
      </div>
      
      <Separator />

      <div className="flex gap-2">
        <Button variant="outline" className="w-full" onClick={() => onSettingsChange({ x:0, y:0, scaleX:100, scaleY:100, rotation:0, skewX:0, skewY:0 })}>
            <RotateCcw className="h-4 w-4 mr-2"/>
            Reset All
        </Button>
      </div>

    </div>
  )
}
