import { RevealOnScroll } from '../ui/RevealOnScroll';
import { SystemPanel } from '../ui/SystemPanel';
import { motion } from 'framer-motion';

const profileFields = [
  { key: 'NAME',     val: 'Sumit Thakur' },
  { key: 'CLASS',    val: 'Full Stack Developer' },
  { key: 'LEVEL',    val: '3+ Years Production Experience' },
  { key: 'GUILD',    val: 'Ingram Micro (Current)' },
  { key: 'PREV',     val: 'GEP Worldwide' },
  { key: 'LOCATION', val: 'Mumbai, India' },
  { key: 'TITLE',    val: '"Spotlight Awardee" × 2' },
  { key: 'CERT',     val: 'GCP Associate Cloud Engineer' },
  { key: 'EDU',      val: 'B.E. in IT — VPP College, 2022' },
  { key: 'STATUS',   val: 'Open to Opportunities' },
];

export function AboutSection() {
  return (
    <section id="about" className="section" style={{ background: 'var(--color-abyss)' }}>
      <div className="container">
        <RevealOnScroll>
          <h2 className="section-heading">HUNTER PROFILE</h2>
        </RevealOnScroll>

        <div className="about-grid">
          {/* Status Window */}
          <RevealOnScroll delay={0.1}>
            <SystemPanel>
              <div className="panel-header">
                <span>STATUS WINDOW</span>
                <span style={{ color: 'var(--rank-s)', fontSize: 'var(--text-xs)' }}>● S-RANK</span>
              </div>
              {profileFields.map(({ key, val }) => (
                <div key={key} className="profile-field">
                  <span className="profile-key">{key}</span>
                  <span className="profile-val">{val}</span>
                </div>
              ))}
            </SystemPanel>
          </RevealOnScroll>

          {/* Bio */}
          <RevealOnScroll delay={0.2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <SystemPanel>
                <div className="panel-header"><span>BIO.EXE</span></div>
                <p className="about-bio">
                  I am a results-driven Full Stack Developer with 3+ years forging enterprise-grade
                  systems at Ingram Micro, where I've delivered 10+ production REST APIs, slashed
                  onboarding time by 60%, and secured multi-region APAC/EMEA deployments.
                </p>
                <br />
                <p className="about-bio">
                  Armed with C# .NET Core, React.js, and a GCP certification, I specialize in
                  building performant backend systems and seamless frontends. Like a true Hunter,
                  I adapt to any dungeon — from fintech to enterprise CRM — and clear it with
                  precision and efficiency.
                </p>
              </SystemPanel>

              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {[
                  { val: '10+', label: 'REST APIs Delivered' },
                  { val: '60%', label: 'Faster Onboarding' },
                  { val: '35%+', label: 'API Perf. Gain' },
                  { val: '1000+', label: 'Enterprise Users Served' },
                ].map(({ val, label }) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.03 }}
                    style={{
                      padding: 'var(--space-4)',
                      background: 'rgba(13, 21, 38, 0.8)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--color-system-400)', textShadow: 'var(--glow-text-blue)' }}>
                      {val}
                    </div>
                    <div style={{ fontFamily: 'var(--font-system)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: '1px', marginTop: '4px' }}>
                      {label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
