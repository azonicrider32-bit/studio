
"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Layer } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface AuraColorWheelProps {
  size: number;
  onColorSelect?: (color: string) => void;
  constructionLayers?: {
    showBase?: boolean;
    showWhiteAura?: boolean;
    showColorFields?: boolean;
    showSeparators?: boolean;
    showVignette?: boolean;
  }
}

export const ColorSphere: React.FC<AuraColorWheelProps> = ({ size = 2.5, onColorSelect, constructionLayers }) => {
  const [poleTop, setPoleTop] = React.useState('white'); // Adjustable: white/black/lum/sat
  const [poleBottom, setPoleBottom] = React.useState('black');
  const [equatorColors, setEquatorColors] = React.useState([
    'red', 'orange', 'yellow', 'green', 'turquoise', 'blue', 'violet', 'purple' // Your sequence
  ]);

  // Swap function
  const swapNodes = (idx1: number) => {
    const idx2 = (idx1 + 1) % equatorColors.length;
    const newColors = [...equatorColors];
    [newColors[idx1], newColors[idx2]] = [newColors[idx2], newColors[idx1]];
    setEquatorColors(newColors);
  };

  // Generate gradient texture for sphere (dynamic based on poles/equator)
  const texture = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Equatorial gradient ring
    const grad = ctx.createLinearGradient(0, 128, 512, 128);
    equatorColors.forEach((color, i) => grad.addColorStop(i / (equatorColors.length -1), color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 128 - 30, 512, 60); // Equator band

    // Pole gradients: Top to white/lum, bottom to black/sat
    const topGrad = ctx.createLinearGradient(0, 0, 0, 128);
    topGrad.addColorStop(0, poleTop); topGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 512, 128);

    const bottomGrad = ctx.createLinearGradient(0, 128, 0, 256);
    bottomGrad.addColorStop(0, 'transparent'); bottomGrad.addColorStop(1, poleBottom);
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 128, 512, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [equatorColors, poleTop, poleBottom]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <OrbitControls enableZoom={true} />
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
      </mesh>
      {/* Equator nodes: Clickable spheres for swapping */}
      {equatorColors.map((color, i) => {
        const angle = (i / equatorColors.length) * Math.PI * 2;
        const x = Math.cos(angle) * (size + 0.5);
        const z = Math.sin(angle) * (size + 0.5);
        return (
          <Sphere key={i} position={[x, 0, z]} args={[0.2, 16, 16]} onClick={() => swapNodes(i)}>
            <meshStandardMaterial color={color} />
          </Sphere>
        );
      })}
      {/* Poles: Adjustable endpoints */}
      <Line points={[[0, -size * 1.2, 0], [0, size * 1.2, 0]]} color="gray" lineWidth={1} />
    </>
  );
};


export function ColorSpherePanel() {
    const [sphereSize, setSphereSize] = React.useState(2.5);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <Canvas>
                <ColorSphere size={sphereSize} />
            </Canvas>
        </div>
    )
}
