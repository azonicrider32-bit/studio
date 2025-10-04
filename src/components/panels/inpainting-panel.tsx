
"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Wand2, Sparkles, Trash2, Glasses, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { inpaintWithPrompt } from "@/ai/flows/inpaint-with-prompt"
import { handleApiError } from "@/lib/error-handling"

interface InpaintingPanelProps {
  imageUrl: string | undefined;
  getSelectionMask: () => string | undefined;
  onGenerationComplete: (newImageUrl: string) => void;
  clearSelection: () => void;
}

const oneClickPrompts = [
  {
    id: "remove-object",
    label: "Remove Object",
    prompt: "Inpaint the selected area to seamlessly match the surrounding background, making it look as if the object was never there. Pay close attention to texture, lighting, and patterns to create a realistic and unnoticeable fill.",
    icon: Trash2,
  },
  {
    id: "add-sunglasses",
    label: "Add Sunglasses",
    prompt: "Add a pair of stylish, modern sunglasses to the selected person's face. The sunglasses should fit naturally on the face, with realistic reflections on the lenses and appropriate shadows cast on the skin.",
    icon: Glasses,
  },
  {
    id: "change-color-red",
    label: "Change to Red",
    prompt: "Change the color of the selected object to a vibrant, realistic red. Maintain the original texture, shadows, and highlights of the object, ensuring only the color is altered.",
    icon: Palette,
  },
];


export function InpaintingPanel({ imageUrl, getSelectionMask, onGenerationComplete, clearSelection }: InpaintingPanelProps) {
  const [prompt, setPrompt] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const { toast } = useToast()

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    const currentImageUrl = imageUrl;

    if (!currentImageUrl) {
      toast({ variant: "destructive", title: "No image loaded." })
      return
    }

    const maskDataUri = getSelectionMask()
    if (!maskDataUri) {
      toast({ variant: "destructive", title: "No selection made.", description: "Please use the lasso or magic wand tool to select an area to inpaint." })
      return
    }

    if (!finalPrompt) {
      toast({ variant: "destructive", title: "Prompt is empty.", description: "Please describe what you want to generate or select a one-click action." })
      return
    }

    setIsGenerating(true)
    toast({ title: "AI is generating...", description: "This may take a moment." })

    try {
      const result = await inpaintWithPrompt({
        photoDataUri: currentImageUrl,
        maskDataUri: maskDataUri,
        prompt: finalPrompt,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.generatedImageDataUri) {
        onGenerationComplete(result.generatedImageDataUri)
        toast({ title: "Inpainting successful!", description: "The image has been updated."})
        clearSelection();
      } else {
        throw new Error("The model did not return an image.")
      }

    } catch (error: any) {
      handleApiError(error, toast, {
        title: "Inpainting Failed",
        description: "An unknown error occurred during inpainting.",
      });
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">AI Actions (Inpainting)</h3>
        <p className="text-sm text-muted-foreground">
          Select an area, then use a one-click action or a custom prompt to generate content.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
          <Label className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary"/> One-Click Actions</Label>
          <div className="grid grid-cols-2 gap-2">
            {oneClickPrompts.map(p => (
              <Button key={p.id} variant="outline" size="sm" onClick={() => handleGenerate(p.prompt)} disabled={isGenerating}>
                <p.icon className="w-4 h-4 mr-2"/>
                {p.label}
              </Button>
            ))}
          </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inpainting-prompt">Custom Prompt</Label>
          <Textarea
            id="inpainting-prompt"
            placeholder="A majestic eagle soaring..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={isGenerating}
          />
        </div>
        <Button onClick={() => handleGenerate()} disabled={isGenerating} className="w-full">
          <Wand2 className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate with Custom Prompt"}
        </Button>
      </div>
    </div>
  )
}
