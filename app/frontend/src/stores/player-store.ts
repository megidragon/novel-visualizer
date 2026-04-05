import { create } from 'zustand';
import type { SceneSpec } from '@novel-visualizer/shared';
import { getAllScenes } from '../api/client.js';

interface PlayerState {
  projectId: string | null;
  scenes: SceneSpec[];
  currentSceneIndex: number;
  isPlaying: boolean;
  currentTime: number;
  isLoading: boolean;

  loadProject(id: string): Promise<void>;
  play(): void;
  pause(): void;
  togglePlay(): void;
  seekScene(index: number): void;
  nextScene(): void;
  prevScene(): void;
  setCurrentTime(time: number): void;
  onAudioEnded(): void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  projectId: null,
  scenes: [],
  currentSceneIndex: 0,
  isPlaying: false,
  currentTime: 0,
  isLoading: false,

  async loadProject(id: string) {
    set({ isLoading: true, projectId: id });
    const scenes = await getAllScenes(id);
    set({ scenes, isLoading: false, currentSceneIndex: 0, currentTime: 0, isPlaying: false });
  },

  play() {
    set({ isPlaying: true });
  },

  pause() {
    set({ isPlaying: false });
  },

  togglePlay() {
    set((s) => ({ isPlaying: !s.isPlaying }));
  },

  seekScene(index: number) {
    const { scenes } = get();
    if (index >= 0 && index < scenes.length) {
      set({ currentSceneIndex: index, currentTime: 0, isPlaying: false });
    }
  },

  nextScene() {
    const { currentSceneIndex, scenes } = get();
    if (currentSceneIndex < scenes.length - 1) {
      set({ currentSceneIndex: currentSceneIndex + 1, currentTime: 0 });
    } else {
      set({ isPlaying: false });
    }
  },

  prevScene() {
    const { currentSceneIndex } = get();
    if (currentSceneIndex > 0) {
      set({ currentSceneIndex: currentSceneIndex - 1, currentTime: 0 });
    }
  },

  setCurrentTime(time: number) {
    set({ currentTime: time });
  },

  onAudioEnded() {
    const { currentSceneIndex, scenes } = get();
    if (currentSceneIndex < scenes.length - 1) {
      // Auto-advance after a brief pause for transition
      setTimeout(() => {
        set({ currentSceneIndex: currentSceneIndex + 1, currentTime: 0 });
      }, 1500);
    } else {
      set({ isPlaying: false });
    }
  },
}));
