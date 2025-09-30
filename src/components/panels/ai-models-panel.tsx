"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BrainCircuit, GitCompareArrows } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { compareAiModels, CompareAiModelsOutput } from "@/ai/flows/compare-ai-models"
import { magicWandAssistedSegmentation, MagicWandAssistedSegmentationOutput } from "@/ai/flows/magic-wand-assisted-segmentation"
import { Skeleton } from "../ui/skeleton"
import { PlaceHolderImages } from "@/lib/placeholder-images"

type AIModel = "googleai/gemini-2.5-flash-image-preview" | "bodypix" | "deeplab" | "sam" | "sam2"

interface AiModelsPanelProps {
  setSegmentationMask: (mask: string | null) => void;
  setImageUrl: (url: string) => void;
}


export function AiModelsPanel({ setSegmentationMask, setImageUrl }: AiModelsPanelProps) {
  const [selectedModel, setSelectedModel] = React.useState<AIModel>("googleai/gemini-2.5-flash-image-preview")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isComparing, setIsComparing] = React.useState(false)
  const [comparison, setComparison] = React.useState<CompareAiModelsOutput | null>(null)
  const { toast } = useToast()
  
  const image = PlaceHolderImages.find(img => img.id === "pro-segment-ai-1")


  const handleRunAI = async () => {
    if (!image) return;
    setIsProcessing(true)
    setComparison(null)
    setSegmentationMask(null);
    try {
      const res = await magicWandAssistedSegmentation({
        photoDataUri: image.imageUrl,
        modelId: selectedModel,
      })
      if (res.maskDataUri) {
        setSegmentationMask(res.maskDataUri);
      }
      toast({ title: "AI Segmentation Complete", description: res.message })
    } catch (error) {
      console.error("AI segmentation failed:", error)
      toast({
        variant: "destructive",
        title: "AI Segmentation Failed",
        description: "Could not process the image with the selected model.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCompare = async () => {
    if(!image) return;
    setIsComparing(true)
    setComparison(null)
    setSegmentationMask(null);

    try {
      const res = await compareAiModels({
        photoDataUri: image.imageUrl,
        modelIds: ["googleai/gemini-2.5-flash-image-preview", "bodypix", "deeplab"],
      })
      setComparison(res)
      toast({ title: "AI Model Comparison Complete" })
    } catch (error) {
      console.error("AI comparison failed:", error)
      toast({
        variant: "destructive",
        title: "AI Comparison Failed",
        description: "Could not compare the AI models.",
      })
    } finally {
      setIsComparing(false)
    }
  }

  const renderComparisonResults = () => (
    <div className="grid grid-cols-2 gap-4 pt-4">
      {comparison?.results.map(res => (
        <Card key={res.modelId} onClick={() => res.segmentationDataUri && setSegmentationMask(res.segmentationDataUri)} className="cursor-pointer">
          <CardHeader className="p-2">
            <CardTitle className="text-sm">{res.modelName}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 text-xs text-muted-foreground">
            {res.error ? (
              <p className="text-destructive">{res.error}</p>
            ) : (
              <p>{res.inferenceTime ? `${res.inferenceTime.toFixed(2)}s` : "Success"}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">AI Models</h3>
        <p className="text-sm text-muted-foreground">
          Leverage powerful AI models for automated segmentation.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModel)}>
          <SelectTrigger>
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="googleai/gemini-2.5-flash-image-preview">Segment Anything (Google)</SelectItem>
            <SelectItem value="bodypix">BodyPix (Human)</SelectItem>
            <SelectItem value="deeplab">DeepLab (Semantic)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleRunAI} disabled={isProcessing || isComparing} className="w-full">
          <BrainCircuit className="mr-2 h-4 w-4" />
          {isProcessing ? "Segmenting..." : `Run Segmentation`}
        </Button>
        <Button onClick={handleCompare} disabled={isProcessing || isComparing} variant="secondary" className="w-full">
          <GitCompareArrows className="mr-2 h-4 w-4" />
          {isComparing ? "Comparing..." : "Compare All Models"}
        </Button>
      </div>

      {(isProcessing || isComparing) && (
        <div className="space-y-2 pt-4">
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-2 gap-4 pt-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        </div>
      )}

      {comparison && !isComparing && renderComparisonResults()}
    </div>
  )
}
