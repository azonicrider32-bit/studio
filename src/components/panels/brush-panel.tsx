"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Paintbrush, Eraser } from "lucide-react"

interface BrushPanelProps {
  isEraser?: boolean;
}

export function BrushPanel({ isEraser = false }: BrushPanelProps) {
  const [size, setSize] = React.useState(50)
  const [softness, setSoftness] = React.useState(50)
  const [strength, setStrength] = React.useState(100)

  const toolName = isEraser ? "Eraser" : "Brush";
  const ToolIcon = isEraser ? Eraser : Paintbrush;

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg flex items-center gap-2">
            <ToolIcon className="w-5 h-5"/>
            {toolName} Tool
        </h3>
        <p className="text-sm text-muted-foreground">
          {isEraser ? "Erase parts of the image or selection." : "Paint a selection or mask."}
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="size">Size: {size}px</Label>
          <Slider
            id="size"
            min={1}
            max={500}
            step={1}
            value={[size]}
            onValueChange={(value) => setSize(value[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="softness">Softness: {softness}%</Label>
          <Slider
            id="softness"
            min={0}
            max={100}
            step={1}
            value={[softness]}
            onValueChange={(value) => setSoftness(value[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="strength">Strength / Opacity: {strength}%</Label>
          <Slider
            id="strength"
            min={0}
            max={100}
            step={1}
            value={[strength]}
            onValueChange={(value) => setStrength(value[0])}
          />
        </div>
      </div>
    </div>
  )
}
