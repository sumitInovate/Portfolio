import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { LoadingScreen } from '../components/layout/LoadingScreen';
import { Navigation } from '../components/layout/Navigation';
import { HeroSection } from '../components/sections/HeroSection';
import { AboutSection } from '../components/sections/AboutSection';
import { SkillsSection } from '../components/sections/SkillsSection';
import { ExperienceSection } from '../components/sections/ExperienceSection';
import { ProjectsSection } from '../components/sections/ProjectsSection';
import { CertificationsSection } from '../components/sections/CertificationsSection';
import { ContactSection } from '../components/sections/ContactSection';
import { Footer } from '../components/layout/Footer';

/** Shown when a username slug has no matching data */
function UserNotFound({ slug }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-void)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-6)',
        fontFamily: 'var(--font-mono)',
        textAlign: 'center',
        padding: 'var(--space-8)',
      }}
    >
      <div style={{ fontSize: 'var(--text-xl)', color: 'var(--color-system-400)', letterSpacing: '4px' }}>
        404 — HUNTER NOT FOUND
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', letterSpacing: '2px' }}>
        No profile registered for <span style={{ color: 'var(--color-text-secondary)' }}>"{slug}"</span>
      </div>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 'var(--space-4)',
          fontFamily: 'var(--font-system)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '2px',
          color: 'var(--color-system-400)',
          border: '1px solid var(--color-system-400)',
          background: 'transparent',
          padding: '10px 28px',
          cursor: 'pointer',
        }}
      >
        ← RETURN TO CODEAETHER
      </button>
    </div>
  );
}

/**
 * PortfolioPage
 *
 * @param {object}  props
 * @param {string}  [props.forceUsername]  — override the URL param (used for /demo → boilerplate)
 */
export default function PortfolioPage({ forceUsername }) {
  const { username: paramUsername } = useParams();
  const username = forceUsername ?? paramUsername;

  const { fetchUser, userData, userError, userLoading } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) fetchUser(username);
  }, [username, fetchUser]);

  // Show 404 if user data fetch failed
  if (userError && !userLoading) return <UserNotFound slug={username} />;

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {/* Navigation renders its own fixed sidebar/mobile bar */}
      {userData && !loading && <Navigation />}

      {/* Page content — offset left by nav width on desktop */}
      <div className="portfolio-page-wrapper">
        <motion.div
          initial={{ opacity: 0 }}
          animate={loading || !userData ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {userData && (
            <>
              <HeroSection />
              <AboutSection />
              <SkillsSection />
              <ExperienceSection />
              <ProjectsSection />
              <CertificationsSection />
              <ContactSection />
              <Footer />
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
