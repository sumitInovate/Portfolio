import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';

// Route-based nav items
const navItems = [
  { label: 'LOBBY',    key: 'lobby'    },
  { label: 'TRAINING', key: 'training', to: '/training' },
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
  const location = useLocation();

  /** Resolve which nav key is active based on current route */
  const getActiveKey = () => {
    if (location.pathname.startsWith('/training')) return 'training';
    // Any other path (/:username, /demo) is the Lobby
    return 'lobby';
  };
  const activeKey = getActiveKey();

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <nav className="sidebar-nav" aria-label="Site navigation">
        <Link to="/" className="nav-logo" aria-label="CodeAether Home">
          CA
        </Link>

        <ul className="nav-items" role="menubar">
          {navItems.map((item) => {
            const isActive = activeKey === item.key;
            const isDisabled = !!item.disabled;

            return (
              <li key={item.key} className="nav-item" role="none">
                {isDisabled ? (
                  <span
                    className={`nav-link nav-link--disabled${isActive ? ' active' : ''}`}
                    role="menuitem"
                    aria-label={item.label}
                    aria-disabled="true"
                    title="Coming soon"
                  >
                    <span className="nav-dot" />
                    <span className="nav-label" aria-hidden="true">{item.label}</span>
                  </span>
                ) : (
                  <Link
                    to={item.to ?? location.pathname}
                    className={`nav-link${isActive ? ' active' : ''}`}
                    role="menuitem"
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="nav-dot" />
                    <span className="nav-label" aria-hidden="true">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
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
        <Link to="/" className="nav-logo" aria-label="CodeAether Home">CA</Link>
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
            {navItems.map((item, i) => {
              const isActive = activeKey === item.key;
              const isDisabled = !!item.disabled;
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  {isDisabled ? (
                    <span
                      className={`m-nav-link m-nav-link--disabled${isActive ? ' active' : ''}`}
                      aria-disabled="true"
                      title="Coming soon"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      to={item.to ?? location.pathname}
                      className={`m-nav-link${isActive ? ' active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
