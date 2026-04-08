import { motion } from 'framer-motion';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { StatBar } from '../ui/StatBar';

const skills = [
  {
    name: 'C# / .NET Core',
    alias: '"Shadow Extraction" — Core Magic',
    value: 90,
    desc: 'Built 10+ production REST APIs with ASP.NET Web API, Entity Framework Core, and LINQ at Ingram Micro.',
  },
  {
    name: 'React.js',
    alias: '"Domain Expansion" — Frontend Mastery',
    value: 85,
    desc: 'Crafted enterprise frontends with React 18, hooks, context, and state management patterns.',
  },
  {
    name: 'SQL Server / EF Core',
    alias: '"Memory Reading" — Data Retrieval',
    value: 82,
    desc: 'Designed relational schemas, wrote complex LINQ & raw SQL, optimized queries for 35%+ perf gain.',
  },
  {
    name: 'GCP / Azure / Docker',
    alias: '"Ruler\'s Authority" — Cloud Control',
    value: 78,
    desc: 'GCP ACE certified. Deployed multi-region services across APAC & EMEA. CI/CD with GitHub Actions.',
  },
  {
    name: 'JWT / OAuth 2.0',
    alias: '"Iron Body" — Security Fortification',
    value: 80,
    desc: 'Implemented enterprise auth flows, OWASP-hardened APIs, and multi-org SSO integrations.',
  },
  {
    name: 'Dynamics 365 / Power Automate',
    alias: '"Architect\'s Eye" — CRM Vision',
    value: 75,
    desc: 'Extended D365 modules for 1,000+ global users, built Power Automate flows for onboarding pipelines.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, scale: 0.87, y: 20 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 22 },
  },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

export function SkillsSection() {
  return (
    <section id="skills" className="section" style={{ background: 'rgba(8, 15, 30, 0.95)' }}>
      <div className="container">
        <RevealOnScroll>
          <h2 className="section-heading">SKILL REGISTRY</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)', letterSpacing: '1px' }}>
            — Hover a card to unlock skill intel —
          </p>
        </RevealOnScroll>

        <motion.div
          className="skill-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {skills.map((skill) => (
            <motion.div key={skill.name} variants={cardVariants} className="skill-card">
              <div className="skill-card-inner">
                {/* Front */}
                <div className="skill-card-front">
                  <p className="skill-alias">{skill.alias}</p>
                  <h3 className="skill-name">{skill.name}</h3>
                  <StatBar label="PROFICIENCY" value={skill.value} />
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

        {/* Additional tech tags */}
        <RevealOnScroll delay={0.3} y={20}>
          <div style={{ marginTop: 'var(--space-10)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            {['TypeScript', 'Node.js', 'Redis', 'SignalR', 'Hangfire', 'Swagger / OpenAPI', 'Git', 'Postman', 'Azure DevOps', 'Agile / Scrum'].map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  padding: '4px 12px',
                  borderRadius: '2px',
                  letterSpacing: '1px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
