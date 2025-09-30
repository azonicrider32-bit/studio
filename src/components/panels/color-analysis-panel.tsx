"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { rgbToHex, rgbToHsv, rgbToLab } from "@/lib/color-utils"

interface ColorAnalysisPanelProps {
  canvas: HTMLCanvasElement | null;
  mousePos: { x: number; y: number } | null;
}

interface Analysis {
  rgb: { r: number; g: number; b: number };
  hex: string;
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b: number };
}

export function ColorAnalysisPanel({ canvas, mousePos }: ColorAnalysisPanelProps) {
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null)

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
            hex: rgbToHex(r, g, b),
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

  const renderColorValue = (label: string, value: string, color?: string) => (
    <div className="grid grid-cols-2 items-center">
      <span className="text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-2">
        {color && <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }}></div>}
        <span>{value}</span>
      </div>
    </div>
  );

  const renderColorBreakdown = (label: string, values: { [key: string]: number | string }) => (
     <div>
        <h5 className="font-semibold text-sm mb-1">{label}</h5>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm pl-2">
            {Object.entries(values).map(([key, value]) => (
                 <React.Fragment key={key}>
                    <span className="text-muted-foreground">{key.toUpperCase()}:</span>
                    <span>{value}</span>
                 </React.Fragment>
            ))}
        </div>
     </div>
  );


  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Color Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Real-time analysis of the area under your cursor.
        </p>
      </div>

      <Separator />
        
        {analysis ? (
            <div className="space-y-4">
                {renderColorValue("Hex", analysis.hex, analysis.hex)}
                <Separator />
                {renderColorBreakdown("RGB", { 
                    R: analysis.rgb.r, 
                    G: analysis.rgb.g, 
                    B: analysis.rgb.b 
                })}
                <Separator />
                 {renderColorBreakdown("HSV", {
                    H: `${analysis.hsv.h}°`,
                    S: `${analysis.hsv.s}%`,
                    V: `${analysis.hsv.v}%`
                })}
                <Separator />
                 {renderColorBreakdown("LAB", {
                    L: analysis.lab.l,
                    A: analysis.lab.a,
                    B: analysis.lab.b
                })}
            </div>
        ) : (
            <p className="text-sm text-muted-foreground text-center pt-8">
                Hover over the image to see color data.
            </p>
        )}

    </div>
  )
}
