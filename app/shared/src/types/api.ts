import type { NovelProject } from './project.js';
import type { SceneSpec, StyleTheme } from './scene.js';

// Requests
export interface UploadRequest {
  style: StyleTheme;
  // PDF file sent as multipart form data
}

export interface GenerateRequest {
  projectId: string;
}

// Responses
export interface UploadResponse {
  project: NovelProject;
}

export interface ProjectListResponse {
  projects: NovelProject[];
}

export interface ProjectResponse {
  project: NovelProject;
}

export interface SceneListResponse {
  scenes: Pick<SceneSpec, 'id' | 'sequence' | 'durationSeconds'>[];
}

export interface SceneResponse {
  scene: SceneSpec;
}

// SSE Progress Events
export interface ProgressEvent {
  phase: 'reading' | 'splitting' | 'designing' | 'audio' | 'complete' | 'error';
  currentScene?: number;
  totalScenes?: number;
  message: string;
}
