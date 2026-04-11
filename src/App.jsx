import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Providers
import { AudioProvider }  from './context/AudioContext';
import { AuthProvider }   from './context/AuthContext';
import { UserProvider }   from './context/UserContext';

// Layout (always needed — no lazy loading for chrome/shell components)
import { SystemCursor }   from './components/layout/SystemCursor';
import { PageTransition } from './components/layout/PageTransition';
import { CookieBanner }   from './components/layout/CookieBanner';

// Pages — lazy loaded for route-level code splitting
const LandingPage   = lazy(() => import('./pages/LandingPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfUse    = lazy(() => import('./pages/legal/TermsOfUse'));
const CookiePolicy  = lazy(() => import('./pages/legal/CookiePolicy'));

/** Minimal loading fallback — matches site background */
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
          {/* Root — CodeAether landing + auth */}
          <Route path="/" element={<LandingPage />} />

          {/* Legal pages */}
          <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/terms-of-use"   element={<PageTransition><TermsOfUse /></PageTransition>} />
          <Route path="/cookie-policy"  element={<PageTransition><CookiePolicy /></PageTransition>} />

          {/* Dynamic user portfolios — must be last to avoid catching /legal/* */}
          <Route path="/:username" element={<PortfolioPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <AudioProvider>
          <BrowserRouter>
            {/* Global decorative / interactive overlays */}
            <SystemCursor />
            <div className="scan-lines" aria-hidden="true" />

            {/* Main content — no global nav wrapper; each page controls its own layout */}
            <main className="page-wrapper" id="main-content" style={{ marginLeft: 0 }}>
              <AnimatedRoutes />
            </main>

            {/* Global cookie banner */}
            <CookieBanner />
          </BrowserRouter>
        </AudioProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
