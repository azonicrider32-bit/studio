
export interface LassoSettings {
    useEdgeSnapping: boolean;
    snapRadius: number;
    snapThreshold: number;
}

export interface MagicWandSettings {
    tolerance: number;
    colorSpace: string;
    contiguous: boolean;
    useAiAssist: boolean;
}

export interface Segment {
    id: number;
    pixels: Set<number>;
    bounds: { x: number; y: number; width: number; height: number };
}

    