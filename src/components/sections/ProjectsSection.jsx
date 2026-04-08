import { useState } from 'react';
import { motion } from 'framer-motion';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { RankBadge } from '../ui/RankBadge';
import { GlowButton } from '../ui/GlowButton';
import { ExternalLink, Lock } from 'lucide-react';

const projects = [
  {
    rank: 'S',
    title: 'Enterprise CRM Platform',
    tech: 'C# · .NET Core · Dynamics 365 · React.js · Azure',
    desc: 'End-to-end CRM platform serving 1,000+ global enterprise users across APAC & EMEA. Features multi-region deployments, OAuth 2.0 SSO, real-time notifications, and Power Automate integrations.',
    classified: true,
    link: null,
  },
  {
    rank: 'A',
    title: 'AlgoVisualizer',
    tech: 'React.js · Netlify · CI/CD · GitHub Actions',
    desc: 'Interactive algorithm visualizer featuring 15+ sorting & pathfinding algorithms with step-by-step animation. Deployed with full CI/CD pipeline on Netlify.',
    classified: false,
    link: 'https://algovisualizerindia.netlify.app',
  },
];

export function ProjectsSection() {
  const [unlockedIdx, setUnlockedIdx] = useState(null);

  return (
    <section id="projects" className="section" style={{ background: 'rgba(8, 10, 24, 0.97)' }}>
      <div className="container">
        <RevealOnScroll>
          <h2 className="section-heading">DUNGEONS CLEARED</h2>
        </RevealOnScroll>

        <div className="projects-grid">
          {projects.map((p, idx) => (
            <RevealOnScroll key={p.title} delay={idx * 0.15}>
              <motion.div
                className={`project-card${p.classified ? ' classified' : ''}`}
                onClick={() => p.classified && setUnlockedIdx(idx === unlockedIdx ? null : idx)}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {/* Classified overlay */}
                {p.classified && unlockedIdx !== idx && (
                  <div className="project-classified-overlay">
                    <div style={{ textAlign: 'center' }}>
                      <Lock size={24} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
                      <div className="classified-text">CLASSIFIED</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '8px', letterSpacing: '1px' }}>
                        Click to unlock
                      </div>
                    </div>
                  </div>
                )}

                {/* Card content */}
                <div className="project-rank-bar">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    GATE: {p.rank}-RANK
                  </span>
                  <RankBadge rank={p.rank} />
                </div>

                <h3 className="project-title">{p.title}</h3>
                <p className="project-tech">{p.tech}</p>
                <p className="project-desc">{p.desc}</p>

                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />
                    ENTER DUNGEON →
                  </a>
                )}
              </motion.div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
