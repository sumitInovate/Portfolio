import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SystemPanel } from '../ui/SystemPanel';
import { RankBadge } from '../ui/RankBadge';
import { GlowButton } from '../ui/GlowButton';
import { SystemText } from '../ui/SystemText';
import { XPProgressPanel } from '../ui/XPProgressPanel';
import { GitHubStatsPanel } from '../ui/GitHubStatsPanel';
import { CharacterAvatar } from '../ui/CharacterAvatar';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

export function HeroSection() {
  const navigate = useNavigate();
  const { play } = useAudio();

  useEffect(() => {
    const timer = setTimeout(() => play(), 1200);
    return () => clearTimeout(timer);
  }, [play]);

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="hero-section" aria-label="Hero section">
      {/* ── Grid background ── */}
      <div className="hero-grid-bg" aria-hidden="true">
        <div className="hero-grid-overlay" />
        <div className="hero-grid-vignette" />
        {/* Subtle ambient glow in center */}
        <div className="hero-grid-glow" />
      </div>

      {/* ── Top HUD bar ── */}
      <div className="hero-hud-bar" aria-hidden="true">
        <div className="hud-bar-left">
          <div className="hud-bar-dots">
            <span className="panel-dot-red" />
            <span className="panel-dot-amber" />
            <span className="panel-dot-green" />
          </div>
          <span className="hud-bar-title">SYSTEM NOTIFICATION</span>
        </div>
        <span className="hud-bar-right">X GATE ACTIVATED</span>
      </div>

      {/* ── 2-column RPG dashboard ── */}
      <div className="hero-dashboard">

        {/* ── LEFT COLUMN: XP + GitHub panels ── */}
        <div className="hero-col hero-col--left">
          <XPProgressPanel />
          <GitHubStatsPanel />
        </div>

        {/* ── RIGHT COLUMN: Big info panel with avatar + data ── */}
        <div className="hero-col hero-col--right">
          <motion.div
            className="hero-info-panel-wrap"
            initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.0, delay: 0.25, type: 'spring', stiffness: 70, damping: 18 }}
          >
            <SystemPanel>
              {/* Invisible panel chrome kept for corner brackets — header hidden */}
              <div className="hero-info-inner">

                {/* Left sub: Avatar */}
                <div className="hero-avatar-col">
                  <CharacterAvatar />
                </div>

                {/* Right sub: Info */}
                <div className="hero-data-col">
                  {/* System alert */}
                  <p className="hero-alert-text">
                    <SystemText text="A NEW HUNTER HAS AWAKENED!" speed={26} delay={600} />
                  </p>

                  {/* Name */}
                  <h1 className="hero-name">SUMIT<br />THAKUR</h1>

                  {/* Roles */}
                  <p className="hero-role">Full Stack Engineer</p>
                  <p className="hero-stack">React.js • .NET Core • Enterprise Systems • GCP Certified</p>

                  {/* Stats grid */}
                  <div className="hero-stats">
                    <div className="hero-stat">
                      <span className="hero-stat-label">RANK:</span>
                      <RankBadge rank="S" />
                    </div>
                    <div className="hero-stat">
                      <span className="hero-stat-label">EXP:</span>
                      <span className="hero-stat-val">3+ YRS</span>
                    </div>
                    <div className="hero-stat">
                      <MapPin size={10} color="var(--color-system-400)" />
                      <span className="hero-stat-label">LOCATION:</span>
                      <span className="hero-stat-val">Mumbai, India</span>
                    </div>
                    <div className="hero-stat">
                      <span className="hero-stat-label">STATUS:</span>
                      <span className="hero-stat-available">AVAILABLE</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="hero-cta-row">
                    <GlowButton onClick={() => navigate('/contact')} className="hero-cta-btn">
                      ACCEPT QUEST
                    </GlowButton>
                    <GlowButton onClick={scrollToAbout} variant="secondary" className="hero-cta-btn">
                      VIEW PROFILE ↓
                    </GlowButton>
                  </div>
                </div>

              </div>
            </SystemPanel>
          </motion.div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        aria-hidden="true"
        className="hero-scroll-hint"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
      >
        SCROLL
        <span style={{ fontSize: '14px', lineHeight: 1 }}>↓</span>
      </motion.div>
    </section>
  );
}
