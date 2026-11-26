import { useEffect, useRef, useState } from 'react';

const TAM = 72;

export default function NucleoParticulas({ onClick }: { onClick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    hoverRef.current = hover;
  }, [hover]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const N = 120;
    const puntos = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(Math.max(1 - y * y, 0));
      const theta = i * 2.39996;
      return { x: Math.cos(theta) * rad, y, z: Math.sin(theta) * rad };
    });

    let raf = 0;
    let t = 0;
    let colorCache = { h: 190, s: 100, l: 50 };
    let frame = 0;

    const leerColor = () => {
      const crudo = getComputedStyle(document.documentElement).getPropertyValue('--hud').trim();
      const partes = crudo.split(/[\s%,]+/).map(Number);
      if (partes.length >= 3 && partes.every((n) => !isNaN(n))) {
        colorCache = { h: partes[0], s: partes[1], l: partes[2] };
      }
    };

    const dibujar = () => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== TAM * dpr) {
        canvas.width = TAM * dpr;
        canvas.height = TAM * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, TAM, TAM);

      if (frame % 30 === 0) leerColor();
      frame++;

      const activo = hoverRef.current;
      const vel = activo ? 0.028 : 0.007;
      t += vel;
      const escala = (activo ? 24 : 21) + Math.sin(t * 2.4) * 1.6;
      const cx = TAM / 2;
      const cy = TAM / 2;
      const { h, s, l } = colorCache;

      const nucleo = ctx.createRadialGradient(cx, cy, 1, cx, cy, activo ? 15 : 11);
      nucleo.addColorStop(0, `hsla(${h}, ${s}%, ${Math.min(l + 25, 95)}%, ${activo ? 0.85 : 0.6})`);
      nucleo.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
      ctx.fillStyle = nucleo;
      ctx.beginPath();
      ctx.arc(cx, cy, activo ? 15 : 11, 0, Math.PI * 2);
      ctx.fill();

      const sinY = Math.sin(t), cosY = Math.cos(t);
      const sinX = Math.sin(t * 0.6), cosX = Math.cos(t * 0.6);

      for (const p of puntos) {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const profundidad = (z2 + 1) / 2;
        const alpha = 0.25 + profundidad * 0.7;
        const tam = 0.8 + profundidad * 1.5;
        ctx.fillStyle = `hsla(${h}, ${s}%, ${l + profundidad * 15}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(cx + x1 * escala, cy + y1 * escala, tam, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(dibujar);
    };

    dibujar();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Asistente J.A.R.V.I.S."
      aria-label="Abrir asistente J.A.R.V.I.S."
      style={{ position: 'fixed', bottom: 84, right: 24, zIndex: 40, cursor: 'pointer', width: TAM, height: TAM, background: 'transparent', border: 'none', padding: 0 }}
    >
      <canvas ref={ref} style={{ width: TAM, height: TAM, display: 'block' }} />
      <span
        className="font-mono-hud uppercase"
        style={{
          position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
          fontSize: 8, letterSpacing: '0.2em', color: 'hsl(var(--hud-glow))',
          textShadow: '0 0 6px hsl(var(--hud) / 0.7)', pointerEvents: 'none', whiteSpace: 'nowrap',
        }}
      >
        {hover ? 'ABRIR' : 'JARVIS'}
      </span>
    </button>
  );
}
