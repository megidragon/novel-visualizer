import { Router } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import type { NovelProject, StyleTheme, ProgressEvent } from '@novel-visualizer/shared';
import * as storage from '../services/storage.js';
import { AppError } from '../middleware/error-handler.js';
import { runPipeline } from '../services/pipeline.js';

const upload = multer({ dest: storage.getTempDir() });
const router = Router();

// Active SSE connections per project
const sseClients = new Map<string, Set<(event: ProgressEvent) => void>>();

export function emitProgress(projectId: string, event: ProgressEvent) {
  const clients = sseClients.get(projectId);
  if (clients) {
    for (const send of clients) send(event);
  }
}

// POST /api/projects/upload
router.post('/upload', upload.single('pdf'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'No PDF file provided');

    const style = (req.body.style as StyleTheme) || 'xinxia';
    if (style !== 'xinxia' && style !== 'mysterious') {
      throw new AppError(400, 'Style must be "xinxia" or "mysterious"');
    }

    const id = uuid();
    const pdfDest = storage.getPdfPath(id);
    await fs.rename(req.file.path, pdfDest);
    await storage.createProjectDir(id);

    const project: NovelProject = {
      id,
      title: req.file.originalname.replace('.pdf', ''),
      pdfFileName: req.file.originalname,
      style,
      status: 'uploaded',
      totalScenes: 0,
      processedScenes: 0,
      createdAt: new Date().toISOString(),
    };

    await storage.saveProjectMeta(project);
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects
router.get('/', async (_req, res, next) => {
  try {
    const projects = await storage.listProjects();
    res.json({ projects });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res, next) => {
  try {
    const project = await storage.readProjectMeta(req.params.id);
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/generate
router.post('/:id/generate', async (req, res, next) => {
  try {
    const project = await storage.readProjectMeta(req.params.id);

    // Allow re-generate for stale processing, error, or uploaded status
    // Only block if there's an active pipeline running in this process
    if (project.status === 'ready') {
      res.json({ status: 'ready' });
      return;
    }

    project.status = 'processing';
    project.error = undefined;
    await storage.saveProjectMeta(project);
    res.json({ status: 'processing' });

    // Run pipeline in background
    runPipeline(project, (event) => emitProgress(project.id, event)).catch(async (err) => {
      console.error('[Pipeline Error]', err);
      project.status = 'error';
      project.error = err.message;
      await storage.saveProjectMeta(project);
      emitProgress(project.id, { phase: 'error', message: err.message });
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/status (SSE)
router.get('/:id/status', (req, res) => {
  const projectId = req.params.id;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (event: ProgressEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  if (!sseClients.has(projectId)) {
    sseClients.set(projectId, new Set());
  }
  sseClients.get(projectId)!.add(send);

  req.on('close', () => {
    sseClients.get(projectId)?.delete(send);
    if (sseClients.get(projectId)?.size === 0) {
      sseClients.delete(projectId);
    }
  });
});

export default router;
