
"use client"

import * as React from "react"
import {
  Link,
  Palette,
  EyeOff,
  Paintbrush,
  Layers,
  Sparkles,
  Lasso,
} from "lucide-react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { MagicWandSettings, LassoSettings } from "@/lib/types"

interface ToolSettingsPanelProps {
  magicWandSettings: MagicWandSettings
  onMagicWandSettingsChange: (settings: Partial<MagicWandSettings>) => void
  lassoSettings: LassoSettings
  onLassoSettingsChange: (settings: Partial<LassoSettings>) => void
  activeTool: 'magic-wand' | 'lasso'
}

export function ToolSettingsPanel({ 
    magicWandSettings, 
    onMagicWandSettingsChange,
    lassoSettings,
    onLassoSettingsChange,
    activeTool 
}: ToolSettingsPanelProps) {
  
  const isWand = activeTool === 'magic-wand';
  const settings = isWand ? magicWandSettings : lassoSettings;
  const onSettingsChange = isWand ? onMagicWandSettingsChange : onLassoSettingsChange;
  
  return (
    <div className="p-2 space-y-4">
      <div className="space-y-1 px-2">
        <h3 className="font-headline text-base flex items-center gap-2">
            {isWand ? <Sparkles className="w-4 h-4"/> : <Lasso className="w-4 h-4"/>}
            Tool Settings
        </h3>
      </div>
      <Separator />

      {isWand && (
        <>
            <div className="space-y-4 px-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="contiguous" className="flex items-center gap-2"><Layers className="w-4 h-4"/>Contiguous</Label>
                    <Switch
                    id="contiguous"
                    checked={magicWandSettings.contiguous}
                    onCheckedChange={(v) => onMagicWandSettingsChange({ contiguous: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="create-as-mask" className="flex items-center gap-2"><Link className="w-4 h-4" />Create as Mask</Label>
                    <Switch
                        id="create-as-mask"
                        checked={magicWandSettings.createAsMask}
                        onCheckedChange={(v) => onMagicWandSettingsChange({ createAsMask: v })}
                    />
                </div>
            </div>
            <Separator />
        </>
      )}


      <div className="space-y-4 px-2">
        <div className="flex items-center justify-between">
            <Label htmlFor="show-masks" className="flex items-center gap-2"><Palette className="w-4 h-4" />Show All Masks</Label>
            <Switch
                id="show-masks"
                checked={settings.showAllMasks}
                onCheckedChange={(v) => onSettingsChange({ showAllMasks: v })}
            />
        </div>
         <div className="flex items-center justify-between">
            <Label htmlFor="ignore-segments" className="flex items-center gap-2"><EyeOff className="w-4 h-4"/>Ignore Segments</Label>
            <Switch
                id="ignore-segments"
                checked={isWand ? magicWandSettings.ignoreExistingSegments : false}
                onCheckedChange={(v) => isWand && onMagicWandSettingsChange({ ignoreExistingSegments: v })}
                disabled={!isWand}
            />
        </div>
      </div>
      <Separator />

      {isWand && (
        <div className="space-y-4 px-2">
            <Label className="flex items-center gap-2"><Paintbrush className="w-4 h-4"/> Highlight Style</Label>
            <div className="space-y-2">
                <Label htmlFor="highlight-opacity" className="text-xs">Opacity: {magicWandSettings.highlightOpacity.toFixed(2)}</Label>
                <Slider 
                    id="highlight-opacity"
                    min={0} max={1} step={0.05}
                    value={[magicWandSettings.highlightOpacity]}
                    onValueChange={(v) => onMagicWandSettingsChange({ highlightOpacity: v[0]})}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="highlight-texture" className="text-xs">Texture</Label>
                <Select value={magicWandSettings.highlightTexture} onValueChange={(v) => onMagicWandSettingsChange({ highlightTexture: v as any })}>
                    <SelectTrigger id="highlight-texture"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="checkerboard">Checkerboard</SelectItem>
                        <SelectItem value="lines">Lines</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2">
                <Select value={magicWandSettings.highlightColorMode} onValueChange={(v) => onMagicWandSettingsChange({ highlightColorMode: v as 'fixed' | 'random'})}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="random">Random</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                </Select>
                {magicWandSettings.highlightColorMode === 'fixed' && (
                    <div className="relative h-10 flex-1">
                        <input 
                        type="color" 
                        value={magicWandSettings.fixedHighlightColor}
                        onChange={(e) => onMagicWandSettingsChange({ fixedHighlightColor: e.target.value })}
                        className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer"
                        style={{ opacity: 0 }}
                        />
                        <div 
                            className="h-full w-full rounded-md border border-input px-3 py-2"
                            style={{ backgroundColor: magicWandSettings.fixedHighlightColor }}
                        />
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  )
}
