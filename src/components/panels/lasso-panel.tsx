"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { BrainCircuit } from "lucide-react"
import { intelligentLassoAssistedPathSnapping } from "@/ai/flows/intelligent-lasso-assisted-path-snapping"
import { useToast } from "@/hooks/use-toast"

export function LassoPanel() {
    const [perpBias, setPerpBias] = React.useState(0.8)
    const [falloffSigma, setFalloffSigma] = React.useState(20)
    const [predictiveHover, setPredictiveHover] = React.useState(true)
    const [jumpOptimization, setJumpOptimization] = React.useState(true)
    const [isOptimizing, setIsOptimizing] = React.useState(false)
    const { toast } = useToast()

    const handleOptimizePath = async () => {
        setIsOptimizing(true)
        try {
            // In a real app, you'd get the path and image data from canvas state.
            const result = await intelligentLassoAssistedPathSnapping({
                photoDataUri: "data:image/jpeg;base64,",
                lassoPath: [{x: 10, y: 10}, {x: 50, y: 50}],
                prompt: "the main object"
            });
            toast({
                title: "Path Optimized",
                description: "AI has enhanced the lasso path.",
            })
        } catch (error) {
            console.error("Error optimizing path:", error)
            toast({
                variant: "destructive",
                title: "Optimization Failed",
                description: "The AI could not optimize the path.",
            })
        } finally {
            setIsOptimizing(false)
        }
    }


  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Intelligent Lasso</h3>
        <p className="text-sm text-muted-foreground">
          Draw a freehand selection with smart edge-snapping.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="perp-bias">Perpendicular Bias: {perpBias.toFixed(1)}</Label>
          <Slider
            id="perp-bias"
            min={0}
            max={1}
            step={0.1}
            value={[perpBias]}
            onValueChange={(value) => setPerpBias(value[0])}
          />
          <p className="text-xs text-muted-foreground -mt-1">
            How strongly to snap to edges perpendicular to your drawing direction.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="falloff-sigma">Falloff Sigma: {falloffSigma}°</Label>
          <Slider
            id="falloff-sigma"
            min={10}
            max={50}
            step={1}
            value={[falloffSigma]}
            onValueChange={(value) => setFalloffSigma(value[0])}
          />
           <p className="text-xs text-muted-foreground -mt-1">
            Controls the angle range for perpendicular snapping.
          </p>
        </div>
      </div>
      
      <Separator />

       <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="predictive-hover" className="font-semibold">Predictive Hover</Label>
          <Switch
            id="predictive-hover"
            checked={predictiveHover}
            onCheckedChange={setPredictiveHover}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          AI previews segmentation ahead of your cursor.
        </p>

        <div className="flex items-center justify-between">
          <Label htmlFor="jump-optimization" className="font-semibold">A* Jump Optimization</Label>
          <Switch
            id="jump-optimization"
            checked={jumpOptimization}
            onCheckedChange={setJumpOptimization}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
            Uses A* pathfinding to intelligently connect gaps in your path.
        </p>

        <Button onClick={handleOptimizePath} disabled={isOptimizing} className="w-full">
            <BrainCircuit className="mr-2 h-4 w-4" />
            {isOptimizing ? "Optimizing..." : "Optimize Current Path with AI"}
        </Button>
      </div>
    </div>
  )
}
