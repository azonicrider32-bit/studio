

"use client"

import * as React from "react"
import {
  Brush,
  Palette,
  User,
  FolderOpen,
  Download,
  Cpu,
  Keyboard,
  Magnet
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { TelemetryPanel, PerformanceMetrics, ApiPerformanceMetrics } from "./telemetry-panel"
import AdvancedAnalyticsPanel from "./AdvancedAnalyticsPanel"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Slider } from "../ui/slider"
import { useSidebar } from "../ui/sidebar"
import { GlobalSettings, Layer } from "@/lib/types"

const hotkeys = [
  { tool: 'Transform', key: 'V' },
  { tool: 'Magic Wand', key: 'W' },
  { tool: 'Intelligent Lasso', key: 'L' },
  { tool: 'Line Tool', key: 'P' },
  { tool: 'Brush', key: 'B' },
  { tool: 'Eraser', key: 'E' },
  { tool: 'Pan Tool', key: 'H' },
  { tool: 'Clone Stamp', key: 'C' },
  { tool: 'Asset Library', key: 'O' },
  { tool: 'Undo', key: 'Ctrl+Z' },
  { tool: 'Redo', key: 'Ctrl+Y' },
];

const SETTING_TABS = [
    { id: "hotkeys", icon: Keyboard, label: "Hotkeys" },
    { id: "cursor", icon: Brush, label: "Cursor" },
    { id: "theme", icon: Palette, label: "Theme" },
    { id: "snap", icon: Magnet, label: "Snapping" },
    { id: "performance", icon: Cpu, label: "Performance" },
    { id: "account", icon: User, label: "Account" },
    { id: "projects", icon: FolderOpen, label: "Projects" },
    { id: "export", icon: Download, label: "Export" },
];

export function GlobalSettingsCompactPanel({ showHotkeys, onShowHotkeysChange }: { showHotkeys: boolean, onShowHotkeysChange: (value: boolean) => void }) {
    return (
        <div className="flex flex-col h-full items-center justify-start py-2 px-1">
            <TooltipProvider>
                <div className="flex flex-col items-center space-y-1">
                    {SETTING_TABS.map(tab => (
                        <Tooltip key={tab.id}>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10">
                                    <tab.icon className="w-5 h-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{tab.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>
        </div>
    )
}

function UIAdjusterPanel() {
  const [primaryColor, setPrimaryColor] = React.useState("#6366f1");

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setPrimaryColor(newColor);
    // In a real app, you'd update the CSS variables here
    // document.documentElement.style.setProperty('--primary', newColor);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-5 h-5"/>
            Theme Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={handleColorChange}
                className="w-12 h-10 p-1"
              />
              <span className="font-mono">{primaryColor}</span>
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="font-select">Font Family</Label>
             <select id="font-select" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>Inter</option>
                <option>Space Grotesk</option>
                <option>Roboto</option>
             </select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CursorSettingsPanel() {
    const [cursorSize, setCursorSize] = React.useState(32);
    const [cursorOpacity, setCursorOpacity] = React.useState(50);
    const [useAnimation, setUseAnimation] = React.useState(true);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Brush className="w-5 h-5"/>
                    Custom Cursor Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="cursor-size">Cursor Size: {cursorSize}px</Label>
                    <Slider 
                        id="cursor-size"
                        min={16} max={128} step={2}
                        value={[cursorSize]}
                        onValueChange={(v) => setCursorSize(v[0])}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="cursor-opacity">Cursor Opacity: {cursorOpacity}%</Label>
                    <Slider 
                        id="cursor-opacity"
                        min={10} max={100} step={5}
                        value={[cursorOpacity]}
                        onValueChange={(v) => setCursorOpacity(v[0])}
                    />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label>Enable Animation</Label>
                        <p className="text-xs text-muted-foreground">
                            Animate color transitions smoothly.
                        </p>
                    </div>
                    <Switch
                        checked={useAnimation}
                        onCheckedChange={setUseAnimation}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function SnapSettingsPanel({ settings, onSettingsChange }: { settings: GlobalSettings, onSettingsChange: (s: Partial<GlobalSettings>) => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Magnet className="w-5 h-5"/>
                    Snapping
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label>Enable Snapping</Label>
                        <p className="text-xs text-muted-foreground">
                           Globally enable or disable snapping to nodes and guides.
                        </p>
                    </div>
                    <Switch
                        checked={settings.snapEnabled}
                        onCheckedChange={(checked) => onSettingsChange({ snapEnabled: checked })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="snap-radius">Snap Radius: {settings.snapRadius}px</Label>
                    <Slider 
                        id="snap-radius"
                        min={1} max={50} step={1}
                        value={[settings.snapRadius]}
                        onValueChange={(v) => onSettingsChange({ snapRadius: v[0]})}
                        disabled={!settings.snapEnabled}
                    />
                </div>
            </CardContent>
        </Card>
    )
}


export function GlobalSettingsPanel({
  showHotkeys,
  onShowHotkeysChange,
  settings,
  onSettingsChange,
  wandPerf,
  lassoPerf,
  apiPerf,
  imageData,
  layers,
}: {
  showHotkeys: boolean;
  onShowHotkeysChange: (value: boolean) => void;
  settings: GlobalSettings;
  onSettingsChange: (s: Partial<GlobalSettings>) => void;
  wandPerf: PerformanceMetrics;
  lassoPerf: PerformanceMetrics;
  apiPerf: ApiPerformanceMetrics;
  imageData: ImageData | null;
  layers: Layer[];
}) {
  const [activeTab, setActiveTab] = React.useState("performance");
  const [isPerfOpen, setIsPerfOpen] = React.useState(true);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="border-b mb-4">
        <TooltipProvider>
          <div className="flex items-center justify-around">
            {SETTING_TABS.map(tab => (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === tab.id ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tab.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'hotkeys' && (
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
                    onCheckedChange={onShowHotkeysChange}
                />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manage Hotkeys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {hotkeys.map(hotkey => (
                  <div key={hotkey.tool} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{hotkey.tool}</span>
                    <Button variant="outline" size="sm" className="font-mono">{hotkey.key}</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
        {activeTab === 'cursor' && (
          <CursorSettingsPanel />
        )}
        {activeTab === 'theme' && (
          <UIAdjusterPanel />
        )}
        {activeTab === 'snap' && (
            <SnapSettingsPanel settings={settings} onSettingsChange={onSettingsChange} />
        )}
        {activeTab === 'performance' && (
            <AdvancedAnalyticsPanel 
              imageData={imageData}
              segmentationData={null}
              layers={layers}
              performanceMetrics={wandPerf}
              isOpen={isPerfOpen}
              onToggle={() => setIsPerfOpen(!isPerfOpen)}
            />
        )}
         {activeTab === 'account' && (
            <div className="text-center p-8 text-muted-foreground">Account settings will be available here.</div>
        )}
        {activeTab === 'projects' && (
            <div className="text-center p-8 text-muted-foreground">Project loading options will be available here.</div>
        )}
        {activeTab === 'export' && (
            <div className="text-center p-8 text-muted-foreground">Export settings will be available here.</div>
        )}
      </div>
    </div>
  )
}
