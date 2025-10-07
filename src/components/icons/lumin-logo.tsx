"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export const LuminLogo = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    width="80"
    height="28"
    viewBox="0 0 80 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-auto h-5", className)}
    {...props}
  >
    <defs>
      <linearGradient
        id="lumin-gradient"
        x1="0"
        y1="14"
        x2="80"
        y2="14"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <path
      d="M0 28V0H8V20.8889H0V28Z"
      fill="url(#lumin-gradient)"
    />
    <path
      d="M11.5556 28V7.11111H19.5556V28H11.5556Z"
      fill="url(#lumin-gradient)"
    />
    <path
      d="M32.8889 20.8889C32.8889 24.8148 29.8148 27.8889 25.8889 27.8889C21.963 27.8889 18.8889 24.8148 18.8889 20.8889V0H26.8889V20.8889C26.8889 21.3259 26.5815 21.8889 25.8889 21.8889C25.1963 21.8889 24.8889 21.3259 24.8889 20.8889V0H32.8889V20.8889Z"
      fill="url(#lumin-gradient)"
    />
    <path
      d="M48.4445 28V0H56.4445V28H48.4445Z"
      fill="url(#lumin-gradient)"
    />
    <path
      d="M43.5 13C45.9853 13 48 10.9853 48 8.5C48 6.01472 45.9853 4 43.5 4C41.0147 4 39 6.01472 39 8.5C39 10.9853 41.0147 13 43.5 13Z"
      fill="url(#lumin-gradient)"
    />
    <path
      d="M43.5 28C45.9853 28 48 25.9853 48 23.5C48 21.0147 45.9853 19 43.5 19C41.0147 19 39 21.0147 39 23.5C39 25.9853 41.0147 28 43.5 28Z"
      fill="url(#lumin-gradient)"
    />
    <path
      d="M60.8889 28V0H68.8889V20.8889H74.8889V28H60.8889Z"
      fill="url(#lumin-gradient)"
    />
  </svg>
));
LuminLogo.displayName = "LuminLogo";
