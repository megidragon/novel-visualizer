import type {
  NovelProject,
  SceneSpec,
  StyleTheme,
  ProgressEvent,
} from '@novel-visualizer/shared';

const BASE = '/api';

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function uploadNovel(file: File, style: StyleTheme): Promise<NovelProject> {
  const form = new FormData();
  form.append('pdf', file);
  form.append('style', style);
  const { project } = await json<{ project: NovelProject }>('/projects/upload', {
    method: 'POST',
    body: form,
  });
  return project;
}

export async function listProjects(): Promise<NovelProject[]> {
  const { projects } = await json<{ projects: NovelProject[] }>('/projects');
  return projects;
}

export async function getProject(id: string): Promise<NovelProject> {
  const { project } = await json<{ project: NovelProject }>(`/projects/${id}`);
  return project;
}

export async function startGeneration(id: string): Promise<void> {
  await json(`/projects/${id}/generate`, { method: 'POST' });
}

export async function getSceneSpec(projectId: string, seq: number): Promise<SceneSpec> {
  const { scene } = await json<{ scene: SceneSpec }>(`/projects/${projectId}/scenes/${seq}`);
  return scene;
}

export async function getAllScenes(projectId: string): Promise<SceneSpec[]> {
  const { scenes: summaries } = await json<{ scenes: { sequence: number }[] }>(
    `/projects/${projectId}/scenes`,
  );
  const scenes: SceneSpec[] = [];
  for (const s of summaries) {
    scenes.push(await getSceneSpec(projectId, s.sequence));
  }
  return scenes;
}

export function getSceneAudioUrl(projectId: string, seq: number): string {
  return `${BASE}/projects/${projectId}/scenes/${seq}/audio`;
}

export function subscribeToProgress(
  projectId: string,
  onEvent: (event: ProgressEvent) => void,
): () => void {
  const es = new EventSource(`${BASE}/projects/${projectId}/status`);
  es.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch { /* ignore parse errors */ }
  };
  return () => es.close();
}
