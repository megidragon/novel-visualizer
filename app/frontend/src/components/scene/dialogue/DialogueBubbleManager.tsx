import type { DialogueEntry, CharacterPlacement } from '@novel-visualizer/shared';
import DialogueBubble from './DialogueBubble.js';

interface Props {
  texts: DialogueEntry[];
  characters: CharacterPlacement[];
  currentTime: number;
}

const BODY_HEIGHTS: Record<string, number> = {
  male_tall: 1.9,
  male_average: 1.7,
  female_tall: 1.75,
  female_average: 1.6,
  elder: 1.55,
  child: 1.1,
};

export default function DialogueBubbleManager({ texts, characters, currentTime }: Props) {
  // Filter active dialogue/thought entries (not narration)
  const activeBubbles = texts.filter((t) => {
    if (t.type === 'narration') return false;
    const displayTime = Math.max(0, t.startTime - 2); // 2s before audio
    return currentTime >= displayTime && currentTime <= t.endTime;
  });

  return (
    <>
      {activeBubbles.map((entry, i) => {
        const char = characters.find((c) => c.name === entry.character);
        if (!char) return null;

        const headHeight = BODY_HEIGHTS[char.appearance.bodyType] || 1.7;

        return (
          <DialogueBubble
            key={`${entry.character}-${entry.startTime}-${i}`}
            entry={entry}
            position={[
              char.position.x,
              char.position.y + headHeight + 1.2,
              char.position.z,
            ]}
          />
        );
      })}
    </>
  );
}
