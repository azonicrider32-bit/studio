
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
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-banana", className)}
    {...props}
  >
    <path d="M4 13.5c3.5-2 8.5-2 12 0" />
    <path d="m18 13.5 4-4" />
    <path d="m6 13.5-4-4" />
    <path d="M8.5 12C6 11.5 4.5 10 4 8" />
  </svg>
));
BananaIcon.displayName = "BananaIcon";
