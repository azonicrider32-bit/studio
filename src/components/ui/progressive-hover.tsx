"use client";

import * as React from "react";
import { Popover, PopoverContent } from "./popover";
import { Tooltip, TooltipContent, TooltipProvider } from "./tooltip";

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
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [detailLevel, setDetailLevel] = React.useState(0);
  const summaryTimer = React.useRef<NodeJS.Timeout>();
  const detailTimer = React.useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    // Show initial tooltip immediately if popover isn't already open
    if (!popoverOpen) {
      setTooltipOpen(true);
    }
    
    // Set timer for the summary popover
    summaryTimer.current = setTimeout(() => {
      setTooltipOpen(false); // Hide tooltip when popover opens
      setPopoverOpen(true);
      setDetailLevel(1);
    }, summaryDelay);
    
    // Set timer for the detailed popover content
    if (detailedContent) {
      detailTimer.current = setTimeout(() => {
        setTooltipOpen(false); // Ensure tooltip is hidden
        setPopoverOpen(true);
        setDetailLevel(2);
      }, detailDelay);
    }
  };

  const handleMouseLeave = () => {
    // Clear all timers and close everything on mouse leave
    clearTimeout(summaryTimer.current);
    clearTimeout(detailTimer.current);
    setTooltipOpen(false);
    setPopoverOpen(false);
    setDetailLevel(0);
  };
  
  const popoverContent = (
    <div className="space-y-2">
        <div className="font-semibold text-foreground">{summaryContent}</div>
        {detailLevel === 2 && detailedContent && <div className="text-muted-foreground text-sm">{detailedContent}</div>}
    </div>
  );

  // This structure is now correct. A single div handles the hover events for both Tooltip and Popover.
  return (
    <TooltipProvider>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
          {/* A single div as the trigger for everything */}
          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {children}
          </div>
          <TooltipContent side="left">
            {initialContent}
          </TooltipContent>
        </Tooltip>
        <PopoverContent side="left" align="start" className="w-80">
          {popoverContent}
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
