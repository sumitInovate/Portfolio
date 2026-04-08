import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', label: 'HOME' },
  { path: '/about', label: 'ABOUT' },
  { path: '/works', label: 'WORKS' },
  { path: '/contact', label: 'CONTACT' },
];

export function Navigation() {
  const [soundOn, setSoundOn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

        <button
          className="nav-sound"
          onClick={() => setSoundOn((s) => !s)}
          title={soundOn ? 'Mute ambient sound' : 'Enable ambient sound'}
          aria-label={soundOn ? 'Mute ambient sound' : 'Enable ambient sound'}
        >
          {soundOn ? '♪' : '♩'}
        </button>
      </nav>

      {/* ── Mobile Top Bar ── */}
      <div className="mobile-nav-bar" aria-label="Mobile navigation">
        <Link to="/" className="nav-logo" aria-label="Home">SU</Link>
        <button
          className="hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          ☰
        </button>
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
            aria-label="Navigation menu"
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
