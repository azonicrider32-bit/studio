
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "../ui/card";
import { BananaIcon } from "../icons/banana-icon";
import { Wand2, Mic, Trash2, Sparkles, Plus, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "../ui/label";

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
  isGenerating: boolean;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
}

const oneClickPrompts = [
  {
    id: "blemish-remover",
    label: "Blemish Remover",
    prompt: "Inpaint the selected area to seamlessly match the surrounding background, making it look as if the blemish or object was never there. Pay close attention to texture, lighting, and patterns to create a realistic and unnoticeable fill.",
    icon: Sparkles,
  },
  {
    id: "remove-object",
    label: "Remove Object",
    prompt: "Inpaint the selected area to seamlessly match the surrounding background, making it look as if the object was never there. Pay close attention to texture, lighting, and patterns to create a realistic and unnoticeable fill.",
    icon: Trash2,
  },
  {
    id: "add-object",
    label: "Add Object",
    prompt: "Add a small bird to the selected area. It should be sitting naturally and match the lighting of the scene.",
    icon: Plus,
  },
  {
    id: "change-color",
    label: "Change Color",
    prompt: "Change the color of the selected object to a vibrant, realistic blue. Maintain the original texture, shadows, and highlights of the object, ensuring only the color is altered.",
    icon: Palette,
  },
];


export function NanoBananaPanel({
  instructionLayers,
  onInstructionChange,
  onLayerDelete,
  onGenerate,
  isGenerating,
  customPrompt,
  setCustomPrompt,
}: NanoBananaPanelProps) {

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="space-y-2">
        <h3 className="font-headline text-lg flex items-center gap-2">
          <BananaIcon className="w-5 h-5 text-yellow-400" />
          Nano Banana Editor
        </h3>
        <p className="text-sm text-muted-foreground">
          Visually instruct the AI to perform generative edits.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="instruct" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instruct">Instruct</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>
        <TabsContent value="instruct" className="flex-1 overflow-y-auto -mx-4 mt-4">
           <ScrollArea className="h-full px-4">
            <div className="space-y-3">
              {instructionLayers.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <p>Start drawing on the canvas to create an instruction layer.</p>
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
        <TabsContent value="generate" className="mt-4 space-y-4">
            <div className="space-y-2">
                <Label className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary"/> One-Click Actions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {oneClickPrompts.map(p => (
                    <Button key={p.id} variant="outline" size="sm" onClick={() => onGenerate(p.prompt)} disabled={isGenerating}>
                      <p.icon className="w-4 h-4 mr-2"/>
                      {p.label}
                    </Button>
                  ))}
                </div>
            </div>
            <Separator/>
            <div className="space-y-2">
                <Label htmlFor="inpainting-prompt">Custom Prompt</Label>
                <Textarea
                  id="inpainting-prompt"
                  placeholder="A majestic eagle soaring..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
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
