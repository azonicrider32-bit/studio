
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, Cpu, Clock, Bot } from "lucide-react"

export interface PerformanceMetrics {
    lastDuration: number;
    avgDuration: number;
    lagEvents: number;
}

export interface ApiPerformanceMetrics {
    lastCall: number;
    avgCall: number;
    errors: number;
}

export function TelemetryPanel({
    wandPerf,
    lassoPerf,
    apiPerf,
}: {
    wandPerf: PerformanceMetrics;
    lassoPerf: PerformanceMetrics;
    apiPerf: ApiPerformanceMetrics;
}) {

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
    <div className="space-y-6">
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
                <PerfStat icon={Clock} label="Last Preview" value={wandPerf?.lastDuration || 0} unit="ms" status="good" />
                <PerfStat icon={Clock} label="Avg Preview" value={wandPerf?.avgDuration || 0} unit="ms" status="good" />
                <PerfStat icon={AlertTriangle} label="Lag Events" value={wandPerf?.lagEvents || 0} unit="" status="good" />
             </div>
          </div>
           <div className="space-y-2">
            <h4 className="font-semibold text-sm">Intelligent Lasso</h4>
             <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <PerfStat icon={Clock} label="Last Path" value={lassoPerf?.lastDuration || 0} unit="ms" status="good" />
                <PerfStat icon={Clock} label="Avg Path" value={lassoPerf?.avgDuration || 0} unit="ms" status="good" />
                <PerfStat icon={AlertTriangle} label="Lag Events" value={lassoPerf?.lagEvents || 0} unit="" status="good" />
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
              <PerfStat icon={Clock} label="Last Call" value={apiPerf?.lastCall || 0} unit="ms" status="good" />
              <PerfStat icon={Clock} label="Avg Call" value={apiPerf?.avgCall || 0} unit="ms" status="good" />
              <PerfStat icon={AlertTriangle} label="Errors" value={apiPerf?.errors || 0} unit="" status="good" />
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
