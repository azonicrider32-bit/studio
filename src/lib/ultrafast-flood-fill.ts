
"use client";

import { MagicWandSettings } from "./types";
import { rgbToHsv, rgbToLab } from "./color-utils";

// Types adapted for our existing structure
export interface Point {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface SegmentationResult {
  pixels: number[];
  mask: Uint8ClampedArray;
  confidence: number;
  metadata: {
    algorithm: string;
    executionTime: number;
    memoryUsage: number;
    parameters: any;
  };
}

export type WandOptions = {
    tolerance: number;
    colorSpace: 'rgb' | 'hsv' | 'lab';
    connectivity: 4 | 8;
};

export class UltraFastFloodFill {
  private imageData: ImageData;
  private width: number;
  private height: number;

  constructor(imageData: ImageData) {
    this.imageData = imageData;
    this.width = imageData.width;
    this.height = imageData.height;
  }

  segment(
    seedPoint: Point,
    options: WandOptions
  ): SegmentationResult {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    const seedIdx = Math.floor(seedPoint.y) * this.width + Math.floor(seedPoint.x);
    const seedColor = this.getPixelColor(seedIdx);
    const selected: number[] = [];

    // Use flat array for visited tracking (faster than Set for dense data)
    const visited = new Uint8Array(Math.ceil((this.width * this.height) / 8));

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
          if (nIdx >= 0 && nIdx < this.width * this.height && !this.isVisited(visited, nIdx)) {
            this.setVisited(visited, nIdx);
            queue[queueEnd++] = nIdx;
          }
        }
      }
    }

    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

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
  private colorDistance(c1: Color, c2: Color, colorSpace: 'rgb' | 'hsv' | 'lab'): number {
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
    const hsv1 = rgbToHsv(c1.r, c1.g, c1.b);
    const hsv2 = rgbToHsv(c2.r, c2.g, c2.b);
    
    const dh = Math.min(Math.abs(hsv1.h - hsv2.h), 360 - Math.abs(hsv1.h - hsv2.h));
    const ds = hsv1.s - hsv2.s;
    const dv = hsv1.v - hsv2.v;
    
    return Math.sqrt(dh * dh + ds * ds * 100 + dv * dv * 100);
  }

  private labDistance(c1: Color, c2: Color): number {
    const lab1 = rgbToLab(c1.r, c1.g, c1.b);
    const lab2 = rgbToLab(c2.r, c2.g, c2.b);
    
    const dl = lab1.l - lab2.l;
    const da = lab1.a - lab2.a;
    const db = lab1.b_lab - lab2.b_lab;
    
    return Math.sqrt(dl * dl + da * da + db * db);
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
