import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
  enter:   { opacity: 1, y: 0, filter: 'blur(0px)',
             transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -10, filter: 'blur(4px)',
             transition: { duration: 0.3, ease: 'easeIn' } },
};

export function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      style={{ minHeight: '100vh', width: '100%', padding: 'var(--space-6)' }}
    >
      {children}
    </motion.div>
  );
}
