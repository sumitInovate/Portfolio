import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { SystemText } from '../ui/SystemText';

const PHASES = [
  '> Authenticating hunter profile...',
  '> Loading skill database...',
  '> Calibrating magic circuits...',
  '> Spawning dungeon environment...',
  '> RANK ASSESSMENT: S-CLASS DETECTED',
];

export function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [done, setDone] = useState(false);

  const finish = useCallback(() => {
    setDone(true);
    setTimeout(onComplete, 900);
  }, [onComplete]);

  useEffect(() => {
    // Phase ticker
    const phaseTimer = setInterval(() => {
      setPhaseIndex((p) => {
        if (p >= PHASES.length - 1) { clearInterval(phaseTimer); return p; }
        return p + 1;
      });
    }, 550);

    // Progress ticker
    let current = 0;
    const progressTimer = setInterval(() => {
      const step = Math.random() * 12 + 4;
      current = Math.min(current + step, 100);
      setProgress(current);
      if (current >= 100) {
        clearInterval(progressTimer);
        setTimeout(finish, 800);
      }
    }, 220);

    return () => {
      clearInterval(phaseTimer);
      clearInterval(progressTimer);
    };
  }, [finish]);

  const filled = Math.floor((progress / 100) * 20);
  const empty = 20 - filled;
  const barStr = `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.floor(progress)}%`;

  return (
    <motion.div
      className="loading-screen"
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    >
      <div className="loading-box">
        <h2 className="loading-title">SYSTEM INITIALIZATION</h2>
        <div className="loading-divider" />

        <div className="loading-lines">
          {PHASES.slice(0, phaseIndex + 1).map((line, i) => (
            <div key={i} className="loading-line">
              <SystemText text={line} speed={18} delay={i * 30} />
            </div>
          ))}
        </div>

        <div className="loading-progress-label">{barStr}</div>
        <div className="loading-progress-bar">
          <div
            className="loading-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <AnimatePresence>
          {done && (
            <motion.div
              className="loading-welcome"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              WELCOME, HUNTER
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
