"use client"

import * as React from "react"
import { Sparkles, BrainCircuit } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { suggestSegmentationPresets, SuggestSegmentationPresetsOutput } from "@/ai/flows/suggest-segmentation-presets"
import { magicWandAssistedSegmentation } from "@/ai/flows/magic-wand-assisted-segmentation"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "../ui/badge"
import { PlaceHolderImages } from "@/lib/placeholder-images"

interface MagicWandPanelProps {
  setSegmentationMask: (mask: string | null) => void;
}

export function MagicWandPanel({ setSegmentationMask }: MagicWandPanelProps) {
  const [tolerance, setTolerance] = React.useState(30)
  const [colorSpace, setColorSpace] = React.useState("hsv")
  const [contiguous, setContiguous] = React.useState(true)
  const [antiAlias, setAntiAlias] = React.useState(true)
  const [varianceExpansion, setVarianceExpansion] = React.useState(false)
  const [isSuggesting, setIsSuggesting] = React.useState(false)
  const [isSegmenting, setIsSegmenting] = React.useState(false)
  const [suggestedPresets, setSuggestedPresets] = React.useState<SuggestSegmentationPresetsOutput | null>(null)
  const { toast } = useToast()

  const image = PlaceHolderImages.find(img => img.id === "pro-segment-ai-1")


  const handleSuggestPresets = async () => {
    if (!image) return;
    setIsSuggesting(true)
    setSuggestedPresets(null)
    try {
      const imageDataUri = image.imageUrl;
      const result = await suggestSegmentationPresets({ imageDataUri });
      setSuggestedPresets(result);
    } catch (error) {
      console.error("Error suggesting presets:", error)
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get suggestions from the AI model.",
      })
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleMagicWandSegmentation = async (contentType?: string) => {
    if (!image) return;
    setIsSegmenting(true);
    setSegmentationMask(null);
    try {
      toast({title: "Performing Magic Wand Segmentation..."});
      const result = await magicWandAssistedSegmentation({
        photoDataUri: image.imageUrl,
        x: 100, // Placeholder
        y: 100, // Placeholder
        contentType: contentType || 'object',
        modelId: 'googleai/gemini-2.5-flash-segment-it-preview'
      });
      if(result.maskDataUri) {
        setSegmentationMask(result.maskDataUri);
        toast({title: "Segmentation successful!"});
      } else {
        throw new Error(result.message || "Segmentation failed to produce a mask.");
      }
    } catch (error: any) {
        console.error("Magic Wand segmentation failed:", error);
        toast({
            variant: "destructive",
            title: "Magic Wand Failed",
            description: error.message || "Could not perform segmentation."
        });
    } finally {
        setIsSegmenting(false);
    }
  };


  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Magic Wand</h3>
        <p className="text-sm text-muted-foreground">
          Select similar colored areas. Click on an image to create a selection.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tolerance">Tolerance: {tolerance}</Label>
          <Slider
            id="tolerance"
            min={0}
            max={100}
            step={1}
            value={[tolerance]}
            onValueChange={(value) => setTolerance(value[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color-space">Color Space</Label>
          <Select value={colorSpace} onValueChange={setColorSpace}>
            <SelectTrigger id="color-space">
              <SelectValue placeholder="Select color space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rgb">RGB</SelectItem>
              <SelectItem value="hsv">HSV</SelectItem>
              <SelectItem value="lab">LAB</SelectItem>
              <SelectItem value="quaternion">Quaternion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="contiguous">Contiguous</Label>
          <Switch
            id="contiguous"
            checked={contiguous}
            onCheckedChange={setContiguous}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          If enabled, selects only adjacent areas using the same colors.
        </p>

        <div className="flex items-center justify-between">
          <Label htmlFor="anti-alias">Anti-alias</Label>
          <Switch
            id="anti-alias"
            checked={antiAlias}
            onCheckedChange={setAntiAlias}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Creates a smoother outline for the selection.
        </p>
      </div>
      
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label htmlFor="variance-expansion" className="font-semibold">Variance-Guided Expansion</Label>
            </div>
          <Switch
            id="variance-expansion"
            checked={varianceExpansion}
            onCheckedChange={setVarianceExpansion}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          AI-powered expansion to capture complex textures and patterns without inflating tolerance.
        </p>
        
        <Button onClick={handleSuggestPresets} disabled={isSuggesting || isSegmenting} className="w-full">
            <BrainCircuit className="mr-2 h-4 w-4" />
            {isSuggesting ? "Analyzing Image..." : "Suggest AI Presets"}
        </Button>
        {suggestedPresets && (
          <div className="space-y-2 pt-2">
            <h4 className="text-sm font-semibold">Suggested Presets:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestedPresets.map((preset, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-accent" onClick={() => handleMagicWandSegmentation(preset.presetName)}>{preset.presetName}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
