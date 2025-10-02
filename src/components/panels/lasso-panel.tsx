

"use client"

import * as React from "react"
import { LassoHoverPreview } from "../lasso-hover-preview";
import { SelectionEngine } from "@/lib/selection-engine";


interface LassoPanelProps {
  canvas: HTMLCanvasElement | null;
  mousePos: { x: number; y: number } | null;
  selectionEngine: SelectionEngine | null;
  onHoverChange: (isHovered: boolean) => void;
  className?: string;
}


export function LassoPanel({ canvas, mousePos, selectionEngine, onHoverChange, className }: LassoPanelProps) {
    
  return (
    <div className="p-4 space-y-4 flex flex-col flex-grow">
        <div className="flex flex-col flex-grow">
            <LassoHoverPreview 
                canvas={canvas} 
                mousePos={mousePos} 
                selectionEngine={selectionEngine} 
                onHoverChange={onHoverChange}
                className="flex-grow"
            />
        </div>
    </div>
  )
}
