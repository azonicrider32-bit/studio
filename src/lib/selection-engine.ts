import { LassoSettings } from "./types";

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
  segments: any[] = [];
  selectedSegmentIds: Set<any> = new Set();
  
  // Lasso State
  lassoNodes: [number, number][] = [];
  lassoCurrentPos: [number, number] | null = null;
  isDrawingLasso: boolean = false;
  
  // Edge Detection
  edgeMap: Float32Array | null = null;

  // Settings
  settings: LassoSettings = {
    useEdgeSnapping: true,
    snapRadius: 10,
    snapThreshold: 0.3,
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
  
  updateSettings(newSettings: Partial<LassoSettings>) {
    this.settings = { ...this.settings, ...newSettings };
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

  startLasso(x: number, y: number) {
    this.cancelLasso();
    this.segments = [];
    this.selectedSegmentIds.clear();
    const startPoint: [number, number] = this.settings.useEdgeSnapping ? this.snapToEdge(x, y) : [x, y];
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
    if (!this.settings.useEdgeSnapping) {
      return [[x1,y1], [x2, y2]];
    }

    const path: [number, number][] = [[x1, y1]];
    let currentX = Math.round(x1);
    let currentY = Math.round(y1);

    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const stepCount = Math.max(1, Math.round(dist / (this.settings.snapRadius / 2)));

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
    if (!this.edgeMap || !this.settings.useEdgeSnapping) return [Math.round(x), Math.round(y)];
    
    const radius = this.settings.snapRadius;
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

        if (edgeStrength > maxEdge && edgeStrength > (this.settings.snapThreshold * 255)) {
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

  createSegmentFromSelection() {
    if (this.selectedPixels.size === 0) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    this.selectedPixels.forEach(idx => {
      const x = idx % this.width;
      const y = Math.floor(idx / this.width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
    
    if (minX === Infinity) return null;

    const bounds = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    const segment = {
      id: Date.now(),
      pixels: new Set(this.selectedPixels),
      bounds: bounds,
    };

    this.segments.push(segment);
    this.selectedSegmentIds.add(segment.id);
    this.selectedPixels.clear();
    return segment;
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
