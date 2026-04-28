import { motion } from 'framer-motion';
import { useHunterStore } from '../../stores/hunterStore';
import { BadgeMissionCard } from './BadgeMissionCard';

export function ActiveMissions() {
  const badges = useHunterStore(s => s.badges);
  const active = badges.filter(b => b.status === 'active');

  if (active.length === 0) {
    return (
      <div className="missions-empty system-panel">
        <span className="missions-empty__icon">⚔️</span>
        <p className="missions-empty__title">NO ACTIVE MISSIONS</p>
        <p className="missions-empty__sub">
          Add goals and click SAVE & UPDATE MISSIONS to generate your training badges.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="active-missions"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      {active.map(badge => (
        <motion.div
          key={badge.id}
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        >
          <BadgeMissionCard badge={badge} />
        </motion.div>
      ))}
    </motion.div>
  );
}
