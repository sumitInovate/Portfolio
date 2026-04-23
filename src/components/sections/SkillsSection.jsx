import { motion }        from 'framer-motion';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { StatBar }        from '../ui/StatBar';
import { useUser }        from '../../context/UserContext';

const cardVariants = {
  hidden: { opacity: 0, scale: 0.87, y: 20 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 22 },
  },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const categoryVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function SkillsSection() {
  const { userData } = useUser();
  const skillCategories = userData?.skills ?? [];

  return (
    <section id="skills" className="section" style={{ background: 'rgba(232, 228, 221, 0.95)' }}>
      <div className="container">
        <RevealOnScroll>
          <h2 className="section-heading">SKILL REGISTRY</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)', letterSpacing: '1px' }}>
            — Hover a card to unlock skill intel —
          </p>
        </RevealOnScroll>

        {skillCategories.map((cat) => (
          <motion.div
            key={cat.category}
            variants={categoryVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            style={{ marginBottom: 'var(--space-12)' }}
          >
            {/* Category Header */}
            <div className="skill-category-header">
              <span className="skill-category-icon">{cat.icon}</span>
              <h3 className="skill-category-title">{cat.category}</h3>
            </div>

            {/* Skill Cards Grid */}
            <motion.div
              className="skill-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
            >
              {cat.skills.map((skill) => (
                <motion.div key={skill.name} variants={cardVariants} className="skill-card">
                  <div className="skill-card-inner">
                    {/* Front */}
                    <div className="skill-card-front">
                      <p className="skill-alias">SKILL · {skill.alias}</p>
                      <h3 className="skill-name">{skill.name}</h3>
                      <StatBar label="Proficiency" value={skill.value} />
                      <p className="skill-reveal-hint">Click to reveal</p>
                    </div>
                    {/* Back */}
                    <div className="skill-card-back">
                      <p className="skill-back-title">{skill.name}</p>
                      <p className="skill-back-desc">{skill.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
