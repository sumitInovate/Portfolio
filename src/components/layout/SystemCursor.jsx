import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SystemCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Outer ring — slower, more lag = ghost trail feeling
  const ringX = useSpring(mouseX, { damping: 22, stiffness: 180 });
  const ringY = useSpring(mouseY, { damping: 22, stiffness: 180 });

  // Inner dot — snaps to exact cursor position instantly
  const dotX = useSpring(mouseX, { damping: 40, stiffness: 600 });
  const dotY = useSpring(mouseY, { damping: 40, stiffness: 600 });

  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const down = () => setClicking(true);
    const up   = () => setClicking(false);

    // Detect hover over interactive elements
    const enter = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const role = e.target?.getAttribute?.('role');
      if (
        tag === 'a' || tag === 'button' || tag === 'input' ||
        tag === 'textarea' || tag === 'select' ||
        role === 'button' || role === 'link' || role === 'menuitem' ||
        e.target?.classList?.contains('glow-btn') ||
        e.target?.closest?.('a, button, [role="button"]')
      ) {
        setHovering(true);
      } else {
        setHovering(false);
      }
    };

    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('mouseover', enter);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mouseover', enter);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Outer tracking ring */}
      <motion.div
        className="sc-ring"
        style={{
          x: ringX,
          y: ringY,
          scale: clicking ? 0.65 : hovering ? 1.55 : 1,
          borderColor: hovering
            ? 'var(--color-system-400)'
            : 'rgba(74, 158, 255, 0.70)',
          boxShadow: hovering
            ? '0 0 16px 4px rgba(74,158,255,0.45), inset 0 0 8px rgba(74,158,255,0.15)'
            : '0 0 8px 2px rgba(74,158,255,0.25)',
        }}
        transition={{ scale: { type: 'spring', stiffness: 300, damping: 22 } }}
      />

      {/* Inner dot — exact position */}
      <motion.div
        className="sc-dot"
        style={{
          x: dotX,
          y: dotY,
          scale: clicking ? 0.5 : hovering ? 0 : 1,
          background: hovering ? 'transparent' : 'var(--color-system-400)',
        }}
        transition={{ scale: { type: 'spring', stiffness: 400, damping: 28 } }}
      />
    </>
  );
}
