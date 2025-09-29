import { cn } from "@/lib/utils";
import * as React from "react";

export const LassoIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-lasso", className)}
    {...props}
  >
    <path d="M11.25 5.5c-2.42 1.45-3.38 4.38-2.75 6.75s2.9 4.5 5.32 5.14" />
    <path d="M15.14 17.32c2.42-1.45 3.38-4.38 2.75-6.75s-2.9-4.5-5.32-5.14" />
    <path d="M12 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    <path d="m12 15.5 6-6" />
  </svg>
));
LassoIcon.displayName = "LassoIcon";
