"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export function CannyTuningPanel() {
  const [lowThreshold, setLowThreshold] = React.useState(50)
  const [highThreshold, setHighThreshold] = React.useState(150)
  const [apertureSize, setApertureSize] = React.useState("3")
  const [l2Gradient, setL2Gradient] = React.useState(false)

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Canny Edge Detection</h3>
        <p className="text-sm text-muted-foreground">
          Fine-tune edge detection parameters in real-time.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="low-threshold">Low Threshold: {lowThreshold}</Label>
          <Slider
            id="low-threshold"
            min={0}
            max={255}
            step={1}
            value={[lowThreshold]}
            onValueChange={(value) => setLowThreshold(value[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="high-threshold">High Threshold: {highThreshold}</Label>
          <Slider
            id="high-threshold"
            min={0}
            max={255}
            step={1}
            value={[highThreshold]}
            onValueChange={(value) => setHighThreshold(value[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="aperture-size">Aperture Size</Label>
          <Select value={apertureSize} onValueChange={setApertureSize}>
            <SelectTrigger id="aperture-size">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3x3</SelectItem>
              <SelectItem value="5">5x5</SelectItem>
              <SelectItem value="7">7x7</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="l2-gradient">L2 Gradient</Label>
          <Switch
            id="l2-gradient"
            checked={l2Gradient}
            onCheckedChange={setL2Gradient}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Use a more accurate but slower gradient calculation.
        </p>
      </div>
    </div>
  )
}
