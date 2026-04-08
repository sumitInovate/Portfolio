import { useRef, useEffect, useCallback } from 'react';

/* ─── Particle configuration ────────────────────────────────────── */
const PARTICLE_COUNT = 180;

function makeParticle(W, H) {
  const kind = Math.random();
  if (kind < 0.55) {
    // rising ember / dust
    return {
      type: 'ember',
      x: Math.random() * W,
      y: H + Math.random() * 60,
      size: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.5 + 0.15),
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() < 0.6 ? '#4A9EFF' : '#9B6FFF',
      life: 1,
      decay: Math.random() * 0.0015 + 0.0005,
    };
  } else if (kind < 0.8) {
    // static sparkle / star
    return {
      type: 'sparkle',
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.08,
      vy: -(Math.random() * 0.06),
      opacity: Math.random() * 0.8 + 0.1,
      color: Math.random() < 0.5 ? '#ffffff' : '#C4DFFF',
      life: 1,
      decay: Math.random() * 0.002 + 0.0003,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    };
  } else {
    // drifting ash
    return {
      type: 'ash',
      x: Math.random() * W,
      y: Math.random() * H * 0.7 + H * 0.15,
      size: Math.random() * 1.0 + 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: Math.random() * 0.08 - 0.04,
      opacity: Math.random() * 0.35 + 0.05,
      color: '#7BA8D0',
      life: 1,
      decay: Math.random() * 0.001 + 0.0002,
    };
  }
}

/* ─── Main component ─────────────────────────────────────────────── */
export function CinematicHeroBackground() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  // Parallax on mouse move
  useEffect(() => {
    const handler = (e) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const initParticles = useCallback((W, H) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      makeParticle(W, H)
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = () => {
      const W = canvas.width;
      const H = canvas.height;
      timeRef.current += 0.016;
      const t = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      particlesRef.current.forEach((p, i) => {
        // Update
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.type === 'sparkle') {
          p.opacity = (0.4 + Math.sin(t * p.twinkleSpeed * 60 + p.twinklePhase) * 0.4) * p.life;
        }

        // Reset when dead or out of bounds
        if (p.life <= 0 || p.y < -20 || p.x < -20 || p.x > W + 20) {
          particlesRef.current[i] = makeParticle(W, H);
          return;
        }

        // Draw
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.type === 'sparkle' ? p.opacity : p.opacity * p.life);
        ctx.fillStyle = p.color;

        if (p.type === 'ember') {
          // Glowing ember
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          grd.addColorStop(0, p.color);
          grd.addColorStop(1, 'transparent');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      frameRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [initParticles]);

  // Mouse parallax CSS vars via inline style on container element
  const mx = mouseRef.current.x;
  const my = mouseRef.current.y;

  return (
    <div className="cinematic-hero-bg" aria-hidden="true">
      {/* ── Layer 1: Deep space base ── */}
      <div className="chb-base" />

      {/* ── Layer 2: Main gate radial glow (timed pulse via CSS) ── */}
      <div className="chb-gate-glow" />
      <div className="chb-gate-glow chb-gate-glow--inner" />

      {/* ── Layer 3: Horizontal aperture ring around gate ── */}
      <div className="chb-gate-ring" />

      {/* ── Layer 4: Vertical light pillar beams ── */}
      <div className="chb-pillars">
        <div className="chb-pillar chb-pillar--1" />
        <div className="chb-pillar chb-pillar--2" />
        <div className="chb-pillar chb-pillar--3" />
        <div className="chb-pillar chb-pillar--4" />
        <div className="chb-pillar chb-pillar--5" />
      </div>

      {/* ── Layer 5: Ground energy burst (cone from bottom) ── */}
      <div className="chb-ground-burst" />

      {/* ── Layer 6: Volumetric mist / ground fog ── */}
      <div className="chb-fog">
        <div className="chb-fog-layer chb-fog-layer--1" />
        <div className="chb-fog-layer chb-fog-layer--2" />
        <div className="chb-fog-layer chb-fog-layer--3" />
      </div>

      {/* ── Layer 7: Particle canvas ── */}
      <canvas ref={canvasRef} className="chb-canvas" />

      {/* ── Layer 8: Scan lines ── */}
      <div className="chb-scanlines" />

      {/* ── Layer 9: Vignette ── */}
      <div className="chb-vignette" />

      {/* ── Layer 10: Top letter-box bar ── */}
      <div className="chb-letterbox-top" />
      <div className="chb-letterbox-bottom" />
    </div>
  );
}
