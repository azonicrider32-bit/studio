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
import { cn } from "@/lib/utils"
import { rgbToHsv, rgbToLab } from "@/lib/color-utils"

interface MagicWandPanelProps {
  settings: MagicWandSettings;
  onSettingsChange: (settings: Partial<MagicWandSettings>) => void;
  activeScrollSetting: keyof MagicWandSettings['tolerances'] | null;
  onActiveScrollSettingChange: (setting: keyof MagicWandSettings['tolerances'] | null) => void;
  canvas: HTMLCanvasElement | null;
  mousePos: { x: number; y: number } | null;
}

interface Analysis {
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b: number };
}

export function MagicWandPanel({ 
  settings, 
  onSettingsChange,
  activeScrollSetting,
  onActiveScrollSettingChange,
  canvas,
  mousePos
}: MagicWandPanelProps) {
  const [isSuggesting, setIsSuggesting] = React.useState(false)
  const [isSegmenting, setIsSegmenting] = React.useState(false)
  const [suggestedPresets, setSuggestedPresets] = React.useState<SuggestSegmentationPresetsOutput | null>(null)
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null)
  const { toast } = useToast()

  const image = PlaceHolderImages.find(img => img.id === "pro-segment-ai-1")

  React.useEffect(() => {
    if (canvas && mousePos) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const x = Math.floor(mousePos.x);
        const y = Math.floor(mousePos.y);
        
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const r = pixel[0];
          const g = pixel[1];
          const b = pixel[2];
          
          setAnalysis({
            rgb: { r, g, b },
            hsv: rgbToHsv(r, g, b),
            lab: rgbToLab(r, g, b),
          });
        } else {
          setAnalysis(null);
        }
      }
    } else {
        setAnalysis(null);
    }
  }, [canvas, mousePos]);

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
  
  const ALL_COMPONENTS: {title: string, components: {id: keyof MagicWandSettings['tolerances'], label: string, max: number, color: string, value: number | undefined}[]}[] = [
    {
      title: 'RGB',
      components: [
        { id: 'r', label: 'R', max: 255, color: "bg-red-500", value: analysis?.rgb.r },
        { id: 'g', label: 'G', max: 255, color: "bg-green-500", value: analysis?.rgb.g },
        { id: 'b', label: 'B', max: 255, color: "bg-blue-500", value: analysis?.rgb.b },
      ]
    },
    {
      title: 'HSV',
      components: [
        { id: 'h', label: 'H', max: 360, color: "bg-gradient-to-t from-red-500 via-yellow-500 to-blue-500", value: analysis?.hsv.h },
        { id: 's', label: 'S', max: 100, color: "bg-slate-400", value: analysis?.hsv.s },
        { id: 'v', label: 'V', max: 100, color: "bg-white", value: analysis?.hsv.v },
      ]
    },
    {
      title: 'LAB',
      components: [
        { id: 'l', label: 'L', max: 100, color: "bg-gray-500", value: analysis?.lab.l },
        { id: 'a', label: 'a', max: 256, color: "bg-gradient-to-t from-green-500 to-red-500", value: (analysis?.lab.a ?? -128) + 128 },
        { id: 'b_lab', label: 'b', max: 256, color: "bg-gradient-to-t from-blue-500 to-yellow-500", value: (analysis?.lab.b ?? -128) + 128 },
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
        <p className="text-xs text-muted-foreground -mt-2 text-center">Toggle a setting to adjust it with the mouse wheel on the canvas, or scroll over a slider to adjust it directly.</p>
        <TooltipProvider>
            <div className="flex justify-around items-end h-64 bg-muted/50 p-4 rounded-md gap-1">
                {ALL_COMPONENTS.map((group, groupIndex) => 
                    <React.Fragment key={group.title}>
                        {group.components.map(config => (
                            <VerticalToleranceSlider
                                key={config.id}
                                id={config.id}
                                label={config.label}
                                tolerance={settings.tolerances[config.id]}
                                max={config.max}
                                color={config.color}
                                pixelValue={config.value}
                                description={`Adjusts the tolerance for the ${config.label} component.`}
                                isActive={activeScrollSetting === config.id}
                                onToggle={() => handleToggle(config.id)}
                                onToleranceChange={(value) => handleToleranceChange(config.id, value)}
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


interface VerticalToleranceSliderProps {
    id: keyof MagicWandSettings['tolerances'];
    label: string;
    tolerance: number;
    max: number;
    color: string;
    pixelValue: number | undefined;
    description: string;
    isActive: boolean;
    onToggle: () => void;
    onToleranceChange: (value: number) => void;
}

function VerticalToleranceSlider({ id, label, tolerance, max, color, pixelValue, description, isActive, onToggle, onToleranceChange }: VerticalToleranceSliderProps) {
    const displayValue = tolerance.toFixed(0);

    const baseValue = pixelValue ?? (id === 'h' ? 0 : max / 2);
    
    let bottomPercent = ((baseValue - tolerance) / max) * 100;
    let topPercent = ((baseValue + tolerance) / max) * 100;
    
    // Handle hue's circular nature
    if (id === 'h') {
        // This simplified visualization doesn't wrap around, but we'll clamp it.
        bottomPercent = Math.max(0, bottomPercent);
        topPercent = Math.min(100, topPercent);
    } else {
        bottomPercent = Math.max(0, bottomPercent);
        topPercent = Math.min(100, topPercent);
    }
    
    const rangeHeight = topPercent - bottomPercent;

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        let step = 1;
        if (id === 'h') step = 2;
        
        let newValue = tolerance + delta * step;
        newValue = Math.max(0, Math.min(max, newValue));
        onToleranceChange(newValue);
    };
    
    return (
        <div className="flex flex-col items-center justify-between gap-2 h-full flex-1" onWheel={handleWheel}>
            <Tooltip>
                <TooltipTrigger asChild>
                     <span className="text-sm font-semibold">{label}</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label} Tolerance</p>
                </TooltipContent>
            </Tooltip>

             <div className={cn("w-4 h-full bg-muted rounded-full overflow-hidden flex flex-col justify-end relative", color)}>
                {pixelValue !== undefined && (
                  <div 
                      className={cn("w-full absolute bg-primary/75 border-y border-primary-foreground/50")} 
                      style={{ 
                          bottom: `${bottomPercent}%`, 
                          height: `${rangeHeight}%`
                      }}
                  ></div>
                )}
                 {pixelValue !== undefined && (
                    <div className="w-full h-0.5 bg-accent-foreground absolute" style={{ bottom: `${(pixelValue / max) * 100}%`}}></div>
                )}
            </div>
            
            <Slider
                id={id}
                min={0}
                max={max}
                step={1}
                value={[tolerance]}
                onValueChange={(v) => onToleranceChange(v[0])}
                orientation="vertical"
                className="h-full absolute top-0 left-1/2 -translate-x-1/2 opacity-0 cursor-row-resize"
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

    