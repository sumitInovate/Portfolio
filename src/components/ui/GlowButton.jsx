import { motion } from 'framer-motion';

export function GlowButton({ children, onClick, variant = 'primary', className = '' }) {
  return (
    <motion.button
      className={`glow-btn glow-btn--${variant} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <span className="glow-btn__ripple" />
      {children}
    </motion.button>
  );
}
