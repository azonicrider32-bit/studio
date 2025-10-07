
"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button"
import { Smile, Wand2 } from "lucide-react"
import { CharacterSculptSettings } from "@/lib/types"
import { executeCustomTool } from "@/ai/flows/custom-tool-flow"
import { useToast } from "@/hooks/use-toast"
import { handleApiError } from "@/lib/error-handling"

interface CharacterSculptPanelProps {
  settings: CharacterSculptSettings;
  onSettingsChange: (settings: Partial<CharacterSculptSettings>) => void;
  onApply: (prompt: string, overlayUri?: string) => void;
  isGenerating: boolean;
  imageUrl: string | undefined;
  selectionMaskUri: string | undefined;
}

export function CharacterSculptPanel({
  settings,
  onSettingsChange,
  onApply,
  isGenerating,
  imageUrl,
  selectionMaskUri,
}: CharacterSculptPanelProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
        canvas.width = 256;
        canvas.height = 256;
        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(img, 0, 0, 256, 256);

        // Draw overlays based on settings
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.lineWidth = 1;
        ctx.font = '10px sans-serif';

        // Example: Forehead height overlay
        if (settings.foreheadHeight !== 0) {
            const y = 64 - settings.foreheadHeight * 0.5;
            ctx.beginPath();
            ctx.moveTo(80, y);
            ctx.lineTo(176, y);
            ctx.stroke();
            ctx.fillText(`${settings.foreheadHeight > 0 ? '+' : ''}${settings.foreheadHeight.toFixed(0)}%`, 180, y + 4);
        }

        // Example: Eye spacing overlay
        if (settings.eyeSpacing !== 0) {
            const spacing = 40 + settings.eyeSpacing * 0.2;
            const leftEyeX = 128 - spacing;
            const rightEyeX = 128 + spacing;
            ctx.beginPath();
            ctx.moveTo(leftEyeX, 128);
            ctx.lineTo(leftEyeX - 5, 128 - 5);
            ctx.moveTo(leftEyeX, 128);
            ctx.lineTo(leftEyeX - 5, 128 + 5);
            ctx.moveTo(rightEyeX, 128);
            ctx.lineTo(rightEyeX + 5, 128 - 5);
            ctx.moveTo(rightEyeX, 128);
            ctx.lineTo(rightEyeX + 5, 128 + 5);
            ctx.stroke();
        }
    };
  }, [settings, imageUrl]);

  const generateMorphPrompt = () => {
    const changes: string[] = [];
    if (settings.foreheadHeight !== 0) changes.push(`${settings.foreheadHeight > 0 ? 'increase' : 'decrease'} forehead height by ${Math.abs(settings.foreheadHeight)}%`);
    if (settings.nosePosition !== 0) changes.push(`${settings.nosePosition > 0 ? 'lower' : 'raise'} nose by ${Math.abs(settings.nosePosition)}%`);
    if (settings.eyeWidth !== 0) changes.push(`${settings.eyeWidth > 0 ? 'widen' : 'narrow'} eyes by ${Math.abs(settings.eyeWidth)}%`);
    if (settings.eyeSpacing !== 0) changes.push(`${settings.eyeSpacing > 0 ? 'increase' : 'decrease'} eye spacing by ${Math.abs(settings.eyeSpacing)}%`);
    
    if (changes.length === 0) {
        return "Slightly enhance the facial features in the selected area, preserving identity and photorealism.";
    }

    return `Modify the face in the masked area according to the visual overlay and these instructions: ${changes.join(', ')}. Preserve identity, skin texture, lighting, and realistic anatomy. High detail, photorealistic.`;
  };

  const handleApplyClick = async () => {
    if (!imageUrl || !selectionMaskUri) {
        toast({ title: "Error", description: "An image and a selection are required.", variant: "destructive"});
        return;
    }
    
    const prompt = generateMorphPrompt();
    const overlayUri = canvasRef.current?.toDataURL();

    if (!overlayUri) {
         toast({ title: "Error", description: "Could not generate overlay.", variant: "destructive"});
        return;
    }
    
    onApply(prompt, overlayUri);
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
        <div className="aspect-square w-full bg-muted rounded-md border overflow-hidden">
            <canvas ref={canvasRef} />
        </div>

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
