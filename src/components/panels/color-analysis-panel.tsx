
"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { rgbToHex, rgbToHsv, rgbToLab } from "@/lib/color-utils"
import { cn } from "@/lib/utils"
import { MagicWandSettings } from "@/lib/types"

interface ColorAnalysisPanelProps {
  canvas: HTMLCanvasElement | null;
  mousePos: { x: number; y: number } | null;
  magicWandSettings: MagicWandSettings;
  onMagicWandSettingsChange: (settings: Partial<MagicWandSettings>) => void;
}

interface Analysis {
  rgb: { r: number; g: number; b: number };
  hex: string;
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b: number };
}

export function ColorAnalysisPanel({ canvas, mousePos, magicWandSettings, onMagicWandSettingsChange }: ColorAnalysisPanelProps) {
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null)

  const handleToggleTolerance = (key: keyof MagicWandSettings['tolerances']) => {
    const newEnabledTolerances = new Set(magicWandSettings.enabledTolerances);
    if (newEnabledTolerances.has(key)) {
      newEnabledTolerances.delete(key);
    } else {
      newEnabledTolerances.add(key);
    }
    onMagicWandSettingsChange({ enabledTolerances: newEnabledTolerances });
  };


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
        setAnalysis({
          rgb: { r: 0, g: 0, b: 0 },
          hex: "#000000",
          hsv: { h: 0, s: 0, v: 0 },
          lab: { l: 0, a: 0, b: 0 },
        });
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
  
  const VerticalValueBar = ({ value, max, color, label, onLabelClick, isActive }: { value: number; max: number; color: string; label: string, onLabelClick: () => void, isActive: boolean }) => (
    <div className="flex flex-col items-center gap-2 flex-1">
        <div className="w-4 h-32 bg-muted rounded-full overflow-hidden flex flex-col justify-end">
             <div className={cn("w-full", color)} style={{ height: `${(value/max) * 100}%`}}></div>
        </div>
        <button onClick={onLabelClick} className={cn("font-mono text-xs text-muted-foreground rounded-sm px-1", isActive && "bg-primary text-primary-foreground")}>{label}</button>
        <span className="font-mono text-sm">{analysis ? Math.round(value) : "-"}</span>
    </div>
  );

  const renderColorBreakdown = (label: string, values: { [key: string]: { value: number, max: number, color: string, id: keyof MagicWandSettings['tolerances'] }}) => (
     <div className="space-y-2 flex-1">
        <h5 className="font-semibold text-sm mb-2 text-center">{label}</h5>
        <div className="flex justify-around gap-2 p-2 rounded-md bg-muted/50">
            {Object.entries(values).map(([key, data]) => (
                <VerticalValueBar 
                    key={data.id} 
                    label={key} 
                    value={data.value} 
                    max={data.max} 
                    color={data.color}
                    onLabelClick={() => handleToggleTolerance(data.id)}
                    isActive={magicWandSettings.enabledTolerances.has(data.id)}
                />
            ))}
        </div>
     </div>
  );


  return (
    <div className="p-4 space-y-6">
        <div className="space-y-4">
            {renderColorValue("Hex", analysis?.hex ?? "#------", analysis?.hex ?? "transparent")}
            <Separator />
            <div className="flex gap-1">
                {renderColorBreakdown("RGB", { 
                    "R": { id: 'r', value: analysis?.rgb.r ?? 0, max: 255, color: "bg-red-500" },
                    "G": { id: 'g', value: analysis?.rgb.g ?? 0, max: 255, color: "bg-green-500" },
                    "B": { id: 'b', value: analysis?.rgb.b ?? 0, max: 255, color: "bg-blue-500" },
                })}
                 {renderColorBreakdown("HSV", {
                    "H": { id: 'h', value: analysis?.hsv.h ?? 0, max: 360, color: "bg-gradient-to-t from-red-500 via-yellow-500 to-blue-500" },
                    "S": { id: 's', value: analysis?.hsv.s ?? 0, max: 100, color: "bg-slate-400" },
                    "V": { id: 'v', value: analysis?.hsv.v ?? 0, max: 100, color: "bg-white" },
                })}
                 {renderColorBreakdown("LAB", {
                    "L": { id: 'l', value: analysis?.lab.l ?? 0, max: 100, color: "bg-gray-500" },
                    "A": { id: 'a', value: (analysis?.lab.a ?? 0) + 128, max: 256, color: "bg-gradient-to-t from-green-500 to-red-500" },
                    "b_lab": { id: 'b_lab', value: (analysis?.lab.b ?? 0) + 128, max: 256, color: "bg-gradient-to-t from-blue-500 to-yellow-500" },
                })}
            </div>
        </div>

    </div>
  )
}
