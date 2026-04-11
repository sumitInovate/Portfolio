import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';

// Audio
import { AudioProvider } from './context/AudioContext';

// Layout (always needed — no lazy loading for chrome/shell components)
import { Navigation }    from './components/layout/Navigation';
import { SystemCursor }  from './components/layout/SystemCursor';
import { PageTransition } from './components/layout/PageTransition';
import { CookieBanner }  from './components/layout/CookieBanner';

// Pages — lazy loaded for route-level code splitting.
// Each page becomes its own JS chunk, reducing the initial bundle.
const Home          = lazy(() => import('./pages/Home'));
const About         = lazy(() => import('./pages/About'));
const Works         = lazy(() => import('./pages/Works'));
const Contact       = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfUse    = lazy(() => import('./pages/legal/TermsOfUse'));
const CookiePolicy  = lazy(() => import('./pages/legal/CookiePolicy'));

/** Minimal loading fallback — matches site background so no flash */
function PageFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-void)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '3px',
        color: 'var(--color-text-muted)',
      }}
      aria-label="Loading page"
    >
      LOADING…
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageFallback />}>
        <Routes location={location} key={location.pathname}>
          {/* Main pages — Home is full-scroll, no extra padding */}
          <Route path="/"        element={<Home />} />
          <Route path="/about"   element={<PageTransition><About /></PageTransition>} />
          <Route path="/works"   element={<PageTransition><Works /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />

          {/* Legal pages */}
          <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/terms-of-use"   element={<PageTransition><TermsOfUse /></PageTransition>} />
          <Route path="/cookie-policy"  element={<PageTransition><CookiePolicy /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AudioProvider>
      <BrowserRouter>
        {/* Global decorative / interactive overlays */}
        <SystemCursor />
        <div className="scan-lines" aria-hidden="true" />

        {/* Left sidebar navigation */}
        <Navigation />

        {/* Main content — offset left by nav width */}
        <main className="page-wrapper" id="main-content">
          <AnimatedRoutes />
        </main>

        {/* Global cookie banner */}
        <CookieBanner />

        {/* Vercel Web Analytics */}
        <Analytics />
      </BrowserRouter>
    </AudioProvider>
  );
}

export default App;
