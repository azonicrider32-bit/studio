"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CurvesTool } from "./curves-tool"

export function LayerAdjustmentPanel() {
  const [hue, setHue] = React.useState(0)
  const [saturation, setSaturation] = React.useState(0)
  const [brightness, setBrightness] = React.useState(0)
  const [contrast, setContrast] = React.useState(0)

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Adjustments</h3>
        <p className="text-sm text-muted-foreground">
          Non-destructively adjust the look of the current layer.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hue">Hue: {hue}</Label>
          <Slider
            id="hue"
            min={-180}
            max={180}
            step={1}
            value={[hue]}
            onValueChange={(value) => setHue(value[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="saturation">Saturation: {saturation}</Label>
          <Slider
            id="saturation"
            min={-100}
            max={100}
            step={1}
            value={[saturation]}
            onValueChange={(value) => setSaturation(value[0])}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="brightness">Brightness: {brightness}</Label>
          <Slider
            id="brightness"
            min={-100}
            max={100}
            step={1}
            value={[brightness]}
            onValueChange={(value) => setBrightness(value[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contrast">Contrast: {contrast}</Label>
          <Slider
            id="contrast"
            min={-100}
            max={100}
            step={1}
            value={[contrast]}
            onValueChange={(value) => setContrast(value[0])}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Curves</Label>
        <CurvesTool />
      </div>
    </div>
  )
}
