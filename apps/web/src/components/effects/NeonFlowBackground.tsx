import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export const NeonFlowBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isTabVisible = true;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse coordinates & interpolation targets
    const mouse = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.4,
      targetX: window.innerWidth * 0.5,
      targetY: window.innerHeight * 0.4,
      vx: 0,
      vy: 0,
      isMoving: false,
      lastMoveTime: performance.now(),
    };

    // Particles system
    const MAX_PARTICLES = 160;
    const particles: Particle[] = [];
    const hues = [185, 260, 330]; // Cyan #00F0FF, Violet #8B5CF6, Magenta #FF2E93

    // Canvas sizing with devicePixelRatio capping
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Pointer event listeners
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isMoving = true;
      mouse.lastMoveTime = performance.now();

      // Emit interactive neon flow particles on movement
      if (!prefersReducedMotion && particles.length < MAX_PARTICLES) {
        const count = Math.min(3, Math.floor(Math.hypot(e.movementX, e.movementY) * 0.15) + 1);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 0.5;
          particles.push({
            x: mouse.targetX + (Math.random() - 0.5) * 8,
            y: mouse.targetY + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed + (e.movementX || 0) * 0.1,
            vy: Math.sin(angle) * speed + (e.movementY || 0) * 0.1,
            life: 0,
            maxLife: Math.floor(Math.random() * 40) + 35,
            size: Math.random() * 2.8 + 1.2,
            hue: hues[Math.floor(Math.random() * hues.length)],
          });
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Visibility change handler to pause rendering when tab is hidden
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        render();
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial ambient particles for depth
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        life: Math.floor(Math.random() * 50),
        maxLife: Math.floor(Math.random() * 120) + 60,
        size: Math.random() * 2 + 1,
        hue: hues[i % hues.length],
      });
    }

    // Render loop
    const render = () => {
      if (!isTabVisible) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Smooth mouse interpolation (spring/decay)
      const prevX = mouse.x;
      const prevY = mouse.y;
      mouse.x += (mouse.targetX - mouse.x) * 0.14;
      mouse.y += (mouse.targetY - mouse.y) * 0.14;
      mouse.vx = mouse.x - prevX;
      mouse.vy = mouse.y - prevY;

      const isDark = document.documentElement.classList.contains('dark');

      // Clear with theme-aware background
      ctx.fillStyle = isDark ? '#000000' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Render subtle radial spotlight following cursor
      const spotGrad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        mouse.x,
        mouse.y,
        Math.max(width * 0.35, 380)
      );
      if (isDark) {
        spotGrad.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
        spotGrad.addColorStop(0.35, 'rgba(139, 92, 246, 0.05)');
        spotGrad.addColorStop(0.7, 'rgba(255, 46, 147, 0.02)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        spotGrad.addColorStop(0, 'rgba(99, 102, 241, 0.06)');
        spotGrad.addColorStop(0.35, 'rgba(14, 165, 233, 0.04)');
        spotGrad.addColorStop(0.7, 'rgba(244, 63, 94, 0.015)');
        spotGrad.addColorStop(1, 'rgba(248, 250, 252, 0)');
      }

      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

      if (prefersReducedMotion) {
        // For reduced motion: static soft spotlight only
        return;
      }

      // Additive blend mode for neon glow in dark mode
      ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

      // Fluid cursor ribbon trail
      if (Math.hypot(mouse.vx, mouse.vy) > 0.4 || performance.now() - mouse.lastMoveTime < 1200) {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.lineWidth = Math.min(12, Math.hypot(mouse.vx, mouse.vy) * 0.8 + 2);
        ctx.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.18)' : 'rgba(99, 102, 241, 0.15)';
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // Gentle drag & turbulence
        p.vx *= 0.98;
        p.vy *= 0.98;

        const progress = p.life / p.maxLife;
        const alpha = Math.sin(progress * Math.PI) * 0.75;

        if (progress >= 1 || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
          particles.splice(i, 1);
          continue;
        }

        // Particle core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${alpha})`;
        ctx.fill();

        // Particle soft halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.25})`;
        ctx.fill();
      }

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
    </div>
  );
};
