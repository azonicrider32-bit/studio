

"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button"
import { Smile, Wand2, Bot, PersonStanding, Wind, Eye, Upload, ChevronRight } from "lucide-react"
import { CharacterSculptSettings, CharacterSheet } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { handleApiError } from "@/lib/error-handling"
import { generateFacialOverlay } from "@/ai/flows/generate-facial-overlay-flow"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { executeCustomTool } from "@/ai/flows/custom-tool-flow"
import { createCharacterSheet } from "@/ai/flows/create-character-sheet-flow"
import { Card } from "../ui/card"
import Image from "next/image"

interface CharacterSculptPanelProps {
  settings: CharacterSculptSettings;
  onSettingsChange: (settings: Partial<CharacterSculptSettings>) => void;
  onApply: (prompt: string, overlayUri?: string) => void;
  isGenerating: boolean;
  imageUrl: string | undefined;
  characterTargetPoint: {x: number, y: number} | null;
  setCharacterTargetPoint: (point: {x: number, y: number} | null) => void;
  canvas: HTMLCanvasElement | null;
}

const AssetThumbnail: React.FC<{ label: string, url: string | undefined, onSelect: () => void, isActive: boolean }> = ({ label, url, onSelect, isActive }) => (
    <div className="space-y-1 cursor-pointer group" onClick={onSelect}>
        <div className={`aspect-square rounded-md overflow-hidden border bg-muted hover:border-primary transition-all ring-2 ${isActive ? 'ring-primary' : 'ring-transparent'}`}>
            {url ? (
                <Image src={url} alt={label} width={80} height={80} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
            ) : (
                <div className="w-full h-full bg-muted animate-pulse"></div>
            )}
        </div>
        <p className="text-xs text-muted-foreground text-center capitalize truncate">{label}</p>
    </div>
);

export function CharacterSculptPanel({
  settings,
  onSettingsChange,
  onApply,
  isGenerating,
  imageUrl,
  characterTargetPoint,
  setCharacterTargetPoint,
  canvas
}: CharacterSculptPanelProps) {
  const [characterSheet, setCharacterSheet] = React.useState<CharacterSheet | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [activePreview, setActivePreview] = React.useState<string | undefined>(undefined);
  const [overlayImage, setOverlayImage] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleCharacterAnalysis = async () => {
      if (!imageUrl || !characterTargetPoint || !canvas) {
        toast({ title: 'Missing Target', description: 'Please click on a character on the canvas first.', variant: 'destructive'});
        return;
      }
      setIsAnalyzing(true);
      toast({ title: "Analyzing Character...", description: "The AI is creating a character sheet. This may take a moment." });

      const hintMask = createCircularMask(characterTargetPoint.x, characterTargetPoint.y, 25, canvas);
      if (!hintMask) {
        setIsAnalyzing(false);
        toast({ title: "Error", description: "Could not create selection mask.", variant: "destructive"});
        return;
      }

      try {
        const result = await createCharacterSheet({
            photoDataUri: imageUrl,
            maskDataUri: hintMask,
        });

        if (result.error || !result.characterSheet) {
            throw new Error(result.error || "Failed to generate character sheet.");
        }
        
        setCharacterSheet(result.characterSheet);
        setActivePreview(result.characterSheet.views?.front);
        toast({ title: "Character Analysis Complete!", description: `Generated a sheet for ${result.characterSheet.name}.` });
        setCharacterTargetPoint(null); // Clear target point after use

      } catch(error) {
         handleApiError(error, toast, { title: "Character Analysis Failed" });
      } finally {
        setIsAnalyzing(false);
      }
  }

  const handleGenerateOverlay = async () => {
    if (!imageUrl) return;
    setIsAnalyzing(true);
    toast({ title: "Generating Overlay...", description: "AI is analyzing facial landmarks." });
    try {
        const result = await generateFacialOverlay({
            photoDataUri: imageUrl,
            overlayTemplatePrompt: "Draw a precise grid over the face with lines for forehead height, eye spacing, nose position, and jawline width. Use bright green for the lines."
        });
        if (result.error || !result.overlayImageUri) {
            throw new Error(result.error || "Failed to generate overlay.");
        }
        setOverlayImage(result.overlayImageUri);
        toast({ title: "Overlay Generated" });
    } catch (error) {
        handleApiError(error, toast, { title: "Overlay Generation Failed" });
    } finally {
        setIsAnalyzing(false);
    }
  }
  
  const createCircularMask = (x: number, y: number, radius: number, sourceCanvas: HTMLCanvasElement): string | null => {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = sourceCanvas.width;
      maskCanvas.height = sourceCanvas.height;
      const ctx = maskCanvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = 'black'; // The area to keep
      ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      ctx.fillStyle = 'white'; // The area to be considered the 'hint'
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      return maskCanvas.toDataURL();
  }

  const handleReset = () => {
    onSettingsChange({
        foreheadHeight: 0,
        nosePosition: 0,
        eyeWidth: 0,
        eyeSpacing: 0,
    });
    if (characterSheet) {
        setActivePreview(characterSheet.views?.front);
    }
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
  
  if (!characterSheet) {
    return (
        <div className="p-4 flex flex-col h-full items-center justify-center text-center">
            <Smile className="w-12 h-12 text-muted-foreground mb-4"/>
            <p className="text-sm text-muted-foreground mb-6">Click on a person in the image to set a target, then click below to start sculpting.</p>
            <Button onClick={handleCharacterAnalysis} disabled={!characterTargetPoint || isAnalyzing}>
                <Bot className="w-4 h-4 mr-2"/>
                {isAnalyzing ? "Analyzing..." : "Analyze Character"}
            </Button>
        </div>
    );
  }

  return (
    <div className="p-4 space-y-4 flex flex-col h-full">
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-md overflow-hidden border bg-muted flex-shrink-0 relative">
            {activePreview && <Image src={activePreview} alt="Character Preview" width={80} height={80} className="object-cover w-full h-full" />}
            {overlayImage && <Image src={overlayImage} alt="Facial Overlay" layout="fill" objectFit="contain" className="opacity-50" />}
        </div>
        <div className="space-y-1 flex-1">
            <h3 className="font-bold text-lg">{characterSheet.name}</h3>
            <p className="text-xs text-muted-foreground">{characterSheet.description}</p>
             <Button size="xs" variant="outline" className="w-full mt-1" onClick={handleGenerateOverlay} disabled={isAnalyzing}>
                <Wand2 className="w-3 h-3 mr-1.5"/>
                Generate Guide Overlay
            </Button>
        </div>
      </div>
      <Tabs defaultValue="face" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="views"><Eye className="w-4 h-4 mr-2"/>Views</TabsTrigger>
          <TabsTrigger value="face"><Smile className="w-4 h-4 mr-2"/>Face</TabsTrigger>
          <TabsTrigger value="body"><PersonStanding className="w-4 h-4 mr-2"/>Body</TabsTrigger>
          <TabsTrigger value="hair"><Wind className="w-4 h-4 mr-2"/>Hair</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto pr-2 mt-4 no-scrollbar">
            <TabsContent value="views" className="space-y-4 m-0">
                <h4 className="font-semibold text-sm">Character Views</h4>
                <div className="grid grid-cols-4 gap-2">
                    {characterSheet.views && Object.entries(characterSheet.views).map(([key, url]) => (
                        url && <AssetThumbnail key={key} label={key} url={url} onSelect={() => setActivePreview(url)} isActive={activePreview === url}/>
                    ))}
                </div>
                 <h4 className="font-semibold text-sm">Expressions</h4>
                <div className="grid grid-cols-4 gap-2">
                    {characterSheet.expressions && Object.entries(characterSheet.expressions).map(([key, url]) => (
                        url && <AssetThumbnail key={key} label={key} url={url} onSelect={() => setActivePreview(url)} isActive={activePreview === url}/>
                    ))}
                </div>
                 <h4 className="font-semibold text-sm">Outfits</h4>
                <div className="grid grid-cols-4 gap-2">
                    {characterSheet.outfits && Object.entries(characterSheet.outfits).map(([key, url]) => (
                        url && <AssetThumbnail key={key} label={key} url={url} onSelect={() => setActivePreview(url)} isActive={activePreview === url}/>
                    ))}
                </div>
            </TabsContent>
            <TabsContent value="face" className="space-y-4 m-0">
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
            <TabsContent value="body" className="space-y-4 m-0">
                <div className="text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">Body sculpting tools.</div>
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
            <TabsContent value="hair" className="space-y-4 m-0">
                <div className="text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">Hair sculpting tools.</div>
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
        </div>
      </Tabs>
      
       <Separator />
       <div className="space-y-2">
        <Button onClick={() => {}} disabled={isGenerating || isAnalyzing} className="w-full">
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
