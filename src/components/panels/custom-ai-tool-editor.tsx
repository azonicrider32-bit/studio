
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Save, Plus, Trash2, SlidersHorizontal } from "lucide-react";

// Placeholder for the CustomAiTool type from your types file
// import { CustomAiTool } from "@/lib/types";

// For now, we'll define a placeholder type here.
interface CustomAiTool {
    id: string;
    name: string;
    description: string;
    icon: string;
    promptTemplate: string;
    uiDefinition: any[];
}

interface CustomAiToolEditorProps {
    tool: CustomAiTool | null;
    onSave: (tool: CustomAiTool) => void;
    onClose: () => void;
}

export function CustomAiToolEditor({ tool, onSave, onClose }: CustomAiToolEditorProps) {
    const [editedTool, setEditedTool] = React.useState<CustomAiTool | null>(tool);

    React.useEffect(() => {
        setEditedTool(tool);
    }, [tool]);

    if (!editedTool) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Select a tool to edit or create a new one.
            </div>
        );
    }
    
    const handleSave = () => {
        onSave(editedTool);
    }

    return (
        <div className="p-4 h-full flex flex-col">
            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Tool Editor</span>
                        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 overflow-y-auto">
                    <div className="space-y-2">
                        <Label htmlFor="tool-name">Tool Name</Label>
                        <Input id="tool-name" value={editedTool.name} onChange={e => setEditedTool({...editedTool, name: e.target.value})} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tool-desc">Description</Label>
                        <Textarea id="tool-desc" value={editedTool.description} onChange={e => setEditedTool({...editedTool, description: e.target.value})} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tool-prompt">Prompt Template</Label>
                        <Textarea 
                            id="tool-prompt" 
                            value={editedTool.promptTemplate} 
                            onChange={e => setEditedTool({...editedTool, promptTemplate: e.target.value})}
                            rows={8}
                            placeholder="Use {{mask}} and {{custom_param_1}} for variables."
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Custom UI Controls</Label>
                        <div className="border p-4 rounded-md space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <SlidersHorizontal className="w-4 h-4 mr-2"/>
                                <span>Strength Slider</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="w-4 h-4"/></Button>
                            </div>
                             <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <SlidersHorizontal className="w-4 h-4 mr-2"/>
                                <span>Detail Level</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="w-4 h-4"/></Button>
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-2">
                                <Plus className="w-4 h-4 mr-2"/> Add Control
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2"/>
                        Save Custom Tool
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

    