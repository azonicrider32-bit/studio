"use client"

import * as React from "react"
import { Feather, Wind, Droplets, Blend } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { FeatherSettings } from "@/lib/types"

interface FeatherPanelProps {
  settings: FeatherSettings;
  onSettingsChange: (settings: Partial<FeatherSettings>) => void;
}

export function FeatherPanel({ settings, onSettingsChange }: FeatherPanelProps) {

  const handlePreset = (preset: 'fast' | 'balanced' | 'professional') => {
    let newSettings: FeatherSettings;
    switch(preset) {
        case 'fast':
            newSettings = {
                antiAlias: { enabled: true, method: 'smooth', quality: 'fast' },
                smartFeather: { enabled: false, alphaMatting: { enabled: false, method: 'closed-form', quality: 0 }, backgroundAdaptation: { enabled: false, sampleRadius: 0, adaptationStrength: 0, colorThreshold: 0 }, gradientTransparency: { enabled: false, gradientRadius: 0, smoothness: 0, edgeAware: false }, colorAwareProcessing: { enabled: false, haloPreventionStrength: 0, colorContextRadius: 0 } }
            };
            break;
        case 'balanced':
            newSettings = {
                antiAlias: { enabled: true, method: 'gaussian', quality: 'balanced' },
                smartFeather: { 
                    enabled: true,
                    alphaMatting: { enabled: true, method: 'closed-form', quality: 0.85 },
                    backgroundAdaptation: { enabled: true, sampleRadius: 8, adaptationStrength: 0.6, colorThreshold: 20 },
                    gradientTransparency: { enabled: true, gradientRadius: 6, smoothness: 0.7, edgeAware: true },
                    colorAwareProcessing: { enabled: false, haloPreventionStrength: 0, colorContextRadius: 0 }
                }
            };
            break;
        case 'professional':
            newSettings = {
                antiAlias: { enabled: true, method: 'gaussian', quality: 'high' },
                smartFeather: {
                    enabled: true,
                    alphaMatting: { enabled: true, method: 'learning-based', quality: 0.98 },
                    backgroundAdaptation: { enabled: true, sampleRadius: 12, adaptationStrength: 0.9, colorThreshold: 15 },
                    gradientTransparency: { enabled: true, gradientRadius: 8, smoothness: 0.95, edgeAware: true },
                    colorAwareProcessing: { enabled: true, haloPreventionStrength: 0.9, colorContextRadius: 10 }
                }
            };
            break;
    }
    onSettingsChange(newSettings);
  };
  
  const createSubChangeHandler = <T extends keyof FeatherSettings, K extends keyof FeatherSettings[T]>(
    topLevel: T,
    subLevel: K
  ) => {
    return (value: FeatherSettings[T][K]) => {
      onSettingsChange({
        ...settings,
        [topLevel]: {
          ...settings[topLevel],
          [subLevel]: value,
        },
      });
    };
  };

  const createDeepChangeHandler = <T extends keyof FeatherSettings, K extends keyof FeatherSettings[T], D extends keyof FeatherSettings[T][K]>(
    topLevel: T,
    subLevel: K,
    deepLevel: D
  ) => {
    return (value: FeatherSettings[T][K][D]) => {
      onSettingsChange({
        ...settings,
        [topLevel]: {
          ...settings[topLevel],
          [subLevel]: {
            ...settings[topLevel][subLevel],
            [deepLevel]: value
          }
        }
      });
    };
  };

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg flex items-center gap-2"><Feather className="w-5 h-5"/>Smart Feather & Edges</h3>
        <p className="text-sm text-muted-foreground">
          Control anti-aliasing and smart feathering for professional edge quality.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Presets</Label>
        <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePreset('fast')}>Fast</Button>
            <Button variant="outline" size="sm" onClick={() => handlePreset('balanced')}>Balanced</Button>
            <Button variant="outline" size="sm" onClick={() => handlePreset('professional')}>Professional</Button>
        </div>
      </div>

      <Separator />

      <Accordion type="multiple" defaultValue={['anti-alias', 'smart-feather']} className="w-full">
        <AccordionItem value="anti-alias">
          <AccordionTrigger className="text-base font-semibold">Anti-Aliasing</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
             <div className="flex items-center justify-between">
                <Label htmlFor="aa-enabled">Enable Anti-Aliasing</Label>
                <Switch id="aa-enabled" checked={settings.antiAlias.enabled} onCheckedChange={createSubChangeHandler('antiAlias', 'enabled')} disabled />
            </div>
            <div className="space-y-2">
                <Label htmlFor="aa-method">Method</Label>
                <Select value={settings.antiAlias.method} onValueChange={createSubChangeHandler('antiAlias', 'method')}>
                    <SelectTrigger id="aa-method"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="smooth">Smooth</SelectItem>
                        <SelectItem value="gaussian">Gaussian</SelectItem>
                        <SelectItem value="bilinear">Bilinear</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="aa-quality">Quality</Label>
                <Select value={settings.antiAlias.quality} onValueChange={createSubChangeHandler('antiAlias', 'quality')}>
                    <SelectTrigger id="aa-quality"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="smart-feather">
            <div className="flex items-center">
              <AccordionTrigger className="text-base font-semibold flex-1">
                  <div className="flex items-center gap-2">
                      <Wind className="w-5 h-5"/> Smart Feather
                  </div>
              </AccordionTrigger>
              <Switch checked={settings.smartFeather.enabled} onCheckedChange={createSubChangeHandler('smartFeather', 'enabled')} />
            </div>
            <AccordionContent className="space-y-4 pt-4">
                {settings.smartFeather.enabled && (
                    <Accordion type="multiple" defaultValue={['alpha-matting']} className="w-full space-y-2">
                        {/* Alpha Matting */}
                        <AccordionItem value="alpha-matting" className="border-b-0">
                             <div className="flex items-center bg-muted/50 px-2 rounded-md">
                                <AccordionTrigger className="py-2 text-sm flex-1 hover:no-underline">
                                  <div className="flex items-center gap-2"><Blend className="w-4 h-4"/>Alpha Matting</div>
                                </AccordionTrigger>
                                <Switch size="sm" checked={settings.smartFeather.alphaMatting.enabled} onCheckedChange={createDeepChangeHandler('smartFeather', 'alphaMatting', 'enabled')} />
                             </div>
                             <AccordionContent className="space-y-4 p-4 mt-2 border rounded-md">
                                <div className="space-y-2">
                                    <Label>Method</Label>
                                    <Select value={settings.smartFeather.alphaMatting.method} onValueChange={createDeepChangeHandler('smartFeather', 'alphaMatting', 'method')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="closed-form">Closed-form</SelectItem>
                                            <SelectItem value="knn">KNN</SelectItem>
                                            <SelectItem value="learning-based">Learning-based</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Quality: {settings.smartFeather.alphaMatting.quality.toFixed(2)}</Label>
                                    <Slider min={0} max={1} step={0.01} value={[settings.smartFeather.alphaMatting.quality]} onValueChange={v => createDeepChangeHandler('smartFeather', 'alphaMatting', 'quality')(v[0])} />
                                </div>
                             </AccordionContent>
                        </AccordionItem>
                        {/* Background Adaptation */}
                         <AccordionItem value="bg-adapt" className="border-b-0">
                            <div className="flex items-center bg-muted/50 px-2 rounded-md">
                               <AccordionTrigger className="py-2 text-sm flex-1 hover:no-underline">
                                  <div className="flex items-center gap-2"><Droplets className="w-4 h-4"/>Background Adaptation</div>
                               </AccordionTrigger>
                               <Switch size="sm" checked={settings.smartFeather.backgroundAdaptation.enabled} onCheckedChange={createDeepChangeHandler('smartFeather', 'backgroundAdaptation', 'enabled')} />
                            </div>
                             <AccordionContent className="space-y-4 p-4 mt-2 border rounded-md">
                                <div className="space-y-2">
                                    <Label>Sample Radius: {settings.smartFeather.backgroundAdaptation.sampleRadius}px</Label>
                                    <Slider min={1} max={50} step={1} value={[settings.smartFeather.backgroundAdaptation.sampleRadius]} onValueChange={v => createDeepChangeHandler('smartFeather', 'backgroundAdaptation', 'sampleRadius')(v[0])} />
                                </div>
                                 <div className="space-y-2">
                                    <Label>Adaptation Strength: {settings.smartFeather.backgroundAdaptation.adaptationStrength.toFixed(2)}</Label>
                                    <Slider min={0} max={1} step={0.05} value={[settings.smartFeather.backgroundAdaptation.adaptationStrength]} onValueChange={v => createDeepChangeHandler('smartFeather', 'backgroundAdaptation', 'adaptationStrength')(v[0])} />
                                </div>
                                 <div className="space-y-2">
                                    <Label>Color Threshold: {settings.smartFeather.backgroundAdaptation.colorThreshold}</Label>
                                    <Slider min={0} max={100} step={1} value={[settings.smartFeather.backgroundAdaptation.colorThreshold]} onValueChange={v => createDeepChangeHandler('smartFeather', 'backgroundAdaptation', 'colorThreshold')(v[0])} />
                                </div>
                             </AccordionContent>
                        </AccordionItem>
                        {/* More sections for Gradient Transparency and Color-Aware Processing can be added here */}

                    </Accordion>
                )}
            </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
