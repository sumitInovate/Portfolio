import { useState, useEffect, useCallback } from 'react';

function computeActiveSection(navItems) {
  if (typeof window === 'undefined') return navItems[0]?.sectionId ?? '';

  const vh = window.innerHeight;
  const triggerY = vh * 0.30;
  let bestId = navItems[0]?.sectionId ?? '';
  let bestDist = Infinity;

  navItems.forEach(({ sectionId }) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    const { top, bottom } = el.getBoundingClientRect();
    if (bottom < 0 || top > vh) return;

    const dist = Math.abs(top - triggerY);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = sectionId;
    }
  });

  return bestId;
}

/**
 * Tracks which section is currently most visible in the viewport.
 *
 * Uses a scroll-event approach: on each scroll tick we measure every section's
 * bounding rect and pick the one whose top edge is closest to 30% down the
 * viewport.  This is robust regardless of CSS overflow / layout quirks that
 * can silently break IntersectionObserver.
 *
 * @param {Array<{ sectionId: string }>} navItems
 * @returns {string} sectionId of the currently active section
 */
export function useActiveSection(navItems) {
  const [active, setActive] = useState(() => computeActiveSection(navItems));

  const getActive = useCallback(() => {
    setActive(computeActiveSection(navItems));
  }, [navItems]);

  useEffect(() => {
    window.addEventListener('scroll', getActive, { passive: true });
    window.addEventListener('resize', getActive, { passive: true });

    return () => {
      window.removeEventListener('scroll', getActive);
      window.removeEventListener('resize', getActive);
    };
  }, [getActive]);

  return active;
}