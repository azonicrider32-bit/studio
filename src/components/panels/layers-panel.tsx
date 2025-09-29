"use client"

import { Eye, EyeOff, Lock, Unlock, GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const layers = [
  { id: 1, name: "Subject Mask", visible: true, locked: false },
  { id: 2, name: "Background", visible: true, locked: true },
  { id: 3, name: "Adjustments", visible: false, locked: false },
  { id: 4, name: "Watermark", visible: true, locked: false },
]

export function LayersPanel() {
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
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer",
                index === 0 ? "bg-accent/50" : "hover:bg-accent/30"
              )}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">{layer.name}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                {layer.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
