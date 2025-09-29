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
  lassoNodes: [number, number][] = [];
  lassoCurrentPos: [number, number] | null = null;
  isDrawingLasso: boolean = false;
  edgeMap: Float32Array | null = null;

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

        this.edgeMap[idx] = Math.sqrt(gx * gx + gy * gy) / (255 * Math.sqrt(2));
      }
    }
  }

  getGrayscale(x: number, y: number, data: Uint8ClampedArray) {
    const idx = (y * this.width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  }

  startLasso(x: number, y: number) {
    this.cancelLasso();
    this.segments = [];
    this.selectedSegmentIds.clear();
    this.lassoNodes = [[x, y]];
    this.lassoCurrentPos = [x, y];
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

  addLassoNode(x: number, y: number) {
    if (!this.isDrawingLasso) return;
    this.lassoNodes.push([x, y]);
    this.lassoCurrentPos = [x, y];
  }
  
  endLassoWithEnhancedPath(enhancedPath: {x:number, y:number}[]) {
      if (!this.isDrawingLasso) return;

      const pathAsTuples: [number, number][] = enhancedPath.map(p => [p.x, p.y]);
      
      // Ensure the path is closed for selection
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
    
    const nodesToConnect = [...this.lassoNodes];
    if(!closed && this.lassoCurrentPos) {
        nodesToConnect.push(this.lassoCurrentPos);
    }
    if (closed && nodesToConnect.length > 1) {
        nodesToConnect.push(this.lassoNodes[0]);
    }

    for (let i = 0; i < nodesToConnect.length - 1; i++) {
        const [x1, y1] = nodesToConnect[i];
        const [x2, y2] = nodesToConnect[i+1];
        const segmentPath = this.findEdgePath(x1, y1, x2, y2);
        path.push(...segmentPath);
    }
    
    return path;
  }

  findEdgePath(x1: number, y1: number, x2: number, y2: number) {
    const path: [number, number][] = [];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) return [[x2, y2]];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x1 + dx * t);
      const y = Math.round(y1 + dy * t);

      if (this.edgeMap) {
        const snapped = this.snapToEdge(x, y, 5); // 5px snap radius
        path.push([snapped.x, snapped.y]);
      } else {
        path.push([x, y]);
      }
    }
    return path;
  }

  snapToEdge(x: number, y: number, radius: number) {
    if (!this.edgeMap) return { x, y };

    let maxEdge = 0;
    let bestX = x;
    let bestY = y;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const idx = ny * this.width + nx;
          const edgeStrength = this.edgeMap[idx];

          if (edgeStrength > maxEdge) {
            maxEdge = edgeStrength;
            bestX = nx;
            bestY = ny;
          }
        }
      }
    }
    return { x: bestX, y: bestY };
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
    this.selectedPixels.clear(); // Clear temporary selection
    return segment;
  }


  renderSelection(overlayCtx: CanvasRenderingContext2D) {
    if (!overlayCtx) return;

    overlayCtx.clearRect(0, 0, this.width, this.height);

    // Render segments
    this.segments.forEach(segment => {
      const isSelected = this.selectedSegmentIds.has(segment.id);
      const color = isSelected ? 'rgba(3, 169, 244, 0.4)' : 'rgba(3, 169, 244, 0.4)';
      
      overlayCtx.fillStyle = color;
      segment.pixels.forEach((idx: number) => {
        const x = idx % this.width;
        const y = Math.floor(idx / this.width);
        overlayCtx.fillRect(x, y, 1, 1);
      });
      
      if (isSelected) {
        overlayCtx.strokeStyle = 'hsl(var(--accent))';
        overlayCtx.lineWidth = 2;
        overlayCtx.strokeRect(segment.bounds.x, segment.bounds.y, segment.bounds.width, segment.bounds.height);
      }
    });

    // Render current active lasso path
    if (this.isDrawingLasso) {
      const path = this.getLassoPath();

      if (path.length > 0) {
        overlayCtx.strokeStyle = 'hsl(var(--accent))';
        overlayCtx.lineWidth = 2;
        overlayCtx.lineJoin = 'round';
        overlayCtx.lineCap = 'round';
        overlayCtx.beginPath();
        overlayCtx.moveTo(path[0][0], path[0][1]);
        path.forEach(([x, y]) => overlayCtx.lineTo(x, y));
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
