import { cn } from "@/lib/utils";
import * as React from "react";

export const PipetteMinusIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-pipette", className)}
    {...props}
  >
    <path d="m2 22 1-1" />
    <path d="M3.5 20.5 12 12" />
    <path d="m12 12 4-4" />
    <path d="m16 8 5-5" />
    <path d="M14 4 20 10" />
    <path d="M12 12 6.5 17.5" />
    <path d="M14.5 9.5 20 4" />
    <path d="M17 14h6" />
  </svg>
));
PipetteMinusIcon.displayName = "PipetteMinusIcon";
