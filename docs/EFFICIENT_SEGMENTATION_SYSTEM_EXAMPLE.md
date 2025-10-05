
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
    
      {/* Left Settings Panel */}
      
        
          
            
              
              Tools
            
            
              
                
                  Wand
                
                
                  Erase
                
                
                  Heal
                
              
            
          
          

          

          {currentTool === 'magic_wand' && (
            
              
                Magic Wand Settings
              
              
                
                  
                    Base Tolerance
                    
                      {tolerance}
                    
                  
                  
                    
                      setTolerance(v);
                      setLocalTolerance(v);
                    
                    0}
                    100}
                    1}
                    
                  
                  
                    Scroll wheel to adjust live
                  
                

                
                  
                    Live Tolerance
                    
                      {localTolerance}
                    
                  
                  
                    
                      setLocalTolerance(v)}
                    
                    0}
                    100}
                    1}
                    
                  
                

                
                  Contiguous
                  
                    
                      setContiguous}
                    
                  
                

                
                  Connectivity
                  
                    
                      4-Way
                    
                    
                      8-Way
                    
                  
                

                
                  
                    Hide All Segments
                    
                      Prevent overlaps
                    
                  
                  
                    setHideAllSegments}
                    
                  
                

                
                  
                    Auto Fill Holes
                    
                      Fill holes automatically
                    
                  
                  
                    setAutoFillHoles}
                    
                  
                
              
            
          )}

          {(currentTool === 'eraser' || currentTool === 'healing') && (
            
              
                {currentTool === 'eraser' ? 'Eraser' : 'Healing'} Settings
              
              
                
                  
                    Brush Size
                    
                      {eraserSize}px
                    
                  
                  
                    setEraserSize(v)}
                    1}
                    100}
                    1}
                  
                

                
                  
                    Strength
                    
                      {eraserOpacity}%
                    
                  
                  
                    setEraserOpacity(v)}
                    0}
                    100}
                    1}
                  
                

                
                  
                    Edge Softness
                    
                      {eraserSoftness}%
                    
                  
                  
                    setEraserSoftness(v)}
                    0}
                    100}
                    1}
                  
                
              
            
          )}

          

          
            Keyboard Shortcuts
            

              
                Click:
                
                  Select segment
                
              
              
                Ctrl+Click:
                
                  New segment
                
              
              
                Shift+Click:
                
                  Group segments
                
              
              
                Alt+Shift+Click:
                
                  Exclusion mask
                
              
              
                Scroll:
                
                  Adjust tolerance
                
              
              
                Ctrl+Z:
                
                  Undo
                
              
              
                Ctrl+Shift+Z:
                
                  Redo
                
              
            
          
          

          

          
            Load Image
            
              
                
                  
                    Upload Image
                  
                
              
            

            
              {img.name}
            
          
        
      

      {/* Main Canvas Area */}
      
        
          
            
              
                Advanced Segmentation Studio
                
                  
                    
                      Preview: {hoverPreview.length} pixels @ {localTolerance}
                    
                  
                  {hoveredSegment && (
                    
                      Hovering: {hoveredSegment.layer.name}
                    
                  )}
                  
                    {mousePosition.x}, {mousePosition.y}
                  
                  {isShiftPressed && }
                  {isCtrlPressed && }
                  {isAltPressed && }
                
              
            
            
              
                
                  Clear All
                
                
                  History ({history.length})
                
                
                  Export
                
              
            
          
          

            
              
            
            

            
              Upload or select an image to begin
            
          
        
      

      {/* Right Vertical Icon Bar */}
      
        
          
            
          
          
            
          
          
            
          
        
      

      {/* Right Zoom Drawer */}
      {rightDrawers.zoom && (
        
          
            
              Cursor Zoom
              
                
              
            
          

          
            
              
                Pixel zoom preview
              
              
                
                  Position:
                  {mousePosition.x}, {mousePosition.y}
                
              
            
          
        
      )}

      {/* Right Preview Drawer */}
      {rightDrawers.preview && (
        
          
            
              Segment Preview
              
                
              
            
          

          {hoverPreview && hoverPreview.length > 0 ? (
            
              
                
                  
                    Pixels:
                    {hoverPreview.length}
                  
                  
                    Tolerance:
                    {localTolerance}
                  
                  
                    Mode:
                    
                      {isShiftPressed ? 'Group' : isCtrlPressed ? 'New Layer' : 'Select'}
                    
                  
                
              
            
          ) : hoveredSegment ? (
            
              
                
                  
                    Segment:
                    {hoveredSegment.layer.name}
                  
                  
                    Type:
                    
                      {hoveredSegment.layer.isExclusion ? 'Exclusion' : 'Normal'}
                    
                  
                
              
            
          ) : (
            
              
                
                  Hover over image
                
              
            
          )}
        
      )}

      {/* Right History Drawer */}
      {rightDrawers.history && (
        
          
            
              History
              
                
              
            
          

          
            {action.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              {new Date(action.timestamp).toLocaleTimeString()}
              {action.type === 'create_group_layer' && (
                
                  {action.segmentCount} segments
                
              )}
            
          

          {history.length === 0 && (
            
              
                No history yet
              
            
          )}
        
      )}

      {/* Layers Panel */}
      
        
          
            Layers ({layers.length})
            {isShiftPressed && currentGroupLayer && (
              
                Group Active
              
            )}
          
          

          {isShiftPressed && currentGroupLayer && (
            
              
                
                  
                    {currentGroupLayer.name} (Active)
                  
                
                
                  {currentGroupLayer.pixels.size} pixels • {currentGroupLayer.segments.length} segments
                
              
            
          )}

          
            
              
                
                  {layer.name}
                
                
                  
                    {layer.visible ? (
                      
                    ) : (
                      
                    )}
                  
                  {layer.type === 'segment' && (
                    <>
                      
                        
                          {layerToDelete === layer.id && deleteClickCount === 1
                            ? 'Click again to delete'
                            : 'Double-click to delete'}
                        
                      

                      
                        
                          
                            {layer.showHighlight !== false ? 'Hide' : 'Show'} Highlight
                          
                          
                            {layer.isExclusion ? 'Convert to Normal' : 'Convert to Exclusion'}
                          
                          

                            
                              Add Translucent Mask
                            
                            
                              Add Color Mask
                            
                          

                          
                            Fill Holes
                          
                        
                      
                    </>
                  )}
                
              

              {layer.type !== 'background' && (
                
                  
                    {layer.pixels?.length || 0} pixels
                  
                  

                    Modifiers ({layer.modifiers.length})
                    

                      
                        
                          {mod.maskType} mask
                        
                      
                    
                  
                
              )}

              {/* Show modifiers on background layer */}
              {layer.type === 'background' && layer.modifiers && layer.modifiers.length > 0 && (
                

                  Modifiers ({layer.modifiers.length})
                  

                    
                      
                        
                          {mod.name || mod.maskType}
                        
                        
                          
                            
                          
                        
                      
                      
                        {mod.pixels?.length || 0} pixels
                      
                    
                  
                
              )}
            
          ))}
        

        {layers.filter(l => l.type !== 'background').length === 0 && !isShiftPressed && (
          
            
              No segments yet
            
            
              Ctrl+Click to create
            
            
              Shift+Click to group
            
            
              Alt+Shift+Click for exclusion
            
          
        )}
      
    
  );
}
```
