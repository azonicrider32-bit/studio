

"use client"

import * as React from "react"
import { Eye, EyeOff, Lock, Unlock, GripVertical, Trash2, Palette, MoreHorizontal, Plus, Pipette, Link, ChevronDown, ChevronRight } from "lucide-react"
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
    draggedLayerId: string | null;
    setDraggedLayerId: (id: string | null) => void;
    dropTargetId: string | null;
    setDropTargetId: (id: string | null) => void;
    onLayerSelect: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onToggleMask: (id: string) => void;
    onDeleteLayer: (id: string) => void;
    onDrop: (draggedId: string, targetId: string) => void;
}


export function LayersPanel({
    layers,
    activeLayerId,
    draggedLayerId,
    setDraggedLayerId,
    dropTargetId,
    setDropTargetId,
    onLayerSelect,
    onToggleVisibility,
    onToggleLock,
    onToggleMask,
    onDeleteLayer,
    onDrop,
}: LayersPanelProps) {
  
  const [expandedLayers, setExpandedLayers] = React.useState(new Set<string>());

  const toggleLayerExpansion = (layerId: string) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  const renderLayer = (layer: Layer, isMask = false) => {
    const layerTypeIcon = layer.subType === 'mask' 
      ? <div className="w-10 h-7 rounded-sm border bg-card flex items-center justify-center"><Link className="w-4 h-4"/></div>
      : (layer.type === 'background'
          ? <div className="w-10 h-7 bg-muted rounded-sm"></div>
          : <div className="w-10 h-7 rounded-sm border bg-card flex items-center justify-center"><div className="w-full h-full bg-black/5" /></div>
      );

    const isDropTarget = dropTargetId === layer.id && draggedLayerId !== layer.id;

    return (
      <div
        key={layer.id}
        draggable={!isMask && layer.type !== 'background'}
        onDragStart={(e) => {
            if (layer.type === 'background') return;
            e.stopPropagation();
            setDraggedLayerId(layer.id);
        }}
        onDragEnd={() => {
            setDraggedLayerId(null);
            setDropTargetId(null);
        }}
        onDragEnter={(e) => {
            e.preventDefault();
            if (draggedLayerId && draggedLayerId !== layer.id) {
                setDropTargetId(layer.id);
            }
        }}
        onDragLeave={(e) => {
             e.preventDefault();
             if (dropTargetId === layer.id) {
                setDropTargetId(null);
             }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
            e.preventDefault();
            if (draggedLayerId && dropTargetId) {
                onDrop(draggedLayerId, dropTargetId);
            }
            setDraggedLayerId(null);
            setDropTargetId(null);
        }}
        onClick={() => !layer.locked && onLayerSelect(layer.id)}
        className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-all",
          layer.id === activeLayerId ? "bg-accent/50" : "hover:bg-accent/30",
          layer.locked ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          isMask && "ml-6",
          draggedLayerId === layer.id && "opacity-50",
          isDropTarget && "ring-2 ring-primary"
        )}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          {layerTypeIcon}
          <span className="text-sm truncate flex-1">{layer.name}</span>
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
    );
  };
  
  const layerTree = React.useMemo(() => {
    const layerMap = new Map(layers.map(l => [l.id, { ...l, children: [] as Layer[] }]));
    const tree: { parent: Layer & { children: Layer[] }, children: (Layer & { children: Layer[] })[] }[] = [];

    const topLevelLayers: (Layer & { children: Layer[] })[] = [];

    layers.forEach(layer => {
        const currentLayer = layerMap.get(layer.id);
        if (!currentLayer) return;

        if (layer.parentId && layerMap.has(layer.parentId)) {
            const parent = layerMap.get(layer.parentId);
            if(parent) {
                parent.children.push(currentLayer);
            }
        } else {
            topLevelLayers.push(currentLayer);
        }
    });

    return topLevelLayers.map(parent => ({ parent, children: parent.children || [] }));
}, [layers]);


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
          {layerTree.slice().reverse().map(({ parent, children }) => (
            <React.Fragment key={parent.id}>
              {renderLayer(parent)}
                {(children.length > 0 || parent.modifiers?.length > 0) && (
                    <div className="pl-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLayerExpansion(parent.id)}
                            className="h-6 w-full justify-start text-xs text-muted-foreground -ml-2"
                        >
                            {expandedLayers.has(parent.id) ? (
                                <ChevronDown className="w-3 h-3 mr-1" />
                            ) : (
                                <ChevronRight className="w-3 h-3 mr-1" />
                            )}
                            Modifiers ({parent.modifiers?.length || 0})
                        </Button>
                        {expandedLayers.has(parent.id) && (
                            <div className="pl-4 border-l ml-1.5 py-1 space-y-1">
                                {(parent.modifiers || []).map(child => renderLayer(child, true))}
                            </div>
                        )}
                    </div>
                )}
                <div className="pl-8 py-1">
                    <button className="flex items-center w-full text-left gap-2 p-1 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors border-2 border-dashed border-transparent hover:border-accent">
                      <Plus className="h-4 w-4" />
                      <span className="text-xs">Add Modifier/Mask</span>
                    </button>
                </div>
            </React.Fragment>
          ))}
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  )
}
