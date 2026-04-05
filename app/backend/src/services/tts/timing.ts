import type { DialogueEntry } from '@novel-visualizer/shared';

export function reconcileTiming(texts: DialogueEntry[]): DialogueEntry[] {
  // Texts already have real start/end times from TTS synthesis.
  // This function ensures the 2-second pre-display rule is applied
  // and that timing is consistent.
  return texts.map(entry => ({
    ...entry,
    // Clamp startTime to 0 minimum
    startTime: Math.max(0, entry.startTime),
    // Ensure endTime is after startTime
    endTime: Math.max(entry.startTime + 0.1, entry.endTime),
  }));
}

export function getDisplayTime(entry: DialogueEntry): number {
  // Dialogue and thought bubbles appear 2 seconds before audio
  if (entry.type === 'narration') return entry.startTime;
  return Math.max(0, entry.startTime - 2);
}
