"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { rgbToHex, rgbToHsv, rgbToLab } from "@/lib/color-utils"
import { SegmentHoverPreview } from "../segment-hover-preview"
import { cn } from "@/lib/utils"

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
    <div className="grid grid-cols-[80px_1fr] items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {color && <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }}></div>}
        <span className="font-mono text-sm">{value}</span>
      </div>
    </div>
  );
  
  const VerticalValueBar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => (
    <div className="flex flex-col items-center gap-2 flex-1">
        <div className="w-6 h-32 bg-muted rounded-full overflow-hidden flex flex-col justify-end">
             <div className={cn("w-full", color)} style={{ height: `${(value/max) * 100}%`}}></div>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-sm">{Math.round(value)}</span>
    </div>
  );

  const renderColorBreakdown = (label: string, values: { [key: string]: { value: number, max: number, color: string }}) => (
     <div className="space-y-2 flex-1">
        <h5 className="font-semibold text-sm mb-2 text-center">{label}</h5>
        <div className="flex justify-around gap-2 p-2 rounded-md bg-muted/50">
            {Object.entries(values).map(([key, data]) => (
                <VerticalValueBar key={key} label={key} value={data.value} max={data.max} color={data.color} />
            ))}
        </div>
     </div>
  );


  return (
    <div className="p-4 space-y-6">
       <SegmentHoverPreview canvas={canvas} mousePos={mousePos} />

      <Separator />
        
        {analysis ? (
            <div className="space-y-4">
                {renderColorValue("Hex", analysis.hex, analysis.hex)}
                <Separator />
                <div className="flex gap-2">
                    {renderColorBreakdown("RGB", { 
                        "R": { value: analysis.rgb.r, max: 255, color: "bg-red-500" },
                        "G": { value: analysis.rgb.g, max: 255, color: "bg-green-500" },
                        "B": { value: analysis.rgb.b, max: 255, color: "bg-blue-500" },
                    })}
                     {renderColorBreakdown("HSV", {
                        "H": { value: analysis.hsv.h, max: 360, color: "bg-gradient-to-t from-red-500 via-yellow-500 to-blue-500" },
                        "S": { value: analysis.hsv.s, max: 100, color: "bg-slate-400" },
                        "V": { value: analysis.hsv.v, max: 100, color: "bg-white" },
                    })}
                     {renderColorBreakdown("LAB", {
                        "L": { value: analysis.lab.l, max: 100, color: "bg-gray-500" },
                        "A": { value: analysis.lab.a + 128, max: 256, color: "bg-gradient-to-t from-green-500 to-red-500" },
                        "B": { value: analysis.lab.b + 128, max: 256, color: "bg-gradient-to-t from-blue-500 to-yellow-500" },
                    })}
                </div>
            </div>
        ) : (
            <p className="text-sm text-muted-foreground text-center pt-8">
                Hover over the image to see color data.
            </p>
        )}

    </div>
  )
}
