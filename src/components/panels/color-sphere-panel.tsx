
"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

interface ColorSphereProps {
  size?: number;
  onNodeSwap?: (node1: number, node2: number) => void;
}

export const ColorSphere: React.FC<ColorSphereProps> = ({ size = 5, onNodeSwap }) => {
  const [poleTop, setPoleTop] = React.useState('white'); // Adjustable: white/black/lum/sat
  const [poleBottom, setPoleBottom] = React.useState('black');
  const [equatorColors, setEquatorColors] = React.useState([
    'red', 'orange', 'yellow', 'green', 'turquoise', 'blue', 'deepblue', 'purple' // Your sequence
  ]);

  // Swap function
  const swapNodes = (idx1: number, idx2: number) => {
    const newColors = [...equatorColors];
    [newColors[idx1], newColors[idx2]] = [newColors[idx2], newColors[idx1]];
    setEquatorColors(newColors);
    if (onNodeSwap) onNodeSwap(idx1, idx2);
  };

  // Generate gradient texture for sphere (dynamic based on poles/equator)
  const texture = React.useMemo(() => {
    if (typeof document === 'undefined') {
        return new THREE.Texture();
    }
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Equatorial gradient ring
    const grad = ctx.createLinearGradient(0, 128, 512, 128);
    equatorColors.forEach((color, i) => grad.addColorStop(i / equatorColors.length, color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 128 - 20, 512, 40); // Equator band

    // Pole gradients: Top to white/lum, bottom to black/sat
    const topGrad = ctx.createLinearGradient(0, 0, 0, 128);
    topGrad.addColorStop(0, poleTop); topGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 512, 128);

    const bottomGrad = ctx.createLinearGradient(0, 128, 0, 256);
    bottomGrad.addColorStop(0, 'transparent'); bottomGrad.addColorStop(1, poleBottom);
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 128, 512, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [equatorColors, poleTop, poleBottom]);

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableZoom={true} /> {/* For dynamic exploration */}
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial map={texture} transparent={true} /> {/* Gradient map */}
      </mesh>
      {/* Equator nodes: Clickable spheres for swapping */}
      {equatorColors.map((color, i) => {
        const angle = (i / equatorColors.length) * Math.PI * 2;
        const x = Math.cos(angle) * size;
        const z = Math.sin(angle) * size;
        return (
          <Sphere key={i} position={[x, 0, z]} args={[0.2, 16, 16]} onClick={() => swapNodes(i, (i + 1) % equatorColors.length)}>
            <meshStandardMaterial color={color} />
          </Sphere>
        );
      })}
      {/* Poles: Adjustable endpoints */}
      <Line points={[[0, -size, 0], [0, size, 0]]} color="gray" lineWidth={2} /> {/* Axis line */}
    </Canvas>
  );
};

export function ColorSpherePanel() {
    return (
        <div className="h-full w-full">
            <ColorSphere size={2.5} />
        </div>
    )
}
