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

  // Show generate button for uploaded projects
  if (project.status === 'uploaded') {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>{project.title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Style: {project.style}
        </p>
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
          Generate
        </button>
      </div>
    );
  }

  // Show progress during generation
  if (project.status === 'processing' || isGenerating) {
    return <GenerationProgress project={project} onComplete={() => {
      getProject(project.id).then(setProject);
    }} />;
  }

  // Show error state
  if (project.status === 'error') {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>Generation failed</p>
        <p style={{ color: 'var(--text-secondary)' }}>{project.error}</p>
      </div>
    );
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
