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

/**
 * Snap a charOffset to the nearest paragraph break (double newline)
 * or sentence end. Searches within ±500 chars of the given offset.
 */
function snapToBreak(fullText: string, offset: number): number {
  const SEARCH_RANGE = 500;
  const start = Math.max(0, offset - SEARCH_RANGE);
  const end = Math.min(fullText.length, offset + SEARCH_RANGE);
  const region = fullText.slice(start, end);

  // Prefer double newline (paragraph break) closest to the offset
  const centerInRegion = offset - start;
  let bestBreak = -1;
  let bestDist = Infinity;

  // Search for paragraph breaks (\n\n or \n \n)
  const paraRegex = /\n\s*\n/g;
  let match;
  while ((match = paraRegex.exec(region)) !== null) {
    // Position right after the break
    const breakPos = start + match.index + match[0].length;
    const dist = Math.abs(breakPos - offset);
    if (dist < bestDist) {
      bestDist = dist;
      bestBreak = breakPos;
    }
  }

  if (bestBreak >= 0) return bestBreak;

  // Fallback: find nearest sentence end (. or ! or ? followed by space/newline)
  const sentRegex = /[.!?]["'»]?\s/g;
  while ((match = sentRegex.exec(region)) !== null) {
    const breakPos = start + match.index + match[0].length;
    const dist = Math.abs(breakPos - offset);
    if (dist < bestDist) {
      bestDist = dist;
      bestBreak = breakPos;
    }
  }

  if (bestBreak >= 0) return bestBreak;

  // Last resort: return original offset
  return offset;
}

export async function splitIntoActs(fullText: string, style: StyleTheme): Promise<Act[]> {
  const systemPrompt = getActSplitterPrompt(style);

  const chunks: string[] = [];
  for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
    chunks.push(fullText.slice(i, i + CHUNK_SIZE));
  }

  const allBoundaries: ActBoundary[] = [];
  let runningOffset = 0;

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    console.log(`[ActSplitter] Processing chunk ${ci + 1}/${chunks.length}...`);

    try {
      const boundaries = await queryClaudeCliJson<ActBoundary[]>(
        `Analyze this chunk of the novel and identify act boundaries.\nThe chunk starts at character offset ${runningOffset} of the full novel.\n\n${chunk}`,
        systemPrompt,
      );

      for (const b of boundaries) {
        const rawOffset = b.charOffset + runningOffset;
        const snappedOffset = snapToBreak(fullText, rawOffset);
        allBoundaries.push({
          ...b,
          charOffset: snappedOffset,
        });
      }

      console.log(`[ActSplitter] Chunk ${ci + 1}/${chunks.length}: found ${boundaries.length} boundaries`);
    } catch (err) {
      console.error(`[ActSplitter] Chunk ${ci + 1}/${chunks.length} failed:`, (err as Error).message);
    }

    runningOffset += chunk.length;
  }

  // Sort and deduplicate boundaries that snapped to the same position
  allBoundaries.sort((a, b) => a.charOffset - b.charOffset);
  const dedupedBoundaries: ActBoundary[] = [];
  for (const b of allBoundaries) {
    const prev = dedupedBoundaries[dedupedBoundaries.length - 1];
    // Merge boundaries within 200 chars of each other
    if (!prev || b.charOffset - prev.charOffset > 200) {
      dedupedBoundaries.push(b);
    }
  }

  console.log(`[ActSplitter] Total boundaries: ${allBoundaries.length}, after dedup: ${dedupedBoundaries.length}`);

  const acts: Act[] = [];

  if (dedupedBoundaries.length === 0) {
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
    text: fullText.slice(0, dedupedBoundaries[0].charOffset),
    summary: dedupedBoundaries[0].actSummary,
    description: dedupedBoundaries[0].description,
  });

  for (let i = 0; i < dedupedBoundaries.length - 1; i++) {
    acts.push({
      index: i + 1,
      text: fullText.slice(dedupedBoundaries[i].charOffset, dedupedBoundaries[i + 1].charOffset),
      summary: dedupedBoundaries[i + 1].actSummary,
      description: dedupedBoundaries[i + 1].description,
    });
  }

  const lastBoundary = dedupedBoundaries[dedupedBoundaries.length - 1];
  acts.push({
    index: dedupedBoundaries.length,
    text: fullText.slice(lastBoundary.charOffset),
    summary: 'Final act',
    description: 'Conclusion of the narrative',
  });

  return acts.filter(a => a.text.trim().length > 100); // Filter out tiny fragments
}
