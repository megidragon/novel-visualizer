import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { NovelProject } from '@novel-visualizer/shared';
import { getProject } from '../api/client.js';
import { usePlayerStore } from '../stores/player-store.js';
import { useGenerationStore } from '../stores/generation-store.js';
import SceneCanvas from '../components/scene/SceneCanvas.js';
import AudioEngine from '../components/player/AudioEngine.js';
import PlayerControls from '../components/player/PlayerControls.js';
import NarrationOverlay from '../components/scene/dialogue/NarrationOverlay.js';
import GenerationProgress from '../components/GenerationProgress.js';

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<NovelProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { scenes, currentSceneIndex, currentTime, isLoading, loadProject } = usePlayerStore();
  const { isGenerating, generate } = useGenerationStore();

  useEffect(() => {
    if (!id) return;
    getProject(id).then(setProject).catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (project?.status === 'ready' && id) {
      loadProject(id);
    }
  }, [project?.status, id, loadProject]);

  if (error) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--error)' }}>{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading project...</p>
      </div>
    );
  }

  // Show generate button for uploaded projects or stale errors
  if (project.status === 'uploaded' || project.status === 'error') {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>{project.title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Style: {project.style}
        </p>
        {project.status === 'error' && project.error && (
          <p style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Previous error: {project.error}
          </p>
        )}
        {project.processedScenes > 0 && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {project.processedScenes} scenes already generated - will resume from there
          </p>
        )}
        <button
          onClick={() => {
            generate(project.id);
            setProject({ ...project, status: 'processing' });
          }}
          style={{
            padding: '1rem 3rem',
            borderRadius: 8,
            background: project.style === 'xinxia' ? 'var(--accent-xinxia)' : 'var(--accent-mysterious)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '1.2rem',
          }}
        >
          {project.processedScenes > 0 ? 'Resume Generation' : 'Generate'}
        </button>
      </div>
    );
  }

  // Show progress during generation (or stale processing - offer to resume)
  if (project.status === 'processing') {
    if (!isGenerating) {
      // Stale processing state - not actually running. Offer to resume.
      return (
        <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>{project.title}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Generation was interrupted ({project.processedScenes}/{project.totalScenes} scenes done)
          </p>
          <button
            onClick={() => {
              generate(project.id);
            }}
            style={{
              padding: '1rem 3rem',
              borderRadius: 8,
              background: project.style === 'xinxia' ? 'var(--accent-xinxia)' : 'var(--accent-mysterious)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1.2rem',
            }}
          >
            Resume Generation
          </button>
        </div>
      );
    }

    return <GenerationProgress project={project} onComplete={() => {
      getProject(project.id).then(setProject);
    }} />;
  }

  // Loading scenes
  if (isLoading || scenes.length === 0) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading scenes...</p>
      </div>
    );
  }

  const currentScene = scenes[currentSceneIndex];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <SceneCanvas scene={currentScene} currentTime={currentTime} />
      <AudioEngine />
      <NarrationOverlay texts={currentScene.texts} currentTime={currentTime} />
      <PlayerControls style={currentScene.style} totalScenes={scenes.length} />
    </div>
  );
}
