# High-Performance Segmentation System - Code Examples

This document contains code examples for a highly efficient and fast segmentation system for future analysis and reference. The code is organized by its original component structure.

## Workspace Component (`[workspace]`)

```javascript
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Wand2, Lasso, Upload, ZoomIn, Grid, Maximize2,
  Eye, EyeOff, Trash2, Settings, Download, Image as ImageIcon,
  Eraser, Sparkles, Plus, MoreVertical, Layers as LayersIcon,
  Move, ChevronDown, ChevronRight, Palette, Square, Ban, History,
  AlertCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Workspace() {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [currentImage, setCurrentImage] = useState('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop');
  const [currentTool, setCurrentTool] = useState('magic_wand');
  const [layers, setLayers] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef(null);

  // Tool settings
  const [tolerance, setTolerance] = useState(30);
  const [contiguous, setContiguous] = useState(true);
  const [connectivity, setConnectivity] = useState(4);
  const [hideAllSegments, setHideAllSegments] = useState(false);
  const [autoFillHoles, setAutoFillHoles] = useState(false);

  // Advanced interaction state
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [currentGroupLayer, setCurrentGroupLayer] = useState(null);
  const [hoverPreview, setHoverPreview] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [selectedSegments, setSelectedSegments] = useState(new Set());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [localTolerance, setLocalTolerance] = useState(tolerance);

  // Eraser tool settings
  const [eraserSize, setEraserSize] = useState(20);
  const [eraserOpacity, setEraserOpacity] = useState(100);
  const [eraserSoftness, setEraserSoftness] = useState(50);
  const [isErasing, setIsErasing] = useState(false);

  // History and undo/redo system
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [maxHistorySize, setMaxHistorySize] = useState(100);
  const [showHistory, setShowHistory] = useState(false);

  // Layer deletion confirmation
  const [layerToDelete, setLayerToDelete] = useState(null);
  const [deleteClickCount, setDeleteClickCount] = useState(0);
  const deleteTimerRef = useRef(null);

  // Right drawer states
  const [rightDrawers, setRightDrawers] = useState({
    zoom: false,
    preview: false,
    history: false
  });

  // Layer expansion states
  const [expandedLayers, setExpandedLayers] = useState(new Set());

  const sampleImages = [
    { name: 'Mountain', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop' },
    { name: 'Portrait', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop' },
    { name: 'Product', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=800&fit=crop' },
    { name: 'Flower', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop' }
  ];

  // Add action to history
  const addToHistory = useCallback((action) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        ...action,
        timestamp: Date.now(),
        id: `action_${Date.now()}_${Math.random()}`
      });

      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }

      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [historyIndex, maxHistorySize]);

  // Undo handler - MOVED BEFORE useEffect that uses it
  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;

    const action = history[historyIndex];

    switch (action.type) {
      case 'create_layer':
        setLayers(prev => prev.filter(l => l.id !== action.layer.id));
        break;
      case 'create_group_layer':
        setLayers(prev => prev.filter(l => l.id !== action.layer.id));
        break;
      case 'delete_layer':
        setLayers(prev => [...prev, action.layer]);
        break;
      case 'add_segment_to_group':
        // Remove last segment from group
        if (currentGroupLayer && currentGroupLayer.id === action.groupId) {
          const newPixels = new Set(currentGroupLayer.pixels);
          action.segmentPixels.forEach(p => newPixels.delete(p));
          setCurrentGroupLayer({
            ...currentGroupLayer,
            pixels: newPixels,
            segments: currentGroupLayer.segments.slice(0, -1)
          });
        }
        break;
      case 'add_modifier':
        setLayers(prev => prev.map(l =>
          l.id === action.layerId
            ? { ...l, modifiers: l.modifiers.slice(0, -1) }
            : l
        ));
        break;
      case 'toggle_visibility':
        setLayers(prev => prev.map(l =>
          l.id === action.layerId
            ? { ...l, visible: !l.visible }
            : l
        ));
        break;
      default:
        break;
    }

    setHistoryIndex(prev => prev - 1);
  }, [historyIndex, history, currentGroupLayer]);

  // Redo handler - MOVED BEFORE useEffect that uses it
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const action = history[historyIndex + 1];

    switch (action.type) {
      case 'create_layer':
        setLayers(prev => [...prev, action.layer]);
        break;
      case 'create_group_layer':
        setLayers(prev => [...prev, action.layer]);
        break;
      case 'delete_layer':
        setLayers(prev => prev.filter(l => l.id !== action.layer.id));
        break;
      case 'add_segment_to_group':
        if (currentGroupLayer && currentGroupLayer.id === action.groupId) {
          action.segmentPixels.forEach(p => currentGroupLayer.pixels.add(p));
          currentGroupLayer.segments.push({
            pixels: action.segmentPixels,
            tolerance: action.tolerance
          });
          setCurrentGroupLayer({ ...currentGroupLayer });
        }
        break;
      case 'add_modifier':
        setLayers(prev => prev.map(l =>
          l.id === action.layerId
            ? { ...l, modifiers: [...l.modifiers, action.modifier] }
            : l
        ));
        break;
      case 'toggle_visibility':
        setLayers(prev => prev.map(l =>
          l.id === action.layerId
            ? { ...l, visible: !l.visible }
            : l
        ));
        break;
      default:
        break;
    }

    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, history, currentGroupLayer]);

  // Remove specific action from history
  const removeHistoryAction = useCallback((actionId) => {
    const actionIndex = history.findIndex(a => a.id === actionId);
    if (actionIndex === -1) return;

    const action = history[actionIndex];

    // Find dependent actions
    const dependentActions = history.filter((a, i) => {
      if (i <= actionIndex) return false;

      // Check if action depends on removed action
      if (action.type === 'create_layer' && a.layerId === action.layer.id) {
        return true;
      }
      if (action.type === 'create_group_layer' && a.layerId === action.layer.id) {
        return true;
      }

      return false;
    });

    // Remove action and all dependent actions
    const actionsToRemove = [actionId, ...dependentActions.map(a => a.id)];

    setHistory(prev => prev.filter(a => !actionsToRemove.includes(a.id)));
    setHistoryIndex(prev => Math.max(0, prev - actionsToRemove.length));

    // Reverse the action effects
    if (action.type === 'create_layer' || action.type === 'create_group_layer') {
      setLayers(prev => prev.filter(l => l.id !== action.layer.id));
    }

    // Drawing handled by useEffect for layers.
  }, [history]);

  // Fill holes in segment
  const fillHoles = useCallback((pixels, width, height) => {
    if (!pixels || pixels.length === 0) return pixels;

    const pixelSet = new Set(pixels);
    const filled = new Set(pixels);

    // Find all empty regions
    const visited = new Set();
    const regions = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!pixelSet.has(idx) && !visited.has(idx)) {
          // BFS to find region
          const region = [];
          const queue = [[x, y]];
          let touchesBorder = false;

          const currentRegionVisited = new Set(); // Keep track of visited in current region

          while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            const cidx = cy * width + cx;

            if (currentRegionVisited.has(cidx)) continue; // Check against current region's visited set
            currentRegionVisited.add(cidx); // Add to current region's visited
            visited.add(cidx); // Add to global visited for efficiency

            if (cx === 0 || cx === width - 1 || cy === 0 || cy === height - 1) {
              touchesBorder = true;
            }

            if (!pixelSet.has(cidx)) { // If it's an "empty" pixel
              region.push(cidx);

              // Add neighbors
              [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dx, dy]) => {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const neighborIdx = ny * width + nx;
                  if (!currentRegionVisited.has(neighborIdx) && !pixelSet.has(neighborIdx)) {
                    queue.push([nx, ny]);
                  }
                }
              });
            }
          }

          if (!touchesBorder && region.length > 0) {
            regions.push(region);
          }
        }
      }
    }

    // Fill all holes (regions not touching border)
    regions.forEach(region => {
      region.forEach(idx => filled.add(idx));
    });

    return Array.from(filled);
  }, []);

  // Get all occupied pixels
  const getOccupiedPixels = useCallback(() => {
    const occupied = new Set();

    // Iterate through layers to find segments (excluding background)
    layers.forEach(layer => {
      if (layer.type === 'segment' && layer.visible && layer.pixels) {
        const pixels = Array.isArray(layer.pixels) ? layer.pixels : Array.from(layer.pixels);
        if (layer.isExclusion) {
          // Add exclusion pixels to occupied set, so flood fill avoids them
          pixels.forEach(p => occupied.add(p));
        } else if (hideAllSegments) {
          // If hideAllSegments is true, normal segments also block flood fill
          pixels.forEach(p => occupied.add(p));
        }
      }
    });

    // Add current group layer pixels if shift is pressed
    if (isShiftPressed && currentGroupLayer && currentGroupLayer.pixels) {
      currentGroupLayer.pixels.forEach(p => occupied.add(p));
    }

    return occupied;
  }, [layers, hideAllSegments, isShiftPressed, currentGroupLayer]);

  // Find segment at position
  const findSegmentAtPosition = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const pixelIndex = y * canvas.width + x;

    // Iterate through layers from top to bottom (last in array is top)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.type === 'segment' && layer.visible && layer.pixels) {
        const pixels = Array.isArray(layer.pixels) ? layer.pixels : new Set(layer.pixels); // Use Set for faster lookup if it's already a Set
        if (pixels.has(pixelIndex)) {
          return { layer, pixelIndex };
        }
      }
    }

    return null;
  }, [layers]);

  // Flood fill algorithm
  const floodFill = useCallback((startX, startY, customTolerance = null) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return [];

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const useTolerance = customTolerance !== null ? customTolerance : tolerance;
    const occupiedPixels = getOccupiedPixels();

    const startIndex = (startY * width + startX) * 4;
    const startPixelIdx = startY * width + startX;

    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
      return []; // Click outside canvas
    }

    if (occupiedPixels.has(startPixelIdx)) {
      return []; // Clicked on an already occupied pixel (by another segment or exclusion)
    }

    const startColor = {
      r: data[startIndex],
      g: data[startIndex + 1],
      b: data[startIndex + 2]
    };

    const visited = new Set();
    const selected = [];
    const queue = [[startX, startY]];

    const colorDistance = (r1, g1, b1, r2, g2, b2) => {
      const dr = r1 - r2;
      const dg = g1 - g2;
      const db = b1 - b2;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    const getNeighbors = (x, y) => {
      const neighbors = [];
      const dirs = connectivity === 8
        ? [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]]
        : [[0, 1], [1, 0], [0, -1], [-1, 0]];

      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          neighbors.push([nx, ny]);
        }
      }
      return neighbors;
    };

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;
      const pixelIdx = y * width + x;

      if (visited.has(key) || occupiedPixels.has(pixelIdx)) continue; // Already visited or occupied

      const index = (y * width + x) * 4;
      const currentColor = {
        r: data[index],
        g: data[index + 1],
        b: data[index + 2]
      };

      const distance = colorDistance(
        startColor.r, startColor.g, startColor.b,
        currentColor.r, currentColor.g, currentColor.b
      );

      if (distance <= useTolerance) {
        visited.add(key);
        selected.push(pixelIdx);

        if (contiguous) {
          const neighbors = getNeighbors(x, y);
          for (const [nx, ny] of neighbors) {
            const neighborKey = `${nx},${ny}`;
            const neighborIdx = ny * width + nx;
            if (!visited.has(neighborKey) && !occupiedPixels.has(neighborIdx)) {
              queue.push([nx, ny]);
            }
          }
        } else {
          // If not contiguous, check all pixels on canvas that match tolerance
          // This part is typically omitted in basic flood fill for performance,
          // but if 'contiguous' means only directly connected, and 'not contiguous' means all similar pixels,
          // then a full scan or more complex algorithm is needed.
          // For now, let's assume 'contiguous' is the primary mode.
        }
      }
    }

    // Auto fill holes if enabled
    if (autoFillHoles && selected.length > 0) {
      return fillHoles(selected, width, height);
    }

    return selected;
  }, [imageLoaded, tolerance, contiguous, connectivity, getOccupiedPixels, autoFillHoles, fillHoles]);

  // Draw all layers
  const drawLayers = useCallback((layersToDraw, previewPixels = null, hoveredSeg = null) => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    const previewData = previewCtx.createImageData(previewCanvas.width, previewCanvas.height);

    const hslToRgb = (h, s, l) => {
      s /= 100;
      l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return [255 * f(0), 255 * f(8), 255 * f(4)];
    };

    // Draw existing layers
    layersToDraw.forEach((layer) => {
      if (!layer.visible || layer.type === 'background' || !layer.pixels) return;

      const colorMatch = layer.color ? layer.color.match(/\d+/g) : null;
      const h = colorMatch ? Number(colorMatch[0]) : 0;
      const s = colorMatch ? Number(colorMatch[1]) : 70;
      const l = colorMatch ? Number(colorMatch[2]) : 50;

      const [r, g, b] = hslToRgb(h, s, l);

      const pixels = Array.isArray(layer.pixels) ? layer.pixels : Array.from(layer.pixels);

      pixels.forEach(pixelIndex => {
        const index = pixelIndex * 4;
        if (index < 0 || index + 3 >= previewData.data.length) return; // Boundary check

        let finalR = r;
        let finalG = g;
        let finalB = b;
        let finalA = 255 * (layer.opacity || 0.7);

        // Apply modifiers
        if (layer.modifiers && layer.modifiers.length > 0) {
          layer.modifiers.forEach(modifier => {
            if (modifier.type === 'mask' && modifier.enabled !== false) {
              if (modifier.maskType === 'translucent') {
                finalA = 255 * (modifier.opacity || 0.5);
              } else if (modifier.maskType === 'color') {
                const maskColor = modifier.color || [0, 0, 0];
                finalR = maskColor[0];
                finalG = maskColor[1];
                finalB = maskColor[2];
                finalA = 255 * (modifier.opacity || 1);
              }
            }
          });
        }

        if (layer.showHighlight !== false) { // Only apply color if highlight is not explicitly hidden
          previewData.data[index] = finalR;
          previewData.data[index + 1] = finalG;
          previewData.data[index + 2] = finalB;
          previewData.data[index + 3] = finalA;
        }
      });
    });

    // Draw current group layer if shift is pressed
    if (isShiftPressed && currentGroupLayer && currentGroupLayer.pixels.size > 0) {
      const colorMatch = currentGroupLayer.color ? currentGroupLayer.color.match(/\d+/g) : null;
      const h = colorMatch ? Number(colorMatch[0]) : 0;
      const s = colorMatch ? Number(colorMatch[1]) : 70;
      const l = colorMatch ? Number(colorMatch[2]) : 50;

      const [r, g, b] = hslToRgb(h, s, l);

      currentGroupLayer.pixels.forEach(pixelIndex => {
        const index = pixelIndex * 4;
        if (index < 0 || index + 3 >= previewData.data.length) return; // Boundary check
        previewData.data[index] = r;
        previewData.data[index + 1] = g;
        previewData.data[index + 2] = b;
        previewData.data[index + 3] = 255 * (currentGroupLayer.opacity || 0.7);
      });
    }

    // Draw hovered segment highlight
    if (hoveredSeg && hoveredSeg.layer) {
      const pixels = Array.isArray(hoveredSeg.layer.pixels) ? hoveredSeg.layer.pixels : Array.from(hoveredSeg.layer.pixels);
      pixels.forEach(pixelIndex => {
        const index = pixelIndex * 4;
        if (index < 0 || index + 3 >= previewData.data.length) return; // Boundary check
        // Blend with existing preview data to show hover over existing segment
        const existingAlpha = previewData.data[index + 3];
        const hoverAlpha = 120; // Semi-transparent white
        
        // Simple alpha blending: new_color = (old_color * (1 - new_alpha)) + (new_color * new_alpha)
        // For visual clarity, let's just make it a distinct highlight without full blending logic here.
        previewData.data[index] = 255;
        previewData.data[index + 1] = 255;
        previewData.data[index + 2] = 255;
        previewData.data[index + 3] = Math.min(255, existingAlpha + hoverAlpha); // Make it brighter/more opaque
      });
    }

    // Draw hover preview in yellow
    if (previewPixels && previewPixels.length > 0) {
      previewPixels.forEach(pixelIndex => {
        const index = pixelIndex * 4;
        if (index < 0 || index + 3 >= previewData.data.length) return; // Boundary check
        previewData.data[index] = 255;
        previewData.data[index + 1] = 255;
        previewData.data[index + 2] = 0;
        previewData.data[index + 3] = 180;
      });
    }

    previewCtx.putImageData(previewData, 0, 0);
  }, [imageLoaded, isShiftPressed, currentGroupLayer]);

  // Effect to re-draw layers when `layers` state changes
  useEffect(() => {
    drawLayers(layers);
  }, [layers, drawLayers]);


  // Update preview on tolerance change
  useEffect(() => {
    if (mousePosition.x !== 0 || mousePosition.y !== 0) {
      const canvas = canvasRef.current;
      if (!canvas || !imageLoaded || currentTool !== 'magic_wand') return;

      const x = mousePosition.x;
      const y = mousePosition.y;

      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const segment = findSegmentAtPosition(x, y);

        if (segment) {
          setHoveredSegment(segment);
          setHoverPreview(null);
          drawLayers(layers, null, segment); // Re-draw with existing layers and hovered segment
        } else {
          setHoveredSegment(null);
          const previewPixels = floodFill(x, y, localTolerance);
          setHoverPreview(previewPixels);
          drawLayers(layers, previewPixels, null); // Re-draw with existing layers and new preview
        }
      }
    }
  }, [localTolerance, mousePosition, currentTool, imageLoaded, layers, floodFill, findSegmentAtPosition, drawLayers]);

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    setMousePosition({ x, y });

    if (currentTool === 'magic_wand' && x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const segment = findSegmentAtPosition(x, y);

      if (segment) {
        setHoveredSegment(segment);
        setHoverPreview(null);
        drawLayers(layers, null, segment);
      } else {
        setHoveredSegment(null);
        const previewPixels = floodFill(x, y, localTolerance);
        setHoverPreview(previewPixels);
        drawLayers(layers, previewPixels, null);
      }
    } else if (currentTool === 'eraser' && isErasing) {
      // Handle eraser dragging
      // (Implementation for eraser logic would go here)
    }
  }, [imageLoaded, currentTool, floodFill, localTolerance, layers, drawLayers, findSegmentAtPosition, isErasing]);

  // Handle mouse wheel for tolerance adjustment
  const handleWheel = useCallback((e) => {
    if (!imageLoaded || currentTool !== 'magic_wand') return;

    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;

    setLocalTolerance(prev => {
      const newVal = Math.max(0, Math.min(100, prev + delta));
      return newVal;
    });
  }, [imageLoaded, currentTool]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded || currentTool !== 'magic_wand') return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const segment = findSegmentAtPosition(x, y);

      // Normal click - select existing segment
      if (segment && !isCtrlPressed && !isShiftPressed) {
        setSelectedSegments(new Set([segment.layer.id]));
        return;
      }

      // Check if clicking on background to add as modifier
      const isBackgroundClick = !segment;

      // Create new segment
      const selectedPixels = floodFill(x, y, localTolerance);

      if (selectedPixels.length > 0) {
        const isExclusion = isAltPressed && isShiftPressed;

        // Shift - add to group
        if (isShiftPressed && !isAltPressed && currentGroupLayer) {
          selectedPixels.forEach(p => currentGroupLayer.pixels.add(p));
          currentGroupLayer.segments.push({
            pixels: selectedPixels,
            tolerance: localTolerance
          });

          setCurrentGroupLayer({ ...currentGroupLayer });

          addToHistory({
            type: 'add_segment_to_group',
            groupId: currentGroupLayer.id,
            segmentPixels: selectedPixels,
            tolerance: localTolerance
          });

          drawLayers(layers);
        }
        // Ctrl - create single segment
        else if (isCtrlPressed || (isAltPressed && isShiftPressed)) {
          const newLayer = {
            id: Date.now(),
            name: isExclusion ? `Exclusion ${layers.filter(l => l.isExclusion).length + 1}` : `Selection ${layers.filter(l => l.type === 'segment').length + 1}`,
            type: 'segment',
            pixels: selectedPixels,
            visible: true,
            showHighlight: true,
            opacity: 0.7,
            color: isExclusion ? `hsl(0, 70%, 50%)` : `hsl(${(layers.length * 60) % 360}, 70%, 50%)`,
            isExclusion: isExclusion,
            modifiers: []
          };

          const updatedLayers = [...layers, newLayer];
          setLayers(updatedLayers);

          addToHistory({
            type: 'create_layer',
            layer: newLayer
          });

          drawLayers(updatedLayers);
        }
        // No modifier - add as modifier to background if enabled
        else if (isBackgroundClick) {
          const backgroundLayer = layers.find(l => l.type === 'background');
          if (backgroundLayer) {
            const newModifier = {
              id: Date.now(),
              type: 'segment',
              pixels: selectedPixels,
              name: `Modifier ${backgroundLayer.modifiers.length + 1}`,
              visible: true,
              opacity: 0.7,
              color: `hsl(${(backgroundLayer.modifiers.length * 60) % 360}, 70%, 50%)`
            };

            const updatedLayers = layers.map(l =>
              l.id === 'background'
                ? { ...l, modifiers: [...l.modifiers, newModifier] }
                : l
            );

            setLayers(updatedLayers);

            addToHistory({
              type: 'add_modifier',
              layerId: 'background',
              modifier: newModifier
            });

            drawLayers(updatedLayers);
          }
        }
      }
    }

    setHoverPreview(null);
    setHoveredSegment(null);
  }, [imageLoaded, currentTool, floodFill, localTolerance, layers, drawLayers, isShiftPressed, isCtrlPressed, isAltPressed, currentGroupLayer, findSegmentAtPosition, addToHistory]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setCurrentImage(url);
      setLayers([{
        id: 'background',
        name: 'Background',
        type: 'background',
        visible: true,
        opacity: 1,
        pixels: null,
        modifiers: []
      }]);
    }
  };

  const toggleLayerVisibility = (layerId) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    setLayers(updatedLayers);

    // Add to history
    addToHistory({
      type: 'toggle_visibility',
      layerId: layerId
    });

    // drawLayers(updatedLayers); // This is now handled by the useEffect watching 'layers'
  };

  const toggleLayerHighlight = (layerId) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, showHighlight: !layer.showHighlight } : layer
    );
    setLayers(updatedLayers);
    // drawLayers(updatedLayers); // This is now handled by the useEffect watching 'layers'
  };

  const convertToExclusion = (layerId) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? {
        ...layer,
        isExclusion: !layer.isExclusion,
        color: !layer.isExclusion ? 'hsl(0, 70%, 50%)' : `hsl(${(layers.findIndex(l => l.id === layerId) * 60) % 360}, 70%, 50%)`
      } : layer
    );
    setLayers(updatedLayers);
    // drawLayers(updatedLayers); // This is now handled by the useEffect watching 'layers'
  };

  const convertToMask = (layerId, maskType = 'translucent') => {
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          modifiers: [...(layer.modifiers || []), {
            id: Date.now(), // Give modifier a unique ID for identification/undo
            type: 'mask',
            maskType: maskType,
            opacity: maskType === 'translucent' ? 0.5 : 1,
            color: maskType === 'color' ? [0, 0, 0] : null, // Default color for color mask
            enabled: true
          }]
        };
      }
      return layer;
    });
    setLayers(updatedLayers);

    // Add to history
    addToHistory({
      type: 'add_modifier',
      layerId: layerId,
      modifier: {
        id: Date.now(), // Make sure history entry modifier also has an ID
        type: 'mask',
        maskType: maskType,
        opacity: maskType === 'translucent' ? 0.5 : 1
      }
    });

    // drawLayers(updatedLayers); // This is now handled by the useEffect watching 'layers'
  };

  const fillLayerHoles = (layerId) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId && layer.pixels) {
        const pixels = Array.isArray(layer.pixels) ? layer.pixels : Array.from(layer.pixels);
        const filledPixels = fillHoles(pixels, canvas.width, canvas.height);
        return { ...layer, pixels: filledPixels };
      }
      return layer;
    });

    setLayers(updatedLayers);
    // drawLayers(updatedLayers); // This is now handled by the useEffect watching 'layers'
  };

  // Double-click delete handler
  const handleDeleteClick = (layerId) => {
    if (layerToDelete === layerId && deleteClickCount === 1) {
      // Second click - delete
      const layerToRemove = layers.find(l => l.id === layerId);
      if (!layerToRemove) return;

      const updatedLayers = layers.filter(layer => layer.id !== layerId);
      setLayers(updatedLayers);

      // Add to history
      addToHistory({
        type: 'delete_layer',
        layer: layerToRemove
      });

      // drawLayers(updatedLayers); // This is now handled by the useEffect watching 'layers'
      setLayerToDelete(null);
      setDeleteClickCount(0);

      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    } else {
      // First click - prepare
      setLayerToDelete(layerId);
      setDeleteClickCount(1);

      // Reset after 2 seconds
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
      deleteTimerRef.current = setTimeout(() => {
        setLayerToDelete(null);
        setDeleteClickCount(0);
      }, 2000);
    }
  };

  const clearAll = () => {
    setLayers([{
      id: 'background',
      name: 'Background',
      type: 'background',
      visible: true,
      opacity: 1,
      pixels: null,
      modifiers: []
    }]);
    setCurrentGroupLayer(null);
    setHistory([]);
    setHistoryIndex(-1);
    // The image will be re-drawn by the useEffect for currentImage/layers
    // No direct canvas manipulation needed here.
  };

  const toggleDrawer = (drawerName) => {
    setRightDrawers(prev => ({
      ...prev,
      [drawerName]: !prev[drawerName]
    }));
  };

  const toggleLayerExpansion = (layerId) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  // Load image
  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !currentImage) return;

    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const maxWidth = 1000;
      const maxHeight = 700;
      let width = img.width;
      let height = img.height;

      const scale = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      canvas.width = width;
      canvas.height = height;
      previewCanvas.width = width;
      previewCanvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      previewCtx.clearRect(0, 0, width, height);

      imageRef.current = img;
      setImageLoaded(true);

      // Add background layer with modifiers support
      if (layers.length === 0) {
        setLayers([{
          id: 'background',
          name: 'Background',
          type: 'background',
          visible: true,
          opacity: 1,
          pixels: null,
          modifiers: []
        }]);
      }
    };

    img.src = currentImage;
  }, [currentImage, layers.length]);

  // Handle keyboard modifiers and undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
        if (!currentGroupLayer && currentTool === 'magic_wand') {
          setCurrentGroupLayer({
            id: Date.now(),
            name: `Group ${layers.filter(l => l.type !== 'background').length + 1}`,
            type: 'segment',
            pixels: new Set(),
            segments: [],
            visible: true,
            showHighlight: true,
            opacity: 0.7,
            color: `hsl(${(layers.length * 60) % 360}, 70%, 50%)`,
            isExclusion: isAltPressed,
            modifiers: []
          });
        }
      }
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlPressed(true);
      if (e.key === 'Alt') setIsAltPressed(true);

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
        if (currentGroupLayer && currentGroupLayer.segments.length > 0) {
          const newLayer = {
            ...currentGroupLayer,
            pixels: Array.from(currentGroupLayer.pixels)
          };
          setLayers(prev => [...prev, newLayer]);

          addToHistory({
            type: 'create_group_layer',
            layer: newLayer,
            segmentCount: newLayer.segments.length
          });

          setCurrentGroupLayer(null);
        }
      }
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlPressed(false);
      if (e.key === 'Alt') setIsAltPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentGroupLayer, layers, currentTool, isAltPressed, addToHistory, handleUndo, handleRedo]);

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Left Settings Panel */}
      <div className="w-80 bg-slate-800 p-4 overflow-y-auto border-r border-slate-700">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Tools
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={currentTool === 'magic_wand' ? 'default' : 'outline'}
                onClick={() => setCurrentTool('magic_wand')}
                className="w-full"
              >
                <Wand2 className="w-4 h-4 mr-1" />
                Wand
              </Button>
              <Button
                variant={currentTool === 'eraser' ? 'default' : 'outline'}
                onClick={() => setCurrentTool('eraser')}
                className="w-full"
              >
                <Eraser className="w-4 h-4 mr-1" />
                Erase
              </Button>
              <Button
                variant={currentTool === 'healing' ? 'default' : 'outline'}
                onClick={() => setCurrentTool('healing')}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Heal
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {currentTool === 'magic_wand' && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Magic Wand Settings</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Base Tolerance</Label>
                    <Badge variant="outline" className="bg-slate-700 text-white">
                      {tolerance}
                    </Badge>
                  </div>
                  <Slider
                    value={[tolerance]}
                    onValueChange={([v]) => {
                      setTolerance(v);
                      setLocalTolerance(v);
                    }}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Scroll wheel to adjust live
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Live Tolerance</Label>
                    <Badge variant="outline" className="bg-yellow-900 text-yellow-300">
                      {localTolerance}
                    </Badge>
                  </div>
                  <Slider
                    value={[localTolerance]}
                    onValueChange={([v]) => setLocalTolerance(v)}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Contiguous</Label>
                  <Switch
                    checked={contiguous}
                    onCheckedChange={setContiguous}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Connectivity</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={connectivity === 4 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setConnectivity(4)}
                      className="flex-1"
                    >
                      4-Way
                    </Button>
                    <Button
                      variant={connectivity === 8 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setConnectivity(8)}
                      className="flex-1"
                    >
                      8-Way
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Hide All Segments</Label>
                    <p className="text-xs text-slate-400">Prevent overlaps</p>
                  </div>
                  <Switch
                    checked={hideAllSegments}
                    onCheckedChange={setHideAllSegments}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Auto Fill Holes</Label>
                    <p className="text-xs text-slate-400">Fill holes automatically</p>
                  </div>
                  <Switch
                    checked={autoFillHoles}
                    onCheckedChange={setAutoFillHoles}
                  />
                </div>
              </div>
            </div>
          )}

          {(currentTool === 'eraser' || currentTool === 'healing') && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                {currentTool === 'eraser' ? 'Eraser' : 'Healing'} Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Brush Size</Label>
                    <Badge variant="outline" className="bg-slate-700 text-white">
                      {eraserSize}px
                    </Badge>
                  </div>
                  <Slider
                    value={[eraserSize]}
                    onValueChange={([v]) => setEraserSize(v)}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Strength</Label>
                    <Badge variant="outline" className="bg-slate-700 text-white">
                      {eraserOpacity}%
                    </Badge>
                  </div>
                  <Slider
                    value={[eraserOpacity]}
                    onValueChange={([v]) => setEraserOpacity(v)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-slate-300">Edge Softness</Label>
                    <Badge variant="outline" className="bg-slate-700 text-white">
                      {eraserSoftness}%
                    </Badge>
                  </div>
                  <Slider
                    value={[eraserSoftness]}
                    onValueChange={([v]) => setEraserSoftness(v)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-slate-700" />

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Keyboard Shortcuts</h3>
            <div className="bg-slate-700/50 p-3 rounded-lg space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Click:</span>
                <span className="text-slate-400">Select segment</span>
              </div>
              <div className="flex justify-between">
                <span>Ctrl+Click:</span>
                <span className="text-slate-400">New segment</span>
              </div>
              <div className="flex justify-between">
                <span>Shift+Click:</span>
                <span className="text-slate-400">Group segments</span>
              </div>
              <div className="flex justify-between">
                <span>Alt+Shift+Click:</span>
                <span className="text-slate-400">Exclusion mask</span>
              </div>
              <div className="flex justify-between">
                <span>Scroll:</span>
                <span className="text-slate-400">Adjust tolerance</span>
              </div>
              <div className="flex justify-between">
                <span>Ctrl+Z:</span>
                <span className="text-slate-400">Undo</span>
              </div>
              <div className="flex justify-between">
                <span>Ctrl+Shift+Z:</span>
                <span className="text-slate-400">Redo</span>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Load Image</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="upload"
            />
            <label htmlFor="upload">
              <Button className="w-full cursor-pointer mb-2" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </span>
              </Button>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {sampleImages.map((img, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentImage(img.url);
                    setLayers([{
                      id: 'background',
                      name: 'Background',
                      type: 'background',
                      visible: true,
                      opacity: 1,
                      pixels: null,
                      modifiers: []
                    }]);
                  }}
                  className="text-xs"
                >
                  {img.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-slate-900">
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Advanced Segmentation Studio</h1>
              <div className="flex items-center gap-2 mt-1">
                {hoverPreview && (
                  <Badge variant="secondary" className="text-xs">
                    Preview: {hoverPreview.length} pixels @ {localTolerance}
                  </Badge>
                )}
                {hoveredSegment && (
                  <Badge variant="secondary" className="text-xs bg-white/20">
                    Hovering: {hoveredSegment.layer.name}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {mousePosition.x}, {mousePosition.y}
                </Badge>
                {isShiftPressed && <Badge className="text-xs bg-blue-500">Shift</Badge>}
                {isCtrlPressed && <Badge className="text-xs bg-green-500">Ctrl</Badge>}
                {isAltPressed && <Badge className="text-xs bg-red-500">Alt</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleDrawer('history')}>
                <History className="w-4 h-4 mr-2" />
                History ({history.length})
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
          <div className="relative inline-block">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onWheel={handleWheel}
              className="border-2 border-slate-600 cursor-crosshair"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <canvas
              ref={previewCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ maxWidth: '100%', height: 'auto', mixBlendMode: 'screen' }}
            />
          </div>

          {!imageLoaded && (
            <div className="text-center text-slate-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Upload or select an image to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Vertical Icon Bar */}
      <div className="w-14 bg-slate-800 border-l border-slate-700 flex flex-col items-center py-4 gap-2">
        <Button
          variant={rightDrawers.zoom ? 'default' : 'ghost'}
          size="icon"
          onClick={() => toggleDrawer('zoom')}
          className="w-10 h-10"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button
          variant={rightDrawers.preview ? 'default' : 'ghost'}
          size="icon"
          onClick={() => toggleDrawer('preview')}
          className="w-10 h-10"
        >
          <Grid className="w-5 h-5" />
        </Button>
        <Button
          variant={rightDrawers.history ? 'default' : 'ghost'}
          size="icon"
          onClick={() => toggleDrawer('history')}
          className="w-10 h-10"
        >
          <History className="w-5 h-5" />
        </Button>
      </div>

      {/* Right Zoom Drawer */}
      {rightDrawers.zoom && (
        <div className="w-80 bg-slate-800 p-4 border-l border-slate-700 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ZoomIn className="w-4 h-4" />
              Cursor Zoom
            </h3>
            <Button variant="ghost" size="icon" onClick={() => toggleDrawer('zoom')}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          <Card className="bg-slate-700 border-slate-600">
            <div className="p-4">
              <div className="aspect-square bg-slate-900 rounded-lg border border-slate-600 flex items-center justify-center">
                <p className="text-slate-400 text-sm">Pixel zoom preview</p>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Position:</span>
                  <span className="text-white">{mousePosition.x}, {mousePosition.y}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Right Preview Drawer */}
      {rightDrawers.preview && (
        <div className="w-80 bg-slate-800 p-4 border-l border-slate-700 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Segment Preview
            </h3>
            <Button variant="ghost" size="icon" onClick={() => toggleDrawer('preview')}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {hoverPreview && hoverPreview.length > 0 ? (
            <Card className="bg-slate-700 border-slate-600 mb-4">
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Pixels:</span>
                    <span className="text-white font-semibold">{hoverPreview.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Tolerance:</span>
                    <span className="text-yellow-400 font-semibold">{localTolerance}</span>
                  </div>
                  <Separator className="bg-slate-600" />
                  <div className="flex justify-between">
                    <span className="text-slate-300">Mode:</span>
                    <Badge variant="outline" className="text-xs">
                      {isShiftPressed ? 'Group' : isCtrlPressed ? 'New Layer' : 'Select'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ) : hoveredSegment ? (
            <Card className="bg-slate-700 border-slate-600 mb-4">
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Segment:</span>
                    <span className="text-white font-semibold">{hoveredSegment.layer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {hoveredSegment.layer.isExclusion ? 'Exclusion' : 'Normal'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-center text-slate-400 text-sm py-8">
              <Grid className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Hover over image</p>
            </div>
          )}
        </div>
      )}

      {/* Right History Drawer */}
      {rightDrawers.history && (
        <div className="w-80 bg-slate-800 p-4 border-l border-slate-700 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </h3>
            <Button variant="ghost" size="icon" onClick={() => toggleDrawer('history')}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {history.slice().reverse().map((action, idx) => {
              const actualIndex = history.length - 1 - idx;
              const isCurrentAction = actualIndex === historyIndex;

              return (
                <Card
                  key={action.id}
                  className={`p-3 ${
                    isCurrentAction
                      ? 'bg-blue-900/30 border-blue-500/50'
                      : 'bg-slate-700 border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">
                        {action.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </p>
                      {action.type === 'create_group_layer' && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {action.segmentCount} segments
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                      onClick={() => removeHistoryAction(action.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}

            {history.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-8">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No history yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Layers Panel */}
      <div className="w-80 bg-slate-800 p-4 overflow-y-auto border-l border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LayersIcon className="w-5 h-5" />
            Layers ({layers.length})
          </h2>
          {isShiftPressed && currentGroupLayer && (
            <Badge className="text-xs bg-blue-500">Group Active</Badge>
          )}
        </div>

        {isShiftPressed && currentGroupLayer && (
          <Card className="bg-blue-900/30 border-blue-500/50 mb-3">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded border border-blue-400"
                  style={{ backgroundColor: currentGroupLayer.color }}
                />
                <span className="text-sm text-blue-200 font-medium">
                  {currentGroupLayer.name} (Active)
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {currentGroupLayer.pixels.size} pixels • {currentGroupLayer.segments.length} segments
              </Badge>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {layers.map(layer => (
            <Card
              key={layer.id}
              className={`bg-slate-700 border-slate-600 ${
                selectedSegments.has(layer.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {layer.type === 'background' ? (
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded border border-slate-500"
                          style={{ backgroundColor: layer.color }}
                        />
                        {layer.isExclusion && (
                          <Ban className="w-3 h-3 text-red-400" />
                        )}
                      </>
                    )}
                    <span className="text-sm text-white font-medium truncate">
                      {layer.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="h-7 w-7 p-0"
                    >
                      {layer.visible ?
                        <Eye className="w-4 h-4 text-slate-300" /> :
                        <EyeOff className="w-4 h-4 text-slate-500" />
                      }
                    </Button>
                    {layer.type === 'segment' && (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 w-7 p-0 ${
                                  layerToDelete === layer.id && deleteClickCount === 1
                                    ? 'text-red-500 bg-red-500/20'
                                    : 'text-slate-400 hover:text-red-400'
                                }`}
                                onClick={() => handleDeleteClick(layer.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {layerToDelete === layer.id && deleteClickCount === 1
                                  ? 'Click again to delete'
                                  : 'Double-click to delete'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="w-4 h-4 text-slate-300" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => toggleLayerHighlight(layer.id)}>
                              <Palette className="w-4 h-4 mr-2" />
                              {layer.showHighlight !== false ? 'Hide' : 'Show'} Highlight
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => convertToExclusion(layer.id)}>
                              <Ban className="w-4 h-4 mr-2" />
                              {layer.isExclusion ? 'Convert to Normal' : 'Convert to Exclusion'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => convertToMask(layer.id, 'translucent')}>
                              <Square className="w-4 h-4 mr-2" />
                              Add Translucent Mask
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => convertToMask(layer.id, 'color')}>
                              <Palette className="w-4 h-4 mr-2" />
                              Add Color Mask
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => fillLayerHoles(layer.id)}>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Fill Holes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>

                {layer.type !== 'background' && (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {Array.isArray(layer.pixels) ? layer.pixels.length : layer.pixels?.size || 0} pixels
                    </Badge>

                    {layer.modifiers && layer.modifiers.length > 0 && (
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLayerExpansion(layer.id)}
                          className="h-6 w-full justify-start text-xs text-slate-300"
                        >
                          {expandedLayers.has(layer.id) ? (
                            <ChevronDown className="w-3 h-3 mr-1" />
                          ) : (
                            <ChevronRight className="w-3 h-3 mr-1" />
                          )}
                          Modifiers ({layer.modifiers.length})
                        </Button>

                        {expandedLayers.has(layer.id) && (
                          <div className="ml-4 mt-2 space-y-1">
                            {layer.modifiers.map((mod, idx) => (
                              <div key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                                <Square className="w-3 h-3" />
                                <span>{mod.maskType} mask</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Show modifiers on background layer */}
                {layer.type === 'background' && layer.modifiers && layer.modifiers.length > 0 && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLayerExpansion(layer.id)}
                      className="h-6 w-full justify-start text-xs text-slate-300"
                    >
                      {expandedLayers.has(layer.id) ? (
                        <ChevronDown className="w-3 h-3 mr-1" />
                      ) : (
                        <ChevronRight className="w-3 h-3 mr-1" />
                      )}
                      Modifiers ({layer.modifiers.length})
                    </Button>

                    {expandedLayers.has(layer.id) && (
                      <div className="ml-4 mt-2 space-y-2">
                        {layer.modifiers.map((mod, idx) => (
                          <Card key={mod.id || idx} className="bg-slate-600 border-slate-500 p-2">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded border border-slate-400"
                                  style={{ backgroundColor: mod.color ? `rgb(${mod.color[0]}, ${mod.color[1]}, ${mod.color[2]})` : 'transparent' }}
                                />
                                <span className="text-xs text-white font-medium">{mod.name || mod.maskType}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-slate-200"
                                onClick={() => toggleLayerVisibility(mod.id)} // This would need mod-specific visibility toggle
                              >
                                {mod.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </Button>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {mod.pixels?.length || 0} pixels
                            </Badge>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {layers.filter(l => l.type !== 'background').length === 0 && !isShiftPressed && (
          <div className="text-center text-slate-400 text-sm mt-8">
            <p>No segments yet</p>
            <p className="mt-2 text-xs">Ctrl+Click to create</p>
            <p className="text-xs">Shift+Click to group</p>
            <p className="text-xs">Alt+Shift+Click for exclusion</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Compare Component (`[Compare]`)

```javascript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GitCompare, 
  BarChart3, 
  Clock, 
  Target,
  TrendingUp,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';

const mockComparisonData = [
  {
    algorithm: 'Magic Wand',
    accuracy: 92.5,
    speed: 45,
    precision: 89.2,
    recall: 94.1,
    processing_time: 120
  },
  {
    algorithm: 'Magic Lasso',
    accuracy: 96.8,
    speed: 28,
    precision: 95.3,
    recall: 91.7,
    processing_time: 340
  },
  {
    algorithm: 'Quaternion Fusion',
    accuracy: 98.2,
    speed: 12,
    precision: 97.1,
    recall: 96.8,
    processing_time: 850
  }
];

const performanceData = [
  { metric: 'Accuracy', magic_wand: 92.5, magic_lasso: 96.8, quaternion: 98.2 },
  { metric: 'Precision', magic_wand: 89.2, magic_lasso: 95.3, quaternion: 97.1 },
  { metric: 'Recall', magic_wand: 94.1, magic_lasso: 91.7, quaternion: 96.8 },
  { metric: 'Speed (FPS)', magic_wand: 45, magic_lasso: 28, quaternion: 12 }
];

export default function Compare() {
  const [selectedMetric, setSelectedMetric] = useState('accuracy');
  const [selectedAlgorithms, setSelectedAlgorithms] = useState(['magic_wand', 'magic_lasso']);

  const getMetricColor = (algorithm) => {
    const colors = {
      magic_wand: '#3b82f6',
      magic_lasso: '#10b981', 
      quaternion: '#8b5cf6'
    };
    return colors[algorithm] || '#64748b';
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <GitCompare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Algorithm Comparison</h1>
                <p className="text-slate-600 mt-1">Compare segmentation algorithm performance and characteristics</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accuracy">Accuracy</SelectItem>
                  <SelectItem value="precision">Precision</SelectItem>
                  <SelectItem value="recall">Recall</SelectItem>
                  <SelectItem value="speed">Speed</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Algorithm Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockComparisonData.map((algo) => (
                <motion.div
                  key={algo.algorithm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-slate-800">{algo.algorithm}</span>
                        <Badge 
                          className={`${
                            algo.accuracy > 95 ? 'bg-green-100 text-green-800' :
                            algo.accuracy > 90 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {algo.accuracy}% ACC
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="text-slate-600">Precision</span>
                          <span className="font-semibold ml-auto">{algo.precision}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-slate-600">Recall</span>
                          <span className="font-semibold ml-auto">{algo.recall}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-500" />
                          <span className="text-slate-600">Speed</span>
                          <span className="font-semibold ml-auto">{algo.speed} FPS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-slate-600">Process</span>
                          <span className="font-semibold ml-auto">{algo.processing_time}ms</span>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Overall Performance</span>
                          <span>{Math.round((algo.accuracy + algo.precision + algo.recall) / 3)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(algo.accuracy + algo.precision + algo.recall) / 3}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Performance Charts */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800">Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="metrics" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="metrics">Metrics Comparison</TabsTrigger>
                    <TabsTrigger value="timeline">Performance Timeline</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="metrics" className="space-y-4">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="metric" 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              backdropFilter: 'blur(8px)'
                            }}
                          />
                          <Bar dataKey="magic_wand" fill="#3b82f6" name="Magic Wand" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="magic_lasso" fill="#10b981" name="Magic Lasso" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="quaternion" fill="#8b5cf6" name="Quaternion Fusion" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="timeline">
                    <div className="h-80 flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Performance timeline data will be available after running comparisons</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/60">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Best Accuracy</span>
                    <Badge className="bg-green-100 text-green-800">Quaternion (98.2%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Fastest Speed</span>
                    <Badge className="bg-blue-100 text-blue-800">Magic Wand (45 FPS)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Best Precision</span>
                    <Badge className="bg-purple-100 text-purple-800">Quaternion (97.1%)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Configuration */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
              <CardHeader>
                <CardTitle className="text-slate-800">Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Dataset</span>
                  <Select defaultValue="test_images">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test_images">Test Images (250)</SelectItem>
                      <SelectItem value="validation">Validation Set (500)</SelectItem>
                      <SelectItem value="custom">Custom Dataset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Image Size</span>
                  <Select defaultValue="800x600">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="800x600">800×600</SelectItem>
                      <SelectItem value="1024x768">1024×768</SelectItem>
                      <SelectItem value="1920x1080">1920×1080</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Run New Comparison
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Projects Component (`[Projects]`)

```javascript
import React, { useState, useEffect } from 'react';
import { Project } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  MoreHorizontal,
  Calendar,
  Layers,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectData = await Project.list('-created_date');
      setProjects(projectData);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
    setIsLoading(false);
  };

  const handleDeleteProject = async (projectId) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await Project.delete(projectId);
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
                <p className="text-slate-600 mt-1">Manage your segmentation projects and workflows</p>
              </div>
            </div>
            
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200/60"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse bg-white/50">
                  <CardHeader className="pb-4">
                    <div className="w-full h-32 bg-slate-200 rounded-lg"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                      <CardHeader className="pb-4 relative">
                        {/* Project Image */}
                        <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg overflow-hidden">
                          {project.image_url ? (
                            <img 
                              src={project.image_url} 
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Layers className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Project Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div>
                          <CardTitle className="text-lg text-slate-800 mb-2">
                            {project.name}
                          </CardTitle>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {project.description || 'No description available'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(project.created_date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            <span>{project.layers?.length || 0} layers</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {project.settings?.color_space && (
                            <Badge variant="secondary" className="text-xs">
                              {project.settings.color_space}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Segmentation
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* Empty State */}
          {!isLoading && filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderOpen className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {searchTerm ? 'No matching projects' : 'No projects yet'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md">
                {searchTerm 
                  ? `No projects match "${searchTerm}". Try a different search term.`
                  : 'Get started by creating your first segmentation project.'
                }
              </p>
              {!searchTerm && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Other Components (`[Components]`)

### CanvasWorkspace

```javascript
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, RotateCcw, Download, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CanvasWorkspace({ 
  currentTool, 
  image, 
  layers, 
  onLayerUpdate,
  toolSettings,
  onPixelSelect,
  onImageAnalysis 
}) {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [hoverPreview, setHoverPreview] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [lastDropTime, setLastDropTime] = useState(0);

  // Enhanced image loading with proper error handling and CORS
  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !image) return;

    setImageLoaded(false);
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      console.log('Image loaded successfully:', img.width, 'x', img.height);
      
      const maxWidth = 1200;
      const maxHeight = 800;
      let { width, height } = img;
      
      // Maintain aspect ratio while fitting within bounds
      const scaleX = maxWidth / width;
      const scaleY = maxHeight / height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
      
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      
      setCanvasSize({ width, height });
      canvas.width = width;
      canvas.height = height;
      previewCanvas.width = width;
      previewCanvas.height = height;
      
      // Clear and draw image
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Make preview canvas transparent
      previewCtx.clearRect(0, 0, width, height);
      
      imageRef.current = img;
      setImageLoaded(true);
      
      // Extract image data for analysis
      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        onImageAnalysis?.(imageData);
        console.log('Image analysis complete:', width, 'x', height, 'pixels');
      } catch (error) {
        console.warn('Could not extract image data for analysis:', error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      setImageLoaded(false);
    };
    
    // Handle CORS for external images
    if (image.startsWith('blob:') || image.startsWith('data:')) {
      img.src = image;
    } else {
      img.crossOrigin = "anonymous";
      img.src = image;
    }
  }, [image, onImageAnalysis]);

  // Enhanced layer rendering with proper compositing
  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas || !imageLoaded || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    
    // Clear and redraw base image
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.drawImage(imageRef.current, 0, 0, canvasSize.width, canvasSize.height);

    // Clear preview canvas
    previewCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw visible layers with proper blending
    layers.filter(layer => layer.visible && layer.maskData).forEach((layer, index) => {
      if (!layer.maskData || !Array.isArray(layer.maskData)) return;
      
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = canvasSize.width;
      layerCanvas.height = canvasSize.height;
      const layerCtx = layerCanvas.getContext('2d');
      
      // Create layer image data
      const layerImageData = layerCtx.createImageData(canvasSize.width, canvasSize.height);
      
      // Color coding for different layers
      const colors = [
        [0, 150, 255],    // Blue
        [255, 100, 100],  // Red  
        [100, 255, 100],  // Green
        [255, 255, 100],  // Yellow
        [255, 100, 255],  // Magenta
        [100, 255, 255],  // Cyan
      ];
      const color = colors[index % colors.length];
      
      layer.maskData.forEach(pixelIndex => {
        const x = pixelIndex % canvasSize.width;
        const y = Math.floor(pixelIndex / canvasSize.width);
        const dataIndex = (y * canvasSize.width + x) * 4;
        
        if (dataIndex >= 0 && dataIndex < layerImageData.data.length - 3) {
          layerImageData.data[dataIndex] = color[0];     // R
          layerImageData.data[dataIndex + 1] = color[1]; // G  
          layerImageData.data[dataIndex + 2] = color[2]; // B
          layerImageData.data[dataIndex + 3] = Math.round(layer.opacity * 128); // A
        }
      });
      
      layerCtx.putImageData(layerImageData, 0, 0);
      
      // Composite onto main canvas
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(layerCanvas, 0, 0);
    });
  }, [layers, imageLoaded, canvasSize]);

  // Enhanced color space conversions
  const convertColorSpace = useCallback((r, g, b, space) => {
    const rgbToHsv = (r, g, b) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let h = 0;
      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
      
      const s = max === 0 ? 0 : delta / max;
      const v = max;
      
      return [h, Math.round(s * 100), Math.round(v * 100)];
    };

    const rgbToLab = (r, g, b) => {
      // Simplified RGB to LAB conversion
      r /= 255; g /= 255; b /= 255;
      
      // sRGB to XYZ
      const toXYZ = (c) => c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
      r = toXYZ(r); g = toXYZ(g); b = toXYZ(b);
      
      let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
      let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
      let z = r * 0.0193 + g * 0.1192 + b * 0.9505;
      
      // XYZ to LAB
      x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
      y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
      z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
      
      const l = Math.max(0, 116 * y - 16);
      const a = 500 * (x - y);
      const bLab = 200 * (y - z);
      
      return [Math.round(l), Math.round(a), Math.round(bLab)];
    };

    const rgbToQuaternion = (r, g, b) => {
      // Quaternion representation: q = 0 + r*i + g*j + b*k
      const intensity = (r + g + b) / 3;
      return [intensity, r, g, b]; // [scalar, i, j, k]
    };

    switch (space) {
      case 'HSV':
        return rgbToHsv(r, g, b);
      case 'LAB':
        return rgbToLab(r, g, b);
      case 'Quaternion':
        return rgbToQuaternion(r, g, b);
      default:
        return [r, g, b];
    }
  }, []);

  const getPixelColor = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded || x < 0 || y < 0 || x >= canvasSize.width || y >= canvasSize.height) {
      return null;
    }
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    
    return {
      r: data[0],
      g: data[1], 
      b: data[2],
      a: data[3]
    };
  }, [canvasSize, imageLoaded]);

  // Simple polygon fill algorithm
  const polygonFill = useCallback((path, width, height) => {
    const selected = [];
    
    for (let y = 0; y < height; y++) {
      const intersections = [];
      
      // Find intersections with scan line
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        
        if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
          const x = p1.x + (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y);
          intersections.push(Math.round(x));
        }
      }
      
      // Sort intersections and fill between pairs
      intersections.sort((a, b) => a - b);
      
      for (let i = 0; i < intersections.length - 1; i += 2) {
        const startX = Math.max(0, intersections[i]);
        const endX = Math.min(width - 1, intersections[i + 1]);
        
        for (let x = startX; x <= endX; x++) {
          selected.push(y * width + x);
        }
      }
    }
    
    return selected;
  }, []);

  // Advanced flood fill with multiple color spaces and connectivity
  const floodFill = useCallback((startX, startY, tolerance, contiguous = true, colorSpace = 'RGB', connectivity = 4) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return [];

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvasSize.width, canvasSize.height);
    const data = imageData.data;
    const width = canvasSize.width;
    const height = canvasSize.height;
    
    const startColor = getPixelColor(startX, startY);
    if (!startColor) return [];

    const visited = new Set();
    const selected = [];
    const queue = [[startX, startY]];
    
    // Convert start color to selected color space
    const startConverted = convertColorSpace(startColor.r, startColor.g, startColor.b, colorSpace);
    
    const colorDistance = (c1, c2, space) => {
      switch (space) {
        case 'HSV':
          // Handle hue wraparound
          const hueDiff = Math.min(Math.abs(c1[0] - c2[0]), 360 - Math.abs(c1[0] - c2[0]));
          return Math.sqrt(hueDiff * hueDiff + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2);
        case 'LAB':
          return Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2);
        case 'Quaternion':
          // Quaternion distance (simplified)
          return Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2 + (c1[3] - c2[3]) ** 2);
        default:
          return Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2);
      }
    };

    // Get neighbors based on connectivity
    const getNeighbors = (x, y) => {
      const neighbors = [];
      const dirs4 = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      const dirs8 = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
      const directions = connectivity === 8 ? dirs8 : dirs4;
      
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          neighbors.push([nx, ny]);
        }
      }
      return neighbors;
    };

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      
      const currentColor = getPixelColor(x, y);
      if (!currentColor) continue;
      
      const currentConverted = convertColorSpace(currentColor.r, currentColor.g, currentColor.b, colorSpace);
      const distance = colorDistance(startConverted, currentConverted, colorSpace);
      
      if (distance <= tolerance) {
        visited.add(key);
        selected.push(y * width + x);
        
        if (contiguous) {
          // Add neighbors for flood fill
          const neighbors = getNeighbors(x, y);
          for (const [nx, ny] of neighbors) {
            const neighborKey = `${nx},${ny}`;
            if (!visited.has(neighborKey)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
    
    // If not contiguous, find all similar pixels in image
    if (!contiguous) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const key = `${x},${y}`;
          if (!visited.has(key)) {
            const currentColor = getPixelColor(x, y);
            if (currentColor) {
              const currentConverted = convertColorSpace(currentColor.r, currentColor.g, currentColor.b, colorSpace);
              if (colorDistance(startConverted, currentConverted, colorSpace) <= tolerance) {
                selected.push(y * width + x);
              }
            }
          }
        }
      }
    }

    return selected;
  }, [canvasSize, imageLoaded, getPixelColor, convertColorSpace]);

  // Enhanced hover preview for Magic Wand
  const handleMouseMove = useCallback((e) => {
    if (!imageLoaded || !currentTool) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);
    
    if (x < 0 || x >= canvasSize.width || y < 0 || y >= canvasSize.height) return;

    if (currentTool === 'magic_wand') {
      // Show hover preview
      const tolerance = toolSettings.magic_wand?.tolerance || 30;
      const contiguous = toolSettings.magic_wand?.contiguous !== false;
      const colorSpace = toolSettings.magic_wand?.color_space || 'RGB';
      const connectivity = toolSettings.magic_wand?.connectivity || 4;
      
      const selectedPixels = floodFill(x, y, tolerance, contiguous, colorSpace, connectivity);
      
      // Draw preview on preview canvas
      const previewCanvas = previewCanvasRef.current;
      const previewCtx = previewCanvas.getContext('2d');
      previewCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      if (selectedPixels.length > 0) {
        const previewImageData = previewCtx.createImageData(canvasSize.width, canvasSize.height);
        
        selectedPixels.forEach(pixelIndex => {
          const px = pixelIndex % canvasSize.width;
          const py = Math.floor(pixelIndex / canvasSize.width);
          const dataIndex = (py * canvasSize.width + px) * 4;
          
          if (dataIndex >= 0 && dataIndex < previewImageData.data.length - 3) {
            previewImageData.data[dataIndex] = 255;     // R
            previewImageData.data[dataIndex + 1] = 255; // G  
            previewImageData.data[dataIndex + 2] = 0;   // B (yellow preview)
            previewImageData.data[dataIndex + 3] = 100; // A (semi-transparent)
          }
        });
        
        previewCtx.putImageData(previewImageData, 0, 0);
        setHoverPreview(selectedPixels);
      }
    } else if (currentTool === 'magic_lasso' && isDrawing) {
      // Handle lasso drawing with intelligent path following
      setCurrentPath(prev => [...prev, { x, y }]);
      
      // Draw current path
      const previewCanvas = previewCanvasRef.current;
      const previewCtx = previewCanvas.getContext('2d');
      previewCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      if (currentPath.length > 1) {
        previewCtx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        previewCtx.lineWidth = 2;
        previewCtx.setLineDash([5, 5]);
        previewCtx.beginPath();
        previewCtx.moveTo(currentPath[0].x, currentPath[0].y);
        
        for (let i = 1; i < currentPath.length; i++) {
          previewCtx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        
        previewCtx.stroke();
        previewCtx.setLineDash([]);
      }
    }
  }, [imageLoaded, currentTool, toolSettings, zoom, canvasSize, floodFill, isDrawing, currentPath, setCurrentPath, setHoverPreview]);

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);

    if (x >= 0 && x < canvasSize.width && y >= 0 && y < canvasSize.height) {
      if (currentTool === 'magic_wand') {
        const tolerance = toolSettings.magic_wand?.tolerance || 30;
        const contiguous = toolSettings.magic_wand?.contiguous !== false;
        const colorSpace = toolSettings.magic_wand?.color_space || 'RGB';
        const connectivity = toolSettings.magic_wand?.connectivity || 4;
        
        const selectedPixels = floodFill(x, y, tolerance, contiguous, colorSpace, connectivity);
        onPixelSelect?.(x, y, currentTool, toolSettings, selectedPixels);
        
        // Clear hover preview
        const previewCanvas = previewCanvasRef.current;
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        setHoverPreview(null);
      }
    }
  }, [zoom, canvasSize, currentTool, toolSettings, onPixelSelect, imageLoaded, floodFill, setHoverPreview]);

  // Lasso drawing handlers
  const handleMouseDown = useCallback((e) => {
    if (currentTool === 'magic_lasso') {
      setIsDrawing(true);
      setCurrentPath([]);
      setNodes([]);
      setLastDropTime(Date.now());
    } else if (e.button === 1 || (e.button === 0 && e.metaKey)) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, [currentTool, setIsDrawing, setCurrentPath, setNodes, setLastDropTime, setIsPanning, setLastPanPoint]);

  const handleMouseUp = useCallback((e) => {
    if (currentTool === 'magic_lasso' && isDrawing) {
      setIsDrawing(false);
      
      if (currentPath.length > 2) {
        // Close the path and create selection
        const closedPath = [...currentPath, currentPath[0]];
        
        // For now, create a simple polygon fill
        const selectedPixels = polygonFill(closedPath, canvasSize.width, canvasSize.height);
        onPixelSelect?.(0, 0, currentTool, toolSettings, selectedPixels);
      }
      
      setCurrentPath([]);
      setNodes([]);
      
      // Clear preview
      const previewCanvas = previewCanvasRef.current;
      const previewCtx = previewCanvas.getContext('2d');
      previewCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    }
    
    setIsPanning(false);
  }, [currentTool, isDrawing, currentPath, canvasSize, onPixelSelect, toolSettings, polygonFill, setIsDrawing, setCurrentPath, setNodes, setIsPanning]);

  const handlePanMove = (e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200/20">
      {/* Canvas Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
              {Math.round(zoom * 100)}% • {canvasSize.width}×{canvasSize.height}
            </Badge>
            {imageLoaded && (
              <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/50">
                Image Loaded
              </Badge>
            )}
            {hoverPreview && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                {hoverPreview.length} pixels selected
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => handleZoom(-0.1)}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm" 
                onClick={() => handleZoom(0.1)}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetView}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {layers.map((layer, idx) => (
              layer.id !== 'bg' && (
                <motion.div
                  key={layer.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLayerUpdate?.(layer.id, 'toggleVisibility')}
                    className={`text-xs px-2 py-1 h-7 ${
                      layer.visible 
                        ? 'text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {layer.visible ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    {layer.name}
                  </Button>
                </motion.div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-900"
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handlePanMove(e);
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            cursor: isPanning ? 'grabbing' : currentTool === 'pan' ? 'grab' : 
                   currentTool === 'magic_wand' ? 'crosshair' : 
                   currentTool === 'magic_lasso' ? 'crosshair' : 'default'
          }}
        >
          {imageLoaded ? (
            <div className="relative">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="border border-slate-600/50 shadow-2xl bg-white rounded-lg"
                style={{ 
                  imageRendering: zoom > 2 ? 'pixelated' : 'auto'
                }}
              />
              {/* Preview overlay canvas */}
              <canvas
                ref={previewCanvasRef}
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{ 
                  imageRendering: zoom > 2 ? 'pixelated' : 'auto'
                }}
              />
            </div>
          ) : (
            <div className="w-96 h-64 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-4"></div>
                <p>Loading image...</p>
              </div>
            </div>
          )}
        </div>

        {/* Canvas Info Overlay */}
        <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 text-slate-300 text-sm">
          <div>Size: {canvasSize.width}×{canvasSize.height}</div>
          <div>Tool: {currentTool || 'None'}</div>
          <div>Layers: {layers.filter(l => l.visible).length}/{layers.length}</div>
          <div>Color Space: {toolSettings.magic_wand?.color_space || 'RGB'}</div>
        </div>

        {/* Tool-specific overlays */}
        {currentTool === 'magic_wand' && (
          <div className="absolute top-4 left-4 bg-blue-500/20 backdrop-blur-sm rounded-lg p-2 text-blue-300 text-sm">
            Tolerance: {toolSettings.magic_wand?.tolerance || 30} | 
            {toolSettings.magic_wand?.contiguous ? ' Connected' : ' Global'} | 
            {toolSettings.magic_wand?.connectivity || 4}-way
          </div>
        )}

        {currentTool === 'magic_lasso' && isDrawing && (
          <div className="absolute top-4 left-4 bg-yellow-500/20 backdrop-blur-sm rounded-lg p-2 text-yellow-300 text-sm">
            Path points: {currentPath.length} | 
            Elasticity: {toolSettings.magic_lasso?.elasticity || 0.5}
          </div>
        )}
      </div>
    </div>
  );
}
```

### ToolPanel

```javascript
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Wand2, 
  Lasso, 
  Move, 
  RotateCcw, 
  Undo2, 
  Redo2,
  Layers,
  Palette
} from "lucide-react";
import { motion } from "framer-motion";

const tools = [
  { 
    id: 'magic_wand', 
    name: 'Magic Wand', 
    icon: Wand2, 
    description: 'Select similar pixels',
    shortcut: 'W'
  },
  { 
    id: 'magic_lasso', 
    name: 'Magic Lasso', 
    icon: Lasso, 
    description: 'Intelligent edge tracing',
    shortcut: 'L' 
  },
  { 
    id: 'pan', 
    name: 'Pan', 
    icon: Move, 
    description: 'Move canvas view',
    shortcut: 'H'
  }
];

const actions = [
  { id: 'undo', icon: Undo2, name: 'Undo', shortcut: '⌘Z' },
  { id: 'redo', icon: Redo2, name: 'Redo', shortcut: '⌘⇧Z' },
  { id: 'reset', icon: RotateCcw, name: 'Reset', shortcut: 'R' }
];

export default function ToolPanel({ 
  currentTool, 
  onToolChange, 
  onAction,
  canUndo,
  canRedo 
}) {
  return (
    <Card className="w-20 bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl">
      <CardContent className="p-3 space-y-1">
        {/* Main Tools */}
        <div className="space-y-1">
          {tools.map((tool) => (
            <motion.div key={tool.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={currentTool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onToolChange(tool.id)}
                className={`w-full h-12 p-0 flex flex-col items-center justify-center gap-1 relative group ${
                  currentTool === tool.id 
                    ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/80'
                }`}
              >
                <tool.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tool.shortcut}</span>
                
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-slate-300 text-xs">{tool.description}</div>
                  <div className="text-slate-400 text-xs mt-1">Press {tool.shortcut}</div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        <Separator className="bg-slate-200/60" />

        {/* Actions */}
        <div className="space-y-1">
          {actions.map((action) => (
            <motion.div key={action.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction(action.id)}
                disabled={
                  (action.id === 'undo' && !canUndo) || 
                  (action.id === 'redo' && !canRedo)
                }
                className="w-full h-10 p-0 flex flex-col items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 disabled:opacity-30"
              >
                <action.icon className="w-4 h-4" />
                <span className="text-xs">{action.shortcut}</span>
              </Button>
            </motion.div>
          ))}
        </div>

        <Separator className="bg-slate-200/60" />

        {/* Status Indicators */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-col items-center gap-1">
            <Layers className="w-4 h-4 text-slate-400" />
            <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-slate-50 text-slate-600 border-slate-200">
              3
            </Badge>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Palette className="w-4 h-4 text-slate-400" />
            <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-slate-50 text-slate-600 border-slate-200">
              RGB
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### SettingsPanel

```javascript
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Wand2, 
  Lasso, 
  Settings2, 
  Palette,
  Target,
  Layers,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPanel({ 
  currentTool, 
  settings, 
  onSettingsChange,
  presets,
  onPresetApply 
}) {
  const [expandedSections, setExpandedSections] = useState({
    tool_settings: true,
    color_space: true,
    presets: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderMagicWandSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">Tolerance</Label>
          <Badge variant="outline" className="text-xs bg-slate-50">
            {settings.magic_wand?.tolerance || 30}
          </Badge>
        </div>
        <Slider
          value={[settings.magic_wand?.tolerance || 30]}
          onValueChange={(value) => onSettingsChange('magic_wand', 'tolerance', value[0])}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>Strict</span>
          <span>Loose</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Connectivity</Label>
        <Select 
          value={String(settings.magic_wand?.connectivity || 4)}
          onValueChange={(value) => onSettingsChange('magic_wand', 'connectivity', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4-connected</SelectItem>
            <SelectItem value="8">8-connected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700">Contiguous</Label>
        <Switch 
          checked={settings.magic_wand?.contiguous !== false}
          onCheckedChange={(checked) => onSettingsChange('magic_wand', 'contiguous', checked)}
        />
      </div>
    </div>
  );

  const renderMagicLassoSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">Elasticity</Label>
          <Badge variant="outline" className="text-xs bg-slate-50">
            {(settings.magic_lasso?.elasticity || 0.5).toFixed(1)}
          </Badge>
        </div>
        <Slider
          value={[settings.magic_lasso?.elasticity || 0.5]}
          onValueChange={(value) => onSettingsChange('magic_lasso', 'elasticity', value[0])}
          max={1}
          min={0}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">Node Drop Time</Label>
          <Badge variant="outline" className="text-xs bg-slate-50">
            {settings.magic_lasso?.node_drop_time || 200}ms
          </Badge>
        </div>
        <Slider
          value={[settings.magic_lasso?.node_drop_time || 200]}
          onValueChange={(value) => onSettingsChange('magic_lasso', 'node_drop_time', value[0])}
          max={1000}
          min={50}
          step={50}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Cost Function</Label>
        <Select 
          value={settings.magic_lasso?.cost_function || "sobel"}
          onValueChange={(value) => onSettingsChange('magic_lasso', 'cost_function', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sobel">Sobel Edge</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="laplacian">Laplacian</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <Card className="w-80 bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl max-h-full overflow-hidden flex flex-col">
      <CardHeader className="pb-4 border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Settings2 className="w-5 h-5 text-blue-600" />
          Tool Settings
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Current Tool Settings */}
          <motion.div 
            initial={false}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <button
              onClick={() => toggleSection('tool_settings')}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                {currentTool === 'magic_wand' ? (
                  <Wand2 className="w-4 h-4 text-blue-600" />
                ) : currentTool === 'magic_lasso' ? (
                  <Lasso className="w-4 h-4 text-blue-600" />
                ) : (
                  <Target className="w-4 h-4 text-slate-400" />
                )}
                <span className="font-medium text-slate-800">
                  {currentTool === 'magic_wand' ? 'Magic Wand' :
                   currentTool === 'magic_lasso' ? 'Magic Lasso' : 'Select a tool'}
                </span>
              </div>
              {expandedSections.tool_settings ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.tool_settings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {currentTool === 'magic_wand' && renderMagicWandSettings()}
                  {currentTool === 'magic_lasso' && renderMagicLassoSettings()}
                  {!currentTool && (
                    <div className="text-center py-8 text-slate-500">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Select a tool to configure settings</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <Separator />

          {/* Color Space Settings */}
          <div>
            <button
              onClick={() => toggleSection('color_space')}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-slate-800">Color Space</span>
              </div>
              {expandedSections.color_space ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.color_space && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-3"
                >
                  <Select 
                    value={settings.color_space || "RGB"}
                    onValueChange={(value) => onSettingsChange('global', 'color_space', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RGB">RGB</SelectItem>
                      <SelectItem value="HSV">HSV</SelectItem>
                      <SelectItem value="LAB">LAB</SelectItem>
                      <SelectItem value="Quaternion">Quaternion</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Presets */}
          <div>
            <button
              onClick={() => toggleSection('presets')}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-green-600" />
                <span className="font-medium text-slate-800">Quick Presets</span>
              </div>
              {expandedSections.presets ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.presets && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-2"
                >
                  {presets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      onClick={() => onPresetApply(preset)}
                      className="w-full justify-start text-left bg-slate-50/50 hover:bg-slate-100/80 border-slate-200/60"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-slate-800">{preset.name}</span>
                        <span className="text-xs text-slate-500 capitalize">
                          {preset.use_case.replace('_', ' ')}
                        </span>
                      </div>
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### AssetsPanel

```javascript
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Image as ImageIcon, 
  Upload, 
  Eye,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Sample images that actually work
const sampleImages = [
  {
    id: 'portrait1',
    name: 'Portrait Sample',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=face',
    category: 'portrait',
    description: 'Professional portrait for segmentation testing'
  },
  {
    id: 'landscape1', 
    name: 'Mountain Landscape',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    category: 'landscape',
    description: 'Natural landscape with multiple regions'
  },
  {
    id: 'object1',
    name: 'Red Sneakers',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop',
    category: 'object',
    description: 'Product with clean background'
  },
  {
    id: 'nature1',
    name: 'Flower Close-up',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop',
    category: 'nature',
    description: 'High detail flower macro'
  },
  {
    id: 'texture1',
    name: 'Wood Grain',
    url: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=800&h=600&fit=crop',
    category: 'texture',
    description: 'Complex wood texture patterns'
  },
  {
    id: 'medical1',
    name: 'Medical Equipment',
    url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
    category: 'medical',
    description: 'Medical imaging sample'
  }
];

export default function AssetPanel({ onImageSelect, isOpen, onToggle }) {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = (image) => {
    console.log('Asset panel selecting image:', image.name, image.url);
    onImageSelect(image.url, image.name);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          continue;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          continue;
        }

        const localUrl = URL.createObjectURL(file);
        
        const newImage = {
          id: `upload_${Date.now()}_${Math.random()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: localUrl,
          category: 'uploaded',
          description: `Uploaded: ${file.name}`,
          file: file
        };

        setUploadedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }

    setIsUploading(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 h-[60vh] z-50"
      >
        <Card className="h-full bg-white/95 backdrop-blur-sm border-t border-slate-200/60 shadow-2xl rounded-t-2xl">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                Asset Library
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                  {sampleImages.length + uploadedImages.length} items
                </Badge>
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 overflow-hidden h-full">
            <Tabs defaultValue="samples" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="samples">
                  Sample Images ({sampleImages.length})
                </TabsTrigger>
                <TabsTrigger value="uploaded">
                  Uploaded ({uploadedImages.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="samples" className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-6 gap-4">
                  {sampleImages.map(image => (
                    <motion.div
                      key={image.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative group cursor-pointer"
                      onClick={() => handleImageSelect(image)}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-700 truncate">{image.name}</p>
                        <Badge variant="outline" className="text-xs capitalize mt-1">
                          {image.category}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="uploaded" className="flex-1 flex flex-col">
                {/* Upload Area */}
                <div className="mb-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="asset-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="asset-upload">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-600 font-medium">
                        {isUploading ? 'Uploading...' : 'Click to upload images'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Uploaded Images */}
                <div className="flex-1 grid grid-cols-6 gap-4 overflow-y-auto">
                  {uploadedImages.map(image => (
                    <motion.div
                      key={image.id}
                      whileHover={{ scale: 1.05 }}
                      className="relative group cursor-pointer"
                      onClick={() => handleImageSelect(image)}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium text-slate-700 truncate mt-1">{image.name}</p>
                    </motion.div>
                  ))}
                </div>
                
                {uploadedImages.length === 0 && !isUploading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                    <p>No uploaded images yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
```

### AdvancedAssetsPanel

```javascript
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Image as ImageIcon, 
  Upload, 
  Search,
  Grid3x3,
  List,
  X,
  Eye,
  Download,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Advanced sample images with metadata
const advancedSampleImages = [
  {
    id: 'portrait_advanced',
    name: 'Professional Portrait',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop&crop=face',
    category: 'portrait',
    description: 'High-quality portrait for advanced segmentation testing',
    complexity: 'medium',
    recommendedTool: 'magic_wand',
    size: '1200x800',
    colorSpace: 'sRGB'
  },
  {
    id: 'landscape_mountain',
    name: 'Mountain Landscape',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    category: 'landscape',
    description: 'Complex natural landscape with multiple regions',
    complexity: 'high',
    recommendedTool: 'magic_lasso',
    size: '1200x800',
    colorSpace: 'sRGB'
  },
  {
    id: 'medical_scan',
    name: 'Medical Equipment',
    url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=800&fit=crop',
    category: 'medical',
    description: 'Medical imaging sample for precision segmentation',
    complexity: 'high',
    recommendedTool: 'magic_wand',
    size: '1200x800',
    colorSpace: 'sRGB'
  },
  {
    id: 'texture_wood',
    name: 'Wood Grain Texture',
    url: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=1200&h=800&fit=crop',
    category: 'texture',
    description: 'Complex wood texture for texture analysis testing',
    complexity: 'very_high',
    recommendedTool: 'magic_wand',
    size: '1200x800',
    colorSpace: 'sRGB'
  },
  {
    id: 'product_sneakers',
    name: 'Product Photography',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=800&fit=crop',
    category: 'product',
    description: 'Clean product shot with defined edges',
    complexity: 'low',
    recommendedTool: 'magic_wand',
    size: '1200x800',
    colorSpace: 'sRGB'
  },
  {
    id: 'nature_flower',
    name: 'Flower Macro',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop',
    category: 'nature',
    description: 'High detail flower macro photography',
    complexity: 'medium',
    recommendedTool: 'magic_lasso',
    size: '1200x800',
    colorSpace: 'sRGB'
  }
];

const categories = [
  { id: 'all', name: 'All Images', icon: ImageIcon },
  { id: 'portrait', name: 'Portraits', icon: ImageIcon },
  { id: 'landscape', name: 'Landscapes', icon: ImageIcon },
  { id: 'medical', name: 'Medical', icon: ImageIcon },
  { id: 'texture', name: 'Textures', icon: ImageIcon },
  { id: 'product', name: 'Products', icon: ImageIcon },
  { id: 'nature', name: 'Nature', icon: ImageIcon }
];

export default function AdvancedAssetPanel({ 
  onImageSelect, 
  isOpen, 
  onToggle 
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const filteredImages = advancedSampleImages.filter(img => {
    const categoryMatch = selectedCategory === 'all' || img.category === selectedCategory;
    const searchMatch = img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       img.description.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleImageSelect = (image) => {
    console.log('Advanced asset selection:', image.name, image);
    onImageSelect(image.url, image.name);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) continue; // 10MB limit

        const url = URL.createObjectURL(file);
        const newImage = {
          id: `upload_${Date.now()}_${Math.random()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: url,
          category: 'uploaded',
          description: `Uploaded: ${file.name}`,
          complexity: 'unknown',
          recommendedTool: 'magic_wand',
          size: 'unknown',
          colorSpace: 'sRGB',
          file: file
        };

        setUploadedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }

    setIsUploading(false);
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'very_high': return 'text-red-400 bg-red-500/20 border-red-500/50';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
    }
  };

  const getToolColor = (tool) => {
    switch (tool) {
      case 'magic_wand': return 'text-blue-400 bg-blue-500/20';
      case 'magic_lasso': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-6xl h-[80vh] bg-slate-800/95 backdrop-blur-sm border-slate-700/60 shadow-2xl">
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Advanced Asset Library</h2>
                  <p className="text-sm text-slate-400">Professional image collection for segmentation testing</p>
                </div>
              </CardTitle>
              <Button
                variant="ghost"
                onClick={onToggle}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search and Controls */}
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search images by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-slate-300"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="text-slate-300"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="text-slate-300"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 h-full overflow-hidden">
            <div className="flex h-full">
              {/* Category Sidebar */}
              <div className="w-64 border-r border-slate-700/50 p-4 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full justify-start ${
                        selectedCategory === category.id
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                      }`}
                    >
                      <category.icon className="w-4 h-4 mr-2" />
                      {category.name}
                      <Badge 
                        variant="outline" 
                        className="ml-auto text-xs bg-slate-700/50 border-slate-600"
                      >
                        {category.id === 'all' 
                          ? advancedSampleImages.length 
                          : advancedSampleImages.filter(img => img.category === category.id).length
                        }
                      </Badge>
                    </Button>
                  ))}
                </div>

                {/* Upload Section */}
                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="advanced-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="advanced-upload">
                    <Button
                      className="w-full cursor-pointer bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-slate-300"
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload Images'}
                    </Button>
                  </label>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <Tabs value="gallery" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-700/50">
                    <TabsTrigger value="gallery">Sample Gallery</TabsTrigger>
                    <TabsTrigger value="uploaded">Uploaded ({uploadedImages.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="gallery">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-3 gap-4">
                        {filteredImages.map((image) => (
                          <motion.div
                            key={image.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group cursor-pointer"
                            onClick={() => handleImageSelect(image)}
                          >
                            <Card className="bg-slate-700/30 border-slate-600/50 overflow-hidden hover:border-blue-500/50 transition-all duration-200">
                              <div className="aspect-video relative overflow-hidden">
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-8 h-8 text-white" />
                                </div>
                                <div className="absolute top-2 right-2">
                                  <Badge className={getComplexityColor(image.complexity)}>
                                    {image.complexity.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                              <CardContent className="p-3">
                                <h4 className="font-semibold text-slate-200 text-sm mb-1">{image.name}</h4>
                                <p className="text-xs text-slate-400 mb-2 line-clamp-2">{image.description}</p>
                                <div className="flex items-center justify-between">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getToolColor(image.recommendedTool)}`}
                                  >
                                    {image.recommendedTool.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-slate-500">{image.size}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredImages.map((image) => (
                          <motion.div
                            key={image.id}
                            whileHover={{ scale: 1.01 }}
                            className="group cursor-pointer"
                            onClick={() => handleImageSelect(image)}
                          >
                            <Card className="bg-slate-700/30 border-slate-600/50 hover:border-blue-500/50 transition-all duration-200">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                      src={image.url}
                                      alt={image.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-200 mb-1">{image.name}</h4>
                                    <p className="text-sm text-slate-400 mb-2">{image.description}</p>
                                    <div className="flex items-center gap-2">
                                      <Badge className={`text-xs ${getComplexityColor(image.complexity)}`}>
                                        {image.complexity.replace('_', ' ')}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${getToolColor(image.recommendedTool)}`}
                                      >
                                        {image.recommendedTool.replace('_', ' ')}
                                      </Badge>
                                      <span className="text-xs text-slate-500">{image.size}</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-200"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="uploaded">
                    {uploadedImages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Upload className="w-16 h-16 mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No uploaded images</h3>
                        <p className="text-center max-w-md">
                          Upload your own images to test advanced segmentation algorithms with your content.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {uploadedImages.map((image) => (
                          <motion.div
                            key={image.id}
                            whileHover={{ scale: 1.02 }}
                            className="group cursor-pointer"
                            onClick={() => handleImageSelect(image)}
                          >
                            <Card className="bg-slate-700/30 border-slate-600/50 overflow-hidden hover:border-green-500/50 transition-all duration-200">
                              <div className="aspect-video relative overflow-hidden">
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-8 h-8 text-white" />
                                </div>
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                                    Uploaded
                                  </Badge>
                                </div>
                              </div>
                              <CardContent className="p-3">
                                <h4 className="font-semibold text-slate-200 text-sm mb-1">{image.name}</h4>
                                <p className="text-xs text-slate-400 mb-2">{image.description}</p>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs bg-slate-700/50">
                                    Custom
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUploadedImages(prev => prev.filter(img => img.id !== image.id));
                                    }}
                                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

[analytics]
[AnalyticsPanel]
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Grid, 
  Activity, 
  Download,
  Maximize2,
  Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HistogramChart from './HistogramChart';
import PixelGrid from './PixelGrid';
import ConfidenceMap from './ConfidenceMap';

export default function AnalyticsPanel({ 
  isExpanded, 
  onToggleExpand,
  imageData,
  segmentationData 
}) {
  const [activeTab, setActiveTab] = useState('histogram');

  const getImageStats = () => {
    if (!imageData) return null;
    
    const { data, width, height } = imageData;
    const totalPixels = width * height;
    let rSum = 0, gSum = 0, bSum = 0;
    let rMin = 255, gMin = 255, bMin = 255;
    let rMax = 0, gMax = 0, bMax = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      rSum += r; gSum += g; bSum += b;
      rMin = Math.min(rMin, r); gMin = Math.min(gMin, g); bMin = Math.min(bMin, b);
      rMax = Math.max(rMax, r); gMax = Math.max(gMax, g); bMax = Math.max(bMax, b);
    }
    
    return {
      totalPixels,
      avgColor: {
        r: Math.round(rSum / totalPixels),
        g: Math.round(gSum / totalPixels),
        b: Math.round(bSum / totalPixels)
      },
      minColor: { r: rMin, g: gMin, b: bMin },
      maxColor: { r: rMax, g: gMax, b: bMax }
    };
  };

  const stats = getImageStats();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: isExpanded ? 400 : 60 }}
        animate={{ height: isExpanded ? 400 : 60 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white/90 backdrop-blur-sm border-t border-slate-200/60 shadow-lg"
      >
        {/* Panel Header */}
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Analytics Dashboard</h3>
              <p className="text-xs text-slate-500">
                {stats ? `${stats.totalPixels.toLocaleString()} pixels analyzed` : 'No image data'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stats && (
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                Avg: RGB({stats.avgColor.r}, {stats.avgColor.g}, {stats.avgColor.b})
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/80"
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Panel Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex-1 overflow-hidden"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="mx-6 mt-4 bg-slate-100/80 border border-slate-200/60">
                  <TabsTrigger value="histogram" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Histogram
                  </TabsTrigger>
                  <TabsTrigger value="pixel_grid" className="flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    Pixel Grid
                  </TabsTrigger>
                  <TabsTrigger value="confidence" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Segmentation
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden p-6">
                  <TabsContent value="histogram" className="h-full m-0">
                    <Card className="h-full border-slate-200/60 bg-white/70 backdrop-blur-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-slate-800 flex items-center justify-between">
                          Color Distribution
                          <Button variant="ghost" size="sm" className="text-slate-500">
                            <Download className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <HistogramChart imageData={imageData} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="pixel_grid" className="h-full m-0">
                    <Card className="h-full border-slate-200/60 bg-white/70 backdrop-blur-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-slate-800">Pixel Analysis Grid</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <PixelGrid imageData={imageData} segmentData={segmentationData} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="confidence" className="h-full m-0">
                    <Card className="h-full border-slate-200/60 bg-white/70 backdrop-blur-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-slate-800">Segmentation Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ConfidenceMap segmentationData={segmentationData} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

[HistogramChart]
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function HistogramChart({ imageData }) {
  const histogramData = useMemo(() => {
    if (!imageData || !imageData.data) return [];
    
    const { data } = imageData;
    const rHist = new Array(256).fill(0);
    const gHist = new Array(256).fill(0);
    const bHist = new Array(256).fill(0);
    
    // Calculate histogram
    for (let i = 0; i < data.length; i += 4) {
      rHist[data[i]]++;
      gHist[data[i + 1]]++;
      bHist[data[i + 2]]++;
    }
    
    // Group into bins for display
    const bins = [];
    const binSize = 16; // Group every 16 values
    
    for (let i = 0; i < 256; i += binSize) {
      let rSum = 0, gSum = 0, bSum = 0;
      
      for (let j = i; j < Math.min(i + binSize, 256); j++) {
        rSum += rHist[j];
        gSum += gHist[j];
        bSum += bHist[j];
      }
      
      bins.push({
        bin: `${i}-${Math.min(i + binSize - 1, 255)}`,
        red: rSum,
        green: gSum,
        blue: bSum,
        value: Math.max(rSum, gSum, bSum)
      });
    }
    
    return bins;
  }, [imageData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="font-medium text-slate-800 mb-2">Range: {label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="capitalize text-slate-600">{entry.dataKey}: {entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  if (!imageData) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No image data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="bin" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="red" stackId="colors" fill="#ef4444" opacity={0.8} radius={[0, 0, 0, 0]} />
          <Bar dataKey="green" stackId="colors" fill="#22c55e" opacity={0.8} radius={[0, 0, 0, 0]} />
          <Bar dataKey="blue" stackId="colors" fill="#3b82f6" opacity={0.8} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

[PixelGrid]
import React, { useMemo } from 'react';

export default function PixelGrid({ imageData, segmentData }) {
  const gridData = useMemo(() => {
    if (!imageData) return [];
    
    const { data, width, height } = imageData;
    const gridSize = 20;
    const stepX = Math.floor(width / gridSize);
    const stepY = Math.floor(height / gridSize);
    const gridCells = [];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const pixelX = Math.min(x * stepX, width - 1);
        const pixelY = Math.min(y * stepY, height - 1);
        const index = (pixelY * width + pixelX) * 4;
        
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Check if this area is segmented
        const isSegmented = segmentData && Array.isArray(segmentData) && 
          segmentData.some(pixelIndex => {
            const segX = pixelIndex % width;
            const segY = Math.floor(pixelIndex / width);
            return Math.abs(segX - pixelX) < stepX / 2 && Math.abs(segY - pixelY) < stepY / 2;
          });
        
        gridCells.push({
          x,
          y,
          color: `rgb(${r}, ${g}, ${b})`,
          isSegmented
        });
      }
    }
    
    return gridCells;
  }, [imageData, segmentData]);

  const cellSize = 12;

  if (!imageData) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-200 rounded mx-auto mb-2"></div>
          <p>No image data for pixel analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full flex flex-col items-center justify-center">
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div 
          className="grid gap-1"
          style={{ 
            gridTemplateColumns: `repeat(20, ${cellSize}px)`,
            gridTemplateRows: `repeat(20, ${cellSize}px)`
          }}
        >
          {gridData.map((cell, i) => (
            <div
              key={i}
              className={`rounded-sm transition-all duration-200 hover:scale-110 border ${
                cell.isSegmented ? 'border-2 border-blue-500 shadow-md' : 'border-slate-200'
              }`}
              style={{ 
                width: `${cellSize}px`, 
                height: `${cellSize}px`,
                backgroundColor: cell.color
              }}
              title={`Pixel (${cell.x}, ${cell.y}): ${cell.isSegmented ? 'Segmented' : 'Background'}`}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-500 rounded bg-white"></div>
            <span>Segmented</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-slate-200 rounded bg-white"></div>
            <span>Background</span>
          </div>
        </div>
      </div>
    </div>
  );
}

[ConfidenceMap]
import React, { useMemo } from 'react';

export default function ConfidenceMap({ segmentationData }) {
  const confidenceData = useMemo(() => {
    if (!segmentationData || !Array.isArray(segmentationData)) {
      // Generate sample confidence data
      return Array.from({ length: 100 }).map((_, i) => ({
        x: (i % 10) * 30,
        y: Math.floor(i / 10) * 25,
        confidence: Math.random()
      }));
    }
    
    // Calculate confidence based on segmentation density
    const points = [];
    const gridSize = 10;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = j * 30;
        const y = i * 25;
        
        // Calculate local density of segmented pixels
        const localSegments = segmentationData.filter(pixelIndex => {
          // This is simplified - in real implementation would use actual coordinates
          const px = pixelIndex % 800; // Assume 800px width
          const py = Math.floor(pixelIndex / 800);
          return Math.abs(px - x * 8) < 40 && Math.abs(py - y * 8) < 40;
        });
        
        const confidence = Math.min(localSegments.length / 100, 1);
        
        points.push({ x, y, confidence });
      }
    }
    
    return points;
  }, [segmentationData]);

  const getColorForConfidence = (confidence) => {
    if (confidence > 0.8) return '#22c55e'; // Green - high confidence
    if (confidence > 0.6) return '#eab308'; // Yellow - medium confidence
    if (confidence > 0.4) return '#f97316'; // Orange - low confidence
    return '#ef4444'; // Red - very low confidence
  };

  const avgConfidence = useMemo(() => {
    if (confidenceData.length === 0) return 0;
    return confidenceData.reduce((sum, point) => sum + point.confidence, 0) / confidenceData.length;
  }, [confidenceData]);

  return (
    <div className="h-64 w-full flex flex-col">
      <div className="flex-1 relative bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 300 250" className="absolute inset-0">
          {confidenceData.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="8"
              fill={getColorForConfidence(point.confidence)}
              opacity="0.7"
              className="hover:opacity-100 transition-opacity cursor-pointer"
            >
              <title>Confidence: {(point.confidence * 100).toFixed(1)}%</title>
            </circle>
          ))}
        </svg>
        
        {/* Confidence Stats Overlay */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
          <div className="text-slate-600">
            Avg Confidence: <span className="font-semibold">{(avgConfidence * 100).toFixed(1)}%</span>
          </div>
          <div className="text-slate-600">
            Data Points: <span className="font-semibold">{confidenceData.length}</span>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>High (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Medium (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Low (40-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Very Low (&lt;40%)</span>
        </div>
      </div>
    </div>
  );
}

[AdvancedAnalyticsPanel]

import React, { useState } from 'react';
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
  Layers
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

export default function AdvancedAnalyticsPanel({ 
  imageData,
  segmentationData,
  layers,
  performanceMetrics,
  isOpen,
  onToggle
}) {
  const [activeTab, setActiveTab] = useState('overview');

  // Generate advanced analytics data
  const getImageStats = () => {
    if (!imageData) return null;
    
    const { data, width, height } = imageData;
    const totalPixels = width * height;
    let rSum = 0, gSum = 0, bSum = 0;
    let rMin = 255, gMin = 255, bMin = 255;
    let rMax = 0, gMax = 0, bMax = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      rSum += r; gSum += g; bSum += b;
      rMin = Math.min(rMin, r); gMin = Math.min(gMin, g); bMin = Math.min(bMin, b);
      rMax = Math.max(rMax, r); gMax = Math.max(gMax, g); bMax = Math.max(bMax, b);
    }
    
    return {
      totalPixels,
      avgColor: {
        r: Math.round(rSum / totalPixels),
        g: Math.round(gSum / totalPixels),
        b: Math.round(bSum / totalPixels)
      },
      minColor: { r: rMin, g: gMin, b: bMin },
      maxColor: { r: rMax, g: gMax, b: bMax },
      segmentedPixels: segmentationData?.length || 0,
      segmentationCoverage: ((segmentationData?.length || 0) / totalPixels * 100).toFixed(2)
    };
  };

  // Generate histogram data
  const getHistogramData = () => {
    if (!imageData) return [];
    
    const { data } = imageData;
    const rHist = new Array(16).fill(0);
    const gHist = new Array(16).fill(0);
    const bHist = new Array(16).fill(0);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.floor(data[i] / 16);
      const g = Math.floor(data[i + 1] / 16);
      const b = Math.floor(data[i + 2] / 16);
      
      rHist[r]++;
      gHist[g]++;
      bHist[b]++;
    }
    
    return rHist.map((r, i) => ({
      range: `${i * 16}-${(i + 1) * 16 - 1}`,
      red: r,
      green: gHist[i],
      blue: bHist[i]
    }));
  };

  // Layer statistics
  const getLayerStats = () => {
    return layers.filter(layer => layer.id !== 'bg').map((layer, index) => ({
      id: layer.id,
      name: layer.name,
      pixels: layer.maskData?.length || 0,
      opacity: layer.opacity,
      visible: layer.visible,
      color: [
        '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', 
        '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
      ][index % 8]
    }));
  };

  // Performance timeline data
  const getPerformanceData = () => {
    return [
      { time: '0s', cpu: 45, memory: 120, gpu: 30 },
      { time: '1s', cpu: 60, memory: 150, gpu: 45 },
      { time: '2s', cpu: 75, memory: 180, gpu: 60 },
      { time: '3s', cpu: 50, memory: 160, gpu: 35 },
      { time: '4s', cpu: 40, memory: 140, gpu: 25 },
    ];
  };

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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 m-4 mb-0 bg-slate-700/50 border border-slate-600">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="histogram">Histogram</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <div className="p-4">
                <TabsContent value="overview" className="mt-0 space-y-4">
                  {stats ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-slate-300">Total Pixels</span>
                        </div>
                        <div className="text-lg font-bold text-blue-400">
                          {stats.totalPixels.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-slate-300">Segmented</span>
                        </div>
                        <div className="text-lg font-bold text-green-400">
                          {stats.segmentedPixels.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-slate-300">Coverage</span>
                        </div>
                        <div className="text-lg font-bold text-purple-400">
                          {stats.segmentationCoverage}%
                        </div>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-medium text-slate-300">Layers</span>
                        </div>
                        <div className="text-lg font-bold text-orange-400">
                          {layers.filter(l => l.id !== 'bg').length}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Load an image to see analytics</p>
                    </div>
                  )}

                  {/* Average Color Display */}
                  {stats && (
                    <div className="bg-slate-700/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Average Color</h4>
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-lg border border-slate-600"
                          style={{ 
                            backgroundColor: `rgb(${stats.avgColor.r}, ${stats.avgColor.g}, ${stats.avgColor.b})` 
                          }}
                        />
                        <div className="text-sm text-slate-400">
                          <div>RGB: {stats.avgColor.r}, {stats.avgColor.g}, {stats.avgColor.b}</div>
                          <div>Hex: #{[stats.avgColor.r, stats.avgColor.g, stats.avgColor.b]
                            .map(c => c.toString(16).padStart(2, '0')).join('')}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="histogram" className="mt-0">
                  <div className="h-64 w-full">
                    {histogramData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={histogramData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="range" 
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#4b5563' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#4b5563' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#f3f4f6'
                            }}
                          />
                          <Bar dataKey="red" fill="#ef4444" opacity={0.8} />
                          <Bar dataKey="green" fill="#22c55e" opacity={0.8} />
                          <Bar dataKey="blue" fill="#3b82f6" opacity={0.8} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        <div className="text-center">
                          <Grid className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No histogram data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="layers" className="mt-0 space-y-4">
                  {layerStats.length > 0 ? (
                    <div className="space-y-3">
                      {layerStats.map((layer) => (
                        <div
                          key={layer.id}
                          className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border border-slate-500"
                                style={{ backgroundColor: layer.color }}
                              />
                              <span className="text-sm font-medium text-slate-300">
                                {layer.name}
                              </span>
                              {!layer.visible && (
                                <Badge variant="outline" className="text-xs bg-slate-600/50">
                                  Hidden
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-slate-400">
                              {layer.pixels.toLocaleString()} pixels
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Opacity</span>
                              <span>{Math.round(layer.opacity * 100)}%</span>
                            </div>
                            <Progress 
                              value={layer.opacity * 100} 
                              className="h-2 bg-slate-600"
                            />
                          </div>

                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Coverage</span>
                              <span>{stats ? ((layer.pixels / stats.totalPixels) * 100).toFixed(2) : 0}%</span>
                            </div>
                            <Progress 
                              value={stats ? (layer.pixels / stats.totalPixels) * 100 : 0} 
                              className="h-2 bg-slate-600"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No segmentation layers created yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="performance" className="mt-0 space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-slate-300">Frame Rate</span>
                      </div>
                      <div className="text-lg font-bold text-green-400">
                        {performanceMetrics?.averageFrameRate || 60} FPS
                      </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-slate-300">Processing</span>
                      </div>
                      <div className="text-lg font-bold text-blue-400">
                        {Math.round(performanceMetrics?.lastProcessingTime || 0)}ms
                      </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-slate-300">GPU</span>
                      </div>
                      <div className="text-lg font-bold text-purple-400">Active</div>
                    </div>
                  </div>

                  {/* Performance Chart */}
                  <div className="bg-slate-700/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Performance Timeline</h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="time"
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#4b5563' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#4b5563' }}
                          />
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#f3f4f6'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="cpu" 
                            stroke="#22c55e" 
                            strokeWidth={2}
                            name="CPU %"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="memory" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="Memory MB"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="gpu" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            name="GPU %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Optimization Suggestions */}
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <h4 className="text-sm font-medium text-blue-300 mb-2">Optimization Suggestions</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• GPU acceleration is active for optimal performance</li>
                      <li>• Consider reducing image size for faster processing</li>
                      <li>• Multi-threading enabled for large image operations</li>
                      <li>• Real-time preview quality automatically adjusted</li>
                    </ul>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}


[Entities]
[Project]
{
  "name": "Project",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Project name"
    },
    "description": {
      "type": "string",
      "description": "Project description"
    },
    "image_url": {
      "type": "string",
      "description": "Main project image URL"
    },
    "settings": {
      "type": "object",
      "description": "Advanced project settings and parameters",
      "properties": {
        "magic_wand": {
          "type": "object",
          "properties": {
            "tolerance": {
              "type": "number",
              "default": 30
            },
            "contiguous": {
              "type": "boolean",
              "default": true
            },
            "color_space": {
              "type": "string",
              "enum": [
                "RGB",
                "HSV",
                "LAB",
                "Quaternion"
              ],
              "default": "RGB"
            },
            "connectivity": {
              "type": "number",
              "enum": [
                4,
                8
              ],
              "default": 4
            },
            "search_radius": {
              "type": "number",
              "default": 5
            },
            "edge_falloff": {
              "type": "string",
              "enum": [
                "linear",
                "gaussian",
                "exponential"
              ],
              "default": "gaussian"
            },
            "texture_analysis": {
              "type": "boolean",
              "default": false
            },
            "quaternion_processing": {
              "type": "boolean",
              "default": false
            },
            "variance_expansion": {
              "type": "boolean",
              "default": false
            },
            "grid_size": {
              "type": "number",
              "default": 5
            },
            "grid_spacing": {
              "type": "number",
              "default": 10
            },
            "variance_threshold": {
              "type": "number",
              "default": 20
            },
            "max_iterations": {
              "type": "number",
              "default": 5
            },
            "coverage_target": {
              "type": "number",
              "default": 95
            }
          }
        },
        "magic_lasso": {
          "type": "object",
          "properties": {
            "elasticity": {
              "type": "number",
              "default": 0.5
            },
            "node_drop_time": {
              "type": "number",
              "default": 150
            },
            "cost_function": {
              "type": "string",
              "default": "sobel"
            },
            "perp_bias": {
              "type": "number",
              "default": 0.8
            },
            "falloff_sigma": {
              "type": "number",
              "default": 20
            },
            "min_drop_px": {
              "type": "number",
              "default": 3
            },
            "max_segment_px": {
              "type": "number",
              "default": 10
            },
            "corner_thresh": {
              "type": "number",
              "default": 45
            },
            "hover_radius": {
              "type": "number",
              "default": 20
            },
            "future_distance": {
              "type": "number",
              "default": 10
            },
            "predictive_segmentation": {
              "type": "boolean",
              "default": true
            },
            "trajectory_prediction": {
              "type": "boolean",
              "default": true
            },
            "jump_optimization": {
              "type": "boolean",
              "default": true
            },
            "mid_draw_tuning": {
              "type": "boolean",
              "default": true
            }
          }
        }
      }
    },
    "layers": {
      "type": "array",
      "description": "Project segmentation layers",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "visible": {
            "type": "boolean",
            "default": true
          },
          "opacity": {
            "type": "number",
            "default": 1
          },
          "mask_data": {
            "type": "string"
          },
          "metadata": {
            "type": "object",
            "properties": {
              "tool": {
                "type": "string"
              },
              "settings": {
                "type": "object"
              },
              "timestamp": {
                "type": "number"
              },
              "processing_time": {
                "type": "number"
              },
              "quality": {
                "type": "number"
              },
              "expanded": {
                "type": "boolean"
              },
              "soft_edges": {
                "type": "boolean"
              }
            }
          }
        }
      }
    },
    "performance_metrics": {
      "type": "object",
      "properties": {
        "average_processing_time": {
          "type": "number"
        },
        "total_operations": {
          "type": "number"
        },
        "gpu_usage": {
          "type": "boolean"
        },
        "memory_usage": {
          "type": "number"
        }
      }
    }
  },
  "required": [
    "name"
  ]
}

[Preset]
{
  "name": "Preset",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Preset name"
    },
    "description": {
      "type": "string",
      "description": "Preset description"
    },
    "use_case": {
      "type": "string",
      "enum": [
        "green_screen",
        "texture_fusion",
        "medical_imaging",
        "general",
        "fine_detail",
        "portrait_segmentation",
        "landscape_extraction",
        "product_isolation"
      ],
      "description": "Primary use case"
    },
    "settings": {
      "type": "object",
      "description": "Advanced preset parameters",
      "properties": {
        "magic_wand": {
          "type": "object",
          "properties": {
            "tolerance": {
              "type": "number"
            },
            "contiguous": {
              "type": "boolean"
            },
            "color_space": {
              "type": "string"
            },
            "connectivity": {
              "type": "number"
            },
            "search_radius": {
              "type": "number"
            },
            "edge_falloff": {
              "type": "string"
            },
            "texture_analysis": {
              "type": "boolean"
            },
            "quaternion_processing": {
              "type": "boolean"
            },
            "variance_expansion": {
              "type": "boolean"
            },
            "grid_size": {
              "type": "number"
            },
            "variance_threshold": {
              "type": "number"
            },
            "coverage_target": {
              "type": "number"
            }
          }
        },
        "magic_lasso": {
          "type": "object",
          "properties": {
            "elasticity": {
              "type": "number"
            },
            "node_drop_time": {
              "type": "number"
            },
            "cost_function": {
              "type": "string"
            },
            "perp_bias": {
              "type": "number"
            },
            "falloff_sigma": {
              "type": "number"
            },
            "predictive_segmentation": {
              "type": "boolean"
            },
            "trajectory_prediction": {
              "type": "boolean"
            },
            "jump_optimization": {
              "type": "boolean"
            },
            "mid_draw_tuning": {
              "type": "boolean"
            }
          }
        }
      }
    },
    "performance_profile": {
      "type": "object",
      "properties": {
        "target_fps": {
          "type": "number",
          "default": 60
        },
        "gpu_acceleration": {
          "type": "boolean",
          "default": true
        },
        "multi_threading": {
          "type": "boolean",
          "default": true
        },
        "memory_optimization": {
          "type": "boolean",
          "default": true
        }
      }
    }
  },
  "required": [
    "name",
    "use_case"
  ]
}

[Layout]
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Layers, Scissors, BarChart3, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Workspace",
    url: createPageUrl("Workspace"),
    icon: Layers,
    description: "Main segmentation workspace"
  },
  {
    title: "Compare",
    url: createPageUrl("Compare"), 
    icon: BarChart3,
    description: "Algorithm comparison"
  },
  {
    title: "Projects",
    url: createPageUrl("Projects"),
    icon: Settings,
    description: "Manage projects"
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg tracking-tight">STA</h2>
                <p className="text-xs text-slate-500 font-medium">Segmentation Testing</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`group hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 px-4 py-3 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-100 shadow-sm' 
                            : 'text-slate-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className={`w-5 h-5 transition-colors ${
                            location.pathname === item.url ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                          }`} />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.title}</span>
                            <span className="text-xs text-slate-400 group-hover:text-blue-500">{item.description}</span>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}