import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import * as storage from '../services/storage.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();

// GET /api/projects/:id/scenes
router.get('/:id/scenes', async (req, res, next) => {
  try {
    const sequences = await storage.listSceneFiles(req.params.id);
    const scenes = [];
    for (const seq of sequences) {
      const scene = await storage.readSceneJson(req.params.id, seq);
      scenes.push({
        id: scene.id,
        sequence: scene.sequence,
        durationSeconds: scene.durationSeconds,
      });
    }
    res.json({ scenes });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/scenes/:seq
router.get('/:id/scenes/:seq', async (req, res, next) => {
  try {
    const seq = parseInt(req.params.seq, 10);
    if (isNaN(seq)) throw new AppError(400, 'Invalid scene sequence');
    const scene = await storage.readSceneJson(req.params.id, seq);
    res.json({ scene });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/scenes/:seq/audio
router.get('/:id/scenes/:seq/audio', (req, res, next) => {
  try {
    const seq = parseInt(req.params.seq, 10);
    if (isNaN(seq)) throw new AppError(400, 'Invalid scene sequence');

    const audioPath = storage.getSceneAudioPath(req.params.id, seq);
    const stat = fs.statSync(audioPath);

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });

    const stream = fs.createReadStream(audioPath);
    stream.pipe(res);
    stream.on('error', next);
  } catch (err) {
    next(err);
  }
});

export default router;
