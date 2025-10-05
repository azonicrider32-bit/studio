

"use client"

import * as React from "react"
import Image from "next/image";
import { cn } from "@/lib/utils"
import { Layer } from "@/lib/types"
import { ScrollArea } from "../ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

const LayerThumbnail: React.FC<{ layer: Layer; isActive: boolean; isHovered: boolean, imageUrl?: string; }> = ({ layer, isActive, isHovered, imageUrl }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const thumbnailSize = 48;
        canvas.width = thumbnailSize;
        canvas.height = thumbnailSize;
        
        ctx.clearRect(0, 0, thumbnailSize, thumbnailSize);

        // Draw checkerboard for transparency
        const checkerSize = 6;
        ctx.fillStyle = '#ccc';
        for (let y = 0; y < thumbnailSize; y += checkerSize) {
            for (let x = 0; x < thumbnailSize; x += checkerSize) {
                if ((x / checkerSize + y / checkerSize) % 2 === 0) {
                    ctx.fillRect(x, y, checkerSize, checkerSize);
                }
            }
        }
        ctx.fillStyle = '#999';
         for (let y = 0; y < thumbnailSize; y += checkerSize) {
            for (let x = 0; x < thumbnailSize; x += checkerSize) {
                if ((x / checkerSize + y / checkerSize) % 2 !== 0) {
                    ctx.fillRect(x, y, checkerSize, checkerSize);
                }
            }
        }
        
        if (layer.type === 'background' && imageUrl) {
             const img = new window.Image();
             img.crossOrigin = "anonymous";
             img.src = imageUrl;
             img.onload = () => {
                const scale = Math.min(thumbnailSize / img.naturalWidth, thumbnailSize / img.naturalHeight);
                const drawWidth = img.naturalWidth * scale;
                const drawHeight = img.naturalHeight * scale;
                const xOffset = (thumbnailSize - drawWidth) / 2;
                const yOffset = (thumbnailSize - drawHeight) / 2;
                ctx.drawImage(img, xOffset, yOffset, drawWidth, drawHeight);
             }
        } else if (layer.imageData) {
            const { width, height } = layer.imageData
            const scale = Math.min(thumbnailSize / width, thumbnailSize / height)
            const drawWidth = width * scale
            const drawHeight = height * scale
            const xOffset = (thumbnailSize - drawWidth) / 2
            const yOffset = (thumbnailSize - drawHeight) / 2

            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = width
            tempCanvas.height = height
            const tempCtx = tempCanvas.getContext('2d')
            if (tempCtx) {
                tempCtx.putImageData(layer.imageData, 0, 0)
                ctx.drawImage(tempCanvas, xOffset, yOffset, drawWidth, drawHeight)
            }
        }
    }, [layer.imageData, layer.type, imageUrl]);

    const content = (layer.imageData || (layer.type === 'background' && imageUrl)) ? (
        <canvas ref={canvasRef} className="w-full h-full" />
    ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
            ...
        </div>
    );

    return (
        <div
            className={cn(
                "w-12 h-12 rounded-md overflow-hidden border-2 transition-all cursor-pointer",
                isActive ? "border-primary" : "border-border",
                isHovered && !isActive && "border-accent"
            )}
        >
            {content}
        </div>
    )
}

interface LayerStripPanelProps {
    layers: Layer[];
    activeLayerId: string | null;
    hoveredLayerId: string | null;
    onLayerSelect: (id: string) => void;
    onHoverLayer: (id: string | null) => void;
    imageUrl?: string;
}

export function LayerStripPanel({
    layers,
    activeLayerId,
    hoveredLayerId,
    onLayerSelect,
    onHoverLayer,
    imageUrl,
}: LayerStripPanelProps) {
    
    const visibleLayers = layers.filter(l => !l.parentId);

    return (
        <div className="h-full w-16 bg-background/80 backdrop-blur-sm border-l border-r p-2 flex flex-col gap-2">
            <ScrollArea className="flex-1">
                <div className="space-y-2">
                    <TooltipProvider>
                    {visibleLayers.map(layer => (
                        <Tooltip key={layer.id}>
                            <TooltipTrigger asChild>
                                <div
                                    onClick={() => onLayerSelect(layer.id)}
                                    onMouseEnter={() => onHoverLayer(layer.id)}
                                    onMouseLeave={() => onHoverLayer(null)}
                                >
                                    <LayerThumbnail
                                        layer={layer}
                                        isActive={layer.id === activeLayerId}
                                        isHovered={layer.id === hoveredLayerId}
                                        imageUrl={imageUrl}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>{layer.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    </TooltipProvider>
                </div>
            </ScrollArea>
        </div>
    )
}
