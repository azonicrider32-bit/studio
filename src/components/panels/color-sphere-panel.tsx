
"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { Layer } from '@/lib/types';
import { Eye, EyeOff } from 'lucide-react';
import { AuraColorWheel, AuraColorWheelProps } from '../icons/quaternion-logo';

interface ColorSpherePanelProps {
    layers: Layer[];
    onToggleLayerVisibility: (id: string) => void;
}

export function ColorSpherePanel({ layers, onToggleLayerVisibility }: ColorSpherePanelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = canvas.width;
        const center = size / 2;
        const radius = size * 0.4;
        
        ctx.clearRect(0, 0, size, size);

        // Draw sphere body
        const gradient = ctx.createRadialGradient(center - radius * 0.2, center - radius * 0.3, radius * 0.1, center, center, radius);
        gradient.addColorStop(0, '#aaa');
        gradient.addColorStop(0.9, '#333');
        gradient.addColorStop(1, '#111');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Simulate rotation with moving highlights/textures
        const rotX = rotation.y / 100;
        const rotY = rotation.x / 100;

        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.clip();

        // Draw some longitude lines
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
            ctx.lineWidth = 1;
            const angle = (i / 12) * Math.PI * 2 + rotY;
            const ellipseWidth = Math.sin(angle) * radius;
            ctx.ellipse(center, center, Math.abs(ellipseWidth), radius, 0, -Math.PI/2, Math.PI/2);
            ctx.stroke();
        }

        // Draw some latitude lines
        for (let i = -4; i <= 4; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
             ctx.lineWidth = 1;
            const y = center + (i/4) * radius;
            const r = Math.sqrt(radius**2 - (y - center)**2);
            ctx.ellipse(center, y, r, Math.abs((i/4)*0.2 * radius), 0, 0, 2*Math.PI);
            ctx.stroke();
        }

        ctx.restore();


    }, [rotation]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        setRotation(prev => ({
            x: prev.x + dx * 0.5,
            y: prev.y + dy * 0.5,
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="p-4 flex flex-col h-full">
            <h3 className="font-headline text-lg">Quaternion Color Wheel</h3>
            <p className="text-sm text-muted-foreground mb-4">A projection of the RGB color space.</p>
            <div className="w-full aspect-square mb-4 bg-muted/20 rounded-md overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="w-full h-full cursor-grab"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>
            <Separator className="my-2"/>
            <h4 className="font-semibold text-sm mb-2">Image Layers</h4>
            <ScrollArea className="flex-1">
                <div className="space-y-1 pr-2">
                    {layers.map(layer => (
                        <div key={layer.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                            <Label htmlFor={`layer-vis-${layer.id}`} className="text-sm">{layer.name}</Label>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleLayerVisibility(layer.id)}>
                                {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
