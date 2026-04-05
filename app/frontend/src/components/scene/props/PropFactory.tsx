import type { PropPlacement, StyleTheme } from '@novel-visualizer/shared';

interface Props {
  spec: PropPlacement;
  style: StyleTheme;
}

function Tree({ scale, style }: { scale: number; style: StyleTheme }) {
  const leafColor = style === 'xinxia' ? '#2d5a1e' : '#1a3a1e';
  return (
    <group scale={scale}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1.5, 6]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <coneGeometry args={[0.8, 1.5, 6]} />
        <meshStandardMaterial color={leafColor} flatShading />
      </mesh>
    </group>
  );
}

function Rock({ scale }: { scale: number }) {
  return (
    <mesh scale={scale}>
      <dodecahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color="#7a7a7a" flatShading roughness={0.9} />
    </mesh>
  );
}

function Pillar({ scale, style }: { scale: number; style: StyleTheme }) {
  const color = style === 'xinxia' ? '#c4a35a' : '#5a5a6a';
  return (
    <group scale={scale}>
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 2.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.25, 0.15, 0.1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Altar({ scale, style }: { scale: number; style: StyleTheme }) {
  const color = style === 'xinxia' ? '#8a7a5a' : '#4a3a5a';
  return (
    <group scale={scale}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.4]} />
        <meshStandardMaterial color={style === 'xinxia' ? '#FFD700' : '#6a4a8a'} />
      </mesh>
    </group>
  );
}

function Torch({ scale, style }: { scale: number; style: StyleTheme }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.2, 5]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <meshStandardMaterial
          color={style === 'xinxia' ? '#ff6600' : '#4a2aaa'}
          emissive={style === 'xinxia' ? '#ff4400' : '#3a1a8a'}
          emissiveIntensity={2}
        />
      </mesh>
      <pointLight
        position={[0, 1.4, 0]}
        color={style === 'xinxia' ? '#ff6600' : '#6a4aaa'}
        intensity={1.5}
        distance={5}
      />
    </group>
  );
}

function Lantern({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.3]} />
        <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#ff4400" intensity={0.8} distance={4} />
    </group>
  );
}

function Gate({ scale, style }: { scale: number; style: StyleTheme }) {
  const color = style === 'xinxia' ? '#5a3a1a' : '#3a3a4a';
  return (
    <group scale={scale}>
      <mesh position={[-0.6, 1, 0]}>
        <boxGeometry args={[0.2, 2, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.6, 1, 0]}>
        <boxGeometry args={[0.2, 2, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[1.4, 0.2, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

const PROP_MAP: Record<string, React.FC<{ scale: number; style: StyleTheme }>> = {
  tree: Tree,
  rock: Rock,
  pillar: Pillar,
  altar: Altar,
  torch: Torch,
  lantern: Lantern,
  gate: Gate,
};

export default function PropFactory({ spec, style }: Props) {
  const Component = PROP_MAP[spec.type] || Rock;
  return (
    <group position={[spec.position.x, spec.position.y, spec.position.z]}>
      <Component scale={spec.scale} style={style} />
    </group>
  );
}
