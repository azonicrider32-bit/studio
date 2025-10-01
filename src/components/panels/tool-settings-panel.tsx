

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
  Info,
  Wand2,
  GitCommit,
  PenTool,
  ChevronDown,
} from "lucide-react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { MagicWandSettings, LassoSettings } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"

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
  
    const DRAW_MODES: { id: LassoSettings['drawMode']; label: string; icon: React.ElementType; description: string}[] = [
        { id: 'magic', label: 'Magic Snap', icon: Sparkles, description: 'Path snaps to detected edges as you draw.' },
        { id: 'polygon', label: 'Polygon', icon: GitCommit, description: 'Create straight lines between clicked points.' },
        { id: 'free', label: 'Free Draw', icon: PenTool, description: 'Follows your cursor movement exactly.' },
    ];
    const currentMode = DRAW_MODES.find(m => m.id === lassoSettings.drawMode);

  const LassoSliderSetting = ({
    settingKey,
    label,
    max,
    step,
  }: {
    settingKey: keyof LassoSettings;
    label: string;
    max: number;
    step: number;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={`${settingKey}-slider`} className="text-xs">{label}: {(lassoSettings[settingKey] as number).toFixed(2)}</Label>
        <Switch
          id={`${settingKey}-toggle`}
          size="sm"
          checked={lassoSettings[`${settingKey}Enabled` as keyof LassoSettings] as boolean}
          onCheckedChange={(checked) => onLassoSettingsChange({ [`${settingKey}Enabled`]: checked } as Partial<LassoSettings>)}
        />
      </div>
      <Slider
        id={`${settingKey}-slider`}
        min={0}
        max={max}
        step={step}
        value={[lassoSettings[settingKey] as number]}
        onValueChange={(value) => onLassoSettingsChange({ [settingKey]: value[0] } as Partial<LassoSettings>)}
        disabled={!(lassoSettings[`${settingKey}Enabled` as keyof LassoSettings] as boolean)}
      />
    </div>
  );


  return (
    <div className="p-2 space-y-4">
      <div className="space-y-1 px-2">
        <h3 className="font-headline text-base flex items-center gap-2">
            {isWand ? <Sparkles className="w-4 h-4"/> : <Lasso className="w-4 h-4"/>}
            Tool Settings
        </h3>
      </div>
      <Separator />

      {isWand ? (
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
            <div className="space-y-4 px-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-masks" className="flex items-center gap-2"><Palette className="w-4 h-4" />Show All Masks</Label>
                    <Switch
                        id="show-masks"
                        checked={magicWandSettings.showAllMasks}
                        onCheckedChange={(v) => onMagicWandSettingsChange({ showAllMasks: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="ignore-segments" className="flex items-center gap-2"><EyeOff className="w-4 h-4"/>Ignore Segments</Label>
                    <Switch
                        id="ignore-segments"
                        checked={magicWandSettings.ignoreExistingSegments}
                        onCheckedChange={(v) => onMagicWandSettingsChange({ ignoreExistingSegments: v })}
                    />
                </div>
            </div>
            <Separator />
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
        </>
      ) : (
        <div className="space-y-6 px-2">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label htmlFor="draw-mode">Draw Mode</Label>
                    <Popover>
                        <PopoverTrigger>
                            <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </PopoverTrigger>
                        <PopoverContent side="right" className="text-sm">
                            <h4 className="font-semibold mb-2">Switching Modes</h4>
                            <p>You can quickly switch between draw modes while using the lasso tool on the canvas by using the mouse scroll wheel.</p>
                        </PopoverContent>
                    </Popover>
                </div>
                <Select value={lassoSettings.drawMode} onValueChange={(value: LassoSettings['drawMode']) => onLassoSettingsChange({ drawMode: value })}>
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
            
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="useAiEnhancement" className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-primary" />AI Enhancement</Label>
                    <Switch
                        id="useAiEnhancement"
                        checked={lassoSettings.useAiEnhancement}
                        onCheckedChange={(checked) => onLassoSettingsChange({ useAiEnhancement: checked })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="showMouseTrace" className="flex items-center gap-2"><Paintbrush className="w-4 h-4" />Show Mouse Trace</Label>
                    <Switch
                        id="showMouseTrace"
                        checked={lassoSettings.showMouseTrace}
                        onCheckedChange={(checked) => onLassoSettingsChange({ showMouseTrace: checked })}
                        disabled={lassoSettings.drawMode !== 'magic'}
                    />
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="show-masks" className="flex items-center gap-2"><Palette className="w-4 h-4" />Show All Masks</Label>
                    <Switch
                        id="show-masks"
                        checked={lassoSettings.showAllMasks}
                        onCheckedChange={(v) => onLassoSettingsChange({ showAllMasks: v })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Presets (Magic Snap)</Label>
                <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => {}}>Default</Button>
                    <Button variant="outline" size="sm" onClick={() => {}}>Precise</Button>
                    <Button variant="outline" size="sm" onClick={() => {}}>Loose</Button>
                </div>
            </div>
            
            {lassoSettings.drawMode === 'magic' && (
              <Accordion type="single" collapsible>
                <AccordionItem value="advanced-settings">
                  <AccordionTrigger>Advanced Magic Snap Settings</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <LassoSliderSetting settingKey="snapRadius" label="Snap Radius" max={50} step={1} />
                    <LassoSliderSetting settingKey="snapThreshold" label="Snap Threshold" max={1} step={0.05} />
                    <LassoSliderSetting settingKey="curveStrength" label="Curve Strength" max={1} step={0.01} />
                    <LassoSliderSetting settingKey="directionalStrength" label="Directional Strength" max={1} step={0.05} />
                    <LassoSliderSetting settingKey="cursorInfluence" label="Cursor Influence" max={1} step={0.05} />
                    <LassoSliderSetting settingKey="traceInfluence" label="Trace Influence" max={1} step={0.05} />
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="useColorAwareness" className="flex items-center gap-2">
                          <Palette className="w-4 h-4"/> Color Awareness
                        </Label>
                        <Switch
                          id="useColorAwareness"
                          checked={lassoSettings.useColorAwareness}
                          onCheckedChange={(checked) => onLassoSettingsChange({ useColorAwareness: checked })}
                        />
                      </div>
                      <Slider
                        id="colorInfluence-slider"
                        min={0}
                        max={1}
                        step={0.05}
                        value={[lassoSettings.colorInfluence]}
                        onValueChange={(value) => onLassoSettingsChange({ colorInfluence: value[0] })}
                        disabled={!lassoSettings.useColorAwareness}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

        </div>
      )}
    </div>
  )
}
