import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnvironmentSpec, StyleTheme } from '@novel-visualizer/shared';

interface Props {
  environment: EnvironmentSpec;
  style: StyleTheme;
}

export default function ParticleSystem({ environment, style }: Props) {
  const ref = useRef<THREE.Points>(null);
  const count = 60;

  const { positions, colors, speed } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    let spd = 0.003;

    const isForest = environment.terrain === 'forest_clearing' || environment.terrain === 'garden';
    const isCave = environment.terrain === 'cave' || environment.terrain === 'dungeon';
    const isMountain = environment.terrain === 'mountain_peak';

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 5 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;

      if (style === 'xinxia') {
        // Golden qi particles
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 0.85 + Math.random() * 0.15;
        col[i * 3 + 2] = 0.3 + Math.random() * 0.3;
      } else if (isForest) {
        // Green fireflies
        col[i * 3] = 0.5 + Math.random() * 0.3;
        col[i * 3 + 1] = 1.0;
        col[i * 3 + 2] = 0.3;
      } else if (isCave) {
        // Dust motes
        col[i * 3] = 0.6;
        col[i * 3 + 1] = 0.5;
        col[i * 3 + 2] = 0.4;
      } else if (isMountain) {
        // Snow
        col[i * 3] = 0.95;
        col[i * 3 + 1] = 0.95;
        col[i * 3 + 2] = 1.0;
        spd = 0.005;
      } else {
        // Generic mystical
        col[i * 3] = 0.4 + Math.random() * 0.2;
        col[i * 3 + 1] = 0.3 + Math.random() * 0.2;
        col[i * 3 + 2] = 0.8 + Math.random() * 0.2;
      }
    }

    return { positions: pos, colors: col, speed: spd };
  }, [environment.terrain, style, count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * speed;
      arr[i * 3] += Math.cos(Date.now() * 0.0005 + i * 0.5) * speed * 0.5;

      // Reset if too high or too low
      if (arr[i * 3 + 1] > 6) arr[i * 3 + 1] = 0.5;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 5;
    }

    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
