
"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { TelemetryPanel } from "./telemetry-panel"

export function GlobalSettingsPanel() {
  const [showHotkeys, setShowHotkeys] = React.useState(true)

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="space-y-2 mb-4">
        <h3 className="font-headline text-lg">Global Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure application-wide preferences.
        </p>
      </div>

      <Tabs defaultValue="hotkeys" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hotkeys">Hotkeys</TabsTrigger>
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="hotkeys" className="mt-4 flex-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label>Show Hotkey Labels</Label>
                    <p className="text-xs text-muted-foreground">
                        Display keyboard shortcuts on tool buttons.
                    </p>
                </div>
                <Switch
                    checked={showHotkeys}
                    onCheckedChange={setShowHotkeys}
                />
            </div>
            {/* More hotkey settings can go here */}
          </div>
        </TabsContent>
        <TabsContent value="project" className="mt-4">
          <p className="text-sm text-muted-foreground">Project settings will go here.</p>
        </TabsContent>
        <TabsContent value="performance" className="mt-4 flex-1">
            <TelemetryPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
