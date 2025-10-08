
"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button"
import { Smile, Wand2, Bot, PersonStanding, Wind } from "lucide-react"
import { CharacterSculptSettings } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { handleApiError } from "@/lib/error-handling"
import { generateFacialOverlay } from "@/ai/flows/generate-facial-overlay-flow"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { executeCustomTool } from "@/ai/flows/custom-tool-flow"

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
  const [overlayImageUrl, setOverlayImageUrl] = React.useState<string | undefined>(imageUrl);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const { toast } = useToast();
  
  React.useEffect(() => {
    setOverlayImageUrl(imageUrl);
  }, [imageUrl]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !overlayImageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = overlayImageUrl;
    img.onload = () => {
        canvas.width = 256;
        canvas.height = 256;
        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(img, 0, 0, 256, 256);

        // This part is now handled by the AI, but we could add client-side previews too.
        // For now, we rely on the AI-generated overlay.
    };
  }, [settings, overlayImageUrl]);

  const generateMorphPrompt = () => {
    const changes: string[] = [];
    if (settings.foreheadHeight !== 0) changes.push(`${settings.foreheadHeight > 0 ? 'increase' : 'decrease'} forehead height by ${Math.abs(settings.foreheadHeight)}%`);
    if (settings.nosePosition !== 0) changes.push(`${settings.nosePosition > 0 ? 'lower' : 'raise'} nose by ${Math.abs(settings.nosePosition)}%`);
    if (settings.eyeWidth !== 0) changes.push(`${settings.eyeWidth > 0 ? 'widen' : 'narrow'} eyes by ${Math.abs(settings.eyeWidth)}%`);
    if (settings.eyeSpacing !== 0) changes.push(`${settings.eyeSpacing > 0 ? 'increase' : 'decrease'} eye spacing by ${Math.abs(settings.eyeSpacing)}%`);
    if (settings.waistSlim && settings.waistSlim !== 0) changes.push(`slim waist by ${Math.abs(settings.waistSlim)}%`);
    if (settings.legLength && settings.legLength !== 0) changes.push(`${settings.legLength > 0 ? 'increase' : 'decrease'} leg length by ${Math.abs(settings.legLength)}%`);
    if (settings.hairVolume && settings.hairVolume !== 0) changes.push(`${settings.hairVolume > 0 ? 'increase' : 'decrease'} hair volume by ${Math.abs(settings.hairVolume)}%`);
    if (settings.hairLength && settings.hairLength !== 0) changes.push(`${settings.hairLength > 0 ? 'increase' : 'decrease'} hair length by ${Math.abs(settings.hairLength)}%`);
    
    if (changes.length === 0) {
        return "Slightly enhance the facial features in the selected area, preserving identity and photorealism.";
    }

    return `Modify the character in the masked area according to the visual overlay and these instructions: ${changes.join(', ')}. Preserve identity, texture, lighting, and realistic anatomy. High detail, photorealistic.`;
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

  const handleGenerateOverlay = async () => {
    if (!imageUrl) {
      toast({ title: "No Image", description: "Please select an image first.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    toast({ title: "AI is analyzing...", description: "Generating facial landmarks overlay." });

    try {
      const result = await generateFacialOverlay({
        photoDataUri: imageUrl,
        overlayTemplatePrompt: "Draw a grid over the forehead, a vertical line down the nose, horizontal lines through the pupils, and lines indicating jaw width. Use bright green lines.",
      });

      if (result.error || !result.overlayImageUri) {
        throw new Error(result.error || "Failed to generate overlay.");
      }
      
      setOverlayImageUrl(result.overlayImageUri);
      toast({ title: "Analysis Complete", description: "Facial overlay has been generated." });

    } catch (error) {
      handleApiError(error, toast, { title: "Overlay Generation Failed" });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleReset = () => {
    onSettingsChange({
        foreheadHeight: 0,
        nosePosition: 0,
        eyeWidth: 0,
        eyeSpacing: 0,
        waistSlim: 0,
        legLength: 0,
        hairVolume: 0,
        hairLength: 0,
    });
    setOverlayImageUrl(imageUrl);
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
      <Tabs defaultValue="face" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="face"><Smile className="w-4 h-4 mr-2"/>Face</TabsTrigger>
          <TabsTrigger value="body"><PersonStanding className="w-4 h-4 mr-2"/>Body</TabsTrigger>
          <TabsTrigger value="hair"><Wind className="w-4 h-4 mr-2"/>Hair</TabsTrigger>
        </TabsList>
        <TabsContent value="face" className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4 no-scrollbar">
          <div className="aspect-square w-full bg-muted rounded-md border overflow-hidden">
              <canvas ref={canvasRef} />
          </div>

          <Button onClick={handleGenerateOverlay} variant="outline" className="w-full" disabled={isAnalyzing}>
              <Bot className="w-4 h-4 mr-2" />
              {isAnalyzing ? "Analyzing Face..." : "Analyze & Generate Overlay"}
          </Button>
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
        </TabsContent>
        <TabsContent value="body" className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4 no-scrollbar">
            <div className="text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">Body overlay and analysis coming soon.</div>
            <SliderControl 
                label="Waist Slimness"
                value={settings.waistSlim || 0}
                onValueChange={(val) => onSettingsChange({ waistSlim: val })}
            />
             <SliderControl 
                label="Leg Length"
                value={settings.legLength || 0}
                onValueChange={(val) => onSettingsChange({ legLength: val })}
            />
        </TabsContent>
        <TabsContent value="hair" className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4 no-scrollbar">
            <div className="text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">Hair overlay and analysis coming soon.</div>
            <SliderControl 
                label="Hair Volume"
                value={settings.hairVolume || 0}
                onValueChange={(val) => onSettingsChange({ hairVolume: val })}
            />
             <SliderControl 
                label="Hair Length"
                value={settings.hairLength || 0}
                onValueChange={(val) => onSettingsChange({ hairLength: val })}
            />
        </TabsContent>
      </Tabs>
      
       <Separator />
       <div className="space-y-2">
        <Button onClick={handleApplyClick} disabled={isGenerating || isAnalyzing} className="w-full">
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
