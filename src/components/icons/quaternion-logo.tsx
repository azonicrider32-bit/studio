
import React from 'react';

export const QuaternionLogo = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style={{ stopColor: 'rgb(255,255,255)', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: 'rgb(0,0,0)', stopOpacity: 1 }} />
      </radialGradient>
      <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'rgba(217, 9, 9, 1)' }} />
        <stop offset="100%" style={{ stopColor: 'rgba(255, 235, 59, 0)' }} />
      </linearGradient>
      <linearGradient id="gradGreen" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'rgba(67, 217, 9, 1)' }} />
        <stop offset="100%" style={{ stopColor: 'rgba(59, 255, 235, 0)' }} />
      </linearGradient>
      <linearGradient id="gradBlue" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: 'rgba(9, 67, 217, 1)' }} />
        <stop offset="100%" style={{ stopColor: 'rgba(235, 59, 255, 0)' }} />
      </linearGradient>
      <linearGradient id="gradPurple" x1="100%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" style={{ stopColor: 'rgba(121, 9, 217, 1)' }} />
        <stop offset="100%" style={{ stopColor: 'rgba(255, 59, 59, 0)' }} />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="black" />
    <mask id="mask1">
      <path d="M 50,50 L 100,0 L 100,100 Z" fill="url(#gradGreen)" />
      <path d="M 50,50 L 0,100 L 100,100 Z" fill="url(#gradBlue)" />
      <path d="M 50,50 L 0,0 L 0,100 Z" fill="url(#gradPurple)" />
      <path d="M 50,50 L 0,0 L 100,0 Z" fill="url(#gradRed)" />
    </mask>
    <circle cx="50" cy="50" r="45" fill="url(#grad1)" />
  </svg>
);
