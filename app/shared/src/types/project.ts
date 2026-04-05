import type { StyleTheme } from './scene.js';

export interface NovelProject {
  id: string;
  title: string;
  pdfFileName: string;
  style: StyleTheme;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  totalScenes: number;
  processedScenes: number;
  createdAt: string;
  error?: string;
}
