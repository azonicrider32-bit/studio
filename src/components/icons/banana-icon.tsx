
import { cn } from "@/lib/utils";
import * as React from "react";

export const BananaIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    className={cn("lucide lucide-ai-icon", className)}
    {...props}
  >
    <text 
        x="50%" 
        y="50%" 
        dominantBaseline="central" 
        textAnchor="middle" 
        fontSize="12" 
        fontWeight="bold"
        fill="currentColor"
    >
        Ai
    </text>
  </svg>
));
BananaIcon.displayName = "AiIcon";
