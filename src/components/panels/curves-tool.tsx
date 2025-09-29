"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card } from "@/components/ui/card"

const chartData = [
  { x: 0, y: 0 },
  { x: 64, y: 48 },
  { x: 128, y: 128 },
  { x: 192, y: 208 },
  { x: 255, y: 255 },
]

const chartConfig = {
  y: {
    label: "Output",
    color: "hsl(var(--accent))",
  },
  x: {
    label: "Input",
  },
}

export function CurvesTool() {
  return (
    <Card className="p-2 border-dashed">
      <ChartContainer config={chartConfig} className="aspect-video h-48 w-full">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 10,
            left: -20,
            bottom: -10,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="x" type="number" domain={[0, 255]} tick={false} axisLine={false} />
          <YAxis dataKey="y" type="number" domain={[0, 255]} tick={false} axisLine={false} />
          <ChartTooltip cursor={true} content={<ChartTooltipContent />} />
          <Line
            dataKey="y"
            type="monotone"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            dot={{
              r: 4,
              fill: "hsl(var(--accent))",
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  )
}
