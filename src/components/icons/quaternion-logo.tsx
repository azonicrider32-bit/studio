
"use client";

import React from 'react';

export const QuaternionLogo = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" style={{ background: 'black', borderRadius: '50%' }}>
    <defs>
      <conicGradient id="grad1" from="0deg" at="50% 50%">
        <stop offset="0%" stopColor="#ff0000" />
        <stop offset="12.5%" stopColor="#ff8000" />
        <stop offset="25%" stopColor="#ffff00" />
        <stop offset="37.5%" stopColor="#80ff00" />
        <stop offset="50%" stopColor="#00ff00" />
        <stop offset="62.5%" stopColor="#00ff80" />
        <stop offset="75%" stopColor="#00ffff" />
        <stop offset="87.5%" stopColor="#0080ff" />
        <stop offset="100%" stopColor="#ff0000" />
      </conicGradient>
       <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity="1" />
        <stop offset="30%" stopColor="white" stopOpacity="0.3" />
        <stop offset="100%" stopColor="black" stopOpacity="0" />
      </radialGradient>
       <mask id="hole">
        <rect width="100" height="100" fill="white" />
        <circle cx="50" cy="50" r="5" fill="black" />
      </mask>
    </defs>
    
    <circle cx="50" cy="50" r="50" fill="url(#grad1)" />

    <rect x="0" y="0" width="100" height="100" fill="url(#grad2)" mask="url(#hole)" />

    <path d="M 50 0 V 100" stroke="black" strokeWidth="3" />
    <path d="M 0 50 H 100" stroke="black" strokeWidth="3" />
    <path d="M 0 0 L 100 100" stroke="black" strokeWidth="3" />
    <path d="M 100 0 L 0 100" stroke="black" strokeWidth="3" />
  </svg>
);
