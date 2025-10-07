
"use client";

import React from 'react';
import { AuraColorWheel } from '../icons/quaternion-logo';
import { Layer } from '@/lib/types';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';

interface QuaternionColorWheelProps {
    layers: Layer[];
    onToggleVisibility: (id: string) => void;
}

export function QuaternionColorWheel({ layers, onToggleVisibility }: QuaternionColorWheelProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [size, setSize] = React.useState(200);

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
            observer.disconnect();
        };
    }, []);


  return (
    <div className="p-4 flex flex-col h-full">
        <h3 className="font-headline text-lg">Quaternion Color Wheel</h3>
        <p className="text-sm text-muted-foreground mb-4">A projection of the RGB color space.</p>
        <div ref={containerRef} className="w-full aspect-square mb-4">
            <AuraColorWheel size={size} />
        </div>
        <Separator className="my-2"/>
        <h4 className="font-semibold text-sm mb-2">Layers</h4>
        <ScrollArea className="flex-1">
            <div className="space-y-1 pr-2">
                {layers.slice().reverse().map(layer => (
                    <Card key={layer.id} className="bg-muted/30">
                        <CardContent className="p-2 flex items-center justify-between">
                            <span className="text-sm truncate">{layer.name}</span>
                             <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleVisibility(layer.id)}
                                className="h-7 w-7 p-0"
                                >
                                {layer.visible ?
                                    <Eye className="w-4 h-4 text-slate-300" /> :
                                    <EyeOff className="w-4 h-4 text-slate-500" />
                                }
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    </div>
  );
}
