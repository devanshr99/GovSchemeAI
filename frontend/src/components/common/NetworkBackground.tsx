'use client';

import React, { useEffect, useRef } from 'react';

export interface NetworkBackgroundProps {
  className?: string;
  nodeColor?: string;
  lineColor?: string;
  backgroundColor?: string;
  maxDistanceDesktop?: number;
  maxDistanceMobile?: number;
}

interface Particle {
  nx: number; // Normalized x (0..1)
  ny: number; // Normalized y (0..1)
  nvx: number; // Normalized velocity x
  nvy: number; // Normalized velocity y
  radius: number; // Pixel radius
  fadePhase: number; // Phase for delicate alpha breathing
  fadeSpeed: number; // Speed of alpha breathing
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
 * NetworkBackground component
 *
 * Implements the exact visual target from the reference:
 * - Pale cyan background (#DFF3F5) with subtle airy gradient
 * - Small turquoise circular nodes (#43C9C5)
 * - Delicate, very thin connecting lines (#A8E5E5) with low opacity
 * - Irregular polygonal connections, not a uniform grid
 * - Gentle, slow drift movement with smooth boundary handling
 * - DPR-aware rendering for sharp lines and nodes
 * - Clean teardown and respects prefers-reduced-motion
 */
export const NetworkBackground: React.FC<NetworkBackgroundProps> = ({
  className = 'absolute inset-0 w-full h-full pointer-events-none',
  nodeColor = '#43C9C5',
  lineColor = '#A8E5E5',
  backgroundColor = '#DFF3F5',
  maxDistanceDesktop = 150,
  maxDistanceMobile = 105,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
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

    // Helper to determine node count based on container width
    const getNodeCount = (w: number) => {
      if (w < 640) return 22; // Mobile
      if (w < 1024) return 34; // Tablet
      return 46; // Desktop
    };

    // Helper to calculate max distance based on container width
    const getMaxDistance = (w: number) => {
      if (w < 640) return maxDistanceMobile;
      if (w < 1024) return Math.round((maxDistanceMobile + maxDistanceDesktop) / 2);
      return maxDistanceDesktop;
    };

    /**
     * Initialize particles deterministically using seeded RNG
     */
    const initParticles = (w: number, h: number) => {
      const rng = createSeededRandom(104729); // Deterministic seed
      const count = getNodeCount(w);
      const newParticles: Particle[] = [];

      // Grid jitter approach for well-balanced, non-clumping sparse distribution
      const cols = Math.ceil(Math.sqrt(count * (w / Math.max(h, 1))));
      const rows = Math.ceil(count / cols);
      const cellW = 1 / cols;
      const cellH = 1 / rows;

      let created = 0;
      for (let r = 0; r < rows && created < count; r++) {
        for (let c = 0; c < cols && created < count; c++) {
          // Asymmetrical jitter within cell, with organic margin
          const jitterX = (rng() - 0.5) * 0.75 * cellW;
          const jitterY = (rng() - 0.5) * 0.75 * cellH;
          const nx = Math.max(0.04, Math.min(0.96, (c + 0.5) * cellW + jitterX));
          const ny = Math.max(0.05, Math.min(0.95, (r + 0.5) * cellH + jitterY));

          // Extremely slow velocity (pixels per frame in normalized space)
          const angle = rng() * Math.PI * 2;
          const speedPx = 0.16 + rng() * 0.18; // 0.16 to 0.34 px/frame
          const nvx = (Math.cos(angle) * speedPx) / Math.max(w, 400);
          const nvy = (Math.sin(angle) * speedPx) / Math.max(h, 300);

          // Small turquoise circular nodes (2.0px to 3.0px)
          const radius = 2.0 + rng() * 1.0;

          newParticles.push({
            nx,
            ny,
            nvx: prefersReducedMotion ? 0 : nvx,
            nvy: prefersReducedMotion ? 0 : nvy,
            radius,
            fadePhase: rng() * Math.PI * 2,
            fadeSpeed: 0.008 + rng() * 0.012,
          });

          created++;
        }
      }

      particles = newParticles;
    };

    /**
     * Resize canvas with DPR awareness for crisp lines and circles
     */
    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const newWidth = Math.max(Math.floor(rect.width), 100);
      const newHeight = Math.max(Math.floor(rect.height), 100);

      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

      width = newWidth;
      height = newHeight;

      canvas.width = Math.floor(newWidth * dpr);
      canvas.height = Math.floor(newHeight * dpr);
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      if (particles.length === 0 || Math.abs(particles.length - getNodeCount(newWidth)) > 10) {
        initParticles(newWidth, newHeight);
      }

      if (prefersReducedMotion) {
        renderFrame();
      }
    };

    /**
     * Render a single frame
     */
    const renderFrame = () => {
      if (width <= 0 || height <= 0) return;

      // 1. Soft, minimal, airy pale-cyan background (#DFF3F5) with subtle variation
      const bgGradient = ctx.createRadialGradient(
        width * 0.35,
        height * 0.3,
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      // Extremely subtle, elegant light gradation around reference #DFF3F5
      bgGradient.addColorStop(0, '#E7F7F8');
      bgGradient.addColorStop(0.55, backgroundColor);
      bgGradient.addColorStop(1, '#D8F0F2');

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const maxDist = getMaxDistance(width);
      const maxDistSq = maxDist * maxDist;

      // Track edge count per node to keep connections irregular and sparse (polygonal, not dense web)
      const edgeCounts = new Uint8Array(particles.length);
      const maxEdgesPerNode = 4; // Restrained to prevent dense web cluster

      // 2. Draw connecting lines (#A8E5E5 with low opacity, thin and delicate)
      ctx.lineWidth = 0.85;

      for (let i = 0; i < particles.length; i++) {
        if (edgeCounts[i] >= maxEdgesPerNode) continue;
        const pi = particles[i];
        const xi = pi.nx * width;
        const yi = pi.ny * height;

        for (let j = i + 1; j < particles.length; j++) {
          if (edgeCounts[j] >= maxEdgesPerNode) continue;
          const pj = particles[j];
          const xj = pj.nx * width;
          const yj = pj.ny * height;

          const dx = xi - xj;
          const dy = yi - yj;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            // Distance-based delicate alpha (0.15 to 0.50)
            const distFactor = 1 - dist / maxDist;

            // Subtle gentle breathing variation so a few lines softly fade into the background
            const lineBreathing = 0.75 + 0.25 * Math.sin(pi.fadePhase + pj.fadePhase);
            const alpha = Math.min(0.52, Math.max(0.12, distFactor * 0.48 * lineBreathing));

            ctx.beginPath();
            ctx.moveTo(xi, yi);
            ctx.lineTo(xj, yj);
            ctx.strokeStyle = `rgba(168, 229, 229, ${alpha.toFixed(3)})`;
            ctx.stroke();

            edgeCounts[i]++;
            edgeCounts[j]++;
          }
        }
      }

      // 3. Draw small turquoise circular nodes (#43C9C5)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const x = p.nx * width;
        const y = p.ny * height;

        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        // 4. Smooth slow movement & boundary drift (if motion not reduced)
        if (!prefersReducedMotion) {
          p.nx += p.nvx;
          p.ny += p.nvy;

          // Gentle breathing phase for line fade
          p.fadePhase += p.fadeSpeed;

          // Soft boundary wrap with normalized margin
          const marginX = 25 / width;
          const marginY = 25 / height;

          if (p.nx < -marginX) p.nx = 1 + marginX;
          if (p.nx > 1 + marginX) p.nx = -marginX;
          if (p.ny < -marginY) p.ny = 1 + marginY;
          if (p.ny > 1 + marginY) p.ny = -marginY;
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

    // Initialize dimensions and particles
    handleResize();

    // Use ResizeObserver for accurate container scaling
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Visibility change handler to save battery / CPU when tab is hidden
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

    // Start animation if motion is enabled
    if (!prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      renderFrame();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [backgroundColor, nodeColor, lineColor, maxDistanceDesktop, maxDistanceMobile]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
    </div>
  );
};

export default NetworkBackground;
