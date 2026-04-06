import { useCallback, useRef } from 'react';
import type { StyleTheme } from '@novel-visualizer/shared';
import { usePlayerStore } from '../../stores/player-store.js';

interface Props {
  style: StyleTheme;
  totalScenes: number;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayerControls({ style, totalScenes }: Props) {
  const {
    currentSceneIndex,
    isPlaying,
    currentTime,
    scenes,
    volume,
    playbackRate,
    togglePlay,
    nextScene,
    prevScene,
    seekTo,
    setVolume,
    setPlaybackRate,
  } = usePlayerStore();

  const progressRef = useRef<HTMLDivElement>(null);

  const currentScene = scenes[currentSceneIndex];
  const duration = currentScene?.durationSeconds || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const accent = style === 'xinxia' ? 'var(--accent-xinxia)' : 'var(--accent-mysterious)';

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    if (!bar || duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(pct * duration);
  }, [duration, seekTo]);

  const cycleSpeed = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(playbackRate);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setPlaybackRate(next);
  }, [playbackRate, setPlaybackRate]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '0.8rem 2rem 1rem',
      background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      {/* Progress bar (clickable) */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        style={{
          width: '100%',
          height: 6,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 3,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{
          height: '100%',
          width: `${Math.min(progress, 100)}%`,
          background: accent,
          borderRadius: 3,
          transition: 'width 0.1s linear',
        }} />
        {/* Scrubber dot */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${Math.min(progress, 100)}%`,
          transform: 'translate(-50%, -50%)',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
        }} />
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Prev */}
        <button
          onClick={prevScene}
          disabled={currentSceneIndex === 0}
          style={btnStyle(currentSceneIndex === 0)}
        >
          {'<<'}
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          style={{
            background: accent,
            color: '#000',
            width: 40,
            height: 40,
            borderRadius: '50%',
            fontSize: '1rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPlaying ? '||' : '\u25B6'}
        </button>

        {/* Next */}
        <button
          onClick={nextScene}
          disabled={currentSceneIndex >= totalScenes - 1}
          style={btnStyle(currentSceneIndex >= totalScenes - 1)}
        >
          {'>>'}
        </button>

        {/* Time */}
        <span style={{ color: '#aaa', fontSize: '0.8rem', minWidth: 80 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Speed */}
        <button
          onClick={cycleSpeed}
          title="Playback speed"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#ccc',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: '0.75rem',
            fontWeight: 600,
            minWidth: 40,
            textAlign: 'center',
          }}
        >
          {playbackRate}x
        </button>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 1)}
            style={{ background: 'none', color: '#aaa', fontSize: '0.9rem', padding: '0 2px' }}
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? '\uD83D\uDD07' : volume < 0.5 ? '\uD83D\uDD09' : '\uD83D\uDD0A'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: 70, accentColor: accent, cursor: 'pointer' }}
          />
        </div>

        {/* Scene counter */}
        <span style={{ color: '#666', fontSize: '0.8rem' }}>
          {currentSceneIndex + 1}/{totalScenes}
        </span>
      </div>
    </div>
  );
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'none',
    color: disabled ? '#444' : '#fff',
    fontSize: '1.1rem',
    padding: '0.3rem',
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
