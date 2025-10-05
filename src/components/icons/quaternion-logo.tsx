
import React from 'react';

export const QuaternionLogo = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ background: 'black' }}>
    <defs>
      {/* Gradients for each quadrant, fading from color to transparent */}
      <radialGradient id="gradRed" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255, 0, 0, 1)" />
        <stop offset="100%" stopColor="rgba(255, 0, 0, 0)" />
      </radialGradient>
      <radialGradient id="gradGreen" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(0, 255, 0, 1)" />
        <stop offset="100%" stopColor="rgba(0, 255, 0, 0)" />
      </radialGradient>
      <radialGradient id="gradBlue" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(0, 0, 255, 1)" />
        <stop offset="100%" stopColor="rgba(0, 0, 255, 0)" />
      </radialGradient>
      <radialGradient id="gradPurple" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(128, 0, 128, 1)" />
        <stop offset="100%" stopColor="rgba(128, 0, 128, 0)" />
      </radialGradient>

      {/* Center glow */}
      <radialGradient id="gradCenterGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
        <stop offset="25%" stopColor="rgba(255, 255, 255, 0)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
      </radialGradient>

      {/* Clip paths to define the quadrants */}
      <clipPath id="clipTopRight">
        <rect x="50" y="0" width="50" height="50" />
      </clipPath>
      <clipPath id="clipBottomRight">
        <rect x="50" y="50" width="50" height="50" />
      </clipPath>
      <clipPath id="clipBottomLeft">
        <rect x="0" y="50" width="50" height="50" />
      </clipPath>
      <clipPath id="clipTopLeft">
        <rect x="0" y="0" width="50" height="50" />
      </clipPath>
    </defs>

    {/* Apply each gradient to a full circle, but clipped to its quadrant */}
    <circle cx="50" cy="50" r="50" fill="url(#gradGreen)" clipPath="url(#clipTopRight)" />
    <circle cx="50" cy="50" r="50" fill="url(#gradBlue)" clipPath="url(#clipBottomRight)" />
    <circle cx="50" cy="50" r="50" fill="url(#gradPurple)" clipPath="url(#clipBottomLeft)" />
    <circle cx="50" cy="50" r="50" fill="url(#gradRed)" clipPath="url(#clipTopLeft)" />
    
    {/* Add the central white glow on top */}
    <circle cx="50" cy="50" r="50" fill="url(#gradCenterGlow)" />
  </svg>
);
