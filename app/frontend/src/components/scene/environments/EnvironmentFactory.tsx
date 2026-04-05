import type { EnvironmentSpec, StyleTheme } from '@novel-visualizer/shared';

interface Props {
  spec: EnvironmentSpec;
  style: StyleTheme;
}

function Ground({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function MountainPeak({ style }: { style: StyleTheme }) {
  const rockColor = style === 'xinxia' ? '#8B7355' : '#4a4a5e';
  return (
    <group>
      <Ground color={rockColor} />
      <mesh position={[-4, 1.5, -4]}>
        <coneGeometry args={[2, 3, 6]} />
        <meshStandardMaterial color={rockColor} flatShading />
      </mesh>
      <mesh position={[4, 2, -3]}>
        <coneGeometry args={[2.5, 4, 5]} />
        <meshStandardMaterial color={rockColor} flatShading />
      </mesh>
      <mesh position={[-4, 2.5, -3]}>
        <coneGeometry args={[1, 2, 4]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>
    </group>
  );
}

function ForestClearing({ style }: { style: StyleTheme }) {
  const grassColor = style === 'xinxia' ? '#4a7c3f' : '#2a4a2f';
  return (
    <group>
      <Ground color={grassColor} />
      {[[-4, -3], [4, -4], [-3, 4], [5, 3], [-5, 0]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 2, 6]} />
            <meshStandardMaterial color="#5a3a1a" />
          </mesh>
          <mesh position={[0, 2.5, 0]}>
            <coneGeometry args={[1.2, 2, 6]} />
            <meshStandardMaterial color="#2d5a1e" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TempleHall({ style }: { style: StyleTheme }) {
  const pillarColor = style === 'xinxia' ? '#c4a35a' : '#5a5a6a';
  const floorColor = style === 'xinxia' ? '#8a7a5a' : '#3a3a4a';
  return (
    <group>
      <Ground color={floorColor} />
      {[[-3, -3], [3, -3], [-3, 3], [3, 3], [-3, 0], [3, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.5, z]}>
          <cylinderGeometry args={[0.2, 0.25, 3, 8]} />
          <meshStandardMaterial color={pillarColor} />
        </mesh>
      ))}
    </group>
  );
}

function Cave({ style }: { style: StyleTheme }) {
  const rockColor = style === 'xinxia' ? '#5a4a3a' : '#2a2a3a';
  return (
    <group>
      <Ground color={rockColor} />
      <mesh position={[0, 3, -4]} rotation={[Math.PI / 6, 0, 0]}>
        <sphereGeometry args={[5, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={rockColor} flatShading side={1} />
      </mesh>
      {[[-2, 2.8, -3], [1, 2.5, -2], [-1, 2.2, -4]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <coneGeometry args={[0.2, 0.8, 4]} />
          <meshStandardMaterial color="#4a3a2a" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function VillageStreet({ style }: { style: StyleTheme }) {
  const wallColor = style === 'xinxia' ? '#b8a080' : '#5a5a6a';
  const roofColor = style === 'xinxia' ? '#8B0000' : '#3a3a4a';
  return (
    <group>
      <Ground color="#a09080" />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 4, 0, 0]}>
          {[-3, 0, 3].map((z, i) => (
            <group key={i} position={[0, 0, z]}>
              <mesh position={[0, 1, 0]}>
                <boxGeometry args={[2, 2, 2.5]} />
                <meshStandardMaterial color={wallColor} />
              </mesh>
              <mesh position={[0, 2.2, 0]} rotation={[0, 0, side * 0.3]}>
                <boxGeometry args={[2.4, 0.4, 2.8]} />
                <meshStandardMaterial color={roofColor} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function ThroneRoom({ style }: { style: StyleTheme }) {
  const throneColor = style === 'xinxia' ? '#FFD700' : '#4a2a6a';
  return (
    <group>
      <Ground color={style === 'xinxia' ? '#6a5a3a' : '#2a1a3a'} />
      <mesh position={[0, 0.75, -3]}>
        <boxGeometry args={[1.5, 1.5, 1]} />
        <meshStandardMaterial color={throneColor} />
      </mesh>
      <mesh position={[0, 2, -3]}>
        <boxGeometry args={[1.8, 1.5, 0.3]} />
        <meshStandardMaterial color={throneColor} />
      </mesh>
      {[[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.5, z]}>
          <cylinderGeometry args={[0.25, 0.3, 3, 8]} />
          <meshStandardMaterial color={style === 'xinxia' ? '#c4a35a' : '#5a4a6a'} />
        </mesh>
      ))}
    </group>
  );
}

function Battlefield() {
  return (
    <group>
      <Ground color="#5a4a3a" />
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 10, 0.15, (Math.random() - 0.5) * 10]}>
          <dodecahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#6a5a4a" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Library({ style }: { style: StyleTheme }) {
  const woodColor = style === 'xinxia' ? '#6a4a2a' : '#3a2a1a';
  return (
    <group>
      <Ground color={woodColor} />
      {[-4, 4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[-3, 0, 3].map((z, i) => (
            <mesh key={i} position={[0, 1.5, z]}>
              <boxGeometry args={[1.2, 3, 2]} />
              <meshStandardMaterial color={style === 'xinxia' ? '#5a3a1a' : '#2a2a3a'} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Garden({ style }: { style: StyleTheme }) {
  const grassColor = style === 'xinxia' ? '#5a8a4f' : '#2a4a2f';
  return (
    <group>
      <Ground color={grassColor} />
      {[[-2, -2], [2, 2], [-3, 3], [3, -1]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]}>
          <sphereGeometry args={[0.5, 6, 4]} />
          <meshStandardMaterial color={style === 'xinxia' ? '#ff69b4' : '#6a4a8a'} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial color="#4a8aaa" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Dungeon({ style }: { style: StyleTheme }) {
  const stoneColor = style === 'xinxia' ? '#4a4a4a' : '#2a2a2a';
  return (
    <group>
      <Ground color={stoneColor} />
      {[[-5, 0], [5, 0], [0, -5], [0, 5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.5, z]}>
          <boxGeometry args={[10, 3, 0.5]} />
          <meshStandardMaterial color={stoneColor} />
        </mesh>
      ))}
      <mesh position={[0, 2.5, -5]}>
        <boxGeometry args={[1.5, 2.5, 0.2]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
    </group>
  );
}

function OpenField({ style }: { style: StyleTheme }) {
  const grassColor = style === 'xinxia' ? '#6a9a4f' : '#3a5a3f';
  return (
    <group>
      <Ground color={grassColor} />
      {[-6, 6].map((z) => (
        <mesh key={z} position={[0, 0.5, z]}>
          <boxGeometry args={[14, 1, 1]} />
          <meshStandardMaterial color={style === 'xinxia' ? '#7a9a5f' : '#4a6a4f'} flatShading />
        </mesh>
      ))}
    </group>
  );
}

const TERRAIN_MAP: Record<string, React.FC<{ style: StyleTheme }>> = {
  mountain_peak: MountainPeak,
  forest_clearing: ForestClearing,
  temple_hall: TempleHall,
  cave: Cave,
  village_street: VillageStreet,
  throne_room: ThroneRoom,
  battlefield: Battlefield,
  library: Library,
  garden: Garden,
  dungeon: Dungeon,
  open_field: OpenField,
};

export default function EnvironmentFactory({ spec, style }: Props) {
  const TerrainComponent = TERRAIN_MAP[spec.terrain] || OpenField;
  return <TerrainComponent style={style} />;
}
