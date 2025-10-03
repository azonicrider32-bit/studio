

"use client"

import * as React from "react"
import {
  Wand2,
  Brush,
  Eraser,
  SlidersHorizontal,
  Palette,
  Replace,
  Move,
  Image as ImageIcon,
  Hand,
} from "lucide-react"
import { LassoIcon } from "./icons/lasso-icon"
import { PipetteMinusIcon } from "./icons/pipette-minus-icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"

type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "adjustments" | "pipette-minus" | "clone" | "transform" | "pan";

const tools: { id: Tool; icon: React.ElementType; tooltip: string; shortcut: string; disabled?: boolean }[] = [
    { id: "transform", icon: Move, tooltip: "Transform", shortcut: "V" },
    { id: "magic-wand", icon: Wand2, tooltip: "Magic Wand", shortcut: "W" },
    { id: "lasso", icon: LassoIcon, tooltip: "Intelligent Lasso", shortcut: "L" },
    { id: "brush", icon: Brush, tooltip: "Brush", shortcut: "B" },
    { id: "eraser", icon: Eraser, tooltip: "Eraser", shortcut: "E" },
    { id: "pan", icon: Hand, tooltip: "Pan Tool", shortcut: "H" },
    { id: "clone", icon: Replace, tooltip: "Clone Stamp", shortcut: "C", disabled: true },
    { id: "pipette-minus", icon: PipetteMinusIcon, tooltip: "Sample Exclusion Color", shortcut: "I" },
    { id: "adjustments", icon: SlidersHorizontal, tooltip: "Adjustments", shortcut: "A" },
]

interface ToolPanelProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  onToggleAssetDrawer: () => void;
}

export function ToolPanel({ activeTool, setActiveTool, onToggleAssetDrawer }: ToolPanelProps) {
  return (
    <div className="flex h-full flex-col items-center justify-between gap-2 border-r bg-background p-2">
      <div className="flex flex-col items-center gap-2">
        <TooltipProvider>
            {tools.map((tool) => (
            <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                <Button
                    variant={activeTool === tool.id ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTool(tool.id)}
                    disabled={tool.disabled}
                    className="h-12 w-12"
                >
                    <tool.icon className="h-5 w-5" />
                </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                <p>{tool.tooltip} ({tool.shortcut})</p>
                </TooltipContent>
            </Tooltip>
            ))}
        </TooltipProvider>
      </div>
      <div className="flex flex-col items-center gap-2">
          <Separator />
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onToggleAssetDrawer} className="h-12 w-12">
                        <ImageIcon className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Asset Library</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
      </div>
    </div>
  )
}
