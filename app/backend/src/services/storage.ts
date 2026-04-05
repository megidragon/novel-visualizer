import fs from 'fs/promises';
import path from 'path';
import type { NovelProject, SceneSpec } from '@novel-visualizer/shared';
import { config } from '../config.js';

const pdfsDir = path.join(config.novelsDir, 'pdfs');
const projectsDir = path.join(config.novelsDir, 'projects');
const tempDir = path.join(config.novelsDir, 'temp');

export async function ensureDirs() {
  await fs.mkdir(pdfsDir, { recursive: true });
  await fs.mkdir(projectsDir, { recursive: true });
  await fs.mkdir(tempDir, { recursive: true });
}

export async function createProjectDir(id: string): Promise<string> {
  const dir = path.join(projectsDir, id);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function getProjectDir(id: string): string {
  return path.join(projectsDir, id);
}

export function getPdfPath(id: string): string {
  return path.join(pdfsDir, `${id}.pdf`);
}

export function getTempDir(): string {
  return tempDir;
}

export async function saveProjectMeta(project: NovelProject): Promise<void> {
  const dir = path.join(projectsDir, project.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'metadata.json'), JSON.stringify(project, null, 2));
}

export async function readProjectMeta(id: string): Promise<NovelProject> {
  const raw = await fs.readFile(path.join(projectsDir, id, 'metadata.json'), 'utf-8');
  return JSON.parse(raw);
}

export async function saveSceneJson(projectId: string, seq: number, scene: SceneSpec): Promise<void> {
  const filePath = path.join(projectsDir, projectId, `scene_${String(seq).padStart(3, '0')}.json`);
  await fs.writeFile(filePath, JSON.stringify(scene, null, 2));
}

export async function readSceneJson(projectId: string, seq: number): Promise<SceneSpec> {
  const filePath = path.join(projectsDir, projectId, `scene_${String(seq).padStart(3, '0')}.json`);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function getSceneAudioPath(projectId: string, seq: number): string {
  return path.join(projectsDir, projectId, `scene_${String(seq).padStart(3, '0')}.mp3`);
}

export async function listProjects(): Promise<NovelProject[]> {
  try {
    const entries = await fs.readdir(projectsDir, { withFileTypes: true });
    const projects: NovelProject[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const meta = await readProjectMeta(entry.name);
        projects.push(meta);
      } catch {
        // skip directories without valid metadata
      }
    }
    return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function listSceneFiles(projectId: string): Promise<number[]> {
  const dir = path.join(projectsDir, projectId);
  const files = await fs.readdir(dir);
  return files
    .filter(f => f.startsWith('scene_') && f.endsWith('.json'))
    .map(f => parseInt(f.replace('scene_', '').replace('.json', ''), 10))
    .sort((a, b) => a - b);
}
