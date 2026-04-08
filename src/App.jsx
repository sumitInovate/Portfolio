import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layout
import { Navigation }    from './components/layout/Navigation';
import { SystemCursor }  from './components/layout/SystemCursor';
import { PageTransition } from './components/layout/PageTransition';
import { CookieBanner }  from './components/layout/CookieBanner';

// Pages
import Home         from './pages/Home';
import About        from './pages/About';
import Works        from './pages/Works';
import Contact      from './pages/Contact';
import PrivacyPolicy  from './pages/legal/PrivacyPolicy';
import TermsOfUse     from './pages/legal/TermsOfUse';
import CookiePolicy   from './pages/legal/CookiePolicy';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
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
    </AnimatePresence>
  );
}

function App() {
  return (
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
    </BrowserRouter>
  );
}

export default App;
