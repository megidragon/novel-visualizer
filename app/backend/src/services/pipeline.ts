import type { NovelProject, ProgressEvent } from '@novel-visualizer/shared';
import * as storage from './storage.js';
import { extractFullText } from './pdf-reader.js';
import { NovelAgent } from './ai/agent.js';
import { PiperTTS } from './tts/piper.js';
import { reconcileTiming } from './tts/timing.js';

type ProgressCallback = (event: ProgressEvent) => void;

export async function runPipeline(project: NovelProject, onProgress: ProgressCallback): Promise<void> {
  const pdfPath = storage.getPdfPath(project.id);

  // Step 1: Extract text
  onProgress({ phase: 'reading', message: 'Reading novel PDF...' });
  const fullText = await extractFullText(pdfPath);

  // Step 2: Run AI agent to split into acts and design scenes
  const agent = new NovelAgent(project.id, pdfPath, project.style, fullText);

  onProgress({ phase: 'splitting', message: 'Analyzing novel structure and identifying acts...' });
  const acts = await agent.splitIntoActs();

  project.totalScenes = acts.length;
  await storage.saveProjectMeta(project);

  onProgress({
    phase: 'designing',
    message: `Designing ${acts.length} scenes...`,
    totalScenes: acts.length,
    currentScene: 0,
  });

  const tts = new PiperTTS();
  const scenes = [];

  for (let i = 0; i < acts.length; i++) {
    // Step 3: Design scene
    onProgress({
      phase: 'designing',
      message: `Designing scene ${i + 1}/${acts.length}...`,
      currentScene: i + 1,
      totalScenes: acts.length,
    });

    const sceneSpec = await agent.designScene(acts[i], i, scenes);

    // Step 4: Generate audio
    onProgress({
      phase: 'audio',
      message: `Generating audio for scene ${i + 1}/${acts.length}...`,
      currentScene: i + 1,
      totalScenes: acts.length,
    });

    const audioPath = storage.getSceneAudioPath(project.id, i + 1);
    const { durationSeconds, texts } = await tts.synthesizeScene(sceneSpec.texts, audioPath);

    // Step 5: Reconcile timing and save
    const finalScene = {
      ...sceneSpec,
      texts: reconcileTiming(texts),
      audioFile: `scene_${String(i + 1).padStart(3, '0')}.mp3`,
      durationSeconds,
    };

    await storage.saveSceneJson(project.id, i + 1, finalScene);
    scenes.push(finalScene);

    project.processedScenes = i + 1;
    await storage.saveProjectMeta(project);
  }

  // Done
  project.status = 'ready';
  await storage.saveProjectMeta(project);
  onProgress({
    phase: 'complete',
    message: `Generation complete! ${scenes.length} scenes ready.`,
    totalScenes: scenes.length,
    currentScene: scenes.length,
  });
}
