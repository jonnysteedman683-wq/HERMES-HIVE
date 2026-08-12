import React, { useEffect, useRef } from 'react';

/**
 * HiveAmbience — the living background of the HERMES-HIVE dashboard.
 *
 * Renders a fixed, pointer-events-none layer behind all content:
 *   - a breathing ember core anchored bottom-centre (amber heart)
 *   - two slow-drifting aurora ribbons (amber -> violet) that sweep across
 *   - a starfield of firefly motes (amber + violet) with soft glow halos
 *   - occasional sparkle flares for life
 *
 * Deliberately atmospheric but VISIBLE: it should read as a living cosmic
 * field the moment you open the dashboard, matching the homepage's energy.
 * Respects prefers-reduced-motion (renders a single static frame).
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

    // Theme-aware accent colors (rgb triplets from CSS vars).
    const readAccents = () => {
      const style = getComputedStyle(document.documentElement);
      const a = (style.getPropertyValue('--hh-a').trim() || '255,179,71').split(',').map(Number);
      const b = (style.getPropertyValue('--hh-b').trim() || '168,108,255').split(',').map(Number);
      const strong = (style.getPropertyValue('--hh-a-strong').trim() || '255,138,40').split(',').map(Number);
      const gold = (style.getPropertyValue('--hh-gold').trim() || '255,200,120').split(',').map(Number);
      return { a, b, strong, gold };
    };
    let acc = readAccents();
    const onThemeChange = () => { acc = readAccents(); };
    window.addEventListener('hh:theme', onThemeChange);

    let W = 0, H = 0, dpr = 1;
    let raf = 0;

    interface Mote {
      x: number; y: number;
      vx: number; vy: number;
      size: number; phase: number; flick: number;
      warm: boolean;
      flare: number; // 0..1 chance-weighted brightness boost
    }
    let motes: Mote[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const seedMotes = () => {
      const target = Math.round(Math.min(Math.max((W * H) / 45000, 14), 48));
      motes = [];
      for (let i = 0; i < target; i++) {
        motes.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-7, 7), vy: rand(-10, -2),
          size: rand(1.0, 2.6) * dpr,
          phase: rand(0, TAU),
          flick: rand(0.7, 2.8),
          warm: Math.random() < 0.62,
          flare: Math.random() < 0.16 ? rand(1.4, 2.2) : 1,
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

    /** Breathing ember core at bottom-centre — the hive heart. */
    const drawEmberCore = (time: number) => {
      const env = 0.5 + 0.5 * Math.sin(time / 1400);
      const cx = W * 0.5;
      const cy = H * 1.04;
      const R = Math.max(W, H) * (0.48 + 0.05 * env);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(${acc.strong[0]},${acc.strong[1]},${acc.strong[2]},${(0.16 + 0.07 * env).toFixed(3)})`);
      g.addColorStop(0.45, `rgba(${acc.a[0]},${acc.a[1]},${acc.a[2]},${(0.07 + 0.04 * env).toFixed(3)})`);
      g.addColorStop(0.75, `rgba(${acc.b[0]},${acc.b[1]},${acc.b[2]},${(0.035 + 0.02 * env).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();
    };

    /** Top-left violet halo to balance the amber core. */
    const drawVioletHalo = (time: number) => {
      const env = 0.5 + 0.5 * Math.sin(time / 2100 + 1.2);
      const cx = W * 0.08;
      const cy = H * 0.02;
      const R = Math.max(W, H) * (0.34 + 0.04 * env);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(${acc.b[0]},${acc.b[1]},${acc.b[2]},${(0.09 + 0.05 * env).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();
    };

    /** A soft diagonal aurora ribbon that drifts slowly across the sky. */
    const drawAurora = (time: number) => {
      const t = time / 6000;
      const x0 = W * (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t)));
      const x1 = W * (0.75 + 0.5 * (0.5 + 0.5 * Math.sin(t + 1.7)));
      const yBase = H * (0.22 + 0.06 * Math.sin(t * 0.8));

      // Gradient ribbon with vertical falloff
      const g = ctx.createLinearGradient(x0, yBase - 40, x1, yBase + 160);
      g.addColorStop(0, `rgba(${acc.a[0]},${acc.a[1]},${acc.a[2]},0)`);
      g.addColorStop(0.22, `rgba(${acc.a[0]},${acc.a[1]},${acc.a[2]},0.05)`);
      g.addColorStop(0.5, `rgba(${acc.gold ? acc.gold[0] : acc.a[0]},${acc.gold ? acc.gold[1] : acc.a[1]},${acc.gold ? acc.gold[2] : acc.a[2]},0.07)`);
      g.addColorStop(0.78, `rgba(${acc.b[0]},${acc.b[1]},${acc.b[2]},0.05)`);
      g.addColorStop(1, `rgba(${acc.b[0]},${acc.b[1]},${acc.b[2]},0)`);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      ctx.moveTo(x0, yBase - 30);
      for (let i = 0; i <= 24; i++) {
        const px = x0 + ((x1 - x0) * i) / 24;
        const py = yBase + Math.sin(i * 0.9 + t * 2.4) * 26 + Math.sin(i * 0.31 + t) * 14;
        ctx.lineTo(px, py);
      }
      for (let i = 24; i >= 0; i--) {
        const px = x0 + ((x1 - x0) * i) / 24;
        ctx.lineTo(px, yBase + 170 + Math.sin(i * 0.9 + t * 2.4) * 20);
      }
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    };

    const drawMotes = (dt: number, time: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.x += Math.sin(time / 900 + m.phase) * 0.22;

        if (m.y < -24) { m.y = H + 24; m.x = rand(0, W); }
        if (m.x < -24) m.x = W + 24;
        if (m.x > W + 24) m.x = -24;

        const flick = 0.35 + 0.42 * (0.5 + 0.5 * Math.sin(time / 1000 * m.flick + m.phase));
        const boost = m.flare * (0.5 + 0.5 * Math.sin(time / 700 * m.flick + m.phase * 2));
        const color = m.warm ? `${acc.a[0]},${acc.a[1]},${acc.a[2]}` : `${acc.b[0]},${acc.b[1]},${acc.b[2]}`;

        // Soft halo
        const haloR = m.size * (4.5 + 1.5 * boost);
        const gr = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, haloR);
        gr.addColorStop(0, `rgba(${color},${(0.6 * flick).toFixed(3)})`);
        gr.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(m.x, m.y, haloR, 0, TAU);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `rgba(255,242,222,${(0.75 * flick).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 0.55, 0, TAU);
        ctx.fill();

        // Occasional 4-point sparkle flare
        if (m.flare > 1.3 && boost > 0.75) {
          const L = m.size * (2.6 + 2.2 * boost);
          ctx.strokeStyle = `rgba(${color},${(0.5 * boost).toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(m.x - L, m.y); ctx.lineTo(m.x + L, m.y);
          ctx.moveTo(m.x, m.y - L); ctx.lineTo(m.x, m.y + L);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, W, H);
      drawVioletHalo(now);
      drawAurora(now);
      drawEmberCore(now);
      drawMotes(dt, now);
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
      ctx.clearRect(0, 0, W, H);
      drawVioletHalo(0);
      drawAurora(0);
      drawEmberCore(0);
      drawMotes(0, 0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('hh:theme', onThemeChange);
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
