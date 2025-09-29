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
  
  // Edge Detection
  edgeMap: Float32Array | null = null;

  // Settings
  lassoSettings: LassoSettings = {
    useEdgeSnapping: true,
    snapRadius: 10,
    snapThreshold: 0.3,
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
  
  updateSettings(newWandSettings: Partial<LassoSettings>, newLassoSettings: Partial<MagicWandSettings>) {
    this.lassoSettings = { ...this.lassoSettings, ...newWandSettings };
    this.magicWandSettings = { ...this.magicWandSettings, ...newLassoSettings };
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
  }

  updateLassoPreview(x: number, y: number) {
    if (!this.isDrawingLasso) return;
    this.lassoCurrentPos = [x, y];
  }

  addLassoNode() {
    if (!this.isDrawingLasso || !this.lassoCurrentPos) return;

    // The point to add is the end of the current preview path.
    const lastNode = this.lassoNodes[this.lassoNodes.length - 1];
    const newPathSegment = this.findEdgePath(lastNode[0], lastNode[1], this.lassoCurrentPos[0], this.lassoCurrentPos[1]);
    const newNode = newPathSegment[newPathSegment.length - 1];
    
    this.lassoNodes.push(newNode);
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
    if (!this.isDrawingLasso || this.lassoNodes.length < 3) {
      this.cancelLasso();
      return;
    }

    const fullPath = this.getLassoPath(true);
    this.selectedPixels = this.pathToSelection(fullPath);
    this.createSegmentFromSelection();

    this.cancelLasso();
  }

  getLassoPath(closed = false) {
    if (!this.isDrawingLasso || this.lassoNodes.length === 0) return [];
    
    let path: [number, number][] = [];
    
    // Path between existing nodes
    for (let i = 0; i < this.lassoNodes.length - 1; i++) {
        const [x1, y1] = this.lassoNodes[i];
        const [x2, y2] = this.lassoNodes[i+1];
        path.push(...this.findEdgePath(x1, y1, x2, y2));
    }
    
    const lastNode = this.lassoNodes[this.lassoNodes.length - 1];

    if (closed) {
        const firstNode = this.lassoNodes[0];
        path.push(...this.findEdgePath(lastNode[0], lastNode[1], firstNode[0], firstNode[1]));
    } else if (this.lassoCurrentPos) {
        // Preview path from last node to cursor
        path.push(...this.findEdgePath(lastNode[0], lastNode[1], this.lassoCurrentPos[0], this.lassoCurrentPos[1]));
    }
    
    return path;
  }

  findEdgePath(x1: number, y1: number, x2: number, y2: number): [number, number][] {
    if (!this.lassoSettings.useEdgeSnapping) {
      return [[x1,y1], [x2, y2]];
    }

    const path: [number, number][] = [[x1, y1]];
    let currentX = Math.round(x1);
    let currentY = Math.round(y1);

    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const stepCount = Math.max(1, Math.round(dist / (this.lassoSettings.snapRadius / 2)));

    for (let i = 0; i < stepCount; i++) {
        const targetX = x1 + (x2 - x1) * ((i + 1) / stepCount);
        const targetY = y1 + (y2 - y1) * ((i + 1) / stepCount);
        
        const snappedPoint = this.snapToEdge(targetX, targetY);
        currentX = snappedPoint[0];
        currentY = snappedPoint[1];
        path.push([currentX, currentY]);
    }
    path.push([Math.round(x2), Math.round(y2)]);
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
          const x = (y - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]) + p1[0];
          intersections.push(x);
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
      this.visited![seedIndex] = 1;
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
          // Break if queue gets too large for a preview
          if (previewOnly && queue.length > 20000) break;
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
  
  selectionToMaskData(selection: Segment | null): string | undefined {
      if (!selection || selection.pixels.size === 0) return undefined;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return undefined;

      const maskImageData = tempCtx.createImageData(this.width, this.height);
      selection.pixels.forEach(idx => {
          maskImageData.data[idx * 4 + 3] = 255; // Set alpha to 255 for selected pixels
      });

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
      const color = isSelected ? 'rgba(3, 169, 244, 0.4)' : 'rgba(3, 169, 244, 0.4)';
      
      overlayCtx.fillStyle = color;
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
      const path = this.getLassoPath();

      if (path.length > 0) {
        overlayCtx.strokeStyle = 'hsl(var(--accent))';
        overlayCtx.lineWidth = 2;
        overlayCtx.lineJoin = 'round';
        overlayCtx.lineCap = 'round';
        overlayCtx.beginPath();
        overlayCtx.moveTo(path[0][0], path[0][1]);
        for(let i=1; i < path.length; i++) {
          overlayCtx.lineTo(path[i][0], path[i][1]);
        }
        overlayCtx.stroke();
      }

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
