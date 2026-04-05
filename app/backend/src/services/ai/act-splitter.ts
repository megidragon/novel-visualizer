import type { StyleTheme } from '@novel-visualizer/shared';
import { getActSplitterPrompt } from './prompts.js';
import { queryClaudeCliJson } from './claude-cli.js';

export interface ActBoundary {
  charOffset: number;
  description: string;
  actSummary: string;
}

export interface Act {
  index: number;
  text: string;
  summary: string;
  description: string;
}

const CHUNK_SIZE = 80_000;

export async function splitIntoActs(fullText: string, style: StyleTheme): Promise<Act[]> {
  const systemPrompt = getActSplitterPrompt(style);

  const chunks: string[] = [];
  for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
    chunks.push(fullText.slice(i, i + CHUNK_SIZE));
  }

  const allBoundaries: ActBoundary[] = [];
  let runningOffset = 0;

  for (const chunk of chunks) {
    try {
      const boundaries = await queryClaudeCliJson<ActBoundary[]>(
        `Analyze this chunk of the novel and identify act boundaries:\n\n${chunk}`,
        systemPrompt,
      );

      for (const b of boundaries) {
        allBoundaries.push({
          ...b,
          charOffset: b.charOffset + runningOffset,
        });
      }
    } catch (err) {
      console.error(`[ActSplitter] Failed to parse boundaries for chunk ${chunks.indexOf(chunk) + 1}/${chunks.length}:`, (err as Error).message);
    }

    runningOffset += chunk.length;
  }

  allBoundaries.sort((a, b) => a.charOffset - b.charOffset);

  const acts: Act[] = [];

  if (allBoundaries.length === 0) {
    acts.push({
      index: 0,
      text: fullText,
      summary: 'Complete novel',
      description: 'Full narrative',
    });
    return acts;
  }

  acts.push({
    index: 0,
    text: fullText.slice(0, allBoundaries[0].charOffset),
    summary: allBoundaries[0].actSummary,
    description: allBoundaries[0].description,
  });

  for (let i = 0; i < allBoundaries.length - 1; i++) {
    acts.push({
      index: i + 1,
      text: fullText.slice(allBoundaries[i].charOffset, allBoundaries[i + 1].charOffset),
      summary: allBoundaries[i + 1].actSummary,
      description: allBoundaries[i + 1].description,
    });
  }

  const lastBoundary = allBoundaries[allBoundaries.length - 1];
  acts.push({
    index: allBoundaries.length,
    text: fullText.slice(lastBoundary.charOffset),
    summary: 'Final act',
    description: 'Conclusion of the narrative',
  });

  return acts.filter(a => a.text.trim().length > 0);
}
