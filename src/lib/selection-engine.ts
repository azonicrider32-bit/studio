

import { LassoSettings, MagicWandSettings, Segment, Layer } from "./types";
import { rgbToHsv, rgbToLab } from "./color-utils";

const PRESET_HIGHLIGHT_COLORS = [
    'hsl(199, 98%, 48%)', // Blue
    'hsl(350, 98%, 55%)', // Red
    'hsl(140, 78%, 45%)', // Green
    'hsl(45, 98%, 52%)',  // Yellow
    'hsl(280, 88%, 60%)', // Purple
    'hsl(25, 95%, 55%)',  // Orange
];
let randomColorIndex = 0;


/**
 * Advanced Selection Engine
 */
export class SelectionEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData | null = null;
  width: number;
  height: number;
  pixelData: Uint8ClampedArray | null = null;
  visited: Uint8Array | null = null;
  layers: Layer[] = [];

  // Lasso State
  lassoNodes: [number, number][] = [];
  lassoCurrentPos: [number, number] | null = null;
  isDrawingLasso: boolean = false;
  
  // New Lasso Path Memory
  lassoPreviewPath: [number, number][] = [];
  futureLassoPath: [number, number][] = [];
  lassoMouseTrace: [number, number][] = [];
  
  // Edge Detection
  edgeMap: Float32Array | null = null;

  // Settings
  lassoSettings: LassoSettings = {
    drawMode: 'magic',
    useAiEnhancement: false,
    showMouseTrace: true,
    showAllMasks: true,
    snapRadius: 20,
    snapThreshold: 0.3,
    curveStrength: 0.05,
    directionalStrength: 0.2,
    cursorInfluence: 0.1,
    traceInfluence: 0.2,
    colorInfluence: 0.25,
    snapRadiusEnabled: true,
    snapThresholdEnabled: true,
    curveStrengthEnabled: true,
    directionalStrengthEnabled: false,
    cursorInfluenceEnabled: true,
    traceInfluenceEnabled: true,
    colorInfluenceEnabled: true,
    useColorAwareness: false,
  };
  magicWandSettings: MagicWandSettings = {
    tolerances: { r: 30, g: 30, b: 30, h: 10, s: 20, v: 20, l: 20, a: 10, b_lab: 10 },
    contiguous: true,
    useAiAssist: false,
    createAsMask: false,
    showAllMasks: true,
    ignoreExistingSegments: false,
    enabledTolerances: new Set(['h', 's', 'v']),
    scrollAdjustTolerances: new Set(),
    searchRadius: 15,
    sampleMode: 'point',
    useAntiAlias: true,
    useFeather: false,
    highlightColorMode: 'random',
    fixedHighlightColor: '#00aaff',
    highlightOpacity: 0.5,
    highlightTexture: 'solid',
    highlightBorder: {
        enabled: true,
        thickness: 2,
        color: '#ffffff',
        colorMode: 'fixed',
        pattern: 'solid',
        opacity: 1,
    },
  };
   negativeMagicWandSettings: MagicWandSettings = {
    tolerances: { r: 10, g: 10, b: 10, h: 5, s: 10, v: 10, l: 10, a: 5, b_lab: 5 },
    contiguous: true,
    useAiAssist: false,
    createAsMask: false,
    showAllMasks: true,
    ignoreExistingSegments: false,
    enabledTolerances: new Set(),
    scrollAdjustTolerances: new Set(),
    searchRadius: 1,
    sampleMode: 'point',
    seedColor: undefined,
    useAntiAlias: true,
    useFeather: false,
    highlightColorMode: 'fixed',
    fixedHighlightColor: '#ff0000',
    highlightOpacity: 0.5,
    highlightTexture: 'solid',
    highlightBorder: {
        enabled: false,
        thickness: 1,
        color: '#ffffff',
        colorMode: 'fixed',
        pattern: 'solid',
        opacity: 1,
    },
  };


  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, layers: Layer[]) {
    this.canvas = canvas;
    this.ctx = context;
    this.width = canvas.width;
    this.height = canvas.height;
    this.layers = layers;
  }

  initialize() {
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.pixelData = this.imageData.data;
    this.visited = new Uint8Array(this.width * this.height);
    this.computeEdgeMap();
  }
  
  updateLayers(layers: Layer[]) {
    this.layers = layers;
  }
  
  updateSettings(
    newLassoSettings: Partial<LassoSettings>,
    newWandSettings: Partial<MagicWandSettings>,
    newNegativeWandSettings: Partial<MagicWandSettings>
  ) {
    this.lassoSettings = { ...this.lassoSettings, ...newLassoSettings };
    this.magicWandSettings = { ...this.magicWandSettings, ...newWandSettings };
    this.negativeMagicWandSettings = { ...this.negativeMagicWandSettings, ...newNegativeWandSettings };
  }

  computeEdgeMap() {
    if (!this.imageData) return;

    this.edgeMap = new Float32Array(this.width * this.height);
    const data = this.imageData.data;

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const idx = y * this.width + x;

        const gx =
          -1 * this.getGrayscale(x - 1, y - 1, data) +
          1 * this.getGrayscale(x + 1, y - 1, data) +
          -2 * this.getGrayscale(x - 1, y, data) +
          2 * this.getGrayscale(x + 1, y, data) +
          -1 * this.getGrayscale(x - 1, y + 1, data) +
          1 * this.getGrayscale(x + 1, y + 1, data);

        const gy =
          -1 * this.getGrayscale(x - 1, y - 1, data) +
          -2 * this.getGrayscale(x, y - 1, data) +
          -1 * this.getGrayscale(x + 1, y - 1, data) +
          1 * this.getGrayscale(x - 1, y + 1, data) +
          2 * this.getGrayscale(x, y + 1, data) +
          1 * this.getGrayscale(x + 1, y + 1, data);

        this.edgeMap[idx] = Math.sqrt(gx * gx + gy * gy);
      }
    }
  }

  getGrayscale(x: number, y: number, data: Uint8ClampedArray) {
    const idx = (y * this.width + x) * 4;
    return (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
  }

  // #region LASSO
  startLasso(x: number, y: number) {
    this.cancelLasso();
    const startPoint: [number, number] = this.lassoSettings.drawMode === 'magic' ? this.snapToEdge(x, y) : [x, y];
    this.lassoNodes = [startPoint];
    this.lassoCurrentPos = startPoint;
    this.isDrawingLasso = true;
  }
  
  cancelLasso() {
    this.lassoNodes = [];
    this.lassoCurrentPos = null;
    this.isDrawingLasso = false;
    this.lassoPreviewPath = [];
    this.futureLassoPath = [];
    this.lassoMouseTrace = [];
  }

  updateLassoPreview(x: number, y: number, mouseTrace: [number, number][]) {
    if (!this.isDrawingLasso || !this.lassoNodes.length) return;
    
    this.lassoCurrentPos = [x, y];
    this.lassoMouseTrace = mouseTrace;
    const lastNode = this.lassoNodes[this.lassoNodes.length - 1];
    
    let previewPath: [number, number][];
    let futurePath: [number, number][] = [];

    switch(this.lassoSettings.drawMode) {
      case 'magic':
        const result = this.findEdgePath(lastNode, [x, y], this.lassoMouseTrace);
        previewPath = result.path;
        futurePath = result.futurePath;
        break;
      case 'polygon':
        previewPath = [[x, y]];
        break;
      case 'free':
        previewPath = [...mouseTrace];
        break;
      default:
        previewPath = [];
    }
    
    this.lassoPreviewPath = previewPath;
    this.futureLassoPath = futurePath;
  }


  addLassoNode(mouseTrace: [number, number][]) {
    if (!this.isDrawingLasso || !this.lassoCurrentPos) return;

    const newNodes = this.lassoSettings.drawMode === 'free' ? mouseTrace : this.lassoPreviewPath;

    const fullPath = [...this.lassoNodes, ...newNodes];
    
    this.lassoNodes = fullPath;
    this.lassoPreviewPath = [];
    this.futureLassoPath = [];
    this.lassoMouseTrace = [];
    
    const newAnchor = this.lassoNodes[this.lassoNodes.length-1];
    this.updateLassoPreview(newAnchor[0], newAnchor[1], []);
  }
  
  endLassoWithEnhancedPath(enhancedPath: {x:number, y:number}[]): Layer | null {
      if (!this.isDrawingLasso) return null;

      const pathAsTuples: [number, number][] = enhancedPath.map(p => [p.x, p.y]);
      
      if (pathAsTuples.length > 2) {
          const first = pathAsTuples[0];
          const last = pathAsTuples[pathAsTuples.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
              pathAsTuples.push(first);
          }
      }
      
      const pixels = this.pathToSelection(pathAsTuples);
      const layer = this.createLayerFromPixels(pixels);
      this.cancelLasso();
      return layer;
  }

  endLasso(activeLayerId: string | null): Layer | null {
    if (!this.isDrawingLasso || this.lassoNodes.length < 2) {
      this.cancelLasso();
      return null;
    }

    const fullPath = this.getLassoPath(true);
    let newLayer: Layer | null = null;
    if(fullPath.length > 2) {
        const pixels = this.pathToSelection(fullPath);
        newLayer = this.createLayerFromPixels(pixels, activeLayerId);
    }
    
    this.cancelLasso();
    return newLayer;
  }

  getLassoPath(closed = false) {
    if (!this.isDrawingLasso) return [];
    
    let path = [...this.lassoNodes, ...this.lassoPreviewPath];
    
    if (closed && path.length > 1) {
        const firstNode = path[0];
        const lastNode = path[path.length - 1];
        if (Math.hypot(firstNode[0] - lastNode[0], firstNode[1] - lastNode[1]) > 1) {
            const closingPath = this.findEdgePath(lastNode, firstNode, [], false).path;
            path.push(...closingPath);
        }
    }
    
    return path;
  }
  
  findEdgePath(p1: [number, number], p2: [number, number], mouseTrace: [number, number][], withFuturePath = true): { path: [number, number][], futurePath: [number, number][] } {
    if (this.lassoSettings.drawMode !== 'magic' || !this.edgeMap) {
        return { path: [p2], futurePath: [] };
    }

    const path: [number, number][] = [];
    const futurePath: [number, number][] = [];
    let currentPoint = p1;
    const visitedInPath = new Set<number>();
    visitedInPath.add(Math.round(p1[1]) * this.width + Math.round(p1[0]));

    const initialDistToTarget = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const maxSteps = initialDistToTarget * 2 + (withFuturePath ? 50 : 0);
    let steps = 0;
    
    let lastDirection: [number, number] | null = null;
    const falloffDistance = 50; 

    while (steps < maxSteps) {
        steps++;
        const targetPoint = p2;
        
        const distToTarget = Math.hypot(targetPoint[0] - currentPoint[0], targetPoint[1] - currentPoint[1]);
        if (withFuturePath && distToTarget < 1) {
            withFuturePath = false; 
            const futureTarget: [number, number] = [
                targetPoint[0] + (lastDirection ? lastDirection[0] : 0) * 50,
                targetPoint[1] + (lastDirection ? lastDirection[1] : 0) * 50
            ];
            const futureResult = this.findEdgePath(targetPoint, futureTarget, [], false);
            futurePath.push(...futureResult.path);
            path.push(p2);
            break;
        } else if (!withFuturePath && steps > initialDistToTarget * 2) {
             break;
        }
        else if (distToTarget < (this.lassoSettings.snapRadiusEnabled ? this.lassoSettings.snapRadius : 1)) {
            path.push(p2);
            break;
        }

        let bestNextPoint: [number, number] | null = null;
        let minCost = Infinity;
        
        const searchRadius = Math.max(1, Math.min((this.lassoSettings.snapRadiusEnabled ? this.lassoSettings.snapRadius : 1), Math.floor(distToTarget / 4) + 1));

        const startY = Math.max(0, Math.round(currentPoint[1]) - searchRadius);
        const endY = Math.min(this.height - 1, Math.round(currentPoint[1]) + searchRadius);
        const startX = Math.max(0, Math.round(currentPoint[0]) - searchRadius);
        const endX = Math.min(this.width - 1, Math.round(currentPoint[0]) + searchRadius);

        const vectorToTarget = [targetPoint[0] - currentPoint[0], targetPoint[1] - currentPoint[1]];
        const magToTarget = Math.hypot(vectorToTarget[0], vectorToTarget[1]);
        const dirToTarget = [vectorToTarget[0] / magToTarget, vectorToTarget[1] / magToTarget];

        const currentCursorInfluence = this.lassoSettings.cursorInfluenceEnabled ? this.lassoSettings.cursorInfluence : 0;
        const currentTraceInfluence = this.lassoSettings.traceInfluenceEnabled ? this.lassoSettings.traceInfluence : 0;
        const currentColorInfluence = this.lassoSettings.colorInfluenceEnabled ? this.lassoSettings.colorInfluence : 0;

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const idx = y * this.width + x;
                if (visitedInPath.has(idx)) continue;

                const distSq = (x - currentPoint[0])**2 + (y - currentPoint[1])**2;
                if (distSq === 0 || distSq > searchRadius * searchRadius) continue;
                
                const vectorToCandidate = [x - currentPoint[0], y - currentPoint[1]];
                const magToCandidate = Math.hypot(vectorToCandidate[0], vectorToCandidate[1]);
                const dirToCandidate = [vectorToCandidate[0] / magToCandidate, vectorToCandidate[1] / magToCandidate];

                const directionSimilarity = (dirToCandidate[0] * dirToTarget[0] + dirToCandidate[1] * dirToTarget[1] + 1) / 2;
                
                const edgeStrength = (this.edgeMap[idx] || 0) > (this.lassoSettings.snapThresholdEnabled ? this.lassoSettings.snapThreshold : 1) ? this.edgeMap[idx] : 0;
                
                let traceCost = 0;
                if (currentTraceInfluence > 0 && mouseTrace.length > 0) {
                    let minTraceDistSq = Infinity;
                    for(const tracePoint of mouseTrace) {
                        const distSq = (x - tracePoint[0])**2 + (y - tracePoint[1])**2;
                        if (distSq < minTraceDistSq) {
                            minTraceDistSq = distSq;
                        }
                    }
                    traceCost = Math.sqrt(minTraceDistSq) * 10 * currentTraceInfluence;
                }

                const cursorCost = (1 - directionSimilarity) * 500 * (withFuturePath ? currentCursorInfluence : 0);
                const edgeCost = (1 / (edgeStrength + 1)) * 1000;

                let colorCost = 0;
                if (currentColorInfluence > 0) {
                    const lastPathPointColor = this.getPixelColors(Math.round(currentPoint[1]) * this.width + Math.round(currentPoint[0]));
                    const candidateColor = this.getPixelColors(idx);
                    const colorDifference = this.getColorDifference(lastPathPointColor, candidateColor, this.magicWandSettings);
                    colorCost = (1 - colorDifference) * 500 * currentColorInfluence;
                }
                
                let curvatureCost = 0;
                let directionalCost = 0;

                if (lastDirection) {
                    const dot = dirToCandidate[0] * lastDirection[0] + dirToCandidate[1] * lastDirection[1];
                    const angleChange = Math.acos(Math.max(-1, Math.min(1, dot)));
                    
                    const stepsFromAnchor = path.length;
                    const falloff = Math.min(1, stepsFromAnchor / falloffDistance);

                    curvatureCost = (angleChange / Math.PI) * 1000 * (this.lassoSettings.curveStrengthEnabled ? this.lassoSettings.curveStrength : 0) * falloff;
                    directionalCost = (1 - dot) * 500 * (this.lassoSettings.directionalStrengthEnabled ? this.lassoSettings.directionalStrength : 0) * falloff;
                }

                const cost = cursorCost + edgeCost + curvatureCost + directionalCost + traceCost + colorCost;

                if (cost < minCost) {
                    minCost = cost;
                    bestNextPoint = [x, y];
                }
            }
        }

        if (bestNextPoint) {
            const newDirection = [bestNextPoint[0] - currentPoint[0], bestNextPoint[1] - currentPoint[1]];
            const mag = Math.hypot(newDirection[0], newDirection[1]);
            if (mag > 0) {
              lastDirection = [newDirection[0] / mag, newDirection[1] / mag];
            }

            path.push(bestNextPoint);
            currentPoint = bestNextPoint;
            visitedInPath.add(Math.round(bestNextPoint[1]) * this.width + Math.round(bestNextPoint[0]));
        } else {
            const jumpDist = Math.min((this.lassoSettings.snapRadiusEnabled ? this.lassoSettings.snapRadius : 1), distToTarget);
            const nextX = Math.round(currentPoint[0] + dirToTarget[0] * jumpDist);
            const nextY = Math.round(currentPoint[1] + dirToTarget[1] * jumpDist);
            const nextPoint: [number, number] = [nextX, nextY];
            path.push(nextPoint);
            currentPoint = nextPoint;
            lastDirection = null;
        }
    }
    return { path, futurePath };
}


  snapToEdge(x: number, y: number): [number, number] {
    if (!this.edgeMap || this.lassoSettings.drawMode !== 'magic') return [Math.round(x), Math.round(y)];
    
    const radius = this.lassoSettings.snapRadiusEnabled ? this.lassoSettings.snapRadius : 1;
    let maxEdge = -1;
    let bestX = Math.round(x);
    let bestY = Math.round(y);

    const startY = Math.max(0, Math.round(y) - radius);
    const endY = Math.min(this.height - 1, Math.round(y) + radius);
    const startX = Math.max(0, Math.round(x) - radius);
    const endX = Math.min(this.width - 1, Math.round(x) - radius);

    for (let sy = startY; sy <= endY; sy++) {
      for (let sx = startX; sx <= endX; sx++) {
        const distSq = (sx - x) * (sx - x) + (sy - y) * (sy - y);
        if (distSq > radius * radius) continue;

        const idx = sy * this.width + sx;
        const edgeStrength = this.edgeMap[idx];

        if (edgeStrength > maxEdge && edgeStrength > ((this.lassoSettings.snapThresholdEnabled ? this.lassoSettings.snapThreshold : 1) * 255)) {
            maxEdge = edgeStrength;
            bestX = sx;
            bestY = sy;
        }
      }
    }
    return [bestX, bestY];
  }

  pathToSelection(path: [number, number][]): Set<number> {
    const selected = new Set<number>();
    if(path.length < 3) return selected;
  
    const minX = Math.floor(Math.min(...path.map(p => p[0])));
    const maxX = Math.ceil(Math.max(...path.map(p => p[0])));
    const minY = Math.floor(Math.min(...path.map(p => p[1])));
    const maxY = Math.ceil(Math.max(...path.map(p => p[1])));
  
    for (let y = minY; y <= maxY; y++) {
      const intersections: number[] = [];
      for (let i = 0; i < path.length; i++) {
        const p1 = path[i];
        const p2 = path[(i + 1) % path.length];
  
        if ((p1[1] <= y && p2[1] > y) || (p2[1] <= y && p1[1] > y)) {
          const x_intersect = (y - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]) + p1[0];
          intersections.push(x_intersect);
        }
      }
  
      intersections.sort((a, b) => a - b);
  
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          const startX = Math.ceil(intersections[i]);
          const endX = Math.floor(intersections[i + 1]);
          for (let x = startX; x <= endX; x++) {
              if (x >= minX && x <= maxX) {
                 const idx = y * this.width + x;
                 selected.add(idx);
              }
          }
        }
      }
    }
    return selected;
  }
  // #endregion

  // #region MAGIC WAND
    getSeedColor(x: number, y: number) {
        const { searchRadius, sampleMode } = this.magicWandSettings;
        if (sampleMode === 'point' || searchRadius <= 1) {
            return this.getPixelColors(y * this.width + x);
        }

        const samplePixels: { r: number, g: number, b: number }[] = [];
        const startY = Math.max(0, y - searchRadius);
        const endY = Math.min(this.height - 1, y + searchRadius);
        const startX = Math.max(0, x - searchRadius);
        const endX = Math.min(this.width - 1, x + searchRadius);

        for (let j = startY; j <= endY; j++) {
            for (let i = startX; i <= endX; i++) {
                const distSq = (i - x) ** 2 + (j - y) ** 2;
                if (distSq <= searchRadius * searchRadius) {
                    const { rgb } = this.getPixelColors(j * this.width + i);
                    samplePixels.push(rgb);
                }
            }
        }

        if (samplePixels.length === 0) {
            return this.getPixelColors(y * this.width + x);
        }

        let finalR: number, finalG: number, finalB: number;

        if (sampleMode === 'average') {
            let totalR = 0, totalG = 0, totalB = 0;
            for (const p of samplePixels) {
                totalR += p.r; totalG += p.g; totalB += p.b;
            }
            finalR = totalR / samplePixels.length;
            finalG = totalG / samplePixels.length;
            finalB = totalB / samplePixels.length;
        } else { // 'dominant'
            const colorCounts = new Map<string, { count: number, r: number, g: number, b: number }>();
            for (const p of samplePixels) {
                const key = `${p.r},${p.g},${p.b}`;
                const entry = colorCounts.get(key) || { count: 0, r: p.r, g: p.g, b: p.b };
                entry.count++;
                colorCounts.set(key, entry);
            }
            let maxCount = 0;
            let dominantColor = samplePixels[0];
            for (const entry of colorCounts.values()) {
                if (entry.count > maxCount) {
                    maxCount = entry.count;
                    dominantColor = { r: entry.r, g: entry.g, b: entry.b };
                }
            }
            finalR = dominantColor.r;
            finalG = dominantColor.g;
            finalB = dominantColor.b;
        }

        return {
            rgb: { r: finalR, g: finalG, b: finalB },
            hsv: rgbToHsv(finalR, finalG, finalB),
            lab: rgbToLab(finalR, finalG, finalB),
        };
    }
  magicWand(x: number, y: number, previewOnly = false): Segment | null {
      if (!this.pixelData) return null;
      x = Math.floor(x);
      y = Math.floor(y);

      if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
      
      const seedIndex = y * this.width + x;

      if (!this.magicWandSettings.ignoreExistingSegments) {
        for (const layer of this.layers) {
            if (layer.visible && (layer.type === 'segmentation' || layer.subType === 'mask') && layer.pixels.has(seedIndex)) {
                return null;
            }
        }
      }

      const seedColor = this.getSeedColor(x, y);

      const selected = new Set<number>();
      const queue: number[] = [seedIndex];
      this.visited?.fill(0);
      if(this.visited) this.visited[seedIndex] = 1;
      let head = 0;

      while(head < queue.length) {
          const currentIndex = queue[head++];
          selected.add(currentIndex);
          
          const currentX = currentIndex % this.width;
          const currentY = Math.floor(currentIndex / this.width);

          const neighbors = [];
          if (currentX > 0) neighbors.push(currentIndex - 1);
          if (currentX < this.width - 1) neighbors.push(currentIndex + 1);
          if (currentY > 0) neighbors.push(currentIndex - this.width);
          if (currentY < this.height - 1) neighbors.push(currentIndex + this.width);

          for (const neighborIndex of neighbors) {
              if (this.visited && !this.visited[neighborIndex]) {
                  this.visited[neighborIndex] = 1;
                  const neighborColor = this.getPixelColors(neighborIndex);
                  if (this.isWithinTolerance(seedColor, neighborColor)) {
                      queue.push(neighborIndex);
                  }
              }
          }
      }
      
      if (previewOnly) {
          return this.createSegmentFromPixels(selected);
      } else {
          return null; // Should be handled by createLayerFromPixels now
      }
  }

  getPixelColors(index: number): { rgb: any, hsv: any, lab: any } {
    if (!this.pixelData) throw new Error("Pixel data not loaded");
    const i = index * 4;
    const r = this.pixelData[i];
    const g = this.pixelData[i + 1];
    const b = this.pixelData[i + 2];
    
    return {
      rgb: { r, g, b },
      hsv: rgbToHsv(r, g, b),
      lab: rgbToLab(r, g, b)
    }
  }

  getColorDifference(color1: any, color2: any, settings: MagicWandSettings): number {
    const { tolerances, enabledTolerances } = settings;
    if (!enabledTolerances || enabledTolerances.size === 0) return 0;
    
    let maxDiff = 0;
    let count = 0;

    const checkSpace = (space: 'rgb' | 'hsv' | 'lab') => {
        for (const key in color1[space]) {
            const toleranceKey = key === 'b_lab' ? 'b_lab' : (key as keyof typeof tolerances);
            if (enabledTolerances.has(toleranceKey)) {
                count++;
                let diff;
                if (key === 'h') {
                    const hDiff = Math.abs(color1[space][key] - color2[space][key]);
                    diff = Math.min(hDiff, 360 - hDiff);
                } else {
                    diff = Math.abs(color1[space][key] - color2[space][key]);
                }
                const normalizedDiff = diff / tolerances[toleranceKey];
                if (normalizedDiff > maxDiff) {
                    maxDiff = normalizedDiff;
                }
            }
        }
    };
    
    checkSpace('rgb');
    checkSpace('hsv');
    checkSpace('lab');

    return count > 0 ? 1 - Math.min(1, maxDiff) : 0;
  }

  isInsideTolerance(seedColor: any, neighborColor: any, settings: MagicWandSettings): boolean {
    const { tolerances, enabledTolerances } = settings;
    if (!enabledTolerances) return true;

    const colorSpaces: (keyof typeof seedColor)[] = ['rgb', 'hsv', 'lab'];

    for (const space of colorSpaces) {
        const components = Object.keys(seedColor[space]);
        for (const key of components) {
            const toleranceKey = key === 'b' ? 'b_lab' : (key as keyof typeof tolerances);
            if (enabledTolerances && !enabledTolerances.has(toleranceKey)) continue;

            const tolerance = tolerances[toleranceKey];
            const c1 = seedColor[space];
            const c2 = neighborColor[space];
            let diff: number;

            if (key === 'h') { // Handle hue's circular nature
                const hDiff = Math.abs(c1.h - c2.h);
                diff = Math.min(hDiff, 360 - hDiff);
            } else {
                diff = Math.abs(c1[key] - c2[key]);
            }

            if (diff > tolerance) {
                return false;
            }
        }
    }
    return true;
  }

  isWithinTolerance(seedColor: any, neighborColor: any): boolean {
    const isIncluded = this.isInsideTolerance(seedColor, neighborColor, this.magicWandSettings);
    if (!isIncluded) {
        return false;
    }
    
    // If there are active exclusion tolerances, check them
    if (this.negativeMagicWandSettings.enabledTolerances.size > 0 && this.negativeMagicWandSettings.seedColor) {
        const exclusionSeedColor = {
            rgb: { r: this.negativeMagicWandSettings.seedColor.r, g: this.negativeMagicWandSettings.seedColor.g, b: this.negativeMagicWandSettings.seedColor.b },
            hsv: { h: this.negativeMagicWandSettings.seedColor.h, s: this.negativeMagicWandSettings.seedColor.s, v: this.negativeMagicWandSettings.seedColor.v },
            lab: { l: this.negativeMagicWandSettings.seedColor.l, a: this.negativeMagicWandSettings.seedColor.a, b: this.negativeMagicWandSettings.seedColor.b_lab },
        }
        const isExcluded = this.isInsideTolerance(exclusionSeedColor, neighborColor, this.negativeMagicWandSettings);
        return !isExcluded;
    }

    return true;
  }
  // #endregion
  
  createCircularMask(x: number, y: number, radius: number): string {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return "";

    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, this.width, this.height);

    tempCtx.fillStyle = 'black';
    tempCtx.beginPath();
    tempCtx.arc(x, y, radius, 0, Math.PI * 2);
    tempCtx.fill();

    return tempCanvas.toDataURL();
  }

  createSegmentFromPixels(pixels: Set<number>): Segment | null {
    if (pixels.size === 0) return null;
    const bounds = this.getBoundsForPixels(pixels);
    if (bounds.width === Infinity) return null;

    const segment: Segment = {
      id: Date.now() + Math.random(),
      pixels: pixels,
      bounds: bounds,
    };
    
    return segment;
  }
  
  getBoundsForPixels(pixels: Set<number>): Layer['bounds'] {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      pixels.forEach(idx => {
        const x = idx % this.width;
        const y = Math.floor(idx / this.width);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
      if (minX === Infinity) return { x: 0, y: 0, width: 0, height: 0};
      return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  }

  createImageDataForLayer(pixels: Set<number>, bounds: Layer['bounds']): ImageData | null {
    if (!this.pixelData) return null;
    const { x, y, width, height } = bounds;
    if (width <= 0 || height <= 0) return null;
    const newImageData = this.ctx.createImageData(width, height);
    
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            const canvasIndex = (y + j) * this.width + (x + i);
            const dataIndex = (j * width + i) * 4;

            if (pixels.has(canvasIndex)) {
                const sourceIndex = canvasIndex * 4;
                newImageData.data[dataIndex] = this.pixelData[sourceIndex];
                newImageData.data[dataIndex + 1] = this.pixelData[sourceIndex + 1];
                newImageData.data[dataIndex + 2] = this.pixelData[sourceIndex + 2];
                newImageData.data[dataIndex + 3] = this.pixelData[sourceIndex + 3];
            } else {
                newImageData.data[dataIndex + 3] = 0;
            }
        }
    }
    return newImageData;
  }

  createLayerFromPixels(pixels: Set<number>, activeLayerId: string | null = null): Layer | null {
    const segment = this.createSegmentFromPixels(pixels);
    if (!segment) return null;

    const { createAsMask, highlightColorMode, fixedHighlightColor, highlightOpacity, highlightTexture } = this.magicWandSettings;

    let highlightColor = 'hsl(var(--primary))';
    if (highlightColorMode === 'random') {
        highlightColor = PRESET_HIGHLIGHT_COLORS[randomColorIndex];
        randomColorIndex = (randomColorIndex + 1) % PRESET_HIGHLIGHT_COLORS.length;
    } else if (highlightColorMode === 'fixed') {
        highlightColor = fixedHighlightColor;
    } else if (highlightColorMode === 'contrast') {
        const avgLuminance = this.getAverageLuminance(pixels);
        highlightColor = avgLuminance > 0.5 ? '#000000' : '#FFFFFF';
    }


    const newLayer: Layer = {
      id: `segment-${segment.id}`,
      name: `Selection ${Math.floor(segment.id)}`,
      type: 'segmentation',
      visible: true,
      locked: false,
      pixels: segment.pixels,
      bounds: segment.bounds,
      highlightColor,
      highlightOpacity,
      highlightTexture,
    };
    
    if (createAsMask && activeLayerId) {
      newLayer.subType = 'mask';
      newLayer.parentId = activeLayerId;
      newLayer.name = `Mask for Layer ${activeLayerId}`;
    } else {
      newLayer.subType = 'pixel';
      newLayer.imageData = this.createImageDataForLayer(segment.pixels, segment.bounds) ?? undefined;
    }

    return newLayer;
  }


  selectionToMaskData(layers: Layer[]): string | undefined {
      const finalSelection = new Set<number>();
      layers.forEach(layer => {
        if (layer.type === 'segmentation' && layer.visible) {
            layer.pixels.forEach(p => finalSelection.add(p));
        }
      });
      
      if (finalSelection.size === 0) return undefined;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return undefined;
      
      // For inpainting: white is preserved, black is inpainted.
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, this.width, this.height);

      const maskImageData = tempCtx.getImageData(0,0,this.width, this.height);
      const data = maskImageData.data;
      finalSelection.forEach(idx => {
          const i = idx * 4;
          data[i] = 0;   // black
          data[i+1] = 0;
          data[i+2] = 0;
          data[i+3] = 255;
      });
      tempCtx.putImageData(maskImageData, 0, 0);


      return tempCanvas.toDataURL();
  }

  renderPattern(ctx: CanvasRenderingContext2D, texture: Layer['highlightTexture'], color: string, opacity: number): CanvasPattern | string | null {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return null;
        
        let baseColor = color;
        let r = 0, g = 0, b = 0;

        if (color.startsWith('#')) {
            if (color.length === 4) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
            } else if (color.length === 7) {
                r = parseInt(color.substring(1, 3), 16);
                g = parseInt(color.substring(3, 5), 16);
                b = parseInt(color.substring(5, 7), 16);
            }
            baseColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        } else if (color.startsWith('hsl')) {
            baseColor = color.replace(')', `, ${opacity})`).replace('hsl', 'hsla');
        } else {
             baseColor = `rgba(0, 0, 0, ${opacity})`;
        }
        
        const rgbaColorWithOpacity = (alpha: number) => {
            if (baseColor.startsWith('rgba')) {
                return baseColor.replace(/[\d\.]+\)$/g, `${alpha})`);
            }
            return baseColor;
        }


        switch(texture) {
            case 'checkerboard':
                tempCanvas.width = 16;
                tempCanvas.height = 16;
                tempCtx.fillStyle = rgbaColorWithOpacity(opacity * 0.3);
                tempCtx.fillRect(0, 0, 8, 8);
                tempCtx.fillRect(8, 8, 8, 8);
                tempCtx.fillStyle = rgbaColorWithOpacity(opacity);
                tempCtx.fillRect(8, 0, 8, 8);
                tempCtx.fillRect(0, 8, 8, 8);
                break;
            case 'lines':
                 tempCanvas.width = 8;
                tempCanvas.height = 8;
                tempCtx.strokeStyle = rgbaColorWithOpacity(opacity);
                tempCtx.lineWidth = 2;
                tempCtx.beginPath();
                tempCtx.moveTo(0, 8);
                tempCtx.lineTo(8, 0);
                tempCtx.stroke();
                break;
            case 'solid':
            default:
                return rgbaColorWithOpacity(opacity);

        }

        return ctx.createPattern(tempCanvas, 'repeat');
    }

  getAverageLuminance(pixels: Set<number>): number {
      if (!this.pixelData || pixels.size === 0) return 0.5;

      let totalLuminance = 0;
      pixels.forEach(idx => {
          const i = idx * 4;
          const r = this.pixelData![i];
          const g = this.pixelData![i + 1];
          const b = this.pixelData![i + 2];
          // Luminance formula (perceptual brightness)
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          totalLuminance += luminance;
      });

      return totalLuminance / pixels.size;
  }

  renderHoverSegment(overlayCtx: CanvasRenderingContext2D, segment: Segment, isMask: boolean, wandSettings: MagicWandSettings) {
      if (!segment || segment.pixels.size === 0) return;
      
      const { highlightColorMode, fixedHighlightColor, highlightOpacity, highlightTexture } = wandSettings;

      overlayCtx.save();
      
      const texture = isMask ? 'checkerboard' : (highlightTexture || 'solid');
      let color = 'hsl(var(--primary))';

      if (isMask) {
          color = 'hsl(0, 0%, 50%)';
      } else if (highlightColorMode === 'fixed') {
          color = fixedHighlightColor;
      } else if (highlightColorMode === 'contrast') {
          const avgLuminance = this.getAverageLuminance(segment.pixels);
          color = avgLuminance > 0.5 ? '#000000' : '#FFFFFF';
      }

      const opacity = highlightOpacity || 0.5;

      const pattern = this.renderPattern(overlayCtx, texture, color, opacity);
      if(!pattern) {
        overlayCtx.restore();
        return;
      };
      overlayCtx.fillStyle = pattern;
      
      segment.pixels.forEach((idx: number) => {
        const x = idx % this.width;
        const y = Math.floor(idx / this.width);
        overlayCtx.fillRect(x,y,1,1);
      });

      overlayCtx.restore();
  }

    getBorderPixels(pixels: Set<number>): Set<number> {
        const borderPixels = new Set<number>();
        pixels.forEach(idx => {
            const x = idx % this.width;
            const y = Math.floor(idx / this.width);

            const neighbors = [
                (y - 1) * this.width + x, // N
                (y + 1) * this.width + x, // S
                y * this.width + (x - 1), // W
                y * this.width + (x + 1), // E
            ];

            for (const neighborIdx of neighbors) {
                if (!pixels.has(neighborIdx)) {
                    borderPixels.add(idx);
                    break;
                }
            }
        });
        return borderPixels;
    }

    hexToRgba(hex: string, opacity: number): string {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

  renderSelection(overlayCtx: CanvasRenderingContext2D, layers: Layer[], wandSettings: MagicWandSettings, lassoSettings: LassoSettings, hoveredSegment: Segment | null) {
    if (!overlayCtx) return;

    overlayCtx.clearRect(0, 0, this.width, this.height);
    
    const showMasks = wandSettings.showAllMasks && lassoSettings.showAllMasks;

    if (showMasks) {
        layers.forEach(layer => {
            if (layer.visible && layer.maskVisible && (layer.type === 'segmentation' || layer.subType === 'mask')) {
                overlayCtx.save();
                
                const isMask = layer.subType === 'mask';
                const texture = isMask ? 'checkerboard' : (layer.highlightTexture || 'solid');
                let color = isMask ? 'hsl(0, 0%, 50%)' : (layer.highlightColor || 'hsl(var(--primary))');
                const opacity = layer.highlightOpacity || 0.5;

                 if (!isMask && wandSettings.highlightColorMode === 'contrast') {
                    const avgLuminance = this.getAverageLuminance(layer.pixels);
                    color = avgLuminance > 0.5 ? '#000000' : '#FFFFFF';
                }

                const pattern = this.renderPattern(overlayCtx, texture, color, opacity);
                if(pattern) {
                    overlayCtx.fillStyle = pattern;
                } else {
                    overlayCtx.restore();
                    return;
                }

                layer.pixels.forEach(idx => {
                    const x = idx % this.width;
                    const y = Math.floor(idx / this.width);
                    overlayCtx.fillRect(x, y, 1, 1);
                });

                overlayCtx.restore();
            }
        });
    }
    
    if (hoveredSegment && wandSettings.useAiAssist === false) {
       const isMask = wandSettings.createAsMask;
       this.renderHoverSegment(overlayCtx, hoveredSegment, isMask, wandSettings);
       
       if (wandSettings.highlightBorder.enabled) {
            overlayCtx.save();
            
            let borderColor = wandSettings.highlightBorder.color;
            if (wandSettings.highlightBorder.colorMode === 'contrast') {
                const avgLuminance = this.getAverageLuminance(this.getBorderPixels(hoveredSegment.pixels));
                borderColor = avgLuminance > 0.5 ? '#000000' : '#FFFFFF';
            }

            overlayCtx.strokeStyle = this.hexToRgba(borderColor, wandSettings.highlightBorder.opacity);
            overlayCtx.lineWidth = wandSettings.highlightBorder.thickness;
            if (wandSettings.highlightBorder.pattern === 'dashed') {
                overlayCtx.setLineDash([5, 5]);
            }

            const borderPixels = this.getBorderPixels(hoveredSegment.pixels);
            
            overlayCtx.beginPath();
            borderPixels.forEach(idx => {
                 const x = idx % this.width;
                 const y = Math.floor(idx / this.width);
                 overlayCtx.rect(x, y, 1, 1);
            });
            overlayCtx.stroke();
            overlayCtx.restore();
        }
    }


    if (this.isDrawingLasso) {
      // Draw mouse trace if enabled
      if (this.lassoSettings.showMouseTrace && this.lassoMouseTrace.length > 1) {
          overlayCtx.strokeStyle = 'hsla(var(--foreground), 0.3)';
          overlayCtx.lineWidth = 1;
          overlayCtx.setLineDash([2, 3]);
          overlayCtx.beginPath();
          overlayCtx.moveTo(this.lassoMouseTrace[0][0], this.lassoMouseTrace[0][1]);
          for (let i = 1; i < this.lassoMouseTrace.length; i++) {
              overlayCtx.lineTo(this.lassoMouseTrace[i][0], this.lassoMouseTrace[i][1]);
          }
          overlayCtx.stroke();
          overlayCtx.setLineDash([]); // Reset line dash
      }
      
      const mainPath = [...this.lassoNodes, ...this.lassoPreviewPath];
      
      if (mainPath.length > 0) {
        overlayCtx.strokeStyle = 'hsl(var(--accent))';
        overlayCtx.lineWidth = 2;
        overlayCtx.lineJoin = 'round';
        overlayCtx.lineCap = 'round';
        overlayCtx.beginPath();
        overlayCtx.moveTo(mainPath[0][0], mainPath[0][1]);
        for (let i = 1; i < mainPath.length; i++) {
            overlayCtx.lineTo(mainPath[i][0], mainPath[i][1]);
        }
        overlayCtx.stroke();
      }
      
      if (this.futureLassoPath.length > 0) {
        overlayCtx.strokeStyle = 'hsla(var(--accent), 0.5)';
        overlayCtx.lineWidth = 2;
        overlayCtx.lineJoin = 'round';
        overlayCtx.lineCap = 'round';
        overlayCtx.beginPath();
        const lastMainPoint = mainPath[mainPath.length - 1] || this.lassoCurrentPos;
        if(lastMainPoint) overlayCtx.moveTo(lastMainPoint[0], lastMainPoint[1]);
        for (let i = 0; i < this.futureLassoPath.length; i++) {
            overlayCtx.lineTo(this.futureLassoPath[i][0], this.futureLassoPath[i][1]);
        }
        overlayCtx.stroke();
      }


      this.lassoNodes.forEach(([x, y], index) => {
        overlayCtx.beginPath();
        overlayCtx.arc(x, y, 2, 0, Math.PI * 2);
        overlayCtx.fillStyle = index === 0 ? 'hsl(var(--accent))' : '#fff';
        overlayCtx.fill();
        overlayCtx.strokeStyle = 'hsl(var(--background))';
        overlayCtx.lineWidth = 1;
        overlayCtx.stroke();
      });
    }
  }
}
