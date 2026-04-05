import { useEffect } from 'react';
import type { NovelProject } from '@novel-visualizer/shared';
import { useGenerationStore } from '../stores/generation-store.js';

interface Props {
  project: NovelProject;
  onComplete: () => void;
}

export default function GenerationProgress({ project, onComplete }: Props) {
  const { progress, isGenerating, error, generate } = useGenerationStore();

  useEffect(() => {
    if (!isGenerating && !progress && !error) {
      generate(project.id);
    }
  }, [project.id, isGenerating, progress, error, generate]);

  useEffect(() => {
    if (progress?.phase === 'complete') {
      setTimeout(onComplete, 1000);
    }
  }, [progress?.phase, onComplete]);

  const pct = progress?.totalScenes && progress.currentScene
    ? Math.round((progress.currentScene / progress.totalScenes) * 100)
    : 0;

  return (
    <div className="page" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h2 style={{ marginBottom: '0.5rem' }}>{project.title}</h2>
      <p style={{
        color: 'var(--text-secondary)',
        marginBottom: '2rem',
        fontSize: '0.9rem',
      }}>
        {progress?.message || 'Starting generation...'}
      </p>

      {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

      <div style={{
        width: '100%',
        maxWidth: 400,
        height: 6,
        background: 'var(--bg-card)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct || 5}%`,
          background: project.style === 'xinxia' ? 'var(--accent-xinxia)' : 'var(--accent-mysterious)',
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {progress?.totalScenes && (
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          marginTop: '0.75rem',
        }}>
          {progress.currentScene || 0} / {progress.totalScenes} scenes
        </p>
      )}
    </div>
  );
}
