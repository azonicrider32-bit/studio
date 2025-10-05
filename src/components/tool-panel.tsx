

"use client"

import * as React from "react"
import {
  SlidersHorizontal,
  Replace,
  Image as ImageIcon,
  PanelLeft,
  Settings2,
  Ruler,
  MoveHorizontal,
  MoveVertical,
  Wand2,
  Lasso,
  PenTool,
  Paintbrush,
  Eraser,
  Move,
  Hand,
} from "lucide-react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { useSidebar, SidebarTrigger } from "./ui/sidebar"
import { ProgressiveHover } from "./ui/progressive-hover"

type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line";

const toolDetails = {
  transform: {
    id: "transform",
    icon: Move,
    tooltip: "Transform Tool",
    shortcut: "V",
    summary: "Move, scale, and rotate layers or selections.",
    details: "The transform tool allows you to apply transformations to the active layer or selection. Hold Shift to maintain aspect ratio while scaling. Click and drag outside the selection to rotate.",
  },
  "magic-wand": {
    id: "magic-wand",
    icon: Wand2,
    tooltip: "Magic Wand",
    shortcut: "W",
    summary: "Select similarly colored pixels.",
    details: "Click on an area of the image to select all contiguous pixels of a similar color. The tolerance can be adjusted in the settings panel to control how 'similar' the colors must be.",
  },
  lasso: {
    id: "lasso",
    icon: Lasso,
    tooltip: "Intelligent Lasso",
    shortcut: "L",
    summary: "Draw a freehand selection with edge-snapping.",
    details: "Draw a freehand selection around an object. The 'Magic Snap' mode will automatically snap the selection path to the most prominent edges it detects. Other modes like Polygon and Free Draw are available.",
  },
  line: {
    id: "line",
    icon: PenTool,
    tooltip: "Line Tool",
    shortcut: "P",
    summary: "Create straight or curved path segments.",
    details: "Click to create anchor points for a path. The path can be used to create precise selections or vector shapes. Press Enter to complete the path.",
    disabled: false,
  },
  brush: {
    id: "brush",
    icon: Paintbrush,
    tooltip: "Brush Tool",
    shortcut: "B",
    summary: "Paint on a layer or a mask.",
    details: "The Brush Tool allows you to paint with a specific color and brush size. It can be used to add to a layer or to paint on a layer mask to show or hide parts of a layer.",
  },
  eraser: {
    id: "eraser",
    icon: Eraser,
    tooltip: "Eraser Tool",
    shortcut: "E",
    summary: "Erase pixels from a layer.",
    details: "The Eraser Tool removes pixel data from a layer. If used on a layer with a mask, it will typically edit the mask. The size and softness of the eraser can be adjusted.",
  },
  pan: {
    id: "pan",
    icon: Hand,
    tooltip: "Pan Tool",
    shortcut: "H",
    summary: "Move the canvas view.",
    details: "Click and drag the canvas to navigate around the image without affecting the image itself. This is useful when you are zoomed in.",
  },
  clone: {
    id: "clone",
    icon: Replace,
    tooltip: "Clone Stamp",
    shortcut: "C",
    summary: "Paint with pixels from another part of the image.",
    details: "The Clone Stamp tool allows you to duplicate part of an image. Alt-click to define a source point, then click and drag to paint with the sampled pixels.",
    disabled: false,
  },
};

const tools: (typeof toolDetails)[keyof typeof toolDetails][] = [
    toolDetails.transform,
    toolDetails["magic-wand"],
    toolDetails.lasso,
    toolDetails.line,
    toolDetails.brush,
    toolDetails.eraser,
    toolDetails.pan,
    toolDetails.clone,
]

interface ToolPanelProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  showHotkeys: boolean;
  showHorizontalRuler: boolean;
  onToggleHorizontalRuler: () => void;
  showVerticalRuler: boolean;
  onToggleVerticalRuler: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
}

const ToolButtonWithProgressiveHover = ({
  tool,
  isActive,
  onClick,
  showHotkey,
}: {
  tool: (typeof toolDetails)[keyof typeof toolDetails];
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
          {showHotkey && <span className="absolute bottom-1 right-1.5 text-xs font-bold opacity-60">{tool.shortcut}</span>}
        </Button>
    </ProgressiveHover>
  );
};


export function ToolPanel({
  activeTool,
  setActiveTool,
  showHotkeys,
  showHorizontalRuler,
  onToggleHorizontalRuler,
  showVerticalRuler,
  onToggleVerticalRuler,
  showGuides,
  onToggleGuides
}: ToolPanelProps) {
  
  return (
    <div className="h-full flex-shrink-0 w-16 flex flex-col items-center justify-between gap-2 border-r border-border/10 bg-background/80 backdrop-blur-sm p-2 z-30">
      <div className="flex flex-col items-center gap-2">
        <TooltipProvider>
            <SidebarTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12">
                <PanelLeft />
              </Button>
            </SidebarTrigger>
            <Separator className="bg-border/10 my-2"/>
            {tools.map((tool) => (
              <ToolButtonWithProgressiveHover
                key={tool.id}
                tool={tool}
                isActive={activeTool === tool.id}
                onClick={() => setActiveTool(tool.id as Tool)}
                showHotkey={showHotkeys}
              />
            ))}
             <Separator className="bg-border/10 my-2"/>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={showHorizontalRuler ? "secondary" : "ghost"} size="icon" className="h-10 w-10" onClick={onToggleHorizontalRuler}>
                        <MoveHorizontal className="w-5 h-5"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Toggle Horizontal Ruler</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={showVerticalRuler ? "secondary" : "ghost"} size="icon" className="h-10 w-10" onClick={onToggleVerticalRuler}>
                        <MoveVertical className="w-5 h-5"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Toggle Vertical Ruler</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={showGuides ? "secondary" : "ghost"} size="icon" className="h-10 w-10" onClick={onToggleGuides}>
                        <Ruler className="w-5 h-5"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Toggle Guides</p></TooltipContent>
              </Tooltip>
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
          </TooltipProvider>
      </div>
    </div>
  )
}
