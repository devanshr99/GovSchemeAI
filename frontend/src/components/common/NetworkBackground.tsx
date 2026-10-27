'use client';

import React, { useEffect, useRef } from 'react';

export interface NetworkBackgroundProps {
  className?: string;
  nodeColor?: string;
  lineColor?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fadePhase: number;
  fadeSpeed: number;
}

/**
 * Seeded pseudo-random generator (Mulberry32)
 * Ensures a deterministic initial network layout matching the reference.
 */
function createSeededRandom(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Global Floating Network Background
 *
 * Requirements:
 * - Mounted ONCE at root layout, spans fixed across the entire viewport.
 * - Positioned behind all page content with pointer-events: none.
 * - Transparent canvas with only nodes (#43C9C5) and delicate lines (#A8E5E5).
 * - Very subtle underlying pale-cyan tint (#DFF3F5) on container without opaque solid blocking.
 * - Slow, smooth continuous floating drift with boundary wrapping.
 * - Device-pixel-ratio aware, responsive particle count, respects prefers-reduced-motion.
 */
export const NetworkBackground: React.FC<NetworkBackgroundProps> = ({
  className = '',
  nodeColor = '#43C9C5',
  lineColor = '168, 229, 229', // RGB for #A8E5E5 to control delicate alpha
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let isVisible = true;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Determine particle count based on viewport width
    const getParticleCount = (w: number) => {
      if (w < 640) return 24; // Mobile
      if (w < 1024) return 38; // Tablet
      return 52; // Desktop
    };

    // Determine max connection distance based on viewport width
    const getMaxDistance = (w: number) => {
      if (w < 640) return 110;
      if (w < 1024) return 135;
      return 160;
    };

    /**
     * Initialize particles deterministically across the viewport
     */
    const initParticles = (w: number, h: number) => {
      const rng = createSeededRandom(42857);
      const count = getParticleCount(w);
      const newParticles: Particle[] = [];

      // Grid-jitter placement across viewport to maintain sparse, elegant polygonal balance
      const cols = Math.ceil(Math.sqrt(count * (w / Math.max(h, 1))));
      const rows = Math.ceil(count / cols);
      const cellW = w / cols;
      const cellH = h / rows;

      let created = 0;
      for (let r = 0; r < rows && created < count; r++) {
        for (let c = 0; c < cols && created < count; c++) {
          const jitterX = (rng() - 0.5) * 0.7 * cellW;
          const jitterY = (rng() - 0.5) * 0.7 * cellH;
          const x = Math.max(20, Math.min(w - 20, (c + 0.5) * cellW + jitterX));
          const y = Math.max(20, Math.min(h - 20, (r + 0.5) * cellH + jitterY));

          // Slow, smooth continuous floating drift
          const angle = rng() * Math.PI * 2;
          const speed = 0.12 + rng() * 0.16; // 0.12 to 0.28 px/frame
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;

          // Small circular nodes (1.6px - 2.6px)
          const radius = 1.6 + rng() * 1.0;

          newParticles.push({
            x,
            y,
            vx: prefersReducedMotion ? 0 : vx,
            vy: prefersReducedMotion ? 0 : vy,
            radius,
            fadePhase: rng() * Math.PI * 2,
            fadeSpeed: 0.006 + rng() * 0.01,
          });

          created++;
        }
      }

      particles = newParticles;
    };

    /**
     * Resize canvas with DPR awareness for crisp, razor-sharp lines & circles
     */
    const handleResize = () => {
      if (!canvas) return;
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = newWidth;
      height = newHeight;

      canvas.width = Math.floor(newWidth * dpr);
      canvas.height = Math.floor(newHeight * dpr);
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Re-initialize particles if count significantly diverges or empty
      if (particles.length === 0 || Math.abs(particles.length - getParticleCount(newWidth)) > 10) {
        initParticles(newWidth, newHeight);
      } else {
        // Gently clamp existing particles to new viewport bounds
        for (const p of particles) {
          if (p.x > newWidth) p.x = newWidth - 20;
          if (p.y > newHeight) p.y = newHeight - 20;
        }
      }

      if (prefersReducedMotion) {
        renderFrame();
      }
    };

    /**
     * Render a single frame (transparent canvas with delicate network)
     */
    const renderFrame = () => {
      if (width <= 0 || height <= 0) return;

      // 1. CLEAR CANVAS - transparent background, NO solid color fill
      ctx.clearRect(0, 0, width, height);

      const maxDist = getMaxDistance(width);
      const maxDistSq = maxDist * maxDist;

      // Track edge count per node to keep connections irregular and sparse (polygonal, not dense web)
      const edgeCounts = new Uint8Array(particles.length);
      const maxEdgesPerNode = 4;

      // 2. Draw very thin, delicate connecting lines (#A8E5E5)
      ctx.lineWidth = 0.75;

      for (let i = 0; i < particles.length; i++) {
        if (edgeCounts[i] >= maxEdgesPerNode) continue;
        const pi = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          if (edgeCounts[j] >= maxEdgesPerNode) continue;
          const pj = particles[j];

          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            // Distance factor (1 -> 0)
            const distFactor = 1 - dist / maxDist;

            // Gentle breathing factor so a few lines softly fade into the background
            const lineBreathing = 0.75 + 0.25 * Math.sin(pi.fadePhase + pj.fadePhase);
            // Low, delicate opacity (0.06 to 0.35)
            const alpha = Math.min(0.36, Math.max(0.06, distFactor * 0.32 * lineBreathing));

            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `rgba(${lineColor}, ${alpha.toFixed(3)})`;
            ctx.stroke();

            edgeCounts[i]++;
            edgeCounts[j]++;
          }
        }
      }

      // 3. Draw small turquoise circular nodes (#43C9C5)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        // 4. Smooth, slow velocity drift & boundary wrapping
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          p.fadePhase += p.fadeSpeed;

          // Soft boundary wrap with 25px margin
          if (p.x < -25) p.x = width + 25;
          if (p.x > width + 25) p.x = -25;
          if (p.y < -25) p.y = height + 25;
          if (p.y > height + 25) p.y = -25;
        }
      }
    };

    /**
     * Animation loop
     */
    const animate = () => {
      if (isVisible && !prefersReducedMotion) {
        renderFrame();
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    // Initialize dimensions and listeners
    handleResize();
    window.addEventListener('resize', handleResize);

    // Pause on tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        isVisible = true;
        if (!prefersReducedMotion) {
          animationFrameId = requestAnimationFrame(animate);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start continuous animation
    if (!prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      renderFrame();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [nodeColor, lineColor]);

  return (
    <div
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Very subtle underlying pale-cyan atmospheric tint (#DFF3F5) on light base */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(223, 243, 245, 0.40) 0%, rgba(223, 243, 245, 0.15) 60%, transparent 100%)',
        }}
      />
      
      {/* Transparent Canvas with Floating Network */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default NetworkBackground;
