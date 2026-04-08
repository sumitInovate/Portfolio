import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';

const navItems = [
  { path: '/', label: 'HOME' },
  { path: '/about', label: 'ABOUT' },
  { path: '/works', label: 'WORKS' },
  { path: '/contact', label: 'CONTACT' },
];

/* Animated equaliser bars — shown when music is playing */
function EqBars() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
      {[1, 0.6, 0.85, 0.45].map((h, i) => (
        <motion.span
          key={i}
          style={{
            display: 'block',
            width: '2px',
            borderRadius: '1px',
            background: 'var(--color-system-400)',
            originY: 1,
          }}
          animate={{ scaleY: [h, h * 0.3, h * 0.8, h * 0.15, h] }}
          transition={{
            duration: 0.9,
            delay: i * 0.15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          initial={{ scaleY: h, height: '14px' }}
        />
      ))}
    </span>
  );
}

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { playing, toggle } = useAudio();

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <nav className="sidebar-nav" aria-label="Site navigation">
        <Link to="/" className="nav-logo" aria-label="Home">
          SU
        </Link>

        <ul className="nav-items" role="menubar">
          {navItems.map((item) => (
            <li key={item.path} className="nav-item" role="none">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                role="menuitem"
                aria-label={item.label}
              >
                <span className="nav-dot" />
                <span className="nav-label" aria-hidden="true">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Music control button */}
        <button
          className={`nav-sound${playing ? ' nav-sound--playing' : ''}`}
          onClick={toggle}
          title={playing ? 'Pause ambient music' : 'Play ambient music'}
          aria-label={playing ? 'Pause ambient music' : 'Play ambient music'}
          aria-pressed={playing}
        >
          {playing ? <EqBars /> : '♩'}
        </button>
      </nav>

      {/* ── Mobile Top Bar ── */}
      <div className="mobile-nav-bar" aria-label="Mobile navigation">
        <Link to="/" className="nav-logo" aria-label="Home">SU</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className={`nav-sound${playing ? ' nav-sound--playing' : ''}`}
            onClick={toggle}
            aria-label={playing ? 'Pause music' : 'Play music'}
          >
            {playing ? <EqBars /> : '♩'}
          </button>
          <button
            className="hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            ☰
          </button>
        </div>
      </div>

      {/* ── Mobile Full-Screen Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="mobile-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
            {navItems.map((item, i) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `m-nav-link${isActive ? ' active' : ''}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
