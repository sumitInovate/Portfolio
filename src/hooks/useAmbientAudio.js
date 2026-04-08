import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useAmbientAudio — manages the background music player
 * Returns controls and reactive state.
 */
export function useAmbientAudio(src) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady]   = useState(false);

  // Create Audio element once
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop   = true;
    audio.volume = 0.35;  // comfortable background volume
    audio.preload = 'auto';

    audio.addEventListener('canplaythrough', () => setReady(true));
    audio.addEventListener('ended',          () => setPlaying(false));

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const play = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, play, pause]);

  const setVolume = useCallback((v) => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, v));
  }, []);

  return { playing, ready, toggle, play, pause, setVolume };
}
