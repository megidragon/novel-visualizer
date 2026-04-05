import fs from 'fs/promises';
import path from 'path';
import type { NovelProject, ProgressEvent, SceneSpec } from '@novel-visualizer/shared';
import * as storage from './storage.js';
import { extractFullText } from './pdf-reader.js';
import { NovelAgent } from './ai/agent.js';
import { PiperTTS } from './tts/piper.js';
import { reconcileTiming } from './tts/timing.js';
import type { Act } from './ai/act-splitter.js';

type ProgressCallback = (event: ProgressEvent) => void;

interface PipelineCheckpoint {
  acts: Act[];
  characterRegistry: unknown[];
  completedScenes: number;
}

function checkpointPath(projectId: string): string {
  return path.join(storage.getProjectDir(projectId), 'checkpoint.json');
}

async function saveCheckpoint(projectId: string, checkpoint: PipelineCheckpoint): Promise<void> {
  await fs.writeFile(checkpointPath(projectId), JSON.stringify(checkpoint, null, 2));
}

async function loadCheckpoint(projectId: string): Promise<PipelineCheckpoint | null> {
  try {
    const raw = await fs.readFile(checkpointPath(projectId), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function removeCheckpoint(projectId: string): Promise<void> {
  await fs.unlink(checkpointPath(projectId)).catch(() => {});
}

export async function runPipeline(project: NovelProject, onProgress: ProgressCallback): Promise<void> {
  const pdfPath = storage.getPdfPath(project.id);

  // Check for existing checkpoint to resume from
  const existing = await loadCheckpoint(project.id);

  let acts: Act[];
  let startFromScene: number;
  const scenes: SceneSpec[] = [];

  if (existing && existing.completedScenes > 0) {
    // Resume from checkpoint
    acts = existing.acts;
    startFromScene = existing.completedScenes;
    console.log(`[Pipeline] Resuming project ${project.id} from scene ${startFromScene + 1}/${acts.length}`);

    onProgress({
      phase: 'designing',
      message: `Resuming from scene ${startFromScene + 1}/${acts.length}...`,
      totalScenes: acts.length,
      currentScene: startFromScene,
    });

    // Reload already completed scenes
    for (let i = 1; i <= startFromScene; i++) {
      try {
        const scene = await storage.readSceneJson(project.id, i);
        scenes.push(scene);
      } catch {
        // Scene file missing, re-generate from this point
        startFromScene = i - 1;
        console.warn(`[Pipeline] Scene ${i} missing, resuming from ${startFromScene}`);
        break;
      }
    }
  } else {
    // Fresh start
    onProgress({ phase: 'reading', message: 'Reading novel PDF...' });
    const fullText = await extractFullText(pdfPath);

    const agent = new NovelAgent(project.id, pdfPath, project.style, fullText);

    onProgress({ phase: 'splitting', message: 'Analyzing novel structure and identifying acts...' });
    acts = await agent.splitIntoActs();
    startFromScene = 0;

    // Save checkpoint with acts so we don't re-analyze if it fails during scene design
    await saveCheckpoint(project.id, { acts, characterRegistry: [], completedScenes: 0 });
    console.log(`[Pipeline] Split into ${acts.length} acts, checkpoint saved`);
  }

  project.totalScenes = acts.length;
  project.processedScenes = startFromScene;
  await storage.saveProjectMeta(project);

  onProgress({
    phase: 'designing',
    message: `Designing ${acts.length} scenes (starting from ${startFromScene + 1})...`,
    totalScenes: acts.length,
    currentScene: startFromScene,
  });

  // Re-create agent for scene design (uses full text for context)
  const fullText = await extractFullText(pdfPath);
  const agent = new NovelAgent(project.id, pdfPath, project.style, fullText);
  const tts = new PiperTTS();

  for (let i = startFromScene; i < acts.length; i++) {
    console.log(`[Pipeline] Scene ${i + 1}/${acts.length}: designing...`);
    onProgress({
      phase: 'designing',
      message: `Designing scene ${i + 1}/${acts.length}...`,
      currentScene: i + 1,
      totalScenes: acts.length,
    });

    const sceneSpec = await agent.designScene(acts[i], i, scenes);

    console.log(`[Pipeline] Scene ${i + 1}/${acts.length}: generating audio...`);
    onProgress({
      phase: 'audio',
      message: `Generating audio for scene ${i + 1}/${acts.length}...`,
      currentScene: i + 1,
      totalScenes: acts.length,
    });

    const audioPath = storage.getSceneAudioPath(project.id, i + 1);
    const { durationSeconds, texts } = await tts.synthesizeScene(sceneSpec.texts, audioPath);

    const finalScene = {
      ...sceneSpec,
      texts: reconcileTiming(texts),
      audioFile: `scene_${String(i + 1).padStart(3, '0')}.mp3`,
      durationSeconds,
    };

    await storage.saveSceneJson(project.id, i + 1, finalScene);
    scenes.push(finalScene);

    // Update checkpoint after each scene
    project.processedScenes = i + 1;
    await storage.saveProjectMeta(project);
    await saveCheckpoint(project.id, { acts, characterRegistry: [], completedScenes: i + 1 });

    console.log(`[Pipeline] Scene ${i + 1}/${acts.length}: done`);
  }

  // All done - remove checkpoint
  await removeCheckpoint(project.id);
  project.status = 'ready';
  await storage.saveProjectMeta(project);
  onProgress({
    phase: 'complete',
    message: `Generation complete! ${scenes.length} scenes ready.`,
    totalScenes: scenes.length,
    currentScene: scenes.length,
  });

  console.log(`[Pipeline] Project ${project.id} complete: ${scenes.length} scenes`);
}
