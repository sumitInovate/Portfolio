import { useState, useEffect, useRef } from 'react';

/**
 * Tracks which section is currently most visible in the viewport.
 * @param {Array<{ sectionId: string }>} navItems - each item must have a `sectionId`
 *   matching the DOM element's `id` attribute.
 * @returns {string} The `sectionId` of the currently active section.
 */
export function useActiveSection(navItems) {
  const [active, setActive] = useState(navItems[0]?.sectionId ?? '');
  // Keep a live map of sectionId → intersectionRatio so we can compare across entries
  const ratioMap = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Update the ratio map for every changed entry
        entries.forEach((entry) => {
          ratioMap.current[entry.target.id] = entry.isIntersecting
            ? entry.intersectionRatio
            : 0;
        });

        // Pick the section with the highest visible ratio
        const best = Object.entries(ratioMap.current).reduce(
          (max, [id, ratio]) => (ratio > max.ratio ? { id, ratio } : max),
          { id: '', ratio: 0 }
        );

        if (best.ratio > 0) {
          setActive(best.id);
        }
      },
      {
        // Shrink the "active zone" to the middle 60% of the viewport so large
        // sections don't fight with each other at the edges.
        rootMargin: '-20% 0px -20% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    navItems.forEach(({ sectionId }) => {
      const el = document.getElementById(sectionId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [navItems]);

  return active;
}