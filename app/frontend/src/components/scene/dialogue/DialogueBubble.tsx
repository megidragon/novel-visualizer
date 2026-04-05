import { Html } from '@react-three/drei';
import type { DialogueEntry } from '@novel-visualizer/shared';
import './bubble-styles.css';

interface Props {
  entry: DialogueEntry;
  position: [number, number, number];
}

export default function DialogueBubble({ entry, position }: Props) {
  const isThought = entry.type === 'thought';
  const bubbleClass = isThought ? 'thought-bubble' : 'speech-bubble';

  return (
    <group position={position}>
      <Html center distanceFactor={8} zIndexRange={[100, 0]}>
        <div className={`bubble ${bubbleClass}`}>
          {entry.character && (
            <span className="speaker-name" style={{ color: nameToColor(entry.character) }}>
              {entry.character}
            </span>
          )}
          <p className="bubble-text">{entry.text}</p>
          <div className="bubble-tail" />
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
