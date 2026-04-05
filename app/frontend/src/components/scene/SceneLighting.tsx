import { useMemo } from 'react';
import type { LightingSpec, StyleTheme } from '@novel-visualizer/shared';

interface Props {
  spec: LightingSpec;
  style: StyleTheme;
}

const LIGHTING_PRESETS: Record<string, { ambient: string; directional: string; ambientIntensity: number }> = {
  dawn: { ambient: '#ffd4a3', directional: '#ff8c42', ambientIntensity: 0.4 },
  day: { ambient: '#ffffff', directional: '#fffae6', ambientIntensity: 0.6 },
  dusk: { ambient: '#d4789c', directional: '#ff6b35', ambientIntensity: 0.3 },
  night: { ambient: '#1a1a3e', directional: '#4a4a8a', ambientIntensity: 0.2 },
  mystical: { ambient: '#6b4c9a', directional: '#d4a3ff', ambientIntensity: 0.35 },
  ominous: { ambient: '#1a0a2e', directional: '#4a2a6a', ambientIntensity: 0.15 },
};

export default function SceneLighting({ spec, style }: Props) {
  const preset = LIGHTING_PRESETS[spec.type] || LIGHTING_PRESETS.day;

  const dirPos = useMemo(() => {
    const angle = (spec.directionalAngle * Math.PI) / 180;
    return [Math.cos(angle) * 8, 8, Math.sin(angle) * 8] as [number, number, number];
  }, [spec.directionalAngle]);

  const ambientColor = style === 'xinxia'
    ? preset.ambient
    : spec.type === 'mystical' || spec.type === 'ominous'
      ? preset.ambient
      : '#2a2a4e';

  return (
    <>
      <ambientLight color={ambientColor} intensity={preset.ambientIntensity * spec.intensity} />
      <directionalLight
        position={dirPos}
        color={preset.directional}
        intensity={spec.intensity}
        castShadow
      />
      {style === 'mysterious' && (
        <fog attach="fog" args={['#0a0a1a', 8, 25]} />
      )}
    </>
  );
}
