import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function CookieBanner() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem('cookie-accepted')
  );

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="cookie-banner"
        role="alertdialog"
        aria-label="Cookie notice"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <p className="cookie-text">
          This site uses no tracking cookies. Analytics are privacy-first &amp; anonymised.{' '}
          <Link to="/cookie-policy">Learn more</Link>
        </p>
        <button
          className="cookie-accept"
          onClick={() => {
            localStorage.setItem('cookie-accepted', '1');
            setVisible(false);
          }}
          aria-label="Accept cookie policy"
        >
          GOT IT
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
