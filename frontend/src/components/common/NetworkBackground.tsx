'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
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
    // Sparse, subtle cluster density with large whitespace
    const particleCount = isMobile ? 14 : 24;
    const maxDistance = isMobile ? 110 : 150;

    // Muted cyan/teal colors with low opacity and subtle purple accent
    const nodePalette = [
      { color: 'rgb(6, 182, 212)', alpha: 0.35 },    // Soft Cyan
      { color: 'rgb(13, 148, 136)', alpha: 0.30 },   // Muted Teal
      { color: 'rgb(34, 211, 238)', alpha: 0.25 },   // Pale Cyan
      { color: 'rgb(139, 92, 246)', alpha: 0.20 },   // Muted Violet Accent
    ];

    const initParticles = () => {
      particles = [];
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      for (let i = 0; i < particleCount; i++) {
        const palette = nodePalette[Math.floor(Math.random() * nodePalette.length)];
        const speed = prefersReducedMotion ? 0 : 0.04 + Math.random() * 0.06;
        const angle = Math.random() * Math.PI * 2;

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 1.2 + 1.2, // 1.2px - 2.4px small subtle nodes
          color: palette.color,
          alpha: palette.alpha,
        });
      }
    };

    initParticles();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Dark subtle gradient base
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#08090D');
      gradient.addColorStop(0.5, '#07080C');
      gradient.addColorStop(1, '#050608');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle connecting geometric lines (5% to 10% opacity max)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            // Line opacity range 0.03 to 0.09
            const lineAlpha = (1 - dist / maxDistance) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw small, low-contrast nodes
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

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace('rgb', 'rgba').replace(')', `, ${p.alpha})`);
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
