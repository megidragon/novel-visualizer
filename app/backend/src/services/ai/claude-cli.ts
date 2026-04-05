import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface ClaudeCliResponse {
  type: string;
  subtype: string;
  is_error: boolean;
  result: string;
  duration_ms: number;
}

/**
 * Calls Claude Code CLI in non-interactive mode (`claude -p`).
 * Uses the user's local Claude Code subscription for authentication.
 */
export async function queryClaudeCli(prompt: string, systemPrompt?: string): Promise<string> {
  const args = ['-p', prompt, '--output-format', 'json'];

  if (systemPrompt) {
    args.push('--system-prompt', systemPrompt);
  }

  // No tools allowed - pure text generation
  args.push('--allowedTools', '');

  console.log(`[ClaudeCLI] Sending prompt (${prompt.length} chars)...`);

  let stdout: string;
  try {
    const result = await execFileAsync('claude', args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300_000,
    });
    stdout = result.stdout;
  } catch (err) {
    const execErr = err as { stderr?: string; message: string };
    console.error(`[ClaudeCLI] exec failed:`, execErr.message);
    if (execErr.stderr) console.error(`[ClaudeCLI] stderr:`, execErr.stderr);
    throw err;
  }

  let response: ClaudeCliResponse;
  try {
    response = JSON.parse(stdout);
  } catch {
    console.error(`[ClaudeCLI] Failed to parse stdout as JSON. Raw output (first 500 chars):`, stdout.slice(0, 500));
    throw new Error(`Claude CLI returned non-JSON output: ${stdout.slice(0, 200)}`);
  }

  if (response.is_error) {
    console.error(`[ClaudeCLI] Claude returned error:`, response.result);
    throw new Error(`Claude CLI error: ${response.result}`);
  }

  console.log(`[ClaudeCLI] Response received (${response.result.length} chars, ${response.duration_ms}ms)`);
  return response.result;
}

/**
 * Sends a prompt and parses the response as JSON.
 * The prompt should instruct Claude to return valid JSON.
 */
export async function queryClaudeCliJson<T>(prompt: string, systemPrompt?: string): Promise<T> {
  const result = await queryClaudeCli(prompt, systemPrompt);

  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || result.match(/(\[[\s\S]*\])/) || result.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    console.error(`[ClaudeCLI] No JSON found in response. Full response:\n${result.slice(0, 1000)}`);
    throw new Error(`Failed to extract JSON from Claude response: ${result.slice(0, 200)}`);
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error(`[ClaudeCLI] JSON parse failed. Extracted string (first 500 chars):\n${jsonStr.slice(0, 500)}`);
    throw err;
  }
}
