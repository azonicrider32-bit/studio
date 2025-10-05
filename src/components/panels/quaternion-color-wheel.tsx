
"use client";

import React from 'react';
import { QuaternionLogo } from '../icons/quaternion-logo';

export function QuaternionColorWheel() {
  return (
    <div className="p-4">
        <h3 className="font-headline text-lg">Quaternion Color Wheel</h3>
        <p className="text-sm text-muted-foreground mb-4">A projection of the RGB color space.</p>
        <div className="w-full aspect-square">
            <QuaternionLogo />
        </div>
    </div>
  );
}
