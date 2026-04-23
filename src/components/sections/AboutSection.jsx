import { RevealOnScroll } from '../ui/RevealOnScroll';
import { SystemPanel }    from '../ui/SystemPanel';
import { motion }         from 'framer-motion';
import { useUser }        from '../../context/UserContext';

export function AboutSection() {
  const { userData } = useUser();
  const about = userData?.about ?? {};
  const profileFields = about.profileFields ?? [];
  const bio           = about.bio ?? [];
  const quickStats    = about.quickStats ?? [];

  return (
    <section id="about" className="section" style={{ background: 'var(--color-cream)' }}>
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
                {bio.map((paragraph, i) => (
                  <p key={i} className="about-bio" style={i > 0 ? { marginTop: 'var(--space-4)' } : {}}>
                    {paragraph}
                  </p>
                ))}
              </SystemPanel>

              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {quickStats.map(({ val, label }) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.03 }}
                    style={{
                      padding: 'var(--space-4)',
                      background: 'rgba(232, 228, 221, 0.8)',
                      border: '1px solid var(--color-light-border)',
                      borderRadius: '4px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--color-charcoal)' }}>
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
