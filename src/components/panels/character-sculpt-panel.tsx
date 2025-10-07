
"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button"
import { Smile, Wand2 } from "lucide-react"
import { CharacterSculptSettings } from "@/lib/types"

interface CharacterSculptPanelProps {
  settings: CharacterSculptSettings;
  onSettingsChange: (settings: Partial<CharacterSculptSettings>) => void;
  onApply: (prompt: string) => void;
  isGenerating: boolean;
}

export function CharacterSculptPanel({
  settings,
  onSettingsChange,
  onApply,
  isGenerating
}: CharacterSculptPanelProps) {

  const generateMorphPrompt = () => {
    const changes: string[] = [];
    if (settings.foreheadHeight !== 0) {
      changes.push(`${settings.foreheadHeight > 0 ? 'increase' : 'decrease'} forehead by ${Math.abs(settings.foreheadHeight)}%`);
    }
    if (settings.nosePosition !== 0) {
      changes.push(`${settings.nosePosition > 0 ? 'lower' : 'raise'} nose by ${Math.abs(settings.nosePosition)}%`);
    }
    if (settings.eyeWidth !== 0) {
      changes.push(`${settings.eyeWidth > 0 ? 'widen' : 'narrow'} eyes by ${Math.abs(settings.eyeWidth)}%`);
    }
    if (settings.eyeSpacing !== 0) {
      changes.push(`${settings.eyeSpacing > 0 ? 'move eyes apart' : 'move eyes closer'} by ${Math.abs(settings.eyeSpacing)}%`);
    }
    
    if (changes.length === 0) {
        return "Make minor adjustments to the selected face to enhance its features slightly.";
    }

    return `Modify the face in the selected area: ${changes.join(', ')}. Preserve identity, skin texture, lighting, and realistic anatomy. High detail, photorealistic.`;
  };

  const handleApplyClick = () => {
    const prompt = generateMorphPrompt();
    onApply(prompt);
  };
  
  const handleReset = () => {
    onSettingsChange({
        foreheadHeight: 0,
        nosePosition: 0,
        eyeWidth: 0,
        eyeSpacing: 0,
    })
  }

  const SliderControl = ({
    label,
    value,
    onValueChange,
  }: {
    label: string,
    value: number,
    onValueChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={label} className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">{value.toFixed(0)}%</span>
      </Label>
      <Slider
        id={label}
        value={[value]}
        onValueChange={([val]) => onValueChange(val)}
        min={-50}
        max={50}
        step={1}
      />
    </div>
  )


  return (
    <div className="p-4 space-y-4 flex flex-col h-full">
      <div className="space-y-2">
        <h3 className="font-headline text-lg flex items-center gap-2">
            <Smile className="w-5 h-5"/>
            Character Sculpt
        </h3>
        <p className="text-sm text-muted-foreground">
          Use sliders to morph facial features with AI precision.
        </p>
      </div>
      <Separator />

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <SliderControl 
          label="Forehead Height"
          value={settings.foreheadHeight}
          onValueChange={(val) => onSettingsChange({ foreheadHeight: val })}
        />
        <SliderControl 
          label="Nose Position"
          value={settings.nosePosition}
          onValueChange={(val) => onSettingsChange({ nosePosition: val })}
        />
        <SliderControl 
          label="Eye Width"
          value={settings.eyeWidth}
          onValueChange={(val) => onSettingsChange({ eyeWidth: val })}
        />
        <SliderControl 
          label="Eye Spacing"
          value={settings.eyeSpacing}
          onValueChange={(val) => onSettingsChange({ eyeSpacing: val })}
        />
      </div>

       <Separator />
       <div className="space-y-2">
        <Button onClick={handleApplyClick} disabled={isGenerating} className="w-full">
            <Wand2 className="w-4 h-4 mr-2"/>
            {isGenerating ? 'Applying...' : 'Apply Morph'}
        </Button>
         <Button onClick={handleReset} variant="outline" className="w-full">
            Reset Sliders
        </Button>
       </div>
    </div>
  )
}
