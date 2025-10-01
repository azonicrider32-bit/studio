
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, AlertTriangle, Cpu, Clock, Bot } from "lucide-react"

export function TelemetryPanel() {
  // Placeholder data
  const wandPerf = { lastDuration: 12, avgDuration: 18, lagEvents: 0 };
  const lassoPerf = { lastDuration: 4, avgDuration: 5, lagEvents: 0 };
  const apiPerf = { lastCall: 1250, avgCall: 1400, errors: 0 };

  const PerfStat = ({ icon: Icon, label, value, unit, status }: { icon: React.ElementType, label: string, value: number, unit: string, status: "good" | "warning" | "bad" }) => (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <span className="font-mono">{value}{unit}</span>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Performance Telemetry</h3>
        <p className="text-sm text-muted-foreground">
          Real-time diagnostics for application performance and lag detection.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Cpu className="w-5 h-5"/> Tool Performance</CardTitle>
          <CardDescription className="text-xs">
            Measures the execution time of client-side selection tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Magic Wand</h4>
             <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <PerfStat icon={Clock} label="Last Preview" value={wandPerf.lastDuration} unit="ms" status="good" />
                <PerfStat icon={Clock} label="Avg Preview" value={wandPerf.avgDuration} unit="ms" status="good" />
                <PerfStat icon={AlertTriangle} label="Lag Events" value={wandPerf.lagEvents} unit="" status="good" />
             </div>
          </div>
           <div className="space-y-2">
            <h4 className="font-semibold text-sm">Intelligent Lasso</h4>
             <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <PerfStat icon={Clock} label="Last Path" value={lassoPerf.lastDuration} unit="ms" status="good" />
                <PerfStat icon={Clock} label="Avg Path" value={lassoPerf.avgDuration} unit="ms" status="good" />
                <PerfStat icon={AlertTriangle} label="Lag Events" value={lassoPerf.lagEvents} unit="" status="good" />
             </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bot className="w-5 h-5"/> AI API Calls</CardTitle>
           <CardDescription className="text-xs">
            Measures latency for GenAI model inferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <PerfStat icon={Clock} label="Last Call" value={apiPerf.lastCall} unit="ms" status="good" />
              <PerfStat icon={Clock} label="Avg Call" value={apiPerf.avgCall} unit="ms" status="good" />
              <PerfStat icon={AlertTriangle} label="Errors" value={apiPerf.errors} unit="" status="good" />
           </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <span>No performance issues detected.</span>
      </div>

    </div>
  )
}
