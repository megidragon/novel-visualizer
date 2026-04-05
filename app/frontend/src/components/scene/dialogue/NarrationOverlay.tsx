import type { DialogueEntry } from '@novel-visualizer/shared';

interface Props {
  texts: DialogueEntry[];
  currentTime: number;
}

export default function NarrationOverlay({ texts, currentTime }: Props) {
  const activeNarration = texts.find(
    (t) => t.type === 'narration' && currentTime >= t.startTime && currentTime <= t.endTime,
  );

  if (!activeNarration) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: 600,
      padding: '0.75rem 1.5rem',
      background: 'rgba(0, 0, 0, 0.75)',
      borderRadius: 8,
      color: '#e0e0e0',
      fontSize: '0.95rem',
      lineHeight: 1.5,
      textAlign: 'center',
      backdropFilter: 'blur(4px)',
      zIndex: 5,
      animation: 'fadeIn 0.3s ease',
    }}>
      {activeNarration.text}
    </div>
  );
}
