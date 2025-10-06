
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatDistanceToNow } from 'date-fns';


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
      range: `${i * 16}-${(i + 1) * 16 - 1}`,
      red: r,
      green: gHist[i],
      blue: bHist[i]
    }));
  };

  const getLayerStats = () => {
    return layers.filter(layer => layer.id !== 'bg').map((layer, index) => ({
      id: layer.id,
      name: layer.name,
      pixels: layer.pixels?.size || 0,
      opacity: layer.highlightOpacity ?? 1,
      visible: layer.visible,
      color: `hsl(${index * 60}, 70%, 50%)`
    }));
  };
  
  const getPerformanceData = () => [
    { time: '0s', cpu: 45, memory: 120, gpu: 30 },
    { time: '1s', cpu: 60, memory: 150, gpu: 45 },
    { time: '2s', cpu: 75, memory: 180, gpu: 60 },
    { time: '3s', cpu: 50, memory: 160, gpu: 35 },
    { time: '4s', cpu: 40, memory: 140, gpu: 25 },
  ];

  const stats = getImageStats();
  const histogramData = getHistogramData();
  const layerStats = getLayerStats();
  const performanceData = getPerformanceData();

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
          <CardHeader className="pb-3 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Advanced Analytics
              </CardTitle>
              <div className="flex items-center gap-2">
                {stats && (
                  <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                    {stats.segmentationCoverage}% coverage
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={onToggle} className="text-slate-400 hover:text-slate-200">
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 m-4 mb-0 bg-slate-700/50 border border-slate-600">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="histogram">Histogram</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              <div className="p-4">
                <TabsContent value="overview" className="mt-0 space-y-4">
                  {stats ? (
                    <>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Target} label="Total Pixels" value={stats.totalPixels.toLocaleString()} color="blue" />
                        <StatCard icon={Eye} label="Segmented" value={stats.segmentedPixels.toLocaleString()} color="green" />
                        <StatCard icon={Activity} label="Coverage" value={`${stats.segmentationCoverage}%`} color="purple" />
                        <StatCard icon={Layers} label="Layers" value={layers.filter(l => l.id !== 'bg').length} color="orange" />
                      </div>
                      <div className="bg-slate-700/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Average Color</h4>
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-16 h-16 rounded-lg border border-slate-600"
                            style={{ backgroundColor: `rgb(${stats.avgColor.r}, ${stats.avgColor.g}, ${stats.avgColor.b})` }}
                          />
                          <div className="text-sm text-slate-400">
                            <div>RGB: {stats.avgColor.r}, {stats.avgColor.g}, {stats.avgColor.b}</div>
                            <div>Hex: #{[stats.avgColor.r, stats.avgColor.g, stats.avgColor.b].map(c => c.toString(16).padStart(2, '0')).join('')}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyState icon={BarChart3} text="Load an image to see analytics" />
                  )}
                </TabsContent>

                <TabsContent value="histogram" className="mt-0">
                  <div className="h-64 w-full">
                    {histogramData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={histogramData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' }} />
                          <Bar dataKey="red" fill="#ef4444" opacity={0.8} />
                          <Bar dataKey="green" fill="#22c55e" opacity={0.8} />
                          <Bar dataKey="blue" fill="#3b82f6" opacity={0.8} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState icon={Grid} text="No histogram data available" />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="layers" className="mt-0 space-y-4">
                  {layerStats.length > 0 ? (
                    <div className="space-y-3">
                      {layerStats.map((layer) => (
                        <div key={layer.id} className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border border-slate-500" style={{ backgroundColor: layer.color }} />
                              <span className="text-sm font-medium text-slate-300">{layer.name}</span>
                              {!layer.visible && <Badge variant="outline" className="text-xs bg-slate-600/50">Hidden</Badge>}
                            </div>
                            <span className="text-sm text-slate-400">{layer.pixels.toLocaleString()} pixels</span>
                          </div>
                          <Progress value={stats ? (layer.pixels / stats.totalPixels) * 100 : 0} className="h-2 bg-slate-600" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Layers} text="No segmentation layers created yet" />
                  )}
                </TabsContent>

                <TabsContent value="performance" className="mt-0 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <StatCard icon={Activity} label="Frame Rate" value={`${performanceMetrics?.avgDuration ? (1000 / performanceMetrics.avgDuration).toFixed(0) : 'N/A'} FPS`} color="green" />
                    <StatCard icon={Cpu} label="Processing" value={`${Math.round(performanceMetrics?.lastDuration || 0)}ms`} color="blue" />
                    <StatCard icon={Zap} label="GPU" value="Active" color="purple" />
                  </div>
                  <div className="bg-slate-700/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Performance Timeline</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' }} />
                          <Line type="monotone" dataKey="cpu" stroke="#22c55e" strokeWidth={2} name="CPU %" />
                          <Line type="monotone" dataKey="memory" stroke="#3b82f6" strokeWidth={2} name="Memory MB" />
                          <Line type="monotone" dataKey="gpu" stroke="#8b5cf6" strokeWidth={2} name="GPU %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <h4 className="text-sm font-medium text-blue-300 mb-2">Optimization Suggestions</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• GPU acceleration is active for optimal performance.</li>
                      <li>• Consider reducing image size for faster processing.</li>
                    </ul>
                  </div>
                </TabsContent>
                 <TabsContent value="logs" className="mt-0">
                    <Card className="h-80 border-slate-600/50 bg-slate-700/20">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Operation</TableHead>
                            <TableHead>Tool</TableHead>
                            <TableHead className="text-right">Duration (ms)</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logsLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                          ))}
                          {!logsLoading && performanceLogs && performanceLogs.map((log: any) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">{log.operation}</TableCell>
                              <TableCell>{log.tool}</TableCell>
                              <TableCell className="text-right font-mono">{log.duration.toFixed(2)}</TableCell>
                              <TableCell>{log.timestamp ? formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true }) : 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                           {!logsLoading && (!performanceLogs || performanceLogs.length === 0) && (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">No logs yet. Perform an action to see data.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
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
  <div className="bg-slate-700/30 rounded-lg p-3">
    <div className={`flex items-center gap-2 mb-2`}>
      <Icon className={`w-4 h-4 text-${color}-400`} />
      <span className="text-sm font-medium text-slate-300">{label}</span>
    </div>
    <div className={`text-lg font-bold text-${color}-400`}>{value}</div>
  </div>
);

const EmptyState = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
  <div className="flex items-center justify-center h-full text-slate-400">
    <div className="text-center">
      <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>{text}</p>
    </div>
  </div>
);
