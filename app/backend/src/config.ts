import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(fileURLToPath(import.meta.url), '../../../../.env') });

export type AiProvider = 'claude-cli' | 'claude-api' | 'openrouter' | 'lmstudio';

const AI_PROVIDER = (process.env.AI_PROVIDER || 'claude-cli') as AiProvider;
const VALID_PROVIDERS: AiProvider[] = ['claude-cli', 'claude-api', 'openrouter', 'lmstudio'];
if (!VALID_PROVIDERS.includes(AI_PROVIDER)) {
  throw new Error(`Invalid AI_PROVIDER "${AI_PROVIDER}". Must be one of: ${VALID_PROVIDERS.join(', ')}`);
}

function requiredForProvider(key: string, ...providers: AiProvider[]): string {
  if (providers.includes(AI_PROVIDER)) {
    const val = process.env[key];
    if (!val) throw new Error(`AI_PROVIDER="${AI_PROVIDER}" requires env var: ${key}`);
    return val;
  }
  return process.env[key] || '';
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),

  // AI Provider
  aiProvider: AI_PROVIDER,
  aiModel: process.env.AI_MODEL || 'claude-opus-4-6',

  // Claude API (direct Anthropic)
  anthropicApiKey: requiredForProvider('ANTHROPIC_API_KEY', 'claude-api'),

  // OpenRouter
  openrouterApiKey: requiredForProvider('OPENROUTER_API_KEY', 'openrouter'),
  openrouterBaseUrl: 'https://openrouter.ai/api/v1',

  // LM Studio
  lmstudioBaseUrl: process.env.LMSTUDIO_BASE_URL || 'http://127.0.0.1:1234',

  // Max tokens for AI response
  aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS || '16384', 10),

  // Piper TTS
  piperPath: process.env.PIPER_EXECUTABLE_PATH || 'piper',
  piperModelPath: process.env.PIPER_MODEL_PATH || '',
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',

  novelsDir: path.resolve(fileURLToPath(import.meta.url), '../../../../novels'),
} as const;

console.log(`[Config] AI Provider: ${config.aiProvider}, Model: ${config.aiModel}`);
