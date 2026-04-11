import { useEffect, useRef, useState } from 'react';
import { motion }  from 'framer-motion';
import { useUser } from '../../context/UserContext';

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
const RANK_COLORS = {
  E: 'var(--rank-e)',
  D: 'var(--rank-d)',
  C: 'var(--rank-c)',
  B: 'var(--rank-b)',
  A: 'var(--rank-a)',
  S: 'var(--rank-s)',
};

export function XPProgressPanel() {
  const { userData } = useUser();
  const hero = userData?.hero ?? {};

  const XP_CURRENT  = hero.xp?.current  ?? 0;
  const XP_MAX      = hero.xp?.max      ?? 10000;
  const XP_PCT      = Math.round((XP_CURRENT / XP_MAX) * 100);
  const LEVEL       = hero.level        ?? 1;
  const ACTIVE_RANK = hero.rank         ?? 'E';

  const [barPct,  setBarPct]  = useState(0);
  const [countXP, setCountXP] = useState(0);
  const started = useRef(false);

  // Re-run animation when XP data changes (new user loaded)
  useEffect(() => {
    if (!XP_CURRENT) return;
    started.current = false;
  }, [XP_CURRENT]);

  useEffect(() => {
    if (started.current || !XP_CURRENT) return;
    started.current = true;

    const duration = 1400;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed  = Math.min(now - startTime, duration);
      const progress = elapsed / duration;
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCountXP(Math.round(eased * XP_CURRENT));
      setBarPct(eased * XP_PCT);
      if (elapsed < duration) requestAnimationFrame(step);
    };

    const timer = setTimeout(() => requestAnimationFrame(step), 800);
    return () => clearTimeout(timer);
  }, [XP_CURRENT, XP_PCT]);

  return (
    <motion.div
      className="xp-panel glass-panel"
      initial={{ x: -60, opacity: 0, filter: 'blur(8px)' }}
      animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1.0, delay: 0.3, type: 'spring', stiffness: 65, damping: 18 }}
    >
      {/* Panel corner brackets */}
      <div className="panel-corner panel-corner--tl" />
      <div className="panel-corner panel-corner--br" />

      {/* Level heading */}
      <div className="xp-level-row">
        <span className="xp-level-label">LEVEL</span>
        <span className="xp-level-num">{LEVEL}</span>
      </div>

      {/* XP progress bar */}
      <div className="xp-bar-wrap">
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${barPct}%` }} />
          <div className="xp-bar-glow"  style={{ left: `${barPct}%` }} />
        </div>
        <div className="xp-bar-labels">
          <span className="xp-bar-current">{countXP.toLocaleString()}/{XP_MAX.toLocaleString()} XP</span>
          <span className="xp-bar-pct">{XP_PCT}%</span>
        </div>
      </div>

      {/* Divider */}
      <div className="xp-divider" />

      {/* Ranking ladder */}
      <div className="xp-ranking-section">
        <span className="xp-ranking-label">RANKING</span>
        <div className="rank-ladder" role="list" aria-label="Developer rank progression">
          {RANKS.map((rank) => {
            const isActive = rank === ACTIVE_RANK;
            return (
              <motion.div
                key={rank}
                role="listitem"
                className={`rank-node ${isActive ? 'rank-node--active' : ''}`}
                style={{ '--rank-color': RANK_COLORS[rank] }}
                whileHover={{ scale: 1.15 }}
                animate={isActive ? {
                  boxShadow: [
                    '0 0 0px 0px var(--rank-color)',
                    '0 0 16px 4px rgba(255,215,0,0.55)',
                    '0 0 0px 0px var(--rank-color)',
                  ]
                } : {}}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              >
                {rank}
                {isActive && <span className="rank-node-pip" />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
