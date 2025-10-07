
"use client";

import React, { useState } from 'react';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { AuraColorWheel } from '../icons/aura-color-wheel';
import { rgbToHsv, hsvToRgbString } from '@/lib/color-utils';

function rgbStringToHsv(rgbString: string): { h: number, s: number, v: number } {
  if (!rgbString) return { h: 0, s: 0, v: 0 };
  const result = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgbString);
  if (!result) return { h: 0, s: 0, v: 0 };
  const r = parseInt(result[1], 10);
  const g = parseInt(result[2], 10);
  const b = parseInt(result[3], 10);
  return rgbToHsv(r, g, b);
}

export function DynamicColorSpherePanel() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState(200);

  const [selectedHsv, setSelectedHsv] = useState({ h: 0, s: 100, v: 100 });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setSize(width > 0 ? Math.floor(width * 0.9) : 200);
      }
    });

    observer.observe(container);
    return () => {
      if (container) {
        observer.unobserve(container);
      }
    };
  }, []);
  
  const handleColorSelect = (rgbColor: string) => {
    const hsv = rgbStringToHsv(rgbColor);
    setSelectedHsv(hsv);
  };
  
  const selectedColorRgb = hsvToRgbString(selectedHsv.h, selectedHsv.s, selectedHsv.v);

  return (
    <div className="p-4 flex flex-col h-full items-center">
      <h3 className="font-headline text-lg mb-2">Color Gradient Explorer</h3>
      
      <div ref={containerRef} className="w-full aspect-square mb-4">
          <AuraColorWheel size={size} onColorSelect={handleColorSelect}/>
      </div>
      
      <div className="w-full space-y-4">
        <div className="flex items-center gap-4 p-2 rounded-md bg-muted/50">
            <div className="w-10 h-10 rounded-full border-2 border-border" style={{ backgroundColor: selectedColorRgb }}></div>
            <div className="font-mono text-sm">
                <div>H: {selectedHsv.h.toFixed(0)}°</div>
                <div>S: {selectedHsv.s.toFixed(0)}%</div>
                <div>V: {selectedHsv.v.toFixed(0)}%</div>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">Hue</Button>
                </PopoverTrigger>
                <PopoverContent>
                    <Label>Hue: {selectedHsv.h.toFixed(0)}°</Label>
                    <Slider value={[selectedHsv.h]} onValueChange={([val]) => setSelectedHsv(p => ({...p, h: val}))} min={0} max={360} step={1} />
                </PopoverContent>
            </Popover>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">Saturation</Button>
                </PopoverTrigger>
                <PopoverContent>
                    <Label>Saturation: {selectedHsv.s.toFixed(0)}%</Label>
                    <Slider value={[selectedHsv.s]} onValueChange={([val]) => setSelectedHsv(p => ({...p, s: val}))} min={0} max={100} step={1} />
                </PopoverContent>
            </Popover>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">Value</Button>
                </PopoverTrigger>
                <PopoverContent>
                    <Label>Value/Brightness: {selectedHsv.v.toFixed(0)}%</Label>
                    <Slider value={[selectedHsv.v]} onValueChange={([val]) => setSelectedHsv(p => ({...p, v: val}))} min={0} max={100} step={1} />
                </PopoverContent>
            </Popover>
        </div>
      </div>
    </div>
  );
}
