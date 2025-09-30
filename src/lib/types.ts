

export interface LassoSettings {
    useEdgeSnapping: boolean;
    snapRadius: number;
    snapThreshold: number;
    curveStrength: number;
    directionalStrength: number;
    cursorInfluence: number;
}

export interface MagicWandSettings {
    tolerances: {
        r: number; g: number; b: number;
        h: number; s: number; v: number;
        l: number; a: number; b_lab: number;
    };
    contiguous: boolean;
    useAiAssist: boolean;
    activeTolerances: Set<keyof MagicWandSettings['tolerances']>;
    seedColor?: { [key: string]: number };
}


export interface Segment {
    id: number;
    pixels: Set<number>;
    bounds: { x: number; y: number; width: number; height: number };
}
