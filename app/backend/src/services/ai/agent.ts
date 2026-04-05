import OpenAI from 'openai';
import type { SceneSpec, StyleTheme, CharacterAppearance } from '@novel-visualizer/shared';
import { v4 as uuid } from 'uuid';
import { config } from '../../config.js';
import { splitIntoActs, type Act } from './act-splitter.js';
import { allTools } from './tools.js';
import { getSceneDesignPrompt, getCharacterRegistryPrompt } from './prompts.js';
import { validateSceneSpec } from './validator.js';

interface CharacterRegistry {
  name: string;
  appearance: CharacterAppearance;
  role: string;
}

const MAX_RETRIES = 3;

export class NovelAgent {
  private client: OpenAI;
  private characterRegistry: CharacterRegistry[] = [];

  constructor(
    private projectId: string,
    private pdfPath: string,
    private style: StyleTheme,
    private fullText: string,
  ) {
    this.client = new OpenAI({
      apiKey: config.openrouterApiKey,
      baseURL: config.openrouterBaseUrl,
    });
  }

  async splitIntoActs(): Promise<Act[]> {
    await this.buildCharacterRegistry();
    return splitIntoActs(this.fullText, this.style);
  }

  private async buildCharacterRegistry(): Promise<void> {
    const sample = this.fullText.slice(0, 20_000);

    const response = await this.client.chat.completions.create({
      model: config.model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: getCharacterRegistryPrompt() },
        { role: 'user', content: `Analyze these characters from the novel:\n\n${sample}` },
      ],
    });

    const text = response.choices[0]?.message?.content || '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        this.characterRegistry = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.warn('[NovelAgent] Failed to parse character registry');
    }
  }

  async designScene(act: Act, actIndex: number, previousScenes: SceneSpec[]): Promise<SceneSpec> {
    const systemPrompt = getSceneDesignPrompt(this.style);

    const contextSummary = previousScenes.length > 0
      ? `Previous scenes summary:\n${previousScenes.map(s => `Scene ${s.sequence}: ${s.environment.description}`).join('\n')}`
      : 'This is the first scene.';

    const characterContext = this.characterRegistry.length > 0
      ? `\nKnown characters:\n${JSON.stringify(this.characterRegistry, null, 2)}`
      : '';

    const userMessage = `Design scene ${actIndex + 1} for this narrative act.

Style: ${this.style}
${contextSummary}
${characterContext}

Act description: ${act.description}
Act summary: ${act.summary}

Narrative text:
${act.text.slice(0, 15_000)}

First call AnalyzeScene to plan the visual layout, then call DesignScene with the full specification.`;

    let messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];
    let retries = 0;

    while (retries < MAX_RETRIES) {
      const response = await this.client.chat.completions.create({
        model: config.model,
        max_tokens: 8192,
        messages,
        tools: allTools,
      });

      const choice = response.choices[0];
      if (!choice) { retries++; continue; }

      const msg = choice.message;
      const toolCalls = msg.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        retries++;
        messages.push(msg);
        messages.push({ role: 'user', content: 'You must call the DesignScene tool to generate the scene specification. Please try again.' });
        continue;
      }

      // Add assistant message with tool calls
      messages.push(msg);

      let designResult: Record<string, unknown> | null = null;

      for (const toolCall of toolCalls) {
        const args = JSON.parse(toolCall.function.arguments);

        if (toolCall.function.name === 'AnalyzeScene') {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: 'Analysis recorded. Now call DesignScene with the full scene specification.',
          });
        } else if (toolCall.function.name === 'DesignScene') {
          const validation = validateSceneSpec(args);

          if (validation.valid) {
            designResult = args;
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: 'Scene specification accepted.',
            });
          } else {
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: `Validation failed:\n${validation.errors.join('\n')}\n\nPlease fix these issues and call DesignScene again.`,
            });
          }
        }
      }

      if (designResult) {
        return this.buildSceneSpec(designResult, actIndex);
      }

      if (choice.finish_reason === 'stop') {
        retries++;
      }
    }

    throw new Error(`Failed to design scene ${actIndex + 1} after ${MAX_RETRIES} retries`);
  }

  private buildSceneSpec(input: Record<string, unknown>, actIndex: number): SceneSpec {
    return {
      id: uuid(),
      projectId: this.projectId,
      sequence: actIndex + 1,
      style: this.style,
      environment: input.environment as SceneSpec['environment'],
      characters: input.characters as SceneSpec['characters'],
      texts: input.texts as SceneSpec['texts'],
      audioFile: '',
      durationSeconds: 0,
    };
  }
}
