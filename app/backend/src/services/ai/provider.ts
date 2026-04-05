import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config, type AiProvider } from '../../config.js';
import { queryClaudeCli, type CliOptions } from './claude-cli.js';

/**
 * Unified AI provider that routes to the configured backend.
 * All providers return plain text responses.
 */
export async function queryAi(
  prompt: string,
  systemPrompt?: string,
  options?: CliOptions,
): Promise<string> {
  switch (config.aiProvider) {
    case 'claude-cli':
      return queryClaudeCli(prompt, systemPrompt, options);
    case 'claude-api':
      return queryClaudeApi(prompt, systemPrompt);
    case 'openrouter':
      return queryOpenAiCompat(prompt, systemPrompt, config.openrouterBaseUrl, config.openrouterApiKey);
    case 'lmstudio':
      return queryOpenAiCompat(prompt, systemPrompt, `${config.lmstudioBaseUrl}/v1`, 'lm-studio');
    default:
      throw new Error(`Unknown AI provider: ${config.aiProvider}`);
  }
}

/**
 * Sends a prompt, extracts JSON from the response.
 */
export async function queryAiJson<T>(
  prompt: string,
  systemPrompt?: string,
  options?: CliOptions,
): Promise<T> {
  const result = await queryAi(prompt, systemPrompt, options);

  const jsonMatch =
    result.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    result.match(/(\[[\s\S]*\])/) ||
    result.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    console.error(`[AI] No JSON found in response:\n${result.slice(0, 1000)}`);
    throw new Error(`No JSON in AI response: ${result.slice(0, 200)}`);
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error(`[AI] JSON parse failed:\n${jsonStr.slice(0, 500)}`);
    throw err;
  }
}

// --- Provider implementations ---

async function queryClaudeApi(prompt: string, systemPrompt?: string): Promise<string> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  console.log(`[ClaudeAPI] Sending prompt (${prompt.length} chars)...`);

  const response = await client.messages.create({
    model: config.aiModel,
    max_tokens: config.aiMaxTokens,
    system: systemPrompt || undefined,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  console.log(`[ClaudeAPI] OK (${text.length} chars)`);
  return text;
}

async function queryOpenAiCompat(
  prompt: string,
  systemPrompt?: string,
  baseURL?: string,
  apiKey?: string,
): Promise<string> {
  const client = new OpenAI({ apiKey: apiKey || 'none', baseURL });
  const providerName = baseURL?.includes('openrouter') ? 'OpenRouter' : 'LMStudio';

  console.log(`[${providerName}] Sending prompt (${prompt.length} chars)...`);

  const messages: OpenAI.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.completions.create({
    model: config.aiModel,
    max_tokens: config.aiMaxTokens,
    messages,
  });

  const text = response.choices[0]?.message?.content || '';
  const finishReason = response.choices[0]?.finish_reason;
  console.log(`[${providerName}] OK (${text.length} chars, finish: ${finishReason})`);

  if (finishReason === 'length') {
    console.warn(`[${providerName}] WARNING: Response was truncated (hit max_tokens). Output may be incomplete.`);
  }

  return text;
}
