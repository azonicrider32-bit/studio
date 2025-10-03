
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
    <div className={cn("p-4 space-y-4 flex flex-col h-full", className)}>
      <LassoHoverPreview 
          canvas={canvas} 
          mousePos={mousePos} 
          selectionEngine={selectionEngine} 
          onHoverChange={onHoverChange}
          className="flex-1"
      />
    </div>
  )
}

    