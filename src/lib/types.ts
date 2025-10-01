

export interface Layer {
    id: string;
    name: string;
    type: 'segmentation' | 'background' | 'adjustment';
    subType?: 'pixel' | 'mask';
    parentId?: string | null;
    visible: boolean;
    locked: boolean;
    pixels: Set<number>;
    bounds: { x: number; y: number; width: number; height: number };
    imageData?: ImageData;
    maskVisible?: boolean;
}

export interface LassoSettings {
    drawMode: 'magic' | 'polygon' | 'free';
    useAiEnhancement: boolean;
    showMouseTrace: boolean;
    showAllMasks: boolean;
    snapRadius: number;
    snapThreshold: number;
    curveStrength: number;
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
    seedColor?: { [key: string]: number };
    useAntiAlias: boolean;
    useFeather: boolean;
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
