

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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "@/lib/utils"

type Tool = "magic-wand" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line";

const toolDetails = {
  transform: {
    id: "transform",
    icon: CustomMove,
    tooltip: "Transform Tool",
    shortcut: "V",
    summary: "Move, scale, and rotate layers or selections.",
    details: "The transform tool allows you to apply transformations to the active layer or selection. Hold Shift to maintain aspect ratio while scaling. Click and drag outside the selection to rotate.",
  },
  "magic-wand": {
    id: "magic-wand",
    icon: CustomWand2,
    tooltip: "Magic Wand",
    shortcut: "W",
    summary: "Select similarly colored pixels.",
    details: "Click on an area of the image to select all contiguous pixels of a similar color. The tolerance can be adjusted in the settings panel to control how 'similar' the colors must be.",
  },
  lasso: {
    id: "lasso",
    icon: MagnetLassoIcon,
    tooltip: "Intelligent Lasso",
    shortcut: "L",
    summary: "Draw a freehand selection with edge-snapping.",
    details: "Draw a freehand selection around an object. The 'Magic Snap' mode will automatically snap the selection path to the most prominent edges it detects. Other modes like Polygon and Free Draw are available.",
  },
  line: {
    id: "line",
    icon: CustomPenTool,
    tooltip: "Line Tool",
    shortcut: "P",
    summary: "Create straight or curved path segments.",
    details: "Click to create anchor points for a path. The path can be used to create precise selections or vector shapes. Press Enter to complete the path.",
    disabled: false,
  },
  brush: {
    id: "brush",
    icon: CustomBrush,
    tooltip: "Brush Tool",
    shortcut: "B",
    summary: "Paint on a layer or a mask.",
    details: "The Brush Tool allows you to paint with a specific color and brush size. It can be used to add to a layer or to paint on a layer mask to show or hide parts of a layer.",
  },
  eraser: {
    id: "eraser",
    icon: CustomEraser,
    tooltip: "Eraser Tool",
    shortcut: "E",
    summary: "Erase pixels from a layer.",
    details: "The Eraser Tool removes pixel data from a layer. If used on a layer with a mask, it will typically edit the mask. The size and softness of the eraser can be adjusted.",
  },
  pan: {
    id: "pan",
    icon: CustomHand,
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
    disabled: true,
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
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [detailLevel, setDetailLevel] = React.useState(0); // 0: none, 1: summary, 2: detailed
  const summaryTimer = React.useRef<NodeJS.Timeout>();
  const detailTimer = React.useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    summaryTimer.current = setTimeout(() => {
      setPopoverOpen(true);
      setDetailLevel(1);
    }, 1500); // 1.5 seconds for summary

    detailTimer.current = setTimeout(() => {
      setPopoverOpen(true);
      setDetailLevel(2);
    }, 4000); // 4 seconds for detailed view
  };

  const handleMouseLeave = () => {
    clearTimeout(summaryTimer.current);
    clearTimeout(detailTimer.current);
    setPopoverOpen(false);
    setDetailLevel(0);
  };
  
  const content = (
    <div className="space-y-2">
        <p className="font-semibold text-foreground">{tool.summary}</p>
        {detailLevel === 2 && <p className="text-muted-foreground">{tool.details}</p>}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-80">
            {content}
          </PopoverContent>
        </Popover>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tool.tooltip} ({tool.shortcut})</p>
      </TooltipContent>
    </Tooltip>
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
    <div className="h-full flex-shrink-0 w-20 flex flex-col items-center justify-between gap-2 border-r border-border/10 bg-background/80 backdrop-blur-sm p-2 z-30">
      <div className="flex flex-col items-center gap-2">
        <div className="h-14 w-14 flex items-center justify-center">
            <div className="font-headline font-black text-4xl text-red-500">
                Ps
            </div>
        </div>
        <TooltipProvider>
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

