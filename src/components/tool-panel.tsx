

"use client"

import * as React from "react"
import {
  SlidersHorizontal,
  Replace,
  Settings2,
  Wand2,
  Lasso,
  PenTool,
  Paintbrush,
  Eraser,
  Move,
  Hand,
  Info,
  X,
  Sparkles,
  BrainCircuit,
  PanelLeft,
  Trash2,
  Plus,
  Palette,
  Smile,
} from "lucide-react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { SidebarTrigger, useSidebar } from "./ui/sidebar"
import { ProgressiveHover } from "./ui/progressive-hover"
import { BananaIcon } from "./icons/banana-icon"
import { AITool, Tool } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CustomWand2 } from "./icons/custom-tool-icons"

const manualToolDetails: Record<Tool, {
    id: Tool;
    icon: React.ElementType;
    tooltip: string;
    shortcut: string;
    summary: string;
    details: string;
    disabled?: boolean;
}> = {
  transform: { id: "transform", icon: Move, tooltip: "Transform Tool", shortcut: "V", summary: "Move, scale, and rotate layers or selections.", details: "The transform tool allows you to apply transformations to the active layer or selection. Hold Shift to maintain aspect ratio while scaling. Click and drag outside the selection to rotate." },
  "magic-wand": { id: "magic-wand", icon: Wand2, tooltip: "Magic Wand", shortcut: "W", summary: "Select similarly colored pixels.", details: "Click on an area of the image to select all contiguous pixels of a similar color. The tolerance can be adjusted in the settings panel to control how 'similar' the colors must be." },
  "wand-v2": { id: "wand-v2", icon: CustomWand2, tooltip: "Magic Wand V2", shortcut: "W", summary: "High-performance pixel selection.", details: "A faster, more optimized version of the Magic Wand tool using advanced memory and algorithm techniques for real-time performance." },
  lasso: { id: "lasso", icon: Lasso, tooltip: "Intelligent Lasso", shortcut: "L", summary: "Draw a freehand selection with edge-snapping.", details: "Draw a freehand selection around an object. The 'Magic Snap' mode will automatically snap the selection path to the most prominent edges it detects. Other modes like Polygon and Free Draw are available." },
  line: { id: "line", icon: PenTool, tooltip: "Line Tool", shortcut: "P", summary: "Create straight or curved path segments.", details: "Click to create anchor points for a path. The path can be used to create precise selections or vector shapes. Press Enter to complete the path.", disabled: false },
  brush: { id: "brush", icon: Paintbrush, tooltip: "Brush Tool", shortcut: "B", summary: "Paint on a layer or a mask.", details: "The Brush Tool allows you to paint with a specific color and brush size. It can be used to add to a layer or to paint on a layer mask to show or hide parts of a layer." },
  eraser: { id: "eraser", icon: Eraser, tooltip: "Eraser Tool", shortcut: "E", summary: "Erase pixels from a layer.", details: "The Eraser Tool removes pixel data from a layer. If used on a layer with a mask, it will typically edit the mask. The size and softness of the eraser can be adjusted." },
  pan: { id: "pan", icon: Hand, tooltip: "Pan Tool", shortcut: "H", summary: "Move the canvas view.", details: "Click and drag the canvas to navigate around the image without affecting the image itself. This is useful when you are zoomed in." },
  clone: { id: "clone", icon: Replace, tooltip: "Clone Stamp", shortcut: "C", summary: "Paint with pixels from another part of the image.", details: "The Clone Stamp tool allows you to duplicate part of an image. Alt-click to define a source point, then click and drag to paint with the sampled pixels.", disabled: false },
  banana: { id: "banana", icon: BananaIcon, tooltip: "Nano Banana Tool", shortcut: "N", summary: "Visually instruct the AI to perform edits.", details: "Draw and write directly on the canvas to tell the AI what to change. Use Shift to create new colored instruction layers." },
  'blemish-remover': { id: "blemish-remover", icon: Sparkles, tooltip: "Blemish Remover", shortcut: "J", summary: "Quickly remove small imperfections.", details: "Click and drag over an area to automatically select, inpaint, and replace it." },
  'character-sculpt': { id: "character-sculpt", icon: Smile, tooltip: "Character Sculpt", shortcut: "K", summary: "Morph facial and body features with AI.", details: "Use sliders to define changes to facial or body proportions. The AI will generate a new image based on your adjustments." },
  settings: { id: "settings", icon: Settings2, tooltip: "Global Settings", shortcut: "", summary: "Configure application-wide preferences for UI, performance, and more.", details: "Access global settings for the entire application, including theme customization, hotkey management, and performance options." }
};

const manualTools = Object.values(manualToolDetails).filter(t => t.id !== 'settings');

interface ToolPanelProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  showHotkeys: boolean;
  onAiToolClick: (tool: AITool) => void;
}

const ToolButtonWithProgressiveHover = ({
  tool,
  isActive,
  onClick,
  showHotkey,
}: {
  tool: { id: string, icon: React.ElementType, tooltip: string, shortcut: string, summary: string, details: string, disabled?: boolean };
  isActive: boolean;
  onClick: () => void;
  showHotkey: boolean;
}) => {
  return (
    <ProgressiveHover
      initialContent={tool.tooltip}
      summaryContent={tool.summary}
      detailedContent={tool.details}
    >
        <Button
          variant={"ghost"}
          size="icon"
          onClick={onClick}
          disabled={tool.disabled}
          className="h-12 w-12 relative ps-tool-icon-container bg-transparent hover:bg-white/10"
          data-state={isActive ? "on" : "off"}
        >
          <div className="ps-tool-icon">
            <tool.icon className="h-6 w-6 ps-tool-icon__icon" />
          </div>
          {showHotkey && tool.shortcut && <span className="absolute bottom-1 right-1.5 text-xs font-bold opacity-60">{tool.shortcut}</span>}
        </Button>
    </ProgressiveHover>
  );
};


export function ToolPanel({
  activeTool,
  setActiveTool,
  showHotkeys,
}: ToolPanelProps) {
  const { state: sidebarState, setOpen: setSidebarOpen } = useSidebar();
  return (
    <div className="h-full flex-shrink-0 w-16 flex flex-col items-center justify-between gap-2 border-r border-border/10 bg-background/80 backdrop-blur-sm p-2 z-30">
      <div className="flex flex-col items-center gap-2">
        <TooltipProvider>
            
            <Separator className="bg-border/10 my-2"/>

            <div className="flex flex-col gap-1">
                {manualTools.map((tool) => (
                  <ToolButtonWithProgressiveHover
                    key={tool.id}
                    tool={tool}
                    isActive={activeTool === tool.id}
                    onClick={() => setActiveTool(tool.id as Tool)}
                    showHotkey={showHotkeys}
                  />
                ))}
            </div>
            
        </TooltipProvider>
      </div>
      <div className="flex flex-col items-center gap-2">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSidebarOpen(s => !s)}
                        className={cn("h-12 w-12", sidebarState === 'expanded' ? "text-destructive" : "text-foreground")}
                    >
                        <PanelLeft className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{sidebarState === 'expanded' ? "Collapse Panel" : "Expand Panel"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
