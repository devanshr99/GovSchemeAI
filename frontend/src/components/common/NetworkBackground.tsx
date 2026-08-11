'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
}

export const NetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Respect user reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = width < 768;
    // Balanced network density: 40 nodes desktop, 22 mobile
    const particleCount = isMobile ? 22 : 40;
    const maxDistance = isMobile ? 120 : 155;

    // Premium Purple & Lavender Palette
    const nodePalette = [
      { color: 'rgba(167, 139, 250, 0.55)', glow: 'rgba(167, 139, 250, 0.18)' },  // Lavender (#A78BFA)
      { color: 'rgba(192, 132, 252, 0.48)', glow: 'rgba(192, 132, 252, 0.15)' },  // Soft Purple (#C084FC)
      { color: 'rgba(139, 92, 246, 0.45)', glow: 'rgba(139, 92, 246, 0.14)' },   // Violet (#8B5CF6)
      { color: 'rgba(34, 211, 238, 0.38)', glow: 'rgba(34, 211, 238, 0.10)' },   // Subtle Cyan Accent
    ];

    const initParticles = () => {
      particles = [];
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      for (let i = 0; i < particleCount; i++) {
        const palette = nodePalette[Math.floor(Math.random() * nodePalette.length)];
        const speed = prefersReducedMotion ? 0 : 0.06 + Math.random() * 0.08;
        const angle = Math.random() * Math.PI * 2;

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 1.8 + 2.0, // 2.0px - 3.8px clearly visible nodes
          color: palette.color,
          glowColor: palette.glow,
        });
      }
    };

    initParticles();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep dark purple radial atmospheric background
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.25,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height)
      );
      gradient.addColorStop(0, '#100B1C');
      gradient.addColorStop(0.5, '#0B0814');
      gradient.addColorStop(1, '#06040A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle purple connecting lines (10% to 16% opacity)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(167, 139, 250, ${lineAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      // Draw clearly visible nodes with soft purple halo glow
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;
        }

        // Soft outer halo ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = p.glowColor;
        ctx.fill();

        // Visible node core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        initParticles();
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 block w-full h-full"
      aria-hidden="true"
    />
  );
};

export default NetworkBackground;
