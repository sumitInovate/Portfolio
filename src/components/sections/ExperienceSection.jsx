import { useState }      from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { RankBadge }     from '../ui/RankBadge';
import { useUser }       from '../../context/UserContext';

export function ExperienceSection() {
  const [expanded, setExpanded] = useState(0);
  const { userData } = useUser();
  const quests = userData?.experience ?? [];

  return (
    <section id="experience" className="section" style={{ background: 'var(--color-abyss)' }}>
      <div className="container">
        <RevealOnScroll>
          <h2 className="section-heading">QUEST LOG</h2>
        </RevealOnScroll>

        <div className="quest-log">
          {/* Flowing timeline line */}
          <div className="quest-timeline-line" />

          {quests.map((q, idx) => (
            <RevealOnScroll key={q.guild} delay={idx * 0.15}>
              <div className={`quest-entry${q.rank === 'A' ? ' a-rank' : ''}`}>
                {/* Timeline marker */}
                <div className="quest-marker">
                  {q.rank}
                </div>

                {/* Card body */}
                <div
                  className={`quest-card-body${expanded === idx ? ' expanded' : ''}`}
                  onClick={() => setExpanded(expanded === idx ? -1 : idx)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expanded === idx}
                  onKeyDown={(e) => e.key === 'Enter' && setExpanded(expanded === idx ? -1 : idx)}
                >
                  <div className="quest-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <h3 className="quest-guild">{q.guild}</h3>
                        <RankBadge rank={q.rank} />
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          color: q.status === 'ACTIVE' ? 'var(--rank-c)' : 'var(--color-text-muted)',
                          letterSpacing: '1px',
                        }}>
                          ✔ {q.status}
                        </span>
                      </div>
                      <p className="quest-role">{q.role}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className="quest-period">{q.period}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {q.location}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded === idx && (
                      <motion.div
                        className="quest-achievements"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ paddingTop: 'var(--space-4)' }}>
                          {q.achievements.map((a, i) => (
                            <motion.div
                              key={i}
                              className="quest-achievement"
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: i * 0.06 }}
                            >
                              {a}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="quest-expand-toggle">
                    {expanded === idx ? '▲ COLLAPSE' : '▼ VIEW ACHIEVEMENTS'}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
