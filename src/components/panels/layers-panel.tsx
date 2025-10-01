
"use client"

import { Eye, EyeOff, Lock, Unlock, GripVertical, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Layer } from "@/lib/types"


interface LayersPanelProps {
    layers: Layer[];
    activeLayerId: string | null;
    onLayerSelect: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onDeleteLayer: (id: string) => void;
}


export function LayersPanel({
    layers,
    activeLayerId,
    onLayerSelect,
    onToggleVisibility,
    onToggleLock,
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
          {layers.slice().reverse().map((layer) => (
            <div
              key={layer.id}
              onClick={() => !layer.locked && onLayerSelect(layer.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md transition-colors",
                layer.id === activeLayerId ? "bg-accent/50" : "hover:bg-accent/30",
                layer.locked ? "cursor-not-allowed" : "cursor-pointer"
              )}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">{layer.name}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); onToggleVisibility(layer.id)}}>
                {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); onToggleLock(layer.id)}}>
                {layer.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive"
                disabled={layer.type === 'background'}
                onClick={(e) => {e.stopPropagation(); onDeleteLayer(layer.id)}}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
