import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { SystemCursor } from '../components/layout/SystemCursor';

/* ── Feature data ── */
const FEATURES = [
  {
    icon: '⚡',
    title: 'Dynamic Portfolios',
    desc: 'All your data — skills, projects, experience — loaded dynamically from a single profile. Update once, reflect everywhere.',
  },
  {
    icon: '🎮',
    title: 'RPG-Themed Interface',
    desc: 'An immersive Solo Leveling–inspired dashboard that makes your portfolio stand out from every generic résumé.',
  },
  {
    icon: '🔗',
    title: 'Shareable URL',
    desc: 'Your unique profile lives at codearther.vercel.com/{username}. One link to share with recruiters, anywhere.',
  },
];

const STATS = [
  { val: '100%', label: 'CUSTOM DATA' },
  { val: 'RPG', label: 'THEMED UI' },
  { val: '1 URL', label: 'YOUR LINK' },
];

/* ── Sign-In Modal ── */
function AuthModal({ onClose }) {
  const { signIn, authError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    const result = await signIn({ username: username.trim() });
    if (result.success) {
      navigate(`/${result.username}`);
    }
  }, [username, signIn, navigate]);

  return (
    <motion.div
      className="auth-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="auth-modal"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button className="auth-modal-close" onClick={onClose} aria-label="Close sign in">✕</button>

        <div className="auth-modal-header">
          <span className="auth-modal-eyebrow">SYSTEM ACCESS</span>
          <h2 id="auth-modal-title" className="auth-modal-title">SIGN IN</h2>
          <p className="auth-modal-subtitle">Enter your username to access your portfolio</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-username">USERNAME / SLUG</label>
            <input
              id="auth-username"
              className="form-input"
              placeholder="e.g. sumit-thakur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          {authError && (
            <div className="auth-error-msg" role="alert">
              ⚠ {authError}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? 'AUTHENTICATING...' : 'ACCESS PROFILE →'}
          </button>
        </form>

        <p className="auth-demo-hint">
          Demo: enter <strong>sumit-thakur</strong> to view a live profile
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <SystemCursor />

      <div className="landing-root">
        {/* Animated ambient background */}
        <div className="landing-bg" aria-hidden="true">
          <div className="landing-bg-orb landing-bg-orb--a" />
          <div className="landing-bg-orb landing-bg-orb--b" />
          <div className="landing-bg-orb landing-bg-orb--c" />
        </div>
        <div className="landing-grid" aria-hidden="true" />
        <div className="scan-lines" aria-hidden="true" />

        {/* ── Top Bar ── */}
        <header className="landing-topbar">
          <a href="/" className="landing-logo" aria-label="CodeAether home">
            <div className="landing-logo-mark">CA</div>
            <span className="landing-logo-text">Code<span>Aether</span></span>
          </a>
          <nav className="landing-topbar-nav" aria-label="Landing navigation">
            <a
              href="https://github.com/sumitInovate/Portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-topbar-link"
            >
              GITHUB
            </a>
            <button
              id="landing-signin-btn"
              className="landing-topbar-link landing-signin-link glow-btn"
              onClick={() => setShowAuth(true)}
              style={{ fontFamily: 'var(--font-system)', fontSize: 'var(--text-xs)', letterSpacing: '2px', padding: '8px 20px' }}
            >
              SIGN IN
            </button>
          </nav>
        </header>

        {/* ── Hero ── */}
        <section className="landing-hero" aria-label="CodeAether hero">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Eyebrow */}
            <div className="landing-eyebrow">
              <span className="landing-eyebrow-dot" />
              DEVELOPER PORTFOLIO PLATFORM
            </div>

            {/* Headline */}
            <h1 className="landing-headline">
              Your Skills.<br />
              <span className="landing-headline-accent">Legendary.</span>
            </h1>

            {/* Subheadline */}
            <p className="landing-subheadline">
              CodeAether transforms your developer profile into an immersive,
              RPG-styled portfolio. Dynamic data. One link. Unforgettable first impression.
            </p>

            {/* CTAs */}
            <div className="landing-cta-row">
              <button
                id="landing-create-btn"
                className="landing-btn-primary"
                onClick={() => setShowAuth(true)}
              >
                ACCESS YOUR PROFILE →
              </button>
              <a
                href="/sumit-thakur"
                className="landing-btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              >
                VIEW DEMO ↗
              </a>
            </div>

            {/* Stats bar */}
            <div className="landing-stat-bar" role="list">
              {STATS.map(({ val, label }) => (
                <div key={label} className="landing-stat-item" role="listitem">
                  <span className="landing-stat-val">{val}</span>
                  <span className="landing-stat-label">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Features ── */}
        <section className="landing-features" aria-label="CodeAether features">
          <div className="landing-features-header">
            <span className="landing-section-label">SYSTEM FEATURES</span>
            <h2 className="landing-section-title">Built for Hunters</h2>
          </div>

          <div className="landing-features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="feature-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              >
                <span className="feature-card-icon">{f.icon}</span>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="landing-footer">
          <p>
            © {new Date().getFullYear()} CodeAether · Built with React, Framer Motion &amp; Three.js ·{' '}
            <Link to="/privacy-policy">Privacy</Link> ·{' '}
            <Link to="/terms-of-use">Terms</Link>
          </p>
        </footer>
      </div>

      {/* ── Auth Modal (portal-like overlay) ── */}
      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </>
  );
}
