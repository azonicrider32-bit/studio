
"use client";

import * as React from "react"
import { LassoHoverPreview } from "../lasso-hover-preview";
import { SelectionEngine } from "@/lib/selection-engine";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Lasso } from "lucide-react";


interface LassoPanelProps {
  canvas: HTMLCanvasElement | null;
  mousePos: { x: number; y: number } | null;
  selectionEngine: SelectionEngine | null;
  onHoverChange: (isHovered: boolean) => void;
  className?: string;
}


export function LassoPanel({ canvas, mousePos, selectionEngine, onHoverChange, className }: LassoPanelProps) {
    
  return (
    <div className={cn("p-4 space-y-4 h-full flex flex-col", className)}>
        <div className="space-y-2">
            <h3 className="font-headline text-lg flex items-center gap-2">
                <Lasso className="w-5 h-5"/>
                Lasso Zoom Preview
            </h3>
            <p className="text-sm text-muted-foreground">
            A zoomed-in view for precise path creation with the lasso tool.
            </p>
        </div>
        <Separator />
      <LassoHoverPreview 
          canvas={canvas} 
          mousePos={mousePos} 
          selectionEngine={selectionEngine} 
          onHoverChange={onHoverChange}
          className="flex-grow min-h-0"
      />
    </div>
  )
}
