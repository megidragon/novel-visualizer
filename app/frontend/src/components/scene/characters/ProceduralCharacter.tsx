import { useMemo } from 'react';
import type { CharacterPlacement, StyleTheme } from '@novel-visualizer/shared';

interface Props {
  spec: CharacterPlacement;
  style: StyleTheme;
}

const BODY_SCALES: Record<string, { height: number; width: number }> = {
  male_tall: { height: 1.9, width: 0.45 },
  male_average: { height: 1.7, width: 0.4 },
  female_tall: { height: 1.75, width: 0.35 },
  female_average: { height: 1.6, width: 0.33 },
  elder: { height: 1.55, width: 0.38 },
  child: { height: 1.1, width: 0.28 },
};

const FACING_ROTATIONS: Record<string, number> = {
  north: 0,
  south: Math.PI,
  east: Math.PI / 2,
  west: -Math.PI / 2,
  camera: -Math.PI / 4,
};

const POSE_ARM_ANGLES: Record<string, [number, number]> = {
  standing: [0.1, -0.1],
  sitting: [0.3, -0.3],
  fighting: [-0.8, 0.5],
  meditating: [0.5, -0.5],
  walking: [0.3, -0.3],
  kneeling: [0.2, -0.2],
};

export default function ProceduralCharacter({ spec, style }: Props) {
  const { appearance, position, facing, pose } = spec;
  const body = BODY_SCALES[appearance.bodyType] || BODY_SCALES.male_average;
  const rotation = FACING_ROTATIONS[facing] ?? FACING_ROTATIONS.camera;
  const [leftArm, rightArm] = POSE_ARM_ANGLES[pose] || POSE_ARM_ANGLES.standing;

  const headY = body.height - 0.15;
  const torsoY = body.height * 0.55;
  const torsoH = body.height * 0.35;
  const legY = body.height * 0.2;
  const legH = body.height * 0.35;

  const isSitting = pose === 'sitting' || pose === 'meditating';
  const yOffset = isSitting ? -0.3 : 0;

  const robeEmissive = style === 'xinxia' ? appearance.robeColor : '#000000';
  const emissiveIntensity = style === 'xinxia' ? 0.1 : 0;

  return (
    <group position={[position.x, position.y + yOffset, position.z]} rotation={[0, rotation, 0]}>
      {/* Head */}
      <mesh position={[0, headY, 0]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#e8c8a0" flatShading />
      </mesh>

      {/* Hair */}
      {appearance.hairStyle !== 'bald' && (
        <mesh position={[0, headY + (appearance.hairStyle === 'bun' ? 0.2 : 0.12), appearance.hairStyle === 'long' ? -0.05 : 0]}>
          {appearance.hairStyle === 'long' ? (
            <boxGeometry args={[0.22, 0.35, 0.22]} />
          ) : appearance.hairStyle === 'bun' ? (
            <sphereGeometry args={[0.1, 6, 4]} />
          ) : (
            <sphereGeometry args={[0.19, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
          )}
          <meshStandardMaterial color={appearance.hairColor} flatShading />
        </mesh>
      )}

      {/* Torso (robe) */}
      <mesh position={[0, torsoY, 0]}>
        <boxGeometry args={[body.width, torsoH, body.width * 0.8]} />
        <meshStandardMaterial
          color={appearance.robeColor}
          emissive={robeEmissive}
          emissiveIntensity={emissiveIntensity}
          flatShading
        />
      </mesh>

      {/* Left arm */}
      <group position={[-body.width / 2 - 0.08, torsoY, 0]} rotation={[leftArm, 0, -0.15]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.05, torsoH * 0.8, 5]} />
          <meshStandardMaterial color={appearance.robeColor} flatShading />
        </mesh>
      </group>

      {/* Right arm */}
      <group position={[body.width / 2 + 0.08, torsoY, 0]} rotation={[rightArm, 0, 0.15]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.05, torsoH * 0.8, 5]} />
          <meshStandardMaterial color={appearance.robeColor} flatShading />
        </mesh>
      </group>

      {/* Legs */}
      {!isSitting && (
        <>
          <mesh position={[-0.08, legY, 0]}>
            <cylinderGeometry args={[0.07, 0.06, legH, 5]} />
            <meshStandardMaterial color={appearance.robeColor} flatShading />
          </mesh>
          <mesh position={[0.08, legY, 0]}>
            <cylinderGeometry args={[0.07, 0.06, legH, 5]} />
            <meshStandardMaterial color={appearance.robeColor} flatShading />
          </mesh>
        </>
      )}

      {/* Sitting legs - crossed or folded */}
      {isSitting && (
        <mesh position={[0, legY - 0.1, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[body.width * 0.9, 0.12, 0.25]} />
          <meshStandardMaterial color={appearance.robeColor} flatShading />
        </mesh>
      )}

      {/* Weapon */}
      {appearance.hasWeapon === 'sword' && (
        <mesh position={[body.width / 2 + 0.2, torsoY + 0.1, -0.1]} rotation={[0.3, 0, 0.1]}>
          <boxGeometry args={[0.04, 0.8, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </mesh>
      )}
      {appearance.hasWeapon === 'staff' && (
        <mesh position={[body.width / 2 + 0.15, torsoY, -0.05]} rotation={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.03, 0.03, body.height * 0.9, 6]} />
          <meshStandardMaterial color="#5a3a1a" />
        </mesh>
      )}
    </group>
  );
}
