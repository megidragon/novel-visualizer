import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import type { SceneSpec } from '@novel-visualizer/shared';
import SceneLighting from './SceneLighting.js';
import EnvironmentFactory from './environments/EnvironmentFactory.js';
import ProceduralCharacter from './characters/ProceduralCharacter.js';
import PropFactory from './props/PropFactory.js';
import DialogueBubbleManager from './dialogue/DialogueBubbleManager.js';
import ParticleSystem from './effects/ParticleSystem.js';

interface Props {
  scene: SceneSpec;
  currentTime: number;
}

export default function SceneCanvas({ scene, currentTime }: Props) {
  return (
    <Canvas style={{ position: 'absolute', inset: 0 }}>
      <OrthographicCamera
        makeDefault
        position={[10, 10, 10]}
        zoom={50}
        near={0.1}
        far={100}
      />
      <SceneLighting spec={scene.environment.lighting} style={scene.style} />
      <EnvironmentFactory spec={scene.environment} style={scene.style} />
      {scene.environment.props.map((prop, i) => (
        <PropFactory key={i} spec={prop} style={scene.style} />
      ))}
      {scene.characters.map((char) => (
        <ProceduralCharacter key={char.name} spec={char} style={scene.style} />
      ))}
      <DialogueBubbleManager
        texts={scene.texts}
        characters={scene.characters}
        currentTime={currentTime}
      />
      <ParticleSystem environment={scene.environment} style={scene.style} />
    </Canvas>
  );
}
