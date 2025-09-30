"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { LassoSettings } from "@/lib/types";


interface LassoPanelProps {
  settings: LassoSettings;
  onSettingsChange: (settings: Partial<LassoSettings>) => void;
}


export function LassoPanel({ settings, onSettingsChange }: LassoPanelProps) {
    
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Intelligent Lasso</h3>
        <p className="text-sm text-muted-foreground">
          Draw a freehand selection with smart edge-snapping.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="snapRadius">Snap Radius: {settings.snapRadius}px</Label>
          <Slider
            id="snapRadius"
            min={1}
            max={20}
            step={1}
            value={[settings.snapRadius]}
            onValueChange={(value) => onSettingsChange({ snapRadius: value[0] })}
          />
          <p className="text-xs text-muted-foreground">How far the tool looks for an edge to snap to.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="snapThreshold">Edge Sensitivity: {settings.snapThreshold}</Label>
           <Slider
            id="snapThreshold"
            min={0.05}
            max={1}
            step={0.05}
            value={[settings.snapThreshold]}
            onValueChange={(value) => onSettingsChange({ snapThreshold: value[0] })}
          />
          <p className="text-xs text-muted-foreground">How strong an edge must be to be considered for snapping. Lower is more sensitive.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="curveStrength">Smoothness: {settings.curveStrength.toFixed(2)}</Label>
           <Slider
            id="curveStrength"
            min={0}
            max={1}
            step={0.05}
            value={[settings.curveStrength]}
            onValueChange={(value) => onSettingsChange({ curveStrength: value[0] })}
          />
          <p className="text-xs text-muted-foreground">Higher values create smoother, more curved lines, ignoring small details.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="directionalStrength">Directional Strength: {settings.directionalStrength.toFixed(2)}</Label>
           <Slider
            id="directionalStrength"
            min={0}
            max={1}
            step={0.05}
            value={[settings.directionalStrength]}
            onValueChange={(value) => onSettingsChange({ directionalStrength: value[0] })}
          />
          <p className="text-xs text-muted-foreground">How strongly the path maintains its direction. Higher values resist deviation.</p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="useEdgeSnapping">Enable AI Edge Snapping</Label>
          <Switch
            id="useEdgeSnapping"
            checked={settings.useEdgeSnapping}
            onCheckedChange={(checked) => onSettingsChange({ useEdgeSnapping: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Toggles the AI-powered path snapping on or off.
        </p>
      </div>

       <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>How to use</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Click on the image to start your path and add points.</li>
            <li>The path will automatically snap to nearby edges if enabled.</li>
            <li>The pin will drop at the end of the snapped line, not your cursor.</li>
            <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd> to complete the selection.</li>
            <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> to cancel.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
