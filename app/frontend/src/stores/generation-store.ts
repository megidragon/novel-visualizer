import { create } from 'zustand';
import type { ProgressEvent } from '@novel-visualizer/shared';
import { subscribeToProgress, startGeneration } from '../api/client.js';

interface GenerationState {
  isGenerating: boolean;
  progress: ProgressEvent | null;
  error: string | null;
  unsubscribe: (() => void) | null;

  generate(projectId: string): Promise<void>;
  reset(): void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  isGenerating: false,
  progress: null,
  error: null,
  unsubscribe: null,

  async generate(projectId: string) {
    // Cleanup previous subscription
    get().unsubscribe?.();

    set({ isGenerating: true, progress: null, error: null });

    try {
      await startGeneration(projectId);
    } catch (err) {
      set({ isGenerating: false, error: (err as Error).message });
      return;
    }

    const unsub = subscribeToProgress(projectId, (event) => {
      set({ progress: event });

      if (event.phase === 'complete') {
        set({ isGenerating: false });
        get().unsubscribe?.();
      } else if (event.phase === 'error') {
        set({ isGenerating: false, error: event.message });
        get().unsubscribe?.();
      }
    });

    set({ unsubscribe: unsub });
  },

  reset() {
    get().unsubscribe?.();
    set({ isGenerating: false, progress: null, error: null, unsubscribe: null });
  },
}));
