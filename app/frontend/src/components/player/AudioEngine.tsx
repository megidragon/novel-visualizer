import { useRef, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../../stores/player-store.js';
import { getSceneAudioUrl } from '../../api/client.js';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);

  const {
    projectId,
    scenes,
    currentSceneIndex,
    isPlaying,
    volume,
    playbackRate,
    seekRequest,
    setCurrentTime,
    clearSeekRequest,
    onAudioEnded,
  } = usePlayerStore();

  // Create audio element on mount
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    return () => {
      audioRef.current?.pause();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Update source when scene changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !projectId || scenes.length === 0) return;

    const scene = scenes[currentSceneIndex];
    if (!scene) return;

    audio.src = getSceneAudioUrl(projectId, scene.sequence);
    audio.currentTime = 0;
    audio.load();

    // Auto-play if isPlaying is true when scene changes
    if (isPlaying) {
      audio.addEventListener('canplay', function onCanPlay() {
        audio.removeEventListener('canplay', onCanPlay);
        audio.play().catch(() => {});
      });
    }
  }, [projectId, currentSceneIndex, scenes, isPlaying]);

  // Play/pause sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Playback rate sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Seek handling
  useEffect(() => {
    if (seekRequest !== null && audioRef.current) {
      audioRef.current.currentTime = seekRequest;
      clearSeekRequest();
    }
  }, [seekRequest, clearSeekRequest]);

  // Time update loop
  const updateTime = useCallback(() => {
    if (audioRef.current && isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
    }
    rafRef.current = requestAnimationFrame(updateTime);
  }, [isPlaying, setCurrentTime]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateTime);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, updateTime]);

  // Handle audio ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => onAudioEnded();
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [onAudioEnded]);

  // Preload next scene
  useEffect(() => {
    if (!projectId || scenes.length === 0) return;
    const nextIndex = currentSceneIndex + 1;
    if (nextIndex >= scenes.length) return;

    const nextScene = scenes[nextIndex];
    const preload = new Audio();
    preload.src = getSceneAudioUrl(projectId, nextScene.sequence);
    preload.preload = 'auto';
  }, [projectId, currentSceneIndex, scenes]);

  return null;
}
