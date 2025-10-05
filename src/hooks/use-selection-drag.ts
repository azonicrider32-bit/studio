
"use client";

import { useState, useCallback, MouseEvent } from 'react';
import { Layer } from '@/lib/types';

export function useSelectionDrag(
  layers: Layer[],
  setLayers: (layers: Layer[]) => void,
  activeTool: string,
  zoom: number
) {
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number, y: number, layerX: number, layerY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLayer, setDraggedLayer] = useState<Layer | null>(null);

  const getLayerAtPos = (x: number, y: number) => {
    // Iterate backwards to select top layer first
    for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (layer.type === 'background' || !layer.visible || layer.locked) continue;
        const { x: layerX, y: layerY, width, height } = layer.bounds;
        if (x >= layerX && x <= layerX + width && y >= layerY && y <= layerY + height) {
            return layer;
        }
    }
    return null;
  };
  
  const getMousePos = (e: globalThis.MouseEvent | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget as HTMLCanvasElement;
    if(!canvas) return {x: 0, y: 0};
    const rect = canvas.getBoundingClientRect();
    const imageEl = canvas.parentElement?.querySelector('img'); // Assuming image is a sibling
    if (!imageEl) return { x: 0, y: 0 };


    const imageAspectRatio = imageEl.naturalWidth / imageEl.naturalHeight;
    const canvasAspectRatio = rect.width / rect.height;

    let renderWidth = rect.width;
    let renderHeight = rect.height;
    let xOffset = 0;
    let yOffset = 0;

    if (imageAspectRatio > canvasAspectRatio) {
        renderHeight = rect.width / imageAspectRatio;
        yOffset = (rect.height - renderHeight) / 2;
    } else {
        renderWidth = rect.height * imageAspectRatio;
        xOffset = (rect.width - renderWidth) / 2;
    }
    
    const clientX = e.clientX - rect.left - xOffset;
    const clientY = e.clientY - rect.top - yOffset;

    const imageX = (clientX / renderWidth) * imageEl.naturalWidth;
    const imageY = (clientY / renderHeight) * imageEl.naturalHeight;

    return { x: imageX, y: imageY };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'transform' || e.button !== 0) return;
    
    const pos = getMousePos(e);
    const layer = getLayerAtPos(pos.x, pos.y);

    if (layer) {
      setIsDragging(true);
      setDraggedLayerId(layer.id);
      setDragStart({ 
        x: e.clientX, 
        y: e.clientY,
        layerX: layer.bounds.x,
        layerY: layer.bounds.y
      });
      setDraggedLayer(layer);
      e.stopPropagation();
    }
  }, [activeTool, layers]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !draggedLayer) return;

    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;

    setDraggedLayer(prev => {
        if (!prev) return null;
        return {
            ...prev,
            bounds: {
                ...prev.bounds,
                x: dragStart.layerX + dx,
                y: dragStart.layerY + dy,
            }
        }
    });

    e.stopPropagation();
  }, [isDragging, dragStart, zoom, draggedLayer]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && draggedLayer) {
        setLayers(layers.map(l => l.id === draggedLayer.id ? draggedLayer : l));
    }
    setIsDragging(false);
    setDraggedLayerId(null);
    setDragStart(null);
    setDraggedLayer(null);
  }, [isDragging, draggedLayer, layers, setLayers]);

  return {
    draggedLayer: isDragging ? draggedLayer : null,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
