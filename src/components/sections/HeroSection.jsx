import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CinematicHeroBackground } from '../three/CinematicHeroBackground';
import { SystemPanel } from '../ui/SystemPanel';
import { RankBadge } from '../ui/RankBadge';
import { GlowButton } from '../ui/GlowButton';
import { SystemText } from '../ui/SystemText';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

export function HeroSection() {
  const navigate = useNavigate();
  const { play } = useAudio();

  // Auto-play music when the hero section becomes visible
  // (after loading screen completes). Browser autoplay policy
  // requires a prior user interaction — the loading screen click
  // or the page load itself satisfies this on most browsers.
  useEffect(() => {
    const timer = setTimeout(() => play(), 1200);
    return () => clearTimeout(timer);
  }, [play]);

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="hero-section" aria-label="Hero section">
      {/* ── Cinematic background (no Three.js) ── */}
      <CinematicHeroBackground />

      {/* ── Content overlay ── */}
      <div className="hero-overlay">
        <motion.div
          className="hero-panel"
          initial={{ y: 60, opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, delay: 0.2, type: 'spring', stiffness: 70, damping: 18 }}
        >
          <SystemPanel>
            {/* Window chrome */}
            <div className="panel-header">
              <div className="panel-title">
                <div className="panel-dots">
                  <span className="panel-dot-red" />
                  <span className="panel-dot-amber" />
                  <span className="panel-dot-green" />
                </div>
                <span>SYSTEM NOTIFICATION</span>
              </div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                ⚔ GATE ACTIVATED
              </span>
            </div>

            {/* Typewriter alert */}
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-system-400)',
              marginBottom: 'var(--space-3)',
              letterSpacing: '1px',
            }}>
              <SystemText text="A NEW HUNTER HAS AWAKENED" speed={28} delay={500} />
            </p>

            {/* Name */}
            <h1 className="hero-name">SUMIT<br />THAKUR</h1>

            <p className="hero-role">.NET Core Developer · Full Stack Engineer</p>
            <p className="hero-stack">React.js · Enterprise Systems · GCP Certified</p>

            {/* Stats row */}
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-label">RANK</span>
                <RankBadge rank="S" />
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">EXP</span>
                <span style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>3+ YRS</span>
              </div>
              <div className="hero-stat">
                <MapPin size={11} color="var(--color-system-400)" />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Mumbai, India</span>
              </div>
              <div className="hero-stat">
                <Star size={11} color="var(--rank-c)" />
                <span style={{ color: 'var(--rank-c)', fontSize: 'var(--text-xs)', letterSpacing: '1px' }}>AVAILABLE</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="hero-cta-row">
              <GlowButton onClick={() => navigate('/contact')}>
                ACCEPT QUEST
              </GlowButton>
              <GlowButton onClick={scrollToAbout} variant="secondary">
                VIEW PROFILE ↓
              </GlowButton>
            </div>
          </SystemPanel>
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '36px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '3px',
          color: 'var(--color-text-muted)',
        }}
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
      >
        SCROLL
        <span style={{ fontSize: '14px', lineHeight: 1 }}>↓</span>
      </motion.div>
    </section>
  );
}
