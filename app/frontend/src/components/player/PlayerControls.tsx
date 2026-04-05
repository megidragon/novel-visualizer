import type { StyleTheme } from '@novel-visualizer/shared';
import { usePlayerStore } from '../../stores/player-store.js';

interface Props {
  style: StyleTheme;
  totalScenes: number;
}

export default function PlayerControls({ style, totalScenes }: Props) {
  const {
    currentSceneIndex,
    isPlaying,
    currentTime,
    scenes,
    togglePlay,
    nextScene,
    prevScene,
  } = usePlayerStore();

  const currentScene = scenes[currentSceneIndex];
  const duration = currentScene?.durationSeconds || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const accent = style === 'xinxia' ? 'var(--accent-xinxia)' : 'var(--accent-mysterious)';

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '1rem 2rem',
      background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 10,
    }}>
      {/* Prev */}
      <button
        onClick={prevScene}
        disabled={currentSceneIndex === 0}
        style={{
          background: 'none',
          color: currentSceneIndex === 0 ? '#444' : '#fff',
          fontSize: '1.2rem',
          padding: '0.5rem',
        }}
      >
        {'<<'}
      </button>

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        style={{
          background: accent,
          color: '#000',
          width: 44,
          height: 44,
          borderRadius: '50%',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isPlaying ? '||' : '>'}
      </button>

      {/* Next */}
      <button
        onClick={nextScene}
        disabled={currentSceneIndex >= totalScenes - 1}
        style={{
          background: 'none',
          color: currentSceneIndex >= totalScenes - 1 ? '#444' : '#fff',
          fontSize: '1.2rem',
          padding: '0.5rem',
        }}
      >
        {'>>'}
      </button>

      {/* Progress bar */}
      <div style={{
        flex: 1,
        height: 4,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(progress, 100)}%`,
          background: accent,
          borderRadius: 2,
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* Time */}
      <span style={{ color: '#aaa', fontSize: '0.8rem', minWidth: 70, textAlign: 'right' }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Scene counter */}
      <span style={{ color: '#666', fontSize: '0.8rem', minWidth: 50, textAlign: 'right' }}>
        {currentSceneIndex + 1}/{totalScenes}
      </span>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
