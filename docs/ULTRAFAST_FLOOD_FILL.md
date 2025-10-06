# Ultra-Fast Flood Fill and Hole Filling System Examples

This document contains code examples for a highly efficient and fast segmentation system for future analysis and reference. This code was provided by the user as a benchmark for performance.

## Ultra-Fast Flood Fill

```javascript
import { Point, Color, SegmentationResult, WandOptions } from '@/types/segmentation';

export class UltraFastFloodFill {
  private imageData: ImageData;
  private width: number;
  private height: number;

  constructor(imageData: ImageData) {
    this.imageData = imageData;
    this.width = imageData.width;
    this.height = imageData.height;
  }

  async segment(
    seedPoint: Point,
    options: WandOptions
  ): Promise<SegmentationResult> {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;

    const seedIdx = seedPoint.y * this.width + seedPoint.x;
    const seedColor = this.getPixelColor(seedIdx);
    const selected: number[] = [];

    // Use flat array for visited tracking (faster than Set for dense data)
    const visited = new Uint8Array((this.width * this.height + 7) >> 3);

    // Inline queue with pre-allocated size
    const queue = new Int32Array(this.width * this.height);
    let queueStart = 0, queueEnd = 0;

    queue[queueEnd++] = seedIdx;
    this.setVisited(visited, seedIdx);

    // Main flood fill loop - optimized for CPU cache
    while (queueStart < queueEnd) {
      const idx = queue[queueStart++];

      if (this.colorDistance(seedColor, this.getPixelColor(idx), options.colorSpace) <= options.tolerance) {
        selected.push(idx);

        // Add neighbors
        const neighbors = this.getNeighborsFast(idx, options.connectivity);
        for (let i = 0; i < neighbors.length; i++) {
          const nIdx = neighbors[i];
          if (!this.isVisited(visited, nIdx)) {
            this.setVisited(visited, nIdx);
            queue[queueEnd++] = nIdx;
          }
        }
      }
    }

    const endTime = performance.now();
    const endMemory = performance.memory?.usedJSHeapSize || 0;

    // Convert to mask
    const mask = new Uint8ClampedArray(this.width * this.height);
    selected.forEach(idx => mask[idx] = 255);

    return {
      pixels: selected,
      mask,
      confidence: this.calculateConfidence(selected, seedColor, options),
      metadata: {
        algorithm: 'ultra-fast-flood-fill',
        executionTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        parameters: options
      }
    };
  }

  // Bit manipulation for fast visited tracking
  private setVisited(visited: Uint8Array, idx: number): void {
    visited[idx >> 3] |= 1 << (idx & 7);
  }

  private isVisited(visited: Uint8Array, idx: number): boolean {
    return (visited[idx >> 3] & (1 << (idx & 7))) !== 0;
  }

  // Cache-friendly neighbor calculation
  private getNeighborsFast(idx: number, connectivity: number): number[] {
    const x = idx % this.width;
    const y = Math.floor(idx / this.width);
    const neighbors: number[] = [];

    // 4-way connectivity
    if (y > 0) neighbors.push(idx - this.width); // North
    if (y < this.height - 1) neighbors.push(idx + this.width); // South
    if (x > 0) neighbors.push(idx - 1); // West
    if (x < this.width - 1) neighbors.push(idx + 1); // East

    // Additional 4 for 8-way connectivity
    if (connectivity === 8) {
      if (x > 0 && y > 0) neighbors.push(idx - this.width - 1); // NW
      if (x < this.width - 1 && y > 0) neighbors.push(idx - this.width + 1); // NE
      if (x > 0 && y < this.height - 1) neighbors.push(idx + this.width - 1); // SW
      if (x < this.width - 1 && y < this.height - 1) neighbors.push(idx + this.width + 1); // SE
    }

    return neighbors;
  }

  // Fast color extraction using bit shifts
  private getPixelColor(idx: number): Color {
    const offset = idx << 2; // idx * 4
    return {
      r: this.imageData.data[offset],
      g: this.imageData.data[offset + 1],
      b: this.imageData.data[offset + 2],
      a: this.imageData.data[offset + 3]
    };
  }

  // Optimized color distance calculation
  private colorDistance(c1: Color, c2: Color, colorSpace: string): number {
    switch (colorSpace) {
      case 'rgb':
        return this.rgbDistance(c1, c2);
      case 'hsv':
        return this.hsvDistance(c1, c2);
      case 'lab':
        return this.labDistance(c1, c2);
      default:
        return this.rgbDistance(c1, c2);
    }
  }

  private rgbDistance(c1: Color, c2: Color): number {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  private hsvDistance(c1: Color, c2: Color): number {
    const hsv1 = this.rgbToHsv(c1);
    const hsv2 = this.rgbToHsv(c2);
    
    const dh = Math.min(Math.abs(hsv1.h - hsv2.h), 360 - Math.abs(hsv1.h - hsv2.h));
    const ds = hsv1.s - hsv2.s;
    const dv = hsv1.v - hsv2.v;
    
    return Math.sqrt(dh * dh + ds * ds * 100 + dv * dv * 100);
  }

  private labDistance(c1: Color, c2: Color): number {
    const lab1 = this.rgbToLab(c1);
    const lab2 = this.rgbToLab(c2);
    
    const dl = lab1.l - lab2.l;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    
    return Math.sqrt(dl * dl + da * da + db * db);
  }

  private rgbToHsv(color: Color): { h: number; s: number; v: number } {
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
    }
    h = (h * 60 + 360) % 360;

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h, s, v };
  }

  private rgbToLab(color: Color): { l: number; a: number; b: number } {
    // Simplified LAB conversion
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;

    // Convert to XYZ
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    // Convert to LAB
    const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b_lab = 200 * (fy - fz);

    return { l, a, b: b_lab };
  }

  private calculateConfidence(pixels: number[], seedColor: Color, options: WandOptions): number {
    if (pixels.length === 0) return 0;

    let totalDistance = 0;
    for (const idx of pixels) {
      const pixelColor = this.getPixelColor(idx);
      totalDistance += this.colorDistance(seedColor, pixelColor, options.colorSpace);
    }

    const avgDistance = totalDistance / pixels.length;
    return Math.max(0, 1 - (avgDistance / options.tolerance));
  }
}
```

## Hole Filling System

```javascript
import { Point, Hole, Rectangle } from '@/types/segmentation';

export class HoleFillingSystem {
  private maxHoleSize: number = 100;
  private autoFillEnabled: boolean = true;

  setMaxHoleSize(size: number): void {
    this.maxHoleSize = Math.max(0, Math.min(1000, size));
  }

  getMaxHoleSize(): number {
    return this.maxHoleSize;
  }

  enableAutoFill(enabled: boolean): void {
    this.autoFillEnabled = enabled;
  }

  isAutoFillEnabled(): boolean {
    return this.autoFillEnabled;
  }

  detectHoles(mask: boolean[][], imageData: ImageData): Hole[] {
    if (!this.autoFillEnabled) return [];

    const width = mask[0].length;
    const height = mask.length;
    const visited = Array(height).fill(null).map(() => Array(width).fill(false));
    const holes: Hole[] = [];

    // Scan for unselected pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Found unselected, unvisited pixel
        if (!mask[y][x] && !visited[y][x]) {
          const hole = this.floodFillHole(mask, visited, { x, y }, width, height);

          // Only track interior holes (not edge-touching regions)
          if (hole.isInterior) {
            holes.push(hole);
          }
        }
      }
    }

    return holes;
  }

  private floodFillHole(
    mask: boolean[][],
    visited: boolean[][],
    start: Point,
    width: number,
    height: number
  ): Hole {
    const points: Point[] = [];
    const queue: Point[] = [start];
    let touchesEdge = false;

    while (queue.length > 0) {
      const point = queue.shift()!;
      const { x, y } = point;

      // Bounds check
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[y][x] || mask[y][x]) continue;

      // Mark visited
      visited[y][x] = true;
      points.push(point);

      // Check if touching edge
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        touchesEdge = true;
      }

      // Add neighbors
      queue.push({ x: x + 1, y });
      queue.push({ x: x - 1, y });
      queue.push({ x, y: y + 1 });
      queue.push({ x, y: y - 1 });
    }

    // Calculate hole properties
    const bounds = this.calculateBounds(points);
    const centroid = this.calculateCentroid(points);
    const perimeter = this.calculatePerimeter(points);

    return {
      points,
      area: points.length,
      boundingBox: bounds,
      centroid,
      perimeter,
      isInterior: !touchesEdge,
      aspectRatio: bounds.width / bounds.height,
      circularity: this.calculateCircularity(points.length, perimeter),
      solidity: this.calculateSolidity(points, bounds)
    };
  }

  fillHoles(mask: boolean[][], holes: Hole[]): boolean[][] {
    if (!this.autoFillEnabled) return mask;

    // Clone mask to avoid mutation
    const filled = mask.map(row => [...row]);

    // Fill qualifying holes
    for (const hole of holes) {
      if (hole.area <= this.maxHoleSize) {
        // Fill all pixels in this hole
        for (const point of hole.points) {
          filled[point.y][point.x] = true;
        }
      }
    }

    return filled;
  }

  filterHoles(holes: Hole[], maxSize: number): Hole[] {
    return holes.filter(hole => hole.area <= maxSize);
  }

  private calculateBounds(points: Point[]): Rectangle {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const { x, y } of points) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  private calculateCentroid(points: Point[]): Point {
    const sum = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  private calculatePerimeter(points: Point[]): number {
    // Simplified perimeter calculation
    return Math.sqrt(points.length) * 4;
  }

  private calculateCircularity(area: number, perimeter: number): number {
    if (perimeter === 0) return 0;
    return (4 * Math.PI * area) / (perimeter * perimeter);
  }

  private calculateSolidity(points: Point[], bounds: Rectangle): number {
    const boundingBoxArea = bounds.width * bounds.height;
    return points.length / boundingBoxArea;
  }
}
```