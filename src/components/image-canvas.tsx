"use client"

import Image from "next/image"
import * as React from 'react';
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Card } from "@/components/ui/card"
import { intelligentLassoAssistedPathSnapping } from "@/ai/flows/intelligent-lasso-assisted-path-snapping";
import { useToast } from "@/hooks/use-toast";

interface ImageCanvasProps {
  segmentationMask: string | null;
  setSegmentationMask: (mask: string | null) => void;
}


export function ImageCanvas({segmentationMask, setSegmentationMask}: ImageCanvasProps) {
  const image = PlaceHolderImages.find(img => img.id === "pro-segment-ai-1")
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [path, setPath] = React.useState<{x: number; y: number}[]>([]);
  const { toast } = useToast()


  const drawOnCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = image?.imageUrl || '';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (segmentationMask) {
        const maskImg = new window.Image();
        maskImg.src = segmentationMask;
        maskImg.onload = () => {
          ctx.globalAlpha = 0.5;
          ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1.0;
        }
      }
    };
  }, [image, segmentationMask]);


  React.useEffect(() => {
    drawOnCanvas();
  }, [drawOnCanvas]);


  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    setPath([{ x: offsetX, y: offsetY }]);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    setPath(prevPath => [...prevPath, { x: offsetX, y: offsetY }]);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.beginPath();
      ctx.moveTo(path[path.length - 1].x, path[path.length - 1].y);
      ctx.lineTo(offsetX, offsetY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const stopDrawing = async () => {
    if (path.length > 1) {
      try {
        toast({ title: 'Optimizing lasso path...' });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const result = await intelligentLassoAssistedPathSnapping({
            photoDataUri: canvas.toDataURL('image/jpeg'),
            lassoPath: path,
            prompt: "the main object in the foreground"
        });
        
        const ctx = canvas.getContext('2d');
        if (ctx && result.enhancedPath.length > 0) {
          drawOnCanvas(); // Redraw original image
          ctx.beginPath();
          ctx.moveTo(result.enhancedPath[0].x, result.enhancedPath[0].y);
          for(let i = 1; i < result.enhancedPath.length; i++) {
            ctx.lineTo(result.enhancedPath[i].x, result.enhancedPath[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = 'rgba(199, 98%, 48%, 0.5)';
          ctx.fill();
          ctx.strokeStyle = 'hsl(var(--accent))';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        toast({ title: 'Lasso path optimized!' });
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Error optimizing path',
          description: 'Could not optimize the lasso path.',
        });
      }
    }
    setPath([]);
    setIsDrawing(false);
  };


  if (!image) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <p>Image not found</p>
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-background p-4 md:p-8">
      <Card className="relative aspect-[4/3] w-full max-w-5xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="h-full w-full object-cover"
        />
        {segmentationMask && (
          <Image
            src={segmentationMask}
            alt="Segmentation Mask"
            fill
            className="object-contain opacity-50 pointer-events-none"
          />
        )}
      </Card>
    </div>
  )
}
