
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "../ui/card";
import { Wand2, Mic, Trash2, Sparkles, Plus, Palette, BrainCircuit, ImageUp, Sparkle, Camera, Aperture, Wind, Flame, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "../ui/label";
import { AITool } from "@/lib/types";
import { Slider } from "../ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export interface InstructionLayer {
  id: string;
  color: string;
  sketch: string; // data URI of the sketch thumbnail
  prompt: string;
}

interface NanoBananaPanelProps {
  instructionLayers: InstructionLayer[];
  onInstructionChange: (id: string, prompt: string) => void;
  onLayerDelete: (id: string) => void;
  onGenerate: (prompt?: string) => void;
  onAiToolClick: (tool: AITool) => void;
  isGenerating: boolean;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
}

export const oneClickPrompts: AITool[] = [
  {
    id: "blemish-remover",
    label: "Blemish Remover",
    prompt: "Inpaint the selected area to seamlessly match the surrounding background, making it look as if the blemish or object was never there. Pay close attention to texture, lighting, and patterns to create a realistic and unnoticeable fill.",
    icon: Sparkles,
    color: "#ff00ff", // Magenta
    lineStyle: "dashed",
  },
  {
    id: "remove-object",
    label: "Remove Object",
    prompt: "Inpaint the selected area to seamlessly match the surrounding background, making it look as if the object was never there. Pay close attention to texture, lighting, and patterns to create a realistic and unnoticeable fill.",
    icon: Trash2,
    color: "#ff8800", // Orange
    lineStyle: "solid",
  },
  {
    id: "add-object",
    label: "Add Object",
    prompt: "Add a small bird to the selected area. It should be sitting naturally and match the lighting of the scene.",
    icon: Plus,
    color: "#00aaff", // Light Blue
    lineStyle: "solid",
  },
  {
    id: "change-color",
    label: "Change Color",
    prompt: "Change the color of the selected object to a vibrant, realistic blue. Maintain the original texture, shadows, and highlights of the object, ensuring only the color is altered.",
    icon: Palette,
    color: "#00ff88", // Mint Green
    lineStyle: "solid",
  },
];

const sfxTools: AITool[] = [
    { id: "add-smoke", label: "Smoke", prompt: "Add realistic wisps of smoke in the sketched area.", icon: Wind, color: "#cccccc", lineStyle: "dashed" },
    { id: "add-fire", label: "Fire", prompt: "Generate realistic flames within the sketched area, paying attention to the environment's lighting.", icon: Flame, color: "#ff4500", lineStyle: "solid" },
    { id: "add-sparks", label: "Sparks", prompt: "Create a shower of glowing sparks originating from the sketched area.", icon: Sparkle, color: "#ffd700", lineStyle: "solid" },
    { id: "add-lightning", label: "Lightning", prompt: "Generate a bolt of lightning along the sketched path.", icon: Zap, color: "#9400d3", lineStyle: "solid" },
]


export function NanoBananaPanel({
  instructionLayers,
  onInstructionChange,
  onLayerDelete,
  onGenerate,
  onAiToolClick,
  isGenerating,
  customPrompt,
  setCustomPrompt,
}: NanoBananaPanelProps) {

  const AITabTrigger = ({ value, children, icon: Icon }: { value: string, children: React.ReactNode, icon: React.ElementType }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <TabsTrigger value={value} className="flex-1">
            <Icon className="h-5 w-5" />
          </TabsTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <Tabs defaultValue="instruct" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-5">
          <AITabTrigger value="instruct" icon={Sparkle}>Instruct</AITabTrigger>
          <AITabTrigger value="photography" icon={Camera}>Photo</AITabTrigger>
          <AITabTrigger value="sfx" icon={Wind}>SFX</AITabTrigger>
          <AITabTrigger value="lighting" icon={Zap}>Lighting</AITabTrigger>
          <AITabTrigger value="inpaint" icon={ImageUp}>Inpaint</AITabTrigger>
        </TabsList>

        <TabsContent value="instruct" className="flex-1 flex flex-col min-h-0 -mx-4 mt-4">
           <div className="space-y-2 px-4">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">One-Click Actions</Label>
              <div className="grid grid-cols-4 gap-2">
                {oneClickPrompts.map(p => (
                  <TooltipProvider key={p.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => onAiToolClick(p)} disabled={isGenerating}>
                          <p.icon className="w-4 h-4"/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{p.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
          </div>
          <Separator className="my-4"/>
           <ScrollArea className="flex-1 px-4">
            <div className="space-y-3">
              {instructionLayers.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <p>Start drawing on the canvas or use a one-click tool to create an instruction layer.</p>
                  <p className="text-xs mt-2">Press <span className="font-mono bg-muted px-1.5 py-0.5 rounded">Shift</span> to switch colors for new instructions.</p>
                </div>
              ) : (
                instructionLayers.map((layer) => (
                  <Card key={layer.id} className="p-3 bg-muted/30">
                    <div className="flex gap-3">
                      <div className="w-16 flex-shrink-0">
                         <div 
                            className="w-16 h-12 rounded-md border flex items-center justify-center bg-card"
                            style={{ borderColor: layer.color }}
                         >
                            {layer.sketch ? (
                                <img src={layer.sketch} alt="Sketch thumbnail" className="max-w-full max-h-full" />
                            ): (
                                <p className="text-xs text-muted-foreground">...</p>
                            )}
                         </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder={`Prompt for the ${layer.color} sketch...`}
                          value={layer.prompt}
                          onChange={(e) => onInstructionChange(layer.id, e.target.value)}
                          className="text-sm h-14"
                          disabled={isGenerating}
                        />
                        <div className="flex justify-between items-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled>
                                <Mic className="w-4 h-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onLayerDelete(layer.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
           </ScrollArea>
        </TabsContent>

        <TabsContent value="photography" className="flex-1 flex flex-col min-h-0 mt-4 space-y-4">
            <Tabs defaultValue="camera-settings" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="camera-settings">Camera Settings</TabsTrigger>
                    <TabsTrigger value="camera-env">Camera & Env.</TabsTrigger>
                </TabsList>
                <TabsContent value="camera-settings" className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="aperture-slider" className="flex items-center gap-2"><Aperture className="w-4 h-4"/> Aperture (f-stop)</Label>
                        <Slider id="aperture-slider" min={1.4} max={22} step={0.1} defaultValue={[5.6]} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="shutter-slider">Shutter Speed</Label>
                        <Slider id="shutter-slider" min={0} max={10} step={1} defaultValue={[5]} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="iso-slider">ISO</Label>
                        <Slider id="iso-slider" min={100} max={6400} step={100} defaultValue={[400]} />
                    </div>
                     <div className="space-y-2">
                        <Label>Focus Area</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="sm">Center</Button>
                            <Button variant="outline" size="sm">Subject</Button>
                            <Button variant="outline" size="sm">Background</Button>
                        </div>
                    </div>
                </TabsContent>
                 <TabsContent value="camera-env" className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Camera Movement</Label>
                         <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm">Pan Left</Button>
                            <Button variant="outline" size="sm">Pan Right</Button>
                            <Button variant="outline" size="sm">Tilt Up</Button>
                            <Button variant="outline" size="sm">Tilt Down</Button>
                         </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Environment</Label>
                         <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm">Add Wind</Button>
                            <Button variant="outline" size="sm">Add Fog</Button>
                         </div>
                    </div>
                </TabsContent>
            </Tabs>
        </TabsContent>

        <TabsContent value="sfx" className="mt-4 space-y-4">
             <div className="grid grid-cols-2 gap-2">
                {sfxTools.map(tool => (
                    <Button key={tool.id} variant="outline" size="sm" onClick={() => onAiToolClick(tool)} disabled={isGenerating}>
                        <tool.icon className="w-4 h-4 mr-2"/>
                        {tool.label}
                    </Button>
                ))}
             </div>
        </TabsContent>
        
        <TabsContent value="lighting" className="mt-4 space-y-4">
            <div className="space-y-2">
                <Label>Quality Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">Cinematic</Button>
                    <Button variant="outline" size="sm">IMAX Quality</Button>
                    <Button variant="outline" size="sm">Studio</Button>
                    <Button variant="outline" size="sm">Natural</Button>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Environment</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">Outdoor</Button>
                    <Button variant="outline" size="sm">Indoor</Button>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Time of Day</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">Dawn</Button>
                    <Button variant="outline" size="sm">Noon</Button>
                    <Button variant="outline" size="sm">Dusk</Button>
                    <Button variant="outline" size="sm">Night</Button>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Sun Direction</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">Front Light</Button>
                    <Button variant="outline" size="sm">Backlight</Button>
                    <Button variant="outline" size="sm">Side Light</Button>
                    <Button variant="outline" size="sm">Top Light</Button>
                </div>
            </div>
        </TabsContent>

         <TabsContent value="inpaint" className="mt-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="inpainting-prompt">Custom Inpainting Prompt</Label>
                <p className="text-xs text-muted-foreground">Select an area on the canvas, then describe what you want to generate inside it.</p>
                <Textarea
                  id="inpainting-prompt"
                  placeholder="A majestic eagle soaring through a cloudy sky..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={5}
                  disabled={isGenerating}
                />
            </div>
        </TabsContent>
      </Tabs>


      <div className="pt-4 border-t">
        <Button onClick={() => onGenerate()} disabled={isGenerating || (instructionLayers.length === 0 && !customPrompt)}>
          <Wand2 className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate Edits"}
        </Button>
      </div>
    </div>
  );
}
