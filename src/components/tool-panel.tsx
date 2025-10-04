

"use client"

import * as React from "react"
import {
  SlidersHorizontal,
  Replace,
  Image as ImageIcon,
  PanelLeft,
  Settings2,
} from "lucide-react"

import {
  CustomWand2,
  CustomBrush,
  CustomEraser,
  CustomMove,
  CustomHand,
  CustomPenTool,
  MagnetLassoIcon,
} from "@/components/icons/custom-tool-icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { useSidebar } from "./ui/sidebar"

type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line";

const tools: { id: Tool; icon: React.ElementType; tooltip: string; shortcut: string; disabled?: boolean }[] = [
    { id: "transform", icon: CustomMove, tooltip: "Transform", shortcut: "V" },
    { id: "magic-wand", icon: CustomWand2, tooltip: "Magic Wand", shortcut: "W" },
    { id: "lasso", icon: MagnetLassoIcon, tooltip: "Intelligent Lasso", shortcut: "L" },
    { id: "line", icon: CustomPenTool, tooltip: "Line Tool", shortcut: "P"},
    { id: "brush", icon: CustomBrush, tooltip: "Brush", shortcut: "B" },
    { id: "eraser", icon: CustomEraser, tooltip: "Eraser", shortcut: "E" },
    { id: "pan", icon: CustomHand, tooltip: "Pan Tool", shortcut: "H" },
    { id: "clone", icon: Replace, tooltip: "Clone Stamp", shortcut: "C", disabled: true },
]

interface ToolPanelProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  onToggleAssetDrawer: () => void;
  showHotkeys: boolean;
}

export function ToolPanel({ activeTool, setActiveTool, onToggleAssetDrawer, showHotkeys }: ToolPanelProps) {
  
  return (
    <div className="h-full flex-shrink-0 w-20 flex flex-col items-center justify-between gap-2 border-r border-border/10 bg-background/80 backdrop-blur-sm p-2 z-30">
      <div className="flex flex-col items-center gap-2">
        <div className="h-14 w-14 flex items-center justify-center">
            <div className="font-headline font-black text-4xl text-red-500">
                Ps
            </div>
        </div>
        <TooltipProvider>
            {tools.map((tool) => (
            <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                <Button
                    variant={"ghost"}
                    size="icon"
                    onClick={() => setActiveTool(tool.id)}
                    disabled={tool.disabled}
                    className="h-12 w-12 relative ps-tool-icon-container bg-transparent hover:bg-white/10"
                    data-state={activeTool === tool.id ? "on" : "off"}
                >
                    <div className="ps-tool-icon">
                        <tool.icon className="h-6 w-6 ps-tool-icon__icon" />
                    </div>
                    {showHotkeys && <span className="absolute bottom-1 right-1.5 text-xs font-bold opacity-60">{tool.shortcut}</span>}
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
          <Separator className="bg-border/10"/>
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setActiveTool('settings')} className="h-12 w-12 relative ps-tool-icon-container bg-transparent hover:bg-white/10" data-state={activeTool === 'settings' ? "on" : "off"}>
                        <div className="ps-tool-icon">
                            <Settings2 className="h-5 w-5 ps-tool-icon__icon" />
                        </div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Global Settings</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onToggleAssetDrawer} className="h-12 w-12 relative ps-tool-icon-container bg-transparent hover:bg-white/10">
                        <div className="ps-tool-icon">
                            <ImageIcon className="h-5 w-5 ps-tool-icon__icon" />
                        </div>
                        {showHotkeys && <span className="absolute bottom-1 right-1.5 text-xs font-bold opacity-60">O</span>}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>Asset Library (O)</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
      </div>
    </div>
  )
}
