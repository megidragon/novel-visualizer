import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(fileURLToPath(import.meta.url), '../../../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  openrouterApiKey: required('OPENROUTER_API_KEY'),
  model: process.env.CLAUDE_MODEL || 'anthropic/claude-opus-4',
  openrouterBaseUrl: 'https://openrouter.ai/api/v1',
  piperPath: process.env.PIPER_EXECUTABLE_PATH || 'piper',
  piperModelPath: process.env.PIPER_MODEL_PATH || '',
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  novelsDir: path.resolve(fileURLToPath(import.meta.url), '../../../../novels'),
} as const;
