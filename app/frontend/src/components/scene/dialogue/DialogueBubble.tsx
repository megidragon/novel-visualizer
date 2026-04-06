import { Html } from '@react-three/drei';
import type { DialogueEntry } from '@novel-visualizer/shared';
import './bubble-styles.css';

interface Props {
  entry: DialogueEntry;
  position: [number, number, number];
}

const MAX_TEXT_LENGTH = 120;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

export default function DialogueBubble({ entry, position }: Props) {
  const isThought = entry.type === 'thought';

  return (
    <group position={position}>
      <Html
        center
        sprite
        distanceFactor={undefined}
        style={{
          transform: 'scale(1.44)',
          transformOrigin: 'center bottom',
          pointerEvents: 'none',
        }}
        zIndexRange={[100, 0]}
      >
        <div className="bubble-wrapper">
          <div className={`bubble-box ${isThought ? 'thought' : 'speech'}`}>
            {entry.character && (
              <span className="speaker-name" style={{ color: nameToColor(entry.character) }}>
                {entry.character}
              </span>
            )}
            <p className="bubble-text">{truncate(entry.text, MAX_TEXT_LENGTH)}</p>
          </div>
          <div className={`bubble-tail ${isThought ? 'tail-thought' : 'tail-speech'}`} />
        </div>
      </Html>
    </group>
  );
}

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 65%)`;
}
