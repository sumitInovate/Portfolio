import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const AudioCtx = createContext(null);

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    const audio = new Audio('/solo_leveling.mp3');
    audio.loop    = true;
    audio.volume  = 0.35;
    audio.preload = 'auto';
    audio.addEventListener('canplaythrough', () => setReady(true));
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  const play = useCallback(async () => {
    try {
      await audioRef.current?.play();
      setPlaying(true);
    } catch (_) {}
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) pause(); else play();
  }, [playing, play, pause]);

  return (
    <AudioCtx.Provider value={{ playing, ready, play, pause, toggle }}>
      {children}
    </AudioCtx.Provider>
  );
}

export const useAudio = () => useContext(AudioCtx);
