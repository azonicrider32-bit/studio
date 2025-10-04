

import { z } from 'zod';

export interface Layer {
    id: string;
    name: string;
    type: 'segmentation' | 'background' | 'adjustment';
    subType?: 'pixel' | 'mask' | 'path';
    parentId?: string | null;
    visible: boolean;
    locked: boolean;
    pixels: Set<number>;
    path?: [number, number][];
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    closed?: boolean;
    bounds: { x: number; y: number; width: number; height: number };
    imageData?: ImageData;
    maskVisible?: boolean;
    highlightColor?: string; // e.g., 'hsl(210, 40%, 96.1%)'
    highlightOpacity?: number; // 0-1
    highlightTexture?: 'solid' | 'checkerboard' | 'lines';
    modifiers?: Layer[];
}

export interface LassoSettings {
    drawMode: 'magic' | 'polygon' | 'free';
    useAiEnhancement: boolean;
    showMouseTrace: boolean;
    showAllMasks: boolean;
    snapRadius: number;
    snapThreshold: number;
    curveStrength: number; // 0-1, for Catmull-Rom tension
    directionalStrength: number;
    cursorInfluence: number;
    traceInfluence: number;
    colorInfluence: number;
    snapRadiusEnabled: boolean;
    snapThresholdEnabled: boolean;
    curveStrengthEnabled: boolean;
    directionalStrengthEnabled: boolean;
    cursorInfluenceEnabled: boolean;
    traceInfluenceEnabled: boolean;
    colorInfluenceEnabled: boolean;
    useColorAwareness: boolean;
}

export interface MagicWandSettings {
    tolerances: {
        r: number; g: number; b: number;
        h: number; s: number; v: number;
        l: number; a: number; b_lab: number;
    };
    contiguous: boolean;
    useAiAssist: boolean;
    createAsMask: boolean;
    showAllMasks: boolean;
    ignoreExistingSegments: boolean;
    enabledTolerances: Set<keyof MagicWandSettings['tolerances']>;
    scrollAdjustTolerances: Set<keyof MagicWandSettings['tolerances']>;
    searchRadius: number;
    sampleMode: 'point' | 'average' | 'dominant';
    seedColor?: { [key: string]: number };
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

export const UploadAssetInputSchema = z.object({
  userId: z.string().describe('The ID of the user uploading the asset.'),
  fileName: z.string().describe('The name of the file to be uploaded.'),
  fileDataUri: z
    .string()
    .describe(
      "The file content as a data URI. Must include a MIME type and use Base64 encoding. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type UploadAssetInput = z.infer<typeof UploadAssetInputSchema>;

export const UploadAssetOutputSchema = z.object({
  downloadURL: z.string().optional().describe('The public URL to access the uploaded file.'),
  gcsPath: z.string().optional().describe('The path to the file in Google Cloud Storage.'),
  error: z.string().optional().describe('An error message if the upload failed.'),
});
export type UploadAssetOutput = z.infer<typeof UploadAssetOutputSchema>;
