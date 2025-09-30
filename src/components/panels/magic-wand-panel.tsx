"use client"

import * as React from "react"
import { Sparkles, BrainCircuit, Info } from "lucide-react"
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
import { MagicWandSettings } from "@/lib/types"
import { handleApiError } from "@/lib/error-handling"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

interface MagicWandPanelProps {
  settings: MagicWandSettings;
  onSettingsChange: (settings: Partial<MagicWandSettings>) => void;
  activeScrollSetting: keyof MagicWandSettings['tolerances'] | null;
  onActiveScrollSettingChange: (setting: keyof MagicWandSettings['tolerances'] | null) => void;
}

export function MagicWandPanel({ 
  settings, 
  onSettingsChange,
  activeScrollSetting,
  onActiveScrollSettingChange
}: MagicWandPanelProps) {
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
    } catch (error: any) {
      handleApiError(error, toast, {
        title: "AI Suggestion Failed",
        description: "Could not get suggestions from the AI model.",
      });
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleMagicWandSegmentation = async (contentType?: string) => {
    if (!image) return;
    setIsSegmenting(true);
    // setSegmentationMask(null); // This should be handled by the parent component
    try {
      toast({title: "Performing Magic Wand Segmentation..."});
      const result = await magicWandAssistedSegmentation({
        photoDataUri: image.imageUrl,
        contentType: contentType || 'object',
        modelId: 'googleai/gemini-2.5-flash-image-preview'
      });
      if(result.isSuccessful && result.maskDataUri) {
        // setSegmentationMask(result.maskDataUri); // Parent handles this
        toast({title: "Segmentation successful!"});
      } else {
        throw new Error(result.message || "Segmentation failed to produce a mask.");
      }
    } catch (error: any) {
        handleApiError(error, toast, {
            title: "Magic Wand Failed",
            description: "Could not perform segmentation."
        });
    } finally {
        setIsSegmenting(false);
    }
  };

  const handleToggle = (setting: keyof MagicWandSettings['tolerances']) => {
    onActiveScrollSettingChange(activeScrollSetting === setting ? null : setting);
  };
  
  const handleToleranceChange = (key: keyof MagicWandSettings['tolerances'], value: number) => {
      onSettingsChange({
          tolerances: {
              ...settings.tolerances,
              [key]: value
          }
      });
  }
  
  const ALL_COMPONENTS: {title: string, components: {id: keyof MagicWandSettings['tolerances'], label: string, max: number}[]}[] = [
    {
      title: 'RGB',
      components: [
        { id: 'r', label: 'R', max: 255 },
        { id: 'g', label: 'G', max: 255 },
        { id: 'b', label: 'B', max: 255 },
      ]
    },
    {
      title: 'HSV',
      components: [
        { id: 'h', label: 'H', max: 180 },
        { id: 's', label: 'S', max: 100 },
        { id: 'v', label: 'V', max: 100 },
      ]
    },
    {
      title: 'LAB',
      components: [
        { id: 'l', label: 'L', max: 100 },
        { id: 'a', label: 'A', max: 128 },
        { id: 'b_lab', label: 'B', max: 128 },
      ]
    }
  ]


  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Magic Wand</h3>
        <p className="text-sm text-muted-foreground">
          Select similar colored areas. Fine-tune tolerances below.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-center">Color Tolerances</h4>
        <TooltipProvider>
            <div className="flex justify-around items-end h-64 bg-muted/50 p-2 rounded-md gap-1">
                {ALL_COMPONENTS.map((group, groupIndex) => 
                    <React.Fragment key={group.title}>
                        {group.components.map(config => (
                            <VerticalSettingSlider
                                key={config.id}
                                id={config.id}
                                label={config.label}
                                value={settings.tolerances[config.id]}
                                min={0}
                                max={config.max}
                                step={1}
                                description={`Adjusts the tolerance for the ${config.label} component.`}
                                isActive={activeScrollSetting === config.id}
                                onToggle={() => handleToggle(config.id)}
                                onValueChange={(value) => handleToleranceChange(config.id, value)}
                            />
                        ))}
                        {groupIndex < ALL_COMPONENTS.length - 1 && <Separator orientation="vertical" className="h-56 bg-border/50" />}
                    </React.Fragment>
                )}
            </div>
        </TooltipProvider>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="contiguous">Contiguous</Label>
        <Switch
          id="contiguous"
          checked={settings.contiguous}
          onCheckedChange={(checked) => onSettingsChange({ contiguous: checked })}
        />
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        If enabled, selects only adjacent areas using the same colors.
      </p>
      
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label htmlFor="variance-expansion" className="font-semibold">AI-Assisted Selection</Label>
            </div>
          <Switch
            id="variance-expansion"
            checked={settings.useAiAssist}
            onCheckedChange={(checked) => onSettingsChange({ useAiAssist: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Uses AI to refine the Magic Wand click for a more accurate selection.
        </p>
        
        <Button onClick={handleSuggestPresets} disabled={isSuggesting || isSegmenting || !settings.useAiAssist} className="w-full">
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


interface VerticalSettingSliderProps {
    id: keyof MagicWandSettings['tolerances'];
    label: string;
    value: number;
    min: number; max: number; step: number;
    description: string;
    isActive: boolean;
    onToggle: () => void;
    onValueChange: (value: number) => void;
}

function VerticalSettingSlider({ id, label, value, min, max, step, description, isActive, onToggle, onValueChange }: VerticalSettingSliderProps) {
    const displayValue = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
    
    return (
        <div className="flex flex-col items-center justify-between gap-2 h-full flex-1">
            <Tooltip>
                <TooltipTrigger asChild>
                     <span className="text-sm font-semibold">{label}</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label} Tolerance</p>
                </TooltipContent>
            </Tooltip>
            
            <Slider
                id={id}
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={(v) => onValueChange(v[0])}
                orientation="vertical"
                className="h-full"
            />
            <span className="font-mono text-xs">{displayValue}</span>
             <div className="flex flex-col items-center gap-2">
                <Switch
                    id={`${id}-toggle`}
                    checked={isActive}
                    onCheckedChange={onToggle}
                    orientation="vertical"
                />
                 <Popover>
                    <PopoverTrigger>
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </PopoverTrigger>
                    <PopoverContent side="top" className="text-sm">
                        <h4 className="font-semibold mb-2">{label} Tolerance</h4>
                        <p>{description}</p>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
