import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config.js';
import { ensureDirs } from './services/storage.js';
import { errorHandler } from './middleware/error-handler.js';
import projectsRouter from './routes/projects.js';
import scenesRouter from './routes/scenes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Serve novel assets (audio files, etc.)
app.use('/novels', express.static(config.novelsDir));

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/projects', scenesRouter);

// Error handling
app.use(errorHandler);

async function start() {
  await ensureDirs();
  app.listen(config.port, () => {
    console.log(`[Novel Visualizer] Server running on http://localhost:${config.port}`);
  });
}

start().catch(console.error);
