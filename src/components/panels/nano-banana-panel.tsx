
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BananaIcon } from "../icons/banana-icon";
import { Wand2, Mic, Trash2 } from "lucide-react";
import { Card } from "../ui/card";

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
  onGenerate: () => void;
  isGenerating: boolean;
}

export function NanoBananaPanel({
  instructionLayers,
  onInstructionChange,
  onLayerDelete,
  onGenerate,
  isGenerating,
}: NanoBananaPanelProps) {

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="space-y-2">
        <h3 className="font-headline text-lg flex items-center gap-2">
          <BananaIcon className="w-5 h-5 text-yellow-400" />
          Nano Banana Editor
        </h3>
        <p className="text-sm text-muted-foreground">
          Draw and write on your image to instruct the AI.
        </p>
      </div>

      <Separator />

      <ScrollArea className="flex-1 -mx-4">
        <div className="px-4 space-y-3">
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

      <div className="pt-4 border-t">
        <Button onClick={onGenerate} disabled={isGenerating || instructionLayers.length === 0} className="w-full">
          <Wand2 className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate Edits"}
        </Button>
      </div>
    </div>
  );
}
