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
  volume: number;
  playbackRate: number;
  seekRequest: number | null; // set to a time to request a seek

  loadProject(id: string): Promise<void>;
  play(): void;
  pause(): void;
  togglePlay(): void;
  seekScene(index: number): void;
  nextScene(): void;
  prevScene(): void;
  setCurrentTime(time: number): void;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  seekTo(time: number): void;
  clearSeekRequest(): void;
  onAudioEnded(): void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  projectId: null,
  scenes: [],
  currentSceneIndex: 0,
  isPlaying: false,
  currentTime: 0,
  isLoading: false,
  volume: 1,
  playbackRate: 1,
  seekRequest: null,

  async loadProject(id: string) {
    set({ isLoading: true, projectId: id });
    const scenes = await getAllScenes(id);
    set({ scenes, isLoading: false, currentSceneIndex: 0, currentTime: 0, isPlaying: false });
  },

  play() { set({ isPlaying: true }); },
  pause() { set({ isPlaying: false }); },
  togglePlay() { set((s) => ({ isPlaying: !s.isPlaying })); },

  seekScene(index: number) {
    const { scenes } = get();
    if (index >= 0 && index < scenes.length) {
      set({ currentSceneIndex: index, currentTime: 0, isPlaying: false, seekRequest: 0 });
    }
  },

  nextScene() {
    const { currentSceneIndex, scenes } = get();
    if (currentSceneIndex < scenes.length - 1) {
      set({ currentSceneIndex: currentSceneIndex + 1, currentTime: 0, seekRequest: 0 });
    } else {
      set({ isPlaying: false });
    }
  },

  prevScene() {
    const { currentSceneIndex } = get();
    if (currentSceneIndex > 0) {
      set({ currentSceneIndex: currentSceneIndex - 1, currentTime: 0, seekRequest: 0 });
    }
  },

  setCurrentTime(time: number) { set({ currentTime: time }); },
  setVolume(volume: number) { set({ volume: Math.max(0, Math.min(1, volume)) }); },
  setPlaybackRate(rate: number) { set({ playbackRate: rate }); },
  seekTo(time: number) { set({ seekRequest: time, currentTime: time }); },
  clearSeekRequest() { set({ seekRequest: null }); },

  onAudioEnded() {
    const { currentSceneIndex, scenes } = get();
    if (currentSceneIndex < scenes.length - 1) {
      setTimeout(() => {
        set({ currentSceneIndex: currentSceneIndex + 1, currentTime: 0, seekRequest: 0, isPlaying: true });
      }, 1500);
    } else {
      set({ isPlaying: false });
    }
  },
}));
