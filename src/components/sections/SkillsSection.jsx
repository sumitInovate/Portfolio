import { motion } from 'framer-motion';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { StatBar } from '../ui/StatBar';

const skillCategories = [
  {
    category: 'BACKEND',
    icon: '⚔',
    skills: [
      {
        name: 'C# / .NET Core',
        alias: 'SHADOW EXTRACTION',
        value: 95,
        desc: 'Built 10+ production REST APIs with ASP.NET Web API, Entity Framework Core, and LINQ at Ingram Micro.',
      },
      {
        name: 'ASP.NET Web API',
        alias: "ARCHITECT'S BLADE",
        value: 92,
        desc: 'Designed and shipped enterprise-grade Web APIs with clean architecture, middleware pipelines, and global error handling.',
      },
      {
        name: 'Entity Framework Core',
        alias: 'MEMORY READING',
        value: 88,
        desc: 'Managed complex domain models, migrations, and query optimizations using EF Core with SQL Server.',
      },
      {
        name: 'SQL Server / T-SQL',
        alias: 'DATA EXTRACTION',
        value: 88,
        desc: 'Designed relational schemas, wrote complex stored procedures & T-SQL, optimised queries for 35%+ perf gain.',
      },
    ],
  },
  {
    category: 'FRONTEND',
    icon: '👁',
    skills: [
      {
        name: 'React.js',
        alias: 'DOMAIN EXPANSION',
        value: 90,
        desc: 'Crafted enterprise frontends with React 18, hooks, context, and state management patterns.',
      },
      {
        name: 'JavaScript / ES2022+',
        alias: 'SPEED READING',
        value: 88,
        desc: 'Deep mastery of modern JS including async/await, destructuring, optional chaining, and module systems.',
      },
      {
        name: 'TypeScript',
        alias: 'IRON MIND',
        value: 80,
        desc: 'Strongly typed React & Node.js projects with interfaces, generics, and strict null checks.',
      },
      {
        name: 'HTML5 / CSS3',
        alias: 'FOUNDATION MAGIC',
        value: 85,
        desc: 'Built responsive, accessible UIs with semantic HTML5, Flexbox, Grid, and custom CSS animations.',
      },
    ],
  },
  {
    category: 'CLOUD & DEVOPS',
    icon: '☁',
    skills: [
      {
        name: 'GCP (ACE Certified 2024)',
        alias: "RULER'S AUTHORITY",
        value: 88,
        desc: 'GCP ACE certified. Deployed multi-region services across APAC & EMEA using GKE, Cloud Run, and Cloud SQL.',
      },
      {
        name: 'Azure',
        alias: 'SKY DOMAIN',
        value: 78,
        desc: 'Provisioned Azure App Services, Storage, and Azure AD for enterprise deployments.',
      },
      {
        name: 'Docker / CI-CD',
        alias: 'GATE TRAVERSAL',
        value: 82,
        desc: 'Containerised microservices with Docker Compose and automated pipelines via GitHub Actions & Azure DevOps.',
      },
      {
        name: 'Dynamics 365 / Power Automate',
        alias: "ARCHITECT'S EYE",
        value: 80,
        desc: 'Extended D365 modules for 1,000+ global users, built Power Automate flows for onboarding pipelines.',
      },
    ],
  },
  {
    category: 'SECURITY',
    icon: '🛡',
    skills: [
      {
        name: 'JWT / OAuth 2.0',
        alias: 'IRON BODY',
        value: 88,
        desc: 'Implemented enterprise auth flows, OWASP-hardened APIs, and multi-org SSO integrations.',
      },
      {
        name: 'OWASP Practices',
        alias: 'BARRIER OF THE ABSOLUTE',
        value: 85,
        desc: 'Applied OWASP Top 10 mitigations: SQL injection prevention, XSS sanitisation, rate limiting, and secure headers.',
      },
      {
        name: 'HTTPS / TLS',
        alias: 'SEAL OF PROTECTION',
        value: 88,
        desc: 'Enforced HTTPS everywhere, configured TLS termination, certificate rotation, and HSTS policies.',
      },
    ],
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
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const categoryVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
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

        {skillCategories.map((cat, catIndex) => (
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
