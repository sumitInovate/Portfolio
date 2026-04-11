import { motion } from 'framer-motion';

/**
 * CharacterDisplay — center-stage 3D-style character render.
 *
 * Uses the existing Sumit_Solo.png with layered CSS effects:
 *   - Ambient aura ring (radial glow halo)
 *   - Platform light beneath the feet
 *   - Edge-preserving drop shadow for depth
 *   - Subtle parallax float animation (y-shift loop)
 *
 * No Three.js / WebGL needed.
 */
export function CharacterDisplay() {
  return (
    <div className="char-stage" aria-hidden="true">
      {/* Dungeon gate halo — large outer glow orb */}
      <div className="char-gate-halo" />
      <div className="char-gate-halo char-gate-halo--inner" />

      {/* Holographic ring around character */}
      <div className="char-holo-ring" />

      {/* Platform glow — light pool at feet */}
      <div className="char-platform-glow" />

      {/* Character card — floating animation wrapper */}
      <motion.div
        className="char-card"
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
      >
        <img
          src="/Sumit_Solo.png"
          alt="Sumit Thakur — S-Rank Developer"
          className="char-img"
          loading="eager"
          draggable="false"
        />
        {/* Depth edge glow — makes character pop from bg */}
        <div className="char-depth-edge" />
      </motion.div>

      {/* Floating data particles around character */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="char-particle"
          style={{
            '--px': `${[15, 80, 25, 70, 10, 88][i]}%`,
            '--py': `${[60, 55, 30, 35, 75, 70][i]}%`,
            '--pdelay': `${i * 0.55}s`,
          }}
          animate={{
            y: [0, -18, 0],
            opacity: [0.3, 0.9, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + i * 0.4,
            delay: i * 0.55,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
