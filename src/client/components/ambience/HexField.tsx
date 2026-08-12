import React, { useEffect, useRef } from 'react';

/**
 * HexField — the living hexagonal architecture behind the Swarm Topology.
 *
 * Carries the variant-A brief's signature motion into the dashboard:
 *   - nested hexagon rings (core hex + surrounding ring) rotating slowly
 *     and continuously, like a precision instrument
 *   - a PERMANENT glowing orb at the centre that never disappears — it
 *     breathes softly and casts light onto nearby hex edges
 *   - a few drifting motes between cells for life
 *
 * Colors read from the active theme's CSS vars (--hh-a / --hh-b) so the
 * field re-themes with the A/B/C switcher. 60fps via requestAnimationFrame;
 * respects prefers-reduced-motion (static frame). Pointer-events-none.
 */
export const HexField: React.FC<{ className?: string; density?: number }> = ({
  className = '',
  density = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const TAU = Math.PI * 2;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Read current theme accent colors (rgb triplets).
    const readAccents = () => {
      const style = getComputedStyle(document.documentElement);
      const a = (style.getPropertyValue('--hh-a').trim() || '255,179,71').split(',').map(Number);
      const b = (style.getPropertyValue('--hh-b').trim() || '168,108,255').split(',').map(Number);
      const gold = (style.getPropertyValue('--hh-gold').trim() || '255,200,120').split(',').map(Number);
      return { a, b, gold };
    };
    let accents = readAccents();
    const onThemeChange = () => { accents = readAccents(); };
    window.addEventListener('hh:theme', onThemeChange);

    let W = 0, H = 0, dpr = 1;
    let raf = 0;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    interface Mote { x: number; y: number; vx: number; vy: number; size: number; phase: number; warm: boolean; }
    let motes: Mote[] = [];

    const hexPoints = (cx: number, cy: number, r: number, rot = 0) => {
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const ang = rot + (i * TAU) / 6;
        pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
      }
      return pts;
    };

    const seedMotes = () => {
      const target = Math.round(Math.min(Math.max((W * H) / 90000, 4), 14) * density);
      motes = [];
      for (let i = 0; i < target; i++) {
        motes.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-5, 5), vy: rand(-7, -1.5),
          size: rand(0.7, 1.6) * dpr,
          phase: rand(0, TAU),
          warm: Math.random() < 0.6,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth || canvas.parentElement?.clientWidth || 600;
      H = canvas.clientHeight || canvas.parentElement?.clientHeight || 400;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedMotes();
    };

    const drawHexRing = (cx: number, cy: number, r: number, rot: number, alpha: number, color: number[], label?: string) => {
      const pts = hexPoints(cx, cy, r, rot);
      ctx.save();
      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},${(alpha * 0.8).toFixed(3)})`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();

      // inner tick spokes (precision instrument detail)
      ctx.shadowBlur = 4;
      ctx.lineWidth = 0.5;
      pts.forEach(([x, y]) => {
        const mx = cx + (x - cx) * 0.82;
        const my = cy + (y - cy) * 0.82;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      if (label) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${(alpha * 0.7).toFixed(3)})`;
        ctx.font = `9px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);
      }
      ctx.restore();
    };

    const drawOrb = (time: number) => {
      const cx = W / 2, cy = H / 2;
      const env = 0.5 + 0.5 * Math.sin(time / 1600); // slow breath, never 0
      const R = Math.min(W, H) * (0.1 + 0.012 * env);

      // core — always present
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
      core.addColorStop(0, `rgba(${accents.gold[0]},${accents.gold[1]},${accents.gold[2]},${(0.95).toFixed(3)})`);
      core.addColorStop(0.4, `rgba(${accents.a[0]},${accents.a[1]},${accents.a[2]},${(0.55 + 0.2 * env).toFixed(3)})`);
      core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.6, 0, TAU);
      ctx.fill();

      // bright heart
      ctx.fillStyle = `rgba(255,255,255,${(0.85 + 0.15 * env).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.42, 0, TAU);
      ctx.fill();
    };

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;
      const baseR = Math.min(W, H) * 0.22;
      const rot = t * 0.14; // slow continuous rotation — never stops

      // outer ring (counter-rotating, faint)
      drawHexRing(cx, cy, baseR * 1.9, -rot * 0.6, 0.22, accents.b);
      // mid ring
      drawHexRing(cx, cy, baseR * 1.35, rot * 0.8, 0.3, accents.a);
      // core hex (holds the orb)
      drawHexRing(cx, cy, baseR, rot, 0.55, accents.a, 'HERMES');

      // permanent glowing orb at the centre
      drawOrb(now);

      // drifting motes
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.x += Math.sin(t + m.phase) * 0.18;
        if (m.y < -20) { m.y = H + 20; m.x = rand(0, W); }
        if (m.x < -20) m.x = W + 20;
        if (m.x > W + 20) m.x = -20;
        const flick = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2 + m.phase));
        const col = m.warm ? accents.a : accents.b;
        const gr = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size * 5);
        gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${(0.5 * flick).toFixed(3)})`);
        gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const baseR = Math.min(W, H) * 0.22;
      drawHexRing(cx, cy, baseR * 1.9, -0.3, 0.22, accents.b);
      drawHexRing(cx, cy, baseR * 1.35, 0.4, 0.3, accents.a);
      drawHexRing(cx, cy, baseR, 0.2, 0.55, accents.a, 'HERMES');
      drawOrb(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('hh:theme', onThemeChange);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    />
  );
};
