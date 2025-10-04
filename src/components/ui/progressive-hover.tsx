"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface ProgressiveHoverProps {
  children: React.ReactNode;
  initialContent: React.ReactNode;
  summaryContent: React.ReactNode;
  detailedContent?: React.ReactNode;
  summaryDelay?: number;
  detailDelay?: number;
}

export function ProgressiveHover({
  children,
  initialContent,
  summaryContent,
  detailedContent,
  summaryDelay = 1500,
  detailDelay = 4000,
}: ProgressiveHoverProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [detailLevel, setDetailLevel] = React.useState(0);
  const summaryTimer = React.useRef<NodeJS.Timeout>();
  const detailTimer = React.useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    summaryTimer.current = setTimeout(() => {
      setPopoverOpen(true);
      setDetailLevel(1);
    }, summaryDelay);

    if (detailedContent) {
        detailTimer.current = setTimeout(() => {
            setPopoverOpen(true);
            setDetailLevel(2);
        }, detailDelay);
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(summaryTimer.current);
    clearTimeout(detailTimer.current);
    setPopoverOpen(false);
    setDetailLevel(0);
  };
  
  const content = (
    <div className="space-y-2">
        <div className="font-semibold text-foreground">{summaryContent}</div>
        {detailLevel === 2 && detailedContent && <div className="text-muted-foreground text-sm">{detailedContent}</div>}
    </div>
  );

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                        {children}
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" className="w-80">
                        {content}
                    </PopoverContent>
                </Popover>
            </TooltipTrigger>
            <TooltipContent side="left">
                {initialContent}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
