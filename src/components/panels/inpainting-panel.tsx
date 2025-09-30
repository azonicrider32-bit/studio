"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { inpaintWithPrompt } from "@/ai/flows/inpaint-with-prompt"
import { handleApiError } from "@/lib/error-handling"

interface InpaintingPanelProps {
  imageUrl: string | undefined;
  getSelectionMask: () => string | undefined;
  onGenerationComplete: (newImageUrl: string) => void;
  clearSelection: () => void;
}

export function InpaintingPanel({ imageUrl, getSelectionMask, onGenerationComplete, clearSelection }: InpaintingPanelProps) {
  const [prompt, setPrompt] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    // We need a stable reference to the imageUrl for the async operation.
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

    if (!prompt) {
      toast({ variant: "destructive", title: "Prompt is empty.", description: "Please describe what you want to generate." })
      return
    }

    setIsGenerating(true)
    toast({ title: "AI is generating...", description: "This may take a moment." })

    try {
      const result = await inpaintWithPrompt({
        photoDataUri: currentImageUrl,
        maskDataUri: maskDataUri,
        prompt: prompt,
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
        <h3 className="font-headline text-lg">AI Inpainting</h3>
        <p className="text-sm text-muted-foreground">
          Select an area on the canvas, then describe what you want to generate in its place.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inpainting-prompt">Prompt</Label>
          <Textarea
            id="inpainting-prompt"
            placeholder="A majestic eagle soaring..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={isGenerating}
          />
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
          <Wand2 className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </div>
    </div>
  )
}
