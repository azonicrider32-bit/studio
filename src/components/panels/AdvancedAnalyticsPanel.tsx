

"use client"

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Grid, 
  Activity, 
  Download,
  Maximize2,
  Minimize2,
  Cpu,
  Eye,
  Zap,
  Target,
  Layers,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Layer } from '@/lib/types';
import { PerformanceMetrics, ApiPerformanceMetrics } from './telemetry-panel';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { TooltipProvider, Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';


export default function AdvancedAnalyticsPanel({ 
  imageData,
  segmentationData,
  layers,
  performanceMetrics,
  isOpen,
  onToggle
}: {
  imageData: ImageData | null;
  segmentationData: Set<number> | null;
  layers: Layer[];
  performanceMetrics: PerformanceMetrics;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const { firestore, user } = useFirebase();

  const logsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'performanceLogs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  }, [user, firestore]);
  
  const { data: performanceLogs, isLoading: logsLoading } = useCollection(logsQuery);


  // Generate advanced analytics data
  const getImageStats = () => {
    if (!imageData) return null;
    
    const { data, width, height } = imageData;
    const totalPixels = width * height;
    let rSum = 0, gSum = 0, bSum = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2];
    }
    
    return {
      totalPixels,
      avgColor: {
        r: Math.round(rSum / totalPixels),
        g: Math.round(gSum / totalPixels),
        b: Math.round(bSum / totalPixels)
      },
      segmentedPixels: segmentationData?.size || 0,
      segmentationCoverage: ((segmentationData?.size || 0) / totalPixels * 100).toFixed(2)
    };
  };

  const getHistogramData = () => {
    if (!imageData) return [];
    
    const { data } = imageData;
    const rHist = new Array(16).fill(0);
    const gHist = new Array(16).fill(0);
    const bHist = new Array(16).fill(0);
    
    for (let i = 0; i < data.length; i += 4) {
      rHist[Math.floor(data[i] / 16)]++;
      gHist[Math.floor(data[i + 1] / 16)]++;
      bHist[Math.floor(data[i + 2] / 16)]++;
    }
    
    return rHist.map((r, i) => ({
      range: `${i * 16}`,
      red: r,
      green: gHist[i],
      blue: bHist[i]
    }));
  };

  const getLayerStats = () => {
    return layers.filter(layer => layer.type !== 'background').map((layer, index) => ({
      id: layer.id,
      name: layer.name,
      pixels: layer.pixels?.size || 0,
      opacity: layer.highlightOpacity ?? 1,
      visible: layer.visible,
      color: `hsl(${index * 60}, 70%, 50%)`
    }));
  };

  const stats = getImageStats();
  const histogramData = getHistogramData();
  const layerStats = getLayerStats();
  
  const TABS = [
      { id: 'overview', icon: Target, label: "Overview" },
      { id: 'histogram', icon: BarChart3, label: "Histogram" },
      { id: 'layers', icon: Layers, label: "Layers Analysis" },
      { id: 'performance', icon: Activity, label: "Performance" },
      { id: 'logs', icon: FileText, label: "Event Logs" },
  ]

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50"
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        Analytics
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700/60 shadow-xl">
          <CardHeader className="py-2 px-3 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-200 text-sm">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Advanced Analytics
              </CardTitle>
              <div className="flex items-center gap-2">
                {stats && (
                  <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs">
                    {stats.segmentationCoverage}% coverage
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
                  <Minimize2 className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="p-1 border-b border-slate-700/50">
                <div className="flex items-center justify-around bg-slate-700/50 border border-slate-600 rounded-md p-0.5">
                    <TooltipProvider>
                      {TABS.map(tab => (
                        <UITooltip key={tab.id}>
                          <TooltipTrigger asChild>
                            <Button 
                              variant={activeTab === tab.id ? 'secondary' : 'ghost'} 
                              size="icon"
                              className="h-7 w-10 flex-1"
                              onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon className="w-4 h-4"/>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>{tab.label}</p></TooltipContent>
                        </UITooltip>
                      ))}
                    </TooltipProvider>
                </div>
              </div>

              <div className="p-2">
                <TabsContent value="overview" className="mt-0 space-y-2">
                  {stats ? (
                    <>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <StatCard icon={Target} label="Total Pixels" value={stats.totalPixels.toLocaleString()} color="blue" />
                        <StatCard icon={Eye} label="Segmented" value={stats.segmentedPixels.toLocaleString()} color="green" />
                        <StatCard icon={Activity} label="Coverage" value={`${stats.segmentationCoverage}%`} color="purple" />
                        <StatCard icon={Layers} label="Layers" value={layers.filter(l => l.type !== 'background').length} color="orange" />
                      </div>
                      <div className="bg-slate-700/20 rounded-lg p-2">
                        <h4 className="text-xs font-medium text-slate-300 mb-2">Average Color</h4>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-md border border-slate-600"
                            style={{ backgroundColor: `rgb(${stats.avgColor.r}, ${stats.avgColor.g}, ${stats.avgColor.b})` }}
                          />
                          <div className="text-xs text-slate-400">
                            <div>RGB: {stats.avgColor.r}, {stats.avgColor.g}, {stats.avgColor.b}</div>
                            <div className="font-mono">Hex: #{[stats.avgColor.r, stats.avgColor.g, stats.avgColor.b].map(c => c.toString(16).padStart(2, '0')).join('')}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyState icon={BarChart3} text="Load an image to see analytics" />
                  )}
                </TabsContent>

                <TabsContent value="histogram" className="mt-0">
                  <div className="h-56 w-full">
                    {histogramData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={histogramData} margin={{ top: 5, right: 0, left: -30, bottom: -10 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#374151" />
                          <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background)/0.8)', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px' }} />
                          <Bar dataKey="red" stackId="a" fill="#ef4444" opacity={0.7} />
                          <Bar dataKey="green" stackId="a" fill="#22c55e" opacity={0.7} />
                          <Bar dataKey="blue" stackId="a" fill="#3b82f6" opacity={0.7} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState icon={Grid} text="No histogram data available" />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="layers" className="mt-0 space-y-2">
                  {layerStats.length > 0 ? (
                    <div className="space-y-2">
                      {layerStats.map((layer) => (
                        <div key={layer.id} className="bg-slate-700/20 rounded-lg p-2 border border-slate-600/50">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded border border-slate-500" style={{ backgroundColor: layer.color }} />
                              <span className="text-xs font-medium text-slate-300 truncate">{layer.name}</span>
                              {!layer.visible && <Badge variant="outline" className="text-xs bg-slate-600/50">Hidden</Badge>}
                            </div>
                            <span className="text-xs text-slate-400 font-mono">{layer.pixels.toLocaleString()} px</span>
                          </div>
                          <Progress value={stats ? (layer.pixels / stats.totalPixels) * 100 : 0} className="h-1 bg-slate-600" indicatorClassName="bg-primary/50" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Layers} text="No segmentation layers created yet" />
                  )}
                </TabsContent>

                <TabsContent value="performance" className="mt-0 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard icon={Activity} label="Frame Rate" value={`${performanceMetrics?.avgDuration ? (1000 / performanceMetrics.avgDuration).toFixed(0) : 'N/A'} FPS`} color="green" />
                    <StatCard icon={Cpu} label="Processing" value={`${Math.round(performanceMetrics?.lastDuration || 0)}ms`} color="blue" />
                    <StatCard icon={Zap} label="GPU" value="Active" color="purple" />
                  </div>
                  <div className="bg-slate-700/20 rounded-lg p-2">
                    <h4 className="text-xs font-medium text-slate-300 mb-2">Performance Timeline</h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceMetrics.history.map((d, i) => ({name: i, duration: d})).reverse()} margin={{ top: 5, right: 5, left: -30, bottom: -10 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#374151" />
                          <XAxis dataKey="name" tick={false} axisLine={{ stroke: '#4b5563' }} />
                          <YAxis domain={[0, 'dataMax + 20']} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background)/0.8)', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                          <Line type="monotone" dataKey="duration" stroke="#3b82f6" strokeWidth={1.5} name="Frame Time (ms)" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
                 <TabsContent value="logs" className="mt-0">
                    <Card className="h-[280px] border-slate-600/50 bg-slate-700/20">
                      <CardContent className="p-2 h-full overflow-y-auto">
                        {logsLoading && <div className="text-center text-xs text-slate-400 p-4">Loading logs...</div>}
                        {!logsLoading && (!performanceLogs || performanceLogs.length === 0) ? (
                          <EmptyState icon={FileText} text="No performance logs yet."/>
                        ) : (
                          <div className="space-y-2">
                            {performanceLogs?.map((log: any) => (
                              <div key={log.id} className="text-xs p-2 rounded-md bg-slate-700/40 border border-slate-600/50">
                                <p className="text-slate-300 font-medium leading-tight">{log.description}</p>
                                <div className="flex items-center justify-between text-slate-400 mt-1">
                                    <Badge variant="outline" className="text-xs font-mono">{log.duration.toFixed(2)}ms</Badge>
                                    <span className="text-slate-500">{log.timestamp ? formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true }) : 'N/A'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                 </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
  <div className="bg-slate-700/30 rounded-lg p-2">
    <div className={`flex items-center gap-1.5 mb-1`}>
      <Icon className={`w-3.5 h-3.5 text-${color}-400`} />
      <span className="text-xs font-medium text-slate-300">{label}</span>
    </div>
    <div className={`text-base font-bold text-${color}-400`}>{value}</div>
  </div>
);

const EmptyState = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
  <div className="flex items-center justify-center h-56 text-slate-400">
    <div className="text-center">
      <Icon className="w-10 h-10 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  </div>
);

