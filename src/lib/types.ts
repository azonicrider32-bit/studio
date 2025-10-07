
import { z } from 'zod';

export type Tool = "magic-wand" | "wand-v2" | "lasso" | "brush" | "eraser" | "settings" | "clone" | "transform" | "pan" | "line" | "banana" | "blemish-remover" | "project" | "account" | "character-sculpt";

export interface AITool {
    id: string;
    label: string;
    prompt: string;
    icon: React.ElementType;
    color: string;
    lineStyle: 'solid' | 'dashed';
    isOneClick?: boolean;
}

export interface Layer {
    id: string; // Unique identifier
    name: string; // Display name in the layers panel
    type: 'segmentation' | 'background' | 'adjustment'; // The fundamental type of the layer
    subType?: 'pixel' | 'mask' | 'path'; // Specifies if it holds pixels, is a mask, or is a vector path
    parentId?: string | null; // If it's a child (e.g., a mask), this links to its parent layer
    visible: boolean; // Is the layer visible on the canvas?
    locked: boolean; // Is the layer locked from editing?
    pixels: Set<number>; // A set of pixel indices that belong to this layer's selection
    path?: [number, number][]; // An array of [x, y] coordinates for vector paths
    stroke?: string; // Stroke color for vector paths
    strokeWidth?: number; // Stroke width for vector paths
    fill?: string; // Fill color for vector paths
    closed: boolean; // Is the vector path closed?
    imageData?: ImageData; // The actual pixel data for pixel-based layers
    maskVisible?: boolean; // Is the colored highlight/mask overlay visible?
    highlightColor?: string;
    highlightOpacity?: number;
    highlightTexture?: 'solid' | 'checkerboard' | 'lines';
    modifiers?: Layer[]; // An array of child layers acting as modifiers (e.g., masks)
    bounds: { x: number; y: number; width: number; height: number }; // The bounding box of the layer content
}

export interface LassoSettings {
    drawMode: 'magic' | 'polygon' | 'free';
    useAiEnhancement: boolean;
    showMouseTrace: boolean;
    showAllMasks: boolean;
    fillPath: boolean;
    snapRadius: number; // How close to an edge the cursor must be to snap.
    snapThreshold: number; // How strong an edge must be to be considered for snapping.
    curveStrength: number; // Controls the "curviness" of the path in polygon mode.
    curveTension: number;
    directionalStrength: number; // How much the path prefers to continue in its current direction.
    cursorInfluence: number; // How strongly the path is pulled towards the user's cursor.
    traceInfluence: number; // How much the path is influenced by the recent mouse trace.
    colorInfluence: number;
    snapRadiusEnabled: boolean;
    snapThresholdEnabled: boolean;
    curveStrengthEnabled: boolean;
    directionalStrengthEnabled: boolean;
    cursorInfluenceEnabled: boolean;
    traceInfluenceEnabled: boolean;
    colorInfluenceEnabled: boolean;
    useColorAwareness: boolean;
    freeDraw: {
        dropInterval: number; // ms
        minDistance: number; // px
        maxDistance: number; // px
    };
}

export interface CloneStampSettings {
    brushSize: number;
    opacity: number;
    softness: number; // Feathering of the brush edge.
    rotationStep: number;
    sourceLayer: 'current' | 'all'; // Sample from the current layer or all visible layers.
    angle: number;
    flipX: boolean;
    flipY: boolean;
    blendMode: 'normal' | 'lights' | 'mids' | 'darks';
    useAdvancedBlending: boolean;
    tolerances: {
        values: MagicWandSettings['tolerances'];
        enabled: Set<keyof MagicWandSettings['tolerances']>;
    };
    falloff: number;
}

export interface MagicWandSettings {
    tolerances: {
        r: number; g: number; b: number;
        h: number; s: number; v: number;
        l: number; a: number; b_lab: number;
    };
    contiguous: boolean; // Should the selection only include physically connected pixels?
    useAiAssist: boolean;
    createAsMask: boolean;
    showAllMasks: boolean;
    ignoreExistingSegments: boolean; // If true, can select pixels already in another layer.
    enabledTolerances: Set<keyof MagicWandSettings['tolerances']>; // Which color channels to consider.
    scrollAdjustTolerances: Set<keyof MagicWandSettings['tolerances']>; // Which tolerances are adjusted by scrolling.
    searchRadius: number; // For 'average' or 'dominant' sample modes.
    sampleMode: 'point' | 'average' | 'dominant';
    seedColor?: { [key: string]: number }; // The initial color sampled.
    useAntiAlias: boolean;
    useFeather: boolean;
    highlightColorMode: 'fixed' | 'random' | 'contrast';
    fixedHighlightColor: string;
    highlightOpacity: number;
    highlightTexture: 'solid' | 'checkerboard' | 'lines';
    highlightBorder: {
        enabled: boolean;
        thickness: number;
        color: string;
        colorMode: 'fixed' | 'contrast';
        pattern: 'solid' | 'dashed';
        opacity: number;
    };
    debounceDelay: number;
    previewMode: 'real-time' | 'on-stop';
}

export interface GlobalSettings {
    snapEnabled: boolean;
    snapRadius: number;
}

export interface TransformSettings {
    scope: 'layer' | 'visible' | 'all'; // What the transformation applies to.
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX: number;
    skewY: number;
    maintainAspectRatio: boolean;
}

export interface CharacterSculptSettings {
    foreheadHeight: number;
    nosePosition: number;
    eyeWidth: number;
    eyeSpacing: number;
}


export interface Segment {
    id: number;
    pixels: Set<number>;
    bounds: { x: number; y: number; width: number; height: number };
}

export interface FeatherSettings {
  antiAlias: {
    enabled: boolean;
    method: 'smooth' | 'gaussian' | 'bilinear';
    quality: 'fast' | 'balanced' | 'high';
  };
  smartFeather: {
    enabled: boolean;
    alphaMatting: {
      enabled: boolean;
      method: 'closed-form' | 'knn' | 'learning-based';
      quality: number; // 0-1
    };
    backgroundAdaptation: {
      enabled: boolean;
      sampleRadius: number; // pixels
      adaptationStrength: number; // 0-1
      colorThreshold: number; // similarity threshold
    };
    gradientTransparency: {
      enabled: boolean;
      gradientRadius: number; // pixels
      smoothness: number; // 0-1
      edgeAware: boolean;
    };
    colorAwareProcessing: {
      enabled: boolean;
      haloPreventionStrength: number; // 0-1
      colorContextRadius: number; // pixels
    };
  };
}

export interface PerformanceMetrics {
  lastDuration: number;
  avgDuration: number;
  lagEvents: number;
  history: number[];
}

export const UploadAssetInputSchema = z.object({
  userId: z.string().describe('The ID of the user uploading the asset.'),
  fileName: z.string().describe('The name of the file to be uploaded.'),
  fileDataUri: z
    .string()
    .describe(
      "The file content as a data URI. Must include a MIME type and use Base64 encoding. Format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type UploadAssetInput = z.infer<typeof UploadAssetInputSchema>;

export const UploadAssetOutputSchema = z.object({
  downloadURL: z.string().optional().describe('The public URL to access the uploaded file.'),
  gcsPath: z.string().optional().describe('The path to the file in Google Cloud Storage.'),
  error: z.string().optional().describe('An error message if the upload failed.'),
});
export type UploadAssetOutput = z.infer<typeof UploadAssetOutputSchema>;
