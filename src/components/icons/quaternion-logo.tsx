
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export const QuaternionLogo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg width="28" height="28" viewBox="0 0 100 100" {...props} className={cn("w-auto h-auto", className)}>
    <defs>
      {/* The Conic Gradient for the full color spectrum */}
      <conicGradient id="grad1" from="0deg" at="50% 50%">
        <stop offset="0%" stopColor="#ff4444" /> {/* Red */}
        <stop offset="12.5%" stopColor="#ff8c00" /> {/* Orange */}
        <stop offset="25%" stopColor="#f0e68c" /> {/* Yellow */}
        <stop offset="37.5%" stopColor="#9acd32" /> {/* Green */}
        <stop offset="50%" stopColor="#40e0d0" /> {/* Turquoise */}
        <stop offset="62.5%" stopColor="#87ceeb" /> {/* Sky Blue */}
        <stop offset="75%" stopColor="#00008b" /> {/* Deep Blue */}
        <stop offset="87.5%" stopColor="#9400d3" /> {/* Purple */}
        <stop offset="100%" stopColor="#ff4444" /> {/* Back to Red */}
      </conicGradient>

      {/* The Radial Gradient for the white-to-black value overlay */}
      <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity="1" />
        <stop offset="50%" stopColor="white" stopOpacity="0.5" />
        <stop offset="75%" stopColor="black" stopOpacity="0.3" />
        <stop offset="100%" stopColor="black" stopOpacity="0.8" />
      </radialGradient>
      
      {/* Mask to create the hole in the center */}
      <mask id="hole">
        <rect width="100" height="100" fill="white" />
        <circle cx="50" cy="50" r="5" fill="black" />
      </mask>
    </defs>
    
    {/* Base circle with the color gradient */}
    <circle cx="50" cy="50" r="50" fill="url(#grad1)" />

    {/* Overlay with the value gradient, with a hole in the middle */}
    <rect x="0" y="0" width="100" height="100" fill="url(#grad2)" mask="url(#hole)" style={{mixBlendMode: 'overlay'}}/>

    {/* Structural lines */}
    <g stroke="black" strokeWidth="2" strokeOpacity="0.5">
        <path d="M 50 0 V 100" />
        <path d="M 0 50 H 100" />
        <path d="M 0 0 L 100 100" />
        <path d="M 100 0 L 0 100" />
    </g>
  </svg>
);
