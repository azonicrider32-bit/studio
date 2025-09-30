import { LassoSettings, MagicWandSettings, Segment } from "./types";
import { rgbToHsv, rgbToLab } from "./color-utils";


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
  selectedPixels: Set<number> = new Set();
  segments: Segment[] = [];
  selectedSegmentIds: Set<any> = new Set();
  
  // Lasso State
  lassoNodes: [number, number][] = [];
  lassoCurrentPos: [number, number] | null = null;
  isDrawingLasso: boolean = false;
  
  // New Lasso Path Memory
  lassoPreviewPath: [number, number][] = [];
  
  // Edge Detection
  edgeMap: Float32Array | null = null;

  // Settings
  lassoSettings: LassoSettings = {
    useEdgeSnapping: true,
    snapRadius: 10,
    snapThreshold: 0.3,
    curveStrength: 0.5,
    directionalStrength: 0.5,
  };
  magicWandSettings: MagicWandSettings = {
    tolerance: 30,
    colorSpace: 'hsv',
    contiguous: true,
    useAiAssist: true,
  };


  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = context;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  initialize() {
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.pixelData = this.imageData.data;
    this.visited = new Uint8Array(this.width * this.height);
    this.computeEdgeMap();
  }
  
  updateSettings(newLassoSettings: Partial<LassoSettings>, newWandSettings: Partial<MagicWandSettings>) {
    this.lassoSettings = { ...this.lassoSettings, ...newLassoSettings };
    this.magicWandSettings = { ...this.magicWandSettings, ...newWandSettings };
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
    this.segments = [];
    this.selectedSegmentIds.clear();
    const startPoint: [number, number] = this.lassoSettings.useEdgeSnapping ? this.snapToEdge(x, y) : [x, y];
    this.lassoNodes = [startPoint];
    this.lassoCurrentPos = startPoint;
    this.isDrawingLasso = true;
  }
  
  cancelLasso() {
    this.lassoNodes = [];
    this.lassoCurrentPos = null;
    this.isDrawingLasso = false;
    this.lassoPreviewPath = [];
  }

  updateLassoPreview(x: number, y: number) {
    if (!this.isDrawingLasso || !this.lassoNodes.length) return;
    this.lassoCurrentPos = [x, y];

    const lastAnchor = this.lassoNodes[this.lassoNodes.length - 1];
    
    // Check for progressive undo
    const lastPointInPreview = this.lassoPreviewPath[this.lassoPreviewPath.length - 1];
    if (lastPointInPreview) {
      const distToCursor = Math.hypot(lastPointInPreview[0] - x, lastPointInPreview[1] - y);
      const distToAnchor = Math.hypot(lastPointInPreview[0] - lastAnchor[0], lastPointInPreview[1] - lastAnchor[1]);
      const newDistToAnchor = Math.hypot(x - lastAnchor[0], y - lastAnchor[1]);

      if (newDistToAnchor < distToAnchor && distToCursor < this.lassoSettings.snapRadius) {
        // Find closest point on path to cursor
        let closestIndex = -1;
        let minDistance = Infinity;
        for (let i = 0; i < this.lassoPreviewPath.length; i++) {
          const dist = Math.hypot(this.lassoPreviewPath[i][0] - x, this.lassoPreviewPath[i][1] - y);
          if (dist < minDistance) {
            minDistance = dist;
            closestIndex = i;
          }
        }
        if (closestIndex !== -1) {
          this.lassoPreviewPath = this.lassoPreviewPath.slice(0, closestIndex + 1);
          return;
        }
      }
    }
    
    this.lassoPreviewPath = this.findEdgePath(lastAnchor, [x, y]);
}


  addLassoNode() {
    if (!this.isDrawingLasso || !this.lassoCurrentPos || this.lassoPreviewPath.length === 0) return;
    
    // Add the entire preview path to the main nodes list
    this.lassoNodes.push(...this.lassoPreviewPath);
    this.lassoPreviewPath = [];
    
    // Set the new anchor point
    const newAnchor = this.lassoNodes[this.lassoNodes.length-1];
    this.updateLassoPreview(newAnchor[0], newAnchor[1]);
  }
  
  endLassoWithEnhancedPath(enhancedPath: {x:number, y:number}[]) {
      if (!this.isDrawingLasso) return;

      const pathAsTuples: [number, number][] = enhancedPath.map(p => [p.x, p.y]);
      
      if (pathAsTuples.length > 2) {
          const first = pathAsTuples[0];
          const last = pathAsTuples[pathAsTuples.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
              pathAsTuples.push(first);
          }
      }
      
      this.selectedPixels = this.pathToSelection(pathAsTuples);
      this.createSegmentFromSelection();
      this.cancelLasso();
  }

  endLasso() {
    if (!this.isDrawingLasso || this.lassoNodes.length < 2) {
      this.cancelLasso();
      return;
    }

    const fullPath = this.getLassoPath(true);
    this.selectedPixels = this.pathToSelection(fullPath);
    this.createSegmentFromSelection();

    this.cancelLasso();
  }

  getLassoPath(closed = false) {
    if (!this.isDrawingLasso) return [];
    
    let path = [...this.lassoNodes];
    path.push(...this.lassoPreviewPath);
    
    if (closed && path.length > 1) {
        const firstNode = path[0];
        const lastNode = path[path.length - 1];
        if (Math.hypot(firstNode[0] - lastNode[0], firstNode[1] - lastNode[1]) > 1) {
            path.push(firstNode);
        }
    }
    
    return path;
  }
  
  findEdgePath(p1: [number, number], p2: [number, number]): [number, number][] {
    if (!this.lassoSettings.useEdgeSnapping || !this.edgeMap) {
        return [p2];
    }

    const path: [number, number][] = [];
    let currentPoint = p1;
    const visitedInPath = new Set<number>();
    visitedInPath.add(Math.round(p1[1]) * this.width + Math.round(p1[0]));

    const maxSteps = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 2;
    let steps = 0;
    
    let lastDirection: [number, number] | null = null;

    while (steps < maxSteps) {
        steps++;
        const distToTarget = Math.hypot(p2[0] - currentPoint[0], p2[1] - currentPoint[1]);
        if (distToTarget < this.lassoSettings.snapRadius) {
            path.push(p2);
            break;
        }

        let bestNextPoint: [number, number] | null = null;
        let minCost = Infinity;

        const searchRadius = Math.max(1, Math.min(this.lassoSettings.snapRadius, Math.floor(distToTarget / 4)));
        
        const startY = Math.max(0, Math.round(currentPoint[1]) - searchRadius);
        const endY = Math.min(this.height - 1, Math.round(currentPoint[1]) + searchRadius);
        const startX = Math.max(0, Math.round(currentPoint[0]) - searchRadius);
        const endX = Math.min(this.width - 1, Math.round(currentPoint[0]) + searchRadius);

        const vectorToTarget = [p2[0] - currentPoint[0], p2[1] - currentPoint[1]];
        const magToTarget = Math.hypot(vectorToTarget[0], vectorToTarget[1]);
        const dirToTarget = [vectorToTarget[0] / magToTarget, vectorToTarget[1] / magToTarget];

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const idx = y * this.width + x;
                if (visitedInPath.has(idx)) continue;

                const distSq = (x - currentPoint[0])**2 + (y - currentPoint[1])**2;
                if (distSq === 0 || distSq > searchRadius * searchRadius) continue;

                const edgeStrength = this.edgeMap[idx];
                if (edgeStrength < this.lassoSettings.snapThreshold * 255) continue;
                
                // Cost function
                const vectorToCandidate = [x - currentPoint[0], y - currentPoint[1]];
                const magToCandidate = Math.hypot(vectorToCandidate[0], vectorToCandidate[1]);
                const dirToCandidate = [vectorToCandidate[0] / magToCandidate, vectorToCandidate[1] / magToCandidate];

                const directionSimilarity = (dirToCandidate[0] * dirToTarget[0] + dirToCandidate[1] * dirToTarget[1] + 1) / 2; // Range 0-1
                const directionCost = (1 - directionSimilarity) * 500 * (1-this.lassoSettings.directionalStrength);

                const edgeCost = (1 / (edgeStrength + 1)) * 1000;
                
                let curvatureCost = 0;
                if (lastDirection) {
                    const dot = dirToCandidate[0] * lastDirection[0] + dirToCandidate[1] * lastDirection[1];
                    const angleChange = Math.acos(Math.max(-1, Math.min(1, dot))); // 0 to PI
                    curvatureCost = (angleChange / Math.PI) * 1000 * this.lassoSettings.curveStrength;
                }

                const cost = directionCost + edgeCost + curvatureCost;

                if (cost < minCost) {
                    minCost = cost;
                    bestNextPoint = [x, y];
                }
            }
        }

        if (bestNextPoint) {
            path.push(bestNextPoint);
            if (lastDirection) {
              lastDirection = [bestNextPoint[0] - currentPoint[0], bestNextPoint[1] - currentPoint[1]];
              const mag = Math.hypot(lastDirection[0], lastDirection[1]);
              if (mag > 0) {
                lastDirection[0] /= mag;
                lastDirection[1] /= mag;
              }
            } else if (path.length > 0) {
              const prev = path.length > 1 ? path[path.length - 2] : p1;
              lastDirection = [bestNextPoint[0] - prev[0], bestNextPoint[1] - prev[1]];
              const mag = Math.hypot(lastDirection[0], lastDirection[1]);
               if (mag > 0) {
                lastDirection[0] /= mag;
                lastDirection[1] /= mag;
              }
            }

            currentPoint = bestNextPoint;
            visitedInPath.add(Math.round(bestNextPoint[1]) * this.width + Math.round(bestNextPoint[0]));
        } else {
            // No good point found, jump forward along the straight line
            const jumpDist = Math.min(this.lassoSettings.snapRadius, distToTarget);
            const nextX = Math.round(currentPoint[0] + dirToTarget[0] * jumpDist);
            const nextY = Math.round(currentPoint[1] + dirToTarget[1] * jumpDist);
            const nextPoint: [number, number] = [nextX, nextY];
            path.push(nextPoint);
            currentPoint = nextPoint;
            lastDirection = null; // Reset curvature check after a jump
        }
    }
    return path;
}


  snapToEdge(x: number, y: number): [number, number] {
    if (!this.edgeMap || !this.lassoSettings.useEdgeSnapping) return [Math.round(x), Math.round(y)];
    
    const radius = this.lassoSettings.snapRadius;
    let maxEdge = -1;
    let bestX = Math.round(x);
    let bestY = Math.round(y);

    const startY = Math.max(0, Math.round(y) - radius);
    const endY = Math.min(this.height - 1, Math.round(y) + radius);
    const startX = Math.max(0, Math.round(x) - radius);
    const endX = Math.min(this.width - 1, Math.round(x) + radius);

    for (let sy = startY; sy <= endY; sy++) {
      for (let sx = startX; sx <= endX; sx++) {
        const distSq = (sx - x) * (sx - x) + (sy - y) * (sy - y);
        if (distSq > radius * radius) continue;

        const idx = sy * this.width + sx;
        const edgeStrength = this.edgeMap[idx];

        if (edgeStrength > maxEdge && edgeStrength > (this.lassoSettings.snapThreshold * 255)) {
            maxEdge = edgeStrength;
            bestX = sx;
            bestY = sy;
        }
      }
    }
    return [bestX, bestY];
  }

  pathToSelection(path: [number, number][]) {
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
  magicWand(x: number, y: number, previewOnly = false): Segment | null {
      if (!this.pixelData) return null;
      x = Math.floor(x);
      y = Math.floor(y);

      if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;

      const tolerance = this.magicWandSettings.tolerance / 100;
      const seedIndex = y * this.width + x;
      const seedColor = this.getPixelColor(seedIndex);

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
                  const neighborColor = this.getPixelColor(neighborIndex);
                  if (this.colorDistance(seedColor, neighborColor) < tolerance) {
                      queue.push(neighborIndex);
                  }
              }
          }
      }
      
      if (previewOnly) {
          return this.createSegmentFromPixels(selected, false);
      } else {
          this.selectedPixels = selected;
          this.createSegmentFromSelection();
          return null;
      }
  }

  getPixelColor(index: number) {
      if (!this.pixelData) throw new Error("Pixel data not loaded");
      const i = index * 4;
      const r = this.pixelData[i];
      const g = this.pixelData[i + 1];
      const b = this.pixelData[i + 2];
      
      switch (this.magicWandSettings.colorSpace) {
          case 'hsv':
              return rgbToHsv(r, g, b);
          case 'lab':
              return rgbToLab(r, g, b);
          default: // 'rgb'
              return { r: r / 255, g: g / 255, b: b / 255 };
      }
  }

  colorDistance(c1: any, c2: any): number {
      switch (this.magicWandSettings.colorSpace) {
          case 'hsv':
              const dH = Math.min(Math.abs(c1.h - c2.h), 360 - Math.abs(c1.h - c2.h)) / 180;
              const dS = Math.abs(c1.s - c2.s) / 100;
              const dV = Math.abs(c1.v - c2.v) / 100;
              return Math.sqrt(dH * dH + dS * dS + dV * dV);
          case 'lab':
              const dL = c1.l - c2.l;
              const dA = c1.a - c2.a;
              const dB = c1.b - c2.b;
              return Math.sqrt(dL*dL + dA*dA + dB*dB) / 100; // Normalize roughly to 0-1
          default: // 'rgb'
              const dR = c1.r - c2.r;
              const dG = c1.g - c2.g;
              const dB_ = c1.b - c2.b;
              return Math.sqrt(dR*dR + dG*dG + dB_*dB_);
      }
  }
  // #endregion
  
  createSegmentFromPixels(pixels: Set<number>, addToSegments: boolean = true): Segment | null {
    if (pixels.size === 0) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pixels.forEach(idx => {
      const x = idx % this.width;
      const y = Math.floor(idx / this.width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
    
    if (minX === Infinity) return null;

    const bounds = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    const segment: Segment = {
      id: Date.now() + Math.random(),
      pixels: pixels,
      bounds: bounds,
    };

    if (addToSegments) {
      this.segments.push(segment);
      this.selectedSegmentIds.add(segment.id);
      this.selectedPixels.clear();
    }
    
    return segment;
  }

  createSegmentFromSelection() {
    this.createSegmentFromPixels(this.selectedPixels, true);
  }

  clearSelection() {
    this.selectedPixels.clear();
    this.selectedSegmentIds.clear();
    this.segments = [];
  }
  
  selectionToMaskData(selection?: Segment | null): string | undefined {
      const finalSelection = new Set<number>();
      this.segments.forEach(seg => {
        if(this.selectedSegmentIds.has(seg.id)){
            seg.pixels.forEach(p => finalSelection.add(p));
        }
      });

      if (finalSelection.size === 0) return undefined;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return undefined;
      
      // Black background for "inpaint here"
      tempCtx.fillStyle = 'black';
      tempCtx.fillRect(0, 0, this.width, this.height);

      // White foreground for "keep this"
      tempCtx.fillStyle = 'white';
      const maskImageData = tempCtx.getImageData(0,0,this.width, this.height);
      const data = maskImageData.data;
      for(let i = 0; i < data.length; i+=4) {
          const idx = i / 4;
          if (!finalSelection.has(idx)) {
              data[i] = 255;
              data[i+1] = 255;
              data[i+2] = 255;
              data[i+3] = 255;
          } else {
              data[i] = 0;
              data[i+1] = 0;
              data[i+2] = 0;
              data[i+3] = 255;
          }
      }
      tempCtx.putImageData(maskImageData, 0, 0);


      return tempCanvas.toDataURL();
  }


  renderHoverSegment(overlayCtx: CanvasRenderingContext2D, segment: Segment) {
      if (!segment) return;
      overlayCtx.fillStyle = 'rgba(3, 169, 244, 0.3)'; // Highlight color
      
      const originalImageData = this.ctx.getImageData(0,0, this.width, this.height);
      const segmentImageData = overlayCtx.createImageData(originalImageData);

      segment.pixels.forEach((idx: number) => {
        const i = idx * 4;
        segmentImageData.data[i] = 3;
        segmentImageData.data[i + 1] = 169;
        segmentImageData.data[i + 2] = 244;
        segmentImageData.data[i + 3] = 102; // ~0.4 alpha
      });

      overlayCtx.putImageData(segmentImageData, 0, 0);
  }


  renderSelection(overlayCtx: CanvasRenderingContext2D) {
    if (!overlayCtx) return;

    overlayCtx.clearRect(0, 0, this.width, this.height);

    this.segments.forEach(segment => {
      const isSelected = this.selectedSegmentIds.has(segment.id);
      
      const segmentImageData = overlayCtx.createImageData(segment.bounds.width, segment.bounds.height);
      
      segment.pixels.forEach((idx: number) => {
        const x = idx % this.width;
        const y = Math.floor(idx / this.width);
        
        if (x >= segment.bounds.x && x < segment.bounds.x + segment.bounds.width &&
            y >= segment.bounds.y && y < segment.bounds.y + segment.bounds.height) {
              
            const pixelIndex = ((y - segment.bounds.y) * segment.bounds.width + (x - segment.bounds.x)) * 4;
            segmentImageData.data[pixelIndex] = 3;
            segmentImageData.data[pixelIndex + 1] = 169;
            segmentImageData.data[pixelIndex + 2] = 244;
            segmentImageData.data[pixelIndex + 3] = 102; // 0.4 alpha
        }
      });
      overlayCtx.putImageData(segmentImageData, segment.bounds.x, segment.bounds.y);
      
      if (isSelected) {
        overlayCtx.strokeStyle = 'hsl(var(--accent))';
        overlayCtx.lineWidth = 2;
        overlayCtx.strokeRect(segment.bounds.x, segment.bounds.y, segment.bounds.width, segment.bounds.height);
      }
    });

    if (this.isDrawingLasso) {
      const fullPath = this.getLassoPath(false);
      
      if (fullPath.length > 0) {
        overlayCtx.strokeStyle = 'hsl(var(--accent))';
        overlayCtx.lineWidth = 2;
        overlayCtx.lineJoin = 'round';
        overlayCtx.lineCap = 'round';
        overlayCtx.beginPath();
        overlayCtx.moveTo(fullPath[0][0], fullPath[0][1]);
        for (let i = 1; i < fullPath.length; i++) {
            overlayCtx.lineTo(fullPath[i][0], fullPath[i][1]);
        }
        overlayCtx.stroke();
      }


      // Draw anchor points
      this.lassoNodes.forEach(([x, y], index) => {
        overlayCtx.fillStyle = index === 0 ? 'hsl(var(--accent))' : '#fff';
        overlayCtx.beginPath();
        overlayCtx.arc(x, y, 4, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.strokeStyle = 'hsl(var(--background))';
        overlayCtx.lineWidth = 2;
        overlayCtx.stroke();
      });
    }
  }
}
