"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { rgbToHex, rgbToHsv, rgbToLab } from "@/lib/color-utils"

export function ColorAnalysisPanel() {
  const [analysis, setAnalysis] = React.useState({
    rgb: { r: 76, g: 93, b: 122 },
    hex: "#4c5d7a",
    hsv: { h: 218, s: 38, v: 48 },
    lab: { l: 39, a: 1, b: -18 },
    variances: { rgb: 19.6, hsv: 6.2, lab: 5.1 },
    gradientStrength: 45,
    edgeStrength: 60,
  })

  React.useEffect(() => {
    // Mock real-time updates as if the cursor is moving
    const interval = setInterval(() => {
      setAnalysis(prev => {
        const r = Math.min(255, Math.max(0, prev.rgb.r + Math.round((Math.random() - 0.5) * 10)))
        const g = Math.min(255, Math.max(0, prev.rgb.g + Math.round((Math.random() - 0.5) * 10)))
        const b = Math.min(255, Math.max(0, prev.rgb.b + Math.round((Math.random() - 0.5) * 10)))
        return {
          rgb: { r, g, b },
          hex: rgbToHex(r, g, b),
          hsv: rgbToHsv(r, g, b),
          lab: rgbToLab(r, g, b),
          variances: {
            rgb: Math.max(0, prev.variances.rgb + (Math.random() - 0.5) * 2),
            hsv: Math.max(0, prev.variances.hsv + (Math.random() - 0.5) * 1),
            lab: Math.max(0, prev.variances.lab + (Math.random() - 0.5) * 0.5),
          },
          gradientStrength: Math.min(100, Math.max(0, prev.gradientStrength + (Math.random() - 0.5) * 5)),
          edgeStrength: Math.min(100, Math.max(0, prev.edgeStrength + (Math.random() - 0.5) * 5)),
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Color Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Real-time analysis of the area under your cursor.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Pixel Color</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">RGB:</span>
            <span>{analysis.rgb.r}, {analysis.rgb.g}, {analysis.rgb.b}</span>
            <span className="text-muted-foreground">Hex:</span>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: analysis.hex }}></div>
                <span>{analysis.hex}</span>
            </div>
            <span className="text-muted-foreground">HSV:</span>
            <span>{analysis.hsv.h}°, {analysis.hsv.s}%, {analysis.hsv.v}%</span>
            <span className="text-muted-foreground">LAB:</span>
            <span>{analysis.lab.l}, {analysis.lab.a}, {analysis.lab.b}</span>
        </div>
      </div>
      
      <Separator />

      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Area Analysis</h4>
        <div className="space-y-3">
            <div>
                <Label className="text-xs">RGB Variance</Label>
                <Progress value={analysis.variances.rgb} className="h-2 mt-1" />
            </div>
            <div>
                <Label className="text-xs">HSV Variance</Label>
                <Progress value={analysis.variances.hsv * 10} className="h-2 mt-1" />
            </div>
            <div>
                <Label className="text-xs">LAB Variance</Label>
                <Progress value={analysis.variances.lab * 2} className="h-2 mt-1" />
            </div>
             <div>
                <Label className="text-xs">Gradient Strength</Label>
                <Progress value={analysis.gradientStrength} className="h-2 mt-1" />
            </div>
             <div>
                <Label className="text-xs">Edge Strength</Label>
                <Progress value={analysis.edgeStrength} className="h-2 mt-1" />
            </div>
        </div>
      </div>
    </div>
  )
}
