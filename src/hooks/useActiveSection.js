import { useState, useEffect, useCallback } from 'react';

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
  const [active, setActive] = useState(navItems[0]?.sectionId ?? '');

  const getActive = useCallback(() => {
    const vh = window.innerHeight;
    // The "trigger line" — 30% from the top of the viewport
    const triggerY = vh * 0.30;

    let bestId = navItems[0]?.sectionId ?? '';
    let bestDist = Infinity;

    navItems.forEach(({ sectionId }) => {
      const el = document.getElementById(sectionId);
      if (!el) return;

      const { top, bottom } = el.getBoundingClientRect();

      // Section must be at least partially on-screen
      if (bottom < 0 || top > vh) return;

      // Distance from the section's top edge to our trigger line
      const dist = Math.abs(top - triggerY);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = sectionId;
      }
    });

    setActive(bestId);
  }, [navItems]);

  useEffect(() => {
    // Run once on mount so the initial state is correct
    getActive();

    window.addEventListener('scroll', getActive, { passive: true });
    window.addEventListener('resize', getActive, { passive: true });

    return () => {
      window.removeEventListener('scroll', getActive);
      window.removeEventListener('resize', getActive);
    };
  }, [getActive]);

  return active;
}