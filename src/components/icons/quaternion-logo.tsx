
import React from 'react';

export const QuaternionLogo = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ background: 'black' }}>
    <defs>
      {/* Gradients for each lobe, fading from color to transparent */}
      <radialGradient id="gradRed" cx="25%" cy="25%" r="75%">
        <stop offset="0%" stopColor="rgba(255, 0, 0, 1)" />
        <stop offset="100%" stopColor="rgba(255, 0, 0, 0)" />
      </radialGradient>
      <radialGradient id="gradGreen" cx="75%" cy="25%" r="75%">
        <stop offset="0%" stopColor="rgba(0, 255, 0, 1)" />
        <stop offset="100%" stopColor="rgba(0, 255, 0, 0)" />
      </radialGradient>
      <radialGradient id="gradBlue" cx="75%" cy="75%" r="75%">
        <stop offset="0%" stopColor="rgba(0, 0, 255, 1)" />
        <stop offset="100%" stopColor="rgba(0, 0, 255, 0)" />
      </radialGradient>
      <radialGradient id="gradPurple" cx="25%" cy="75%" r="75%">
        <stop offset="0%" stopColor="rgba(128, 0, 128, 1)" />
        <stop offset="100%" stopColor="rgba(128, 0, 128, 0)" />
      </radialGradient>

      {/* Center glow */}
      <radialGradient id="gradCenterGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
        <stop offset="25%" stopColor="rgba(255, 255, 255, 0)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
      </radialGradient>

      {/* Clip paths to define the clover-leaf lobes */}
      <clipPath id="clipTopLeft">
        <path d="M50,50 C50,0 0,0 0,50 C0,0 50,0 50,50 Z" />
      </clipPath>
      <clipPath id="clipTopRight">
        <path d="M50,50 C100,50 100,0 50,0 C100,0 100,50 50,50 Z" />
      </clipPath>
      <clipPath id="clipBottomRight">
        <path d="M50,50 C50,100 100,100 100,50 C100,100 50,100 50,50 Z" />
      </clipPath>
      <clipPath id="clipBottomLeft">
        <path d="M50,50 C0,50 0,100 50,100 C0,100 0,50 50,50 Z" />
      </clipPath>
    </defs>

    {/* Apply each gradient to a full rectangle, but clipped to its lobe shape */}
    <rect x="0" y="0" width="100" height="100" fill="url(#gradRed)" clipPath="url(#clipTopLeft)" />
    <rect x="0" y="0" width="100" height="100" fill="url(#gradGreen)" clipPath="url(#clipTopRight)" />
    <rect x="0" y="0" width="100" height="100" fill="url(#gradBlue)" clipPath="url(#clipBottomRight)" />
    <rect x="0" y="0" width="100" height="100" fill="url(#gradPurple)" clipPath="url(#clipBottomLeft)" />
    
    {/* Add the central white glow on top */}
    <circle cx="50" cy="50" r="50" fill="url(#gradCenterGlow)" />
  </svg>
);
