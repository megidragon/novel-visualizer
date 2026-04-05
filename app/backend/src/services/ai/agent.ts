import type { SceneSpec, StyleTheme, CharacterAppearance } from '@novel-visualizer/shared';
import { v4 as uuid } from 'uuid';
import { splitIntoActs, type Act } from './act-splitter.js';
import { getSceneDesignPrompt, getCharacterRegistryPrompt } from './prompts.js';
import { validateSceneSpec } from './validator.js';
import { queryClaudeCli, queryClaudeCliJson } from './claude-cli.js';

interface CharacterRegistry {
  name: string;
  appearance: CharacterAppearance;
  role: string;
}

const MAX_RETRIES = 3;

export class NovelAgent {
  private characterRegistry: CharacterRegistry[] = [];

  constructor(
    private projectId: string,
    private pdfPath: string,
    private style: StyleTheme,
    private fullText: string,
  ) {}

  async splitIntoActs(): Promise<Act[]> {
    await this.buildCharacterRegistry();
    return splitIntoActs(this.fullText, this.style);
  }

  private async buildCharacterRegistry(): Promise<void> {
    const sample = this.fullText.slice(0, 20_000);

    try {
      this.characterRegistry = await queryClaudeCliJson<CharacterRegistry[]>(
        `Analyze these characters from the novel:\n\n${sample}`,
        getCharacterRegistryPrompt(),
      );
    } catch (err) {
      console.error('[NovelAgent] Failed to parse character registry:', (err as Error).message);
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

    const prompt = `Design scene ${actIndex + 1} for this narrative act.

Style: ${this.style}
${contextSummary}
${characterContext}

Act description: ${act.description}
Act summary: ${act.summary}

Narrative text:
${act.text.slice(0, 15_000)}

Respond with a single JSON object matching this exact structure (no markdown, no explanation, ONLY the JSON):
{
  "sequence": ${actIndex + 1},
  "environment": {
    "description": "...",
    "terrain": "mountain_peak|forest_clearing|temple_hall|cave|village_street|throne_room|battlefield|library|garden|dungeon|open_field",
    "lighting": { "type": "dawn|day|dusk|night|mystical|ominous", "intensity": 0.0-2.0, "directionalAngle": 0-360 },
    "props": [{ "type": "tree|rock|pillar|altar|torch|lantern|gate", "position": {"x":0,"y":0,"z":0}, "scale": 1.0 }],
    "skyColor": "#hex",
    "ambientColor": "#hex"
  },
  "characters": [{
    "name": "...",
    "position": {"x": -5 to 5, "y": 0, "z": -5 to 5},
    "facing": "north|south|east|west|camera",
    "appearance": {
      "bodyType": "male_tall|male_average|female_tall|female_average|elder|child",
      "robeColor": "#hex",
      "hairColor": "#hex",
      "hairStyle": "long|short|bun|bald",
      "hasWeapon": "sword|staff" (optional)
    },
    "pose": "standing|sitting|fighting|meditating|walking|kneeling"
  }],
  "texts": [{
    "character": "name or null for narration",
    "text": "...",
    "startTime": seconds,
    "endTime": seconds,
    "type": "dialogue|narration|thought"
  }]
}`;

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const result = await queryClaudeCliJson<Record<string, unknown>>(prompt, systemPrompt);
        const validation = validateSceneSpec(result);

        if (validation.valid) {
          return this.buildSceneSpec(result, actIndex);
        }

        console.warn(`[NovelAgent] Scene ${actIndex + 1} validation failed (attempt ${retries + 1}):`, validation.errors);

        // Retry with error feedback
        const retryPrompt = `${prompt}\n\nYour previous attempt had these errors:\n${validation.errors.join('\n')}\n\nFix them and return the corrected JSON.`;
        const retryResult = await queryClaudeCliJson<Record<string, unknown>>(retryPrompt, systemPrompt);
        const retryValidation = validateSceneSpec(retryResult);

        if (retryValidation.valid) {
          return this.buildSceneSpec(retryResult, actIndex);
        }

        retries++;
      } catch (err) {
        console.warn(`[NovelAgent] Scene ${actIndex + 1} attempt ${retries + 1} failed:`, (err as Error).message);
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
