import OpenAI from 'openai';
import type { StyleTheme } from '@novel-visualizer/shared';
import { config } from '../../config.js';
import { getActSplitterPrompt } from './prompts.js';

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

const CHUNK_SIZE = 80_000; // ~50 pages worth of characters

export async function splitIntoActs(fullText: string, style: StyleTheme): Promise<Act[]> {
  const client = new OpenAI({
    apiKey: config.openrouterApiKey,
    baseURL: config.openrouterBaseUrl,
  });
  const systemPrompt = getActSplitterPrompt(style);

  // Split text into large chunks for analysis
  const chunks: string[] = [];
  for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
    chunks.push(fullText.slice(i, i + CHUNK_SIZE));
  }

  // Collect all boundaries across chunks
  const allBoundaries: ActBoundary[] = [];
  let runningOffset = 0;

  for (const chunk of chunks) {
    const response = await client.chat.completions.create({
      model: config.model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this chunk of the novel and identify act boundaries:\n\n${chunk}` },
      ],
    });

    const text = response.choices[0]?.message?.content || '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const boundaries: ActBoundary[] = JSON.parse(jsonMatch[0]);
        for (const b of boundaries) {
          allBoundaries.push({
            ...b,
            charOffset: b.charOffset + runningOffset,
          });
        }
      }
    } catch {
      console.warn('[ActSplitter] Failed to parse boundaries for chunk, skipping');
    }

    runningOffset += chunk.length;
  }

  // Sort boundaries by offset
  allBoundaries.sort((a, b) => a.charOffset - b.charOffset);

  // Build acts from boundaries
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

  // First act: start of text to first boundary
  acts.push({
    index: 0,
    text: fullText.slice(0, allBoundaries[0].charOffset),
    summary: allBoundaries[0].actSummary,
    description: allBoundaries[0].description,
  });

  // Middle acts
  for (let i = 0; i < allBoundaries.length - 1; i++) {
    acts.push({
      index: i + 1,
      text: fullText.slice(allBoundaries[i].charOffset, allBoundaries[i + 1].charOffset),
      summary: allBoundaries[i + 1].actSummary,
      description: allBoundaries[i + 1].description,
    });
  }

  // Last act: last boundary to end of text
  const lastBoundary = allBoundaries[allBoundaries.length - 1];
  acts.push({
    index: allBoundaries.length,
    text: fullText.slice(lastBoundary.charOffset),
    summary: 'Final act',
    description: 'Conclusion of the narrative',
  });

  return acts.filter(a => a.text.trim().length > 0);
}
