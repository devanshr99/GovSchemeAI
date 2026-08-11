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
  pulseSpeed: number;
  pulseAngle: number;
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
    const particleCount = isMobile ? 30 : 65;
    const maxDistance = isMobile ? 100 : 140;

    const colors = [
      { core: 'rgba(139, 92, 246, 0.85)', glow: 'rgba(139, 92, 246, 0.3)' }, // Purple
      { core: 'rgba(168, 85, 247, 0.85)', glow: 'rgba(168, 85, 247, 0.3)' }, // Bright Purple
      { core: 'rgba(6, 182, 212, 0.85)', glow: 'rgba(6, 182, 212, 0.35)' }, // Cyan Accent
    ];

    const initParticles = () => {
      particles = [];
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      for (let i = 0; i < particleCount; i++) {
        const colorObj = colors[Math.floor(Math.random() * colors.length)];
        const speed = prefersReducedMotion ? 0 : 0.15 + Math.random() * 0.25;
        const angle = Math.random() * Math.PI * 2;

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 1.5 + 1,
          color: colorObj.core,
          glowColor: colorObj.glow,
          pulseSpeed: 0.01 + Math.random() * 0.02,
          pulseAngle: Math.random() * Math.PI * 2,
        });
      }
    };

    initParticles();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background gradient fill for depth
      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      gradient.addColorStop(0, '#0D0F16');
      gradient.addColorStop(0.5, '#08090D');
      gradient.addColorStop(1, '#050608');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Connect nearby particles with subtle lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.14;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Render nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;

          p.pulseAngle += p.pulseSpeed;
        }

        const currentRadius = p.radius + Math.sin(p.pulseAngle) * 0.4;

        // Outer glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.glowColor;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
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
