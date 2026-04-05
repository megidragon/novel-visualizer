import { spawn } from 'child_process';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { config } from '../../config.js';

interface ClaudeCliResponse {
  type: string;
  subtype: string;
  is_error: boolean;
  result: string;
  duration_ms: number;
}

/**
 * Calls Claude Code CLI in non-interactive mode.
 * Writes prompt to a temp file and pipes it via stdin to avoid
 * Windows command-line length limits.
 */
export async function queryClaudeCli(prompt: string, systemPrompt?: string): Promise<string> {
  console.log(`[ClaudeCLI] Sending prompt (${prompt.length} chars)...`);

  // Combine system prompt + user prompt into one text to avoid
  // Windows command-line argument length limits
  const fullPrompt = systemPrompt
    ? `<system>\n${systemPrompt}\n</system>\n\n${prompt}`
    : prompt;

  // Write to temp file and pipe via stdin
  const tempDir = path.join(config.novelsDir, 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  const tempFile = path.join(tempDir, `prompt_${uuid()}.txt`);
  await fs.writeFile(tempFile, fullPrompt, 'utf-8');

  const args = ['--output-format', 'json', '--allowedTools', ''];

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      // Strip ANTHROPIC_API_KEY so claude CLI uses its own subscription auth
      const env = { ...process.env };
      delete env.ANTHROPIC_API_KEY;

      const proc = spawn('claude', ['-p', '-', ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        env,
      });

      let out = '';
      let err = '';

      proc.stdout.on('data', (d) => { out += d.toString(); });
      proc.stderr.on('data', (d) => { err += d.toString(); });

      proc.on('error', (e) => reject(new Error(`Failed to spawn claude: ${e.message}`)));
      proc.on('close', (code) => {
        if (code !== 0 && !out) {
          reject(new Error(`claude exited with code ${code}: ${err}`));
        } else {
          resolve(out);
        }
      });

      // Pipe the prompt file content to stdin
      const stream = createReadStream(tempFile);
      stream.pipe(proc.stdin);
      stream.on('error', () => proc.stdin.end());
    });

    let response: ClaudeCliResponse;
    try {
      response = JSON.parse(stdout);
    } catch {
      console.error(`[ClaudeCLI] Failed to parse stdout as JSON. Raw (first 500 chars):`, stdout.slice(0, 500));
      throw new Error(`Claude CLI returned non-JSON: ${stdout.slice(0, 200)}`);
    }

    if (response.is_error) {
      console.error(`[ClaudeCLI] Error response:`, response.result);
      throw new Error(`Claude CLI error: ${response.result}`);
    }

    console.log(`[ClaudeCLI] OK (${response.result.length} chars, ${response.duration_ms}ms)`);
    return response.result;
  } finally {
    fs.unlink(tempFile).catch(() => {});
  }
}

/**
 * Sends a prompt and parses the response as JSON.
 */
export async function queryClaudeCliJson<T>(prompt: string, systemPrompt?: string): Promise<T> {
  const result = await queryClaudeCli(prompt, systemPrompt);

  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch =
    result.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    result.match(/(\[[\s\S]*\])/) ||
    result.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    console.error(`[ClaudeCLI] No JSON found in response:\n${result.slice(0, 1000)}`);
    throw new Error(`No JSON in Claude response: ${result.slice(0, 200)}`);
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error(`[ClaudeCLI] JSON parse failed:\n${jsonStr.slice(0, 500)}`);
    throw err;
  }
}
