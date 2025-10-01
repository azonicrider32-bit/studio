

"use client"

import { Eye, EyeOff, Lock, Unlock, GripVertical, Trash2, Palette, MoreHorizontal, Pipette } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Layer } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"


interface LayersPanelProps {
    layers: Layer[];
    activeLayerId: string | null;
    onLayerSelect: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onToggleMask: (id: string) => void;
    onDeleteLayer: (id: string) => void;
}


export function LayersPanel({
    layers,
    activeLayerId,
    onLayerSelect,
    onToggleVisibility,
    onToggleLock,
    onToggleMask,
    onDeleteLayer,
}: LayersPanelProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Layers</h3>
        <p className="text-sm text-muted-foreground">
          Manage and organize your image layers.
        </p>
      </div>
      <Separator />
      <Card>
        <CardContent className="p-2 space-y-1">
         <TooltipProvider>
          {layers.slice().reverse().map((layer) => (
            <div
              key={layer.id}
              onClick={() => !layer.locked && onLayerSelect(layer.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md transition-colors",
                layer.id === activeLayerId ? "bg-accent/50" : "hover:bg-accent/30",
                layer.locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
              )}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 flex items-center gap-2">
                {layer.type === 'background' ? (
                     <div className="w-10 h-7 bg-muted rounded-sm"></div>
                ) : (
                    <div className="w-10 h-7 rounded-sm border bg-card flex items-center justify-center">
                        <Palette className={cn("w-4 h-4", layer.maskVisible ? "text-primary" : "text-muted-foreground")}/>
                    </div>
                )}
                 <span className="text-sm truncate">{layer.name}</span>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); onToggleMask(layer.id)}} disabled={layer.type === 'background'}>
                        <Palette className={cn("w-4 h-4", layer.maskVisible ? "text-primary" : "text-muted-foreground")}/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Toggle Mask Highlight</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); onToggleVisibility(layer.id)}}>
                        {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Toggle Visibility</TooltipContent>
              </Tooltip>
              <Tooltip>
                 <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); onToggleLock(layer.id)}} disabled={layer.type === 'background'}>
                        {layer.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Toggle Lock</TooltipContent>
              </Tooltip>
              
               <Popover>
                    <PopoverTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-7 w-7" disabled={layer.type === 'background'} onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="left" className="w-auto p-1">
                        <div className="flex flex-col gap-1">
                            
                             <Button variant="ghost" className="justify-start gap-2 px-2">
                                <Pipette className="w-4 h-4"/> Change Mask Color
                            </Button>
                             <Separator />
                             <Button 
                                variant="ghost" 
                                className="justify-start gap-2 px-2 text-destructive hover:text-destructive"
                                disabled={layer.type === 'background'}
                                onClick={(e) => {e.stopPropagation(); onDeleteLayer(layer.id)}}
                            >
                                <Trash2 className="h-4 w-4" /> Delete Layer
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

            </div>
          ))}
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  )
}

    