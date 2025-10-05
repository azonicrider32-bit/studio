
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
} from "lucide-react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { SidebarTrigger } from "./ui/sidebar"
import { ProgressiveHover } from "./ui/progressive-hover"
import { BananaIcon } from "./icons/banana-icon"
import { AITool, Tool } from "@/lib/types"
import { cn } from "@/lib/utils"

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
  lasso: { id: "lasso", icon: Lasso, tooltip: "Intelligent Lasso", shortcut: "L", summary: "Draw a freehand selection with edge-snapping.", details: "Draw a freehand selection around an object. The 'Magic Snap' mode will automatically snap the selection path to the most prominent edges it detects. Other modes like Polygon and Free Draw are available." },
  line: { id: "line", icon: PenTool, tooltip: "Line Tool", shortcut: "P", summary: "Create straight or curved path segments.", details: "Click to create anchor points for a path. The path can be used to create precise selections or vector shapes. Press Enter to complete the path.", disabled: false },
  brush: { id: "brush", icon: Paintbrush, tooltip: "Brush Tool", shortcut: "B", summary: "Paint on a layer or a mask.", details: "The Brush Tool allows you to paint with a specific color and brush size. It can be used to add to a layer or to paint on a layer mask to show or hide parts of a layer." },
  eraser: { id: "eraser", icon: Eraser, tooltip: "Eraser Tool", shortcut: "E", summary: "Erase pixels from a layer.", details: "The Eraser Tool removes pixel data from a layer. If used on a layer with a mask, it will typically edit the mask. The size and softness of the eraser can be adjusted." },
  pan: { id: "pan", icon: Hand, tooltip: "Pan Tool", shortcut: "H", summary: "Move the canvas view.", details: "Click and drag the canvas to navigate around the image without affecting the image itself. This is useful when you are zoomed in." },
  clone: { id: "clone", icon: Replace, tooltip: "Clone Stamp", shortcut: "C", summary: "Paint with pixels from another part of the image.", details: "The Clone Stamp tool allows you to duplicate part of an image. Alt-click to define a source point, then click and drag to paint with the sampled pixels.", disabled: false },
  banana: { id: "banana", icon: BananaIcon, tooltip: "Nano Banana Tool", shortcut: "N", summary: "Visually instruct the AI to perform edits.", details: "Draw and write directly on the canvas to tell the AI what to change. Use Shift to create new colored instruction layers." },
  'blemish-remover': { id: "blemish-remover", icon: Sparkles, tooltip: "Blemish Remover", shortcut: "J", summary: "Quickly remove small imperfections.", details: "Click and drag over an area to automatically select, inpaint, and replace it." },
  settings: { id: "settings", icon: Settings2, tooltip: "Global Settings", shortcut: "", summary: "Configure application-wide preferences for UI, performance, and more.", details: "Access global settings for the entire application, including theme customization, hotkey management, and performance options." }
};

const aiToolDetails: Record<string, {
    id: Tool | string;
    icon: React.ElementType;
    tooltip: string;
    shortcut: string;
    summary: string;
    details: string;
    disabled?: boolean;
    isOneClick?: boolean;
}> = {
    banana: manualToolDetails.banana,
    'blemish-remover': { ...manualToolDetails['blemish-remover'], isOneClick: true },
    'remove-object': { id: 'remove-object', icon: Trash2, tooltip: 'Remove Object', shortcut: '', summary: 'Remove an object from the scene.', details: 'Draw a mask around an object to remove it and have the AI intelligently fill the background.', isOneClick: true },
    'add-object': { id: 'add-object', icon: Plus, tooltip: 'Add Object', shortcut: '', summary: 'Add a new object to the scene.', details: 'Draw a rough shape and provide a prompt to generate a new object that matches the scene\'s perspective and lighting.', isOneClick: true },
    'change-color': { id: 'change-color', icon: Palette, tooltip: 'Change Color', shortcut: '', summary: 'Change the color of an object.', details: 'Select an object and use a text prompt or color picker to change its color while preserving texture and lighting.', isOneClick: true },
};


const manualTools = Object.values(manualToolDetails).filter(t => t.id !== 'settings' && !aiToolDetails[t.id]);
const aiTools = Object.values(aiToolDetails);


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
  onAiToolClick,
}: ToolPanelProps) {
  const [activeToolbar, setActiveToolbar] = React.useState<'manual' | 'ai'>('manual');
  
  return (
    <div className="h-full flex-shrink-0 w-16 flex flex-col items-center justify-between gap-2 border-r border-border/10 bg-background/80 backdrop-blur-sm p-2 z-30">
      <div className="flex flex-col items-center gap-2">
        <TooltipProvider>
            
            <Separator className="bg-border/10 my-2"/>

            <div className="flex flex-col gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant={activeToolbar === 'manual' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="h-8"
                            onClick={() => setActiveToolbar('manual')}
                        >
                            <Paintbrush className="w-4 h-4"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>Manual Tools</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant={activeToolbar === 'ai' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="h-8"
                            onClick={() => setActiveToolbar('ai')}
                        >
                            <BrainCircuit className="w-4 h-4"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>AI Tools</p></TooltipContent>
                </Tooltip>
            </div>
            
            <Separator className="bg-border/10 my-2"/>
            
            {activeToolbar === 'manual' && manualTools.map((tool) => (
              <ToolButtonWithProgressiveHover
                key={tool.id}
                tool={tool}
                isActive={activeTool === tool.id}
                onClick={() => setActiveTool(tool.id as Tool)}
                showHotkey={showHotkeys}
              />
            ))}

            {activeToolbar === 'ai' && aiTools.map((tool) => (
               <ToolButtonWithProgressiveHover
                key={tool.id}
                tool={tool}
                isActive={activeTool === tool.id}
                onClick={() => {
                  if (tool.isOneClick) {
                    onAiToolClick(tool as AITool);
                  } else {
                    setActiveTool(tool.id as Tool);
                  }
                }}
                showHotkey={showHotkeys}
              />
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
          </TooltipProvider>
      </div>
    </div>
  )
}
