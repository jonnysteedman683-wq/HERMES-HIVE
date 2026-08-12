import React, { useEffect, useRef } from 'react';

/**
 * HiveAmbience — a whisper-quiet background canvas that carries the
 * variant-B "Organic Energy" homepage feeling into the live dashboard.
 *
 * It renders a very subtle fixed layer behind all content:
 *   - a slow breathing ember glow anchored bottom-centre
 *   - a handful of drifting firefly motes (amber + violet)
 *
 * Deliberately low-contrast and pointer-events-none so it never competes
 * with data. Respects prefers-reduced-motion (renders a single static frame).
 * 60fps via requestAnimationFrame; scales mote count to viewport area.
 */
export const HiveAmbience: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const TAU = Math.PI * 2;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = 1;
    let raf = 0;

    interface Mote {
      x: number; y: number;
      vx: number; vy: number;
      size: number; phase: number; flick: number;
      warm: boolean;
    }
    let motes: Mote[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const seedMotes = () => {
      const target = Math.round(Math.min(Math.max((W * H) / 80000, 8), 26));
      motes = [];
      for (let i = 0; i < target; i++) {
        motes.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-6, 6), vy: rand(-9, -2),
          size: rand(0.8, 2.0) * dpr,
          phase: rand(0, TAU),
          flick: rand(0.8, 2.6),
          warm: Math.random() < 0.62,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedMotes();
    };

    const drawEmberGlow = (time: number) => {
      const env = 0.5 + 0.5 * Math.sin(time / 1300); // slow breath
      const cx = W * 0.5;
      const cy = H * 1.02;
      const R = Math.max(W, H) * (0.42 + 0.03 * env);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(255, 120, 40, ${(0.05 + 0.03 * env).toFixed(3)})`);
      g.addColorStop(0.5, `rgba(168, 108, 255, ${(0.02 + 0.015 * env).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();
    };

    const drawMotes = (dt: number, time: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        // gentle horizontal drift wobble
        m.x += Math.sin(time / 1000 + m.phase) * 0.15;

        // wrap around edges
        if (m.y < -20) { m.y = H + 20; m.x = rand(0, W); }
        if (m.x < -20) m.x = W + 20;
        if (m.x > W + 20) m.x = -20;

        const flick = 0.28 + 0.34 * (0.5 + 0.5 * Math.sin(time / 1000 * m.flick + m.phase));
        const color = m.warm ? '255,179,71' : '168,108,255';

        const gr = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size * 4);
        gr.addColorStop(0, `rgba(${color},${(0.55 * flick).toFixed(3)})`);
        gr.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 4, 0, TAU);
        ctx.fill();

        ctx.fillStyle = `rgba(255,240,220,${(0.5 * flick).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 0.5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    };

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, W, H);
      drawEmberGlow(now);
      drawMotes(dt, now);
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
      // single static frame — glow + placed motes, no animation loop
      ctx.clearRect(0, 0, W, H);
      drawEmberGlow(0);
      drawMotes(0, 0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none"
      style={{ zIndex: 0 }}
    />
  );
};
