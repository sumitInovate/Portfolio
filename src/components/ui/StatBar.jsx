import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export function StatBar({ label, value, variant = 'blue' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <div className="stat-bar-wrap" ref={ref}>
      <div className="stat-bar-header">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="stat-bar-track">
        <motion.div
          className={`stat-bar-fill${variant === 'monarch' ? ' monarch' : ''}`}
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </div>
    </div>
  );
}
