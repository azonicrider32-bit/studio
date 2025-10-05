
      "use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "../ui/card";
import { Wand2, Mic, Trash2, Sparkles, Plus, Palette, BrainCircuit, ImageUp, Sparkle, Camera, Aperture, Wind, Flame, Zap, PanelTop, MessageSquare, Frame, Pipette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "../ui/label";
import { AITool } from "@/lib/types";
import { Slider } from "../ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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
          <TabsTrigger value={value} className="flex-1 flex-col h-14 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Icon className="h-5 w-5" />
            <span className="text-xs mt-1 group-hover:block hidden">{children}</span>
          </TabsTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const oneClickPrompts: AITool[] = [
    { id: 'blemish-remover', label: 'Blemish Remover', prompt: 'Seamlessly remove this blemish, matching the surrounding skin texture and tone.', icon: Sparkles, color: '#ff80ed', lineStyle: 'solid' },
    { id: 'add-object', label: 'Add Object', prompt: 'Add a small, realistic bird sitting here.', icon: Plus, color: '#ffc107', lineStyle: 'solid' },
    { id: 'change-color', label: 'Change Color', prompt: 'Change the color of this object to a deep blue.', icon: Pipette, color: '#00bcd4', lineStyle: 'dashed' },
    { id: 'remove-object', label: 'Remove Object', prompt: 'Completely remove the selected object and realistically fill in the background.', icon: Trash2, color: '#f44336', lineStyle: 'solid' },
  ];

  return (
    <div className="p-2 space-y-4 h-full flex flex-col">
      <Tabs defaultValue="instruct" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-5 h-auto">
          <AITabTrigger value="instruct" icon={MessageSquare}>Instruct</AITabTrigger>
          <AITabTrigger value="generate" icon={Wand2}>Generate</AITabTrigger>
          <AITabTrigger value="enhance" icon={Sparkles}>Enhance</AITabTrigger>
          <AITabTrigger value="inpaint" icon={ImageUp}>Inpaint &amp; Extend</AITabTrigger>
          <AITabTrigger value="lighting" icon={Zap}>Lighting</AITabTrigger>
        </TabsList>

        <TabsContent value="instruct" className="flex-1 flex flex-col min-h-0 -mx-2 mt-4">
           <div className="px-2 pb-2 space-y-2">
                <Label>One-Click Tools</Label>
                <div className="grid grid-cols-4 gap-2">
                    {oneClickPrompts.map(tool => (
                        <TooltipProvider key={tool.id}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-12 w-full flex-col gap-1"
                                        onClick={() => onAiToolClick(tool)}
                                    >
                                        <tool.icon className="h-5 w-5" style={{ color: tool.color }} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{tool.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
            </div>
            <Separator className="my-2" />
           <ScrollArea className="flex-1 px-2">
            <div className="space-y-3">
              {instructionLayers.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <p>Draw on the canvas to give the AI instructions.</p>
                  <p className="text-xs mt-2">Your visual edits will appear here.</p>
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

        <TabsContent value="generate" className="mt-4 space-y-4">
             <div className="text-center text-muted-foreground text-sm py-8">
                <p>Text-to-Image generation tools will be available here.</p>
             </div>
        </TabsContent>
        <TabsContent value="enhance" className="mt-4 space-y-4">
             <div className="text-center text-muted-foreground text-sm py-8">
                <p>AI upscaling and enhancement tools will be available here.</p>
             </div>
        </TabsContent>
        
        <TabsContent value="inpaint" className="mt-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="inpainting-prompt">Inpainting Prompt</Label>
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
            <Separator/>
            <div className="space-y-3">
              <Label>Outpainting / Extend Image</Label>
              <p className="text-xs text-muted-foreground">
                Expand the canvas by drawing a rectangle from the edge of the image. The AI will fill in the new area.
              </p>
              <Button variant="outline" className="w-full">
                <Frame className="w-4 h-4 mr-2"/>
                Start Extending
              </Button>
               <div className="space-y-2">
                  <Label htmlFor="content-adherence">Content Adherence</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger id="content-adherence">
                      <SelectValue placeholder="Select adherence..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (Stick to style)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="low">Low (Creative freedom)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
    