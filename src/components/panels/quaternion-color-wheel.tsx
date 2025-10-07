
"use client";

import React from 'react';
import { AuraColorWheel, type AuraColorWheelProps } from '../icons/quaternion-logo';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

interface QuaternionColorWheelPanelProps {
    // Keeping these for potential future use, but not using them for the construction layers
}

export function QuaternionColorWheel({ }: QuaternionColorWheelPanelProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [size, setSize] = React.useState(200);
    const [constructionLayers, setConstructionLayers] = React.useState<AuraColorWheelProps['constructionLayers']>({
        showBase: true,
        showWhiteAura: true,
        showColorFields: true,
        showSeparators: true,
        showVignette: true,
    });

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                setSize(width > 0 ? width : 200);
            }
        });

        observer.observe(container);

        return () => {
            if (container) {
                observer.unobserve(container);
            }
        };
    }, []);
    
    const handleToggleLayer = (layer: keyof NonNullable<AuraColorWheelProps['constructionLayers']>) => {
        setConstructionLayers(prev => ({ ...prev, [layer]: !prev?.[layer] }));
    }


  return (
    <div className="p-4 flex flex-col h-full">
        <h3 className="font-headline text-lg">Quaternion Color Wheel</h3>
        <p className="text-sm text-muted-foreground mb-4">A projection of the RGB color space.</p>
        <div ref={containerRef} className="w-full aspect-square mb-4">
            <AuraColorWheel size={size} constructionLayers={constructionLayers} />
        </div>
        <Separator className="my-2"/>
        <h4 className="font-semibold text-sm mb-2">Construction Layers</h4>
        <ScrollArea className="flex-1">
            <div className="space-y-2 pr-2">
                {Object.keys(constructionLayers).map((key) => (
                   <div key={key} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                       <Label htmlFor={key} className="text-sm capitalize">
                           {key.replace(/([A-Z])/g, ' $1').replace('Show ', '')}
                       </Label>
                       <Switch
                            id={key}
                            checked={constructionLayers[key as keyof typeof constructionLayers]}
                            onCheckedChange={() => handleToggleLayer(key as keyof typeof constructionLayers)}
                       />
                   </div>
                ))}
            </div>
        </ScrollArea>
    </div>
  );
}
