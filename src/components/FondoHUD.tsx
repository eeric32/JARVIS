import type { FondoId } from '../types';

interface Props {
  fondo: FondoId;
  imagen?: string;
}

export default function FondoHUD({ fondo, imagen }: Props) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: 'rgb(4 10 18)' }}>
      {fondo === 'rejilla' && (
        <>
          <div className="absolute inset-0 fondo-rejilla" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 120%, hsl(var(--hud) / 0.08), transparent 60%)' }} />
        </>
      )}
      {fondo === 'espacio' && (
        <>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, #0a1628 0%, #020409 70%)' }} />
          {ESTRELLAS.map((est, i) => (
            <div
              key={i}
              className="absolute rounded-full pulso"
              style={{
                left: `${est.x}%`,
                top: `${est.y}%`,
                width: est.t,
                height: est.t,
                background: `hsl(var(--hud-glow) / ${est.o})`,
                boxShadow: `0 0 ${est.t * 2}px hsl(var(--hud) / ${est.o})`,
                animationDelay: `${est.d}s`,
              }}
            />
          ))}
        </>
      )}
      {fondo === 'circuito' && <CircuitoSVG />}
      {fondo === 'imagen' && imagen && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imagen})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="linea-escaneo" />
    </div>
  );
}

function CircuitoSVG() {
  return (
    <div className="absolute inset-0">
      <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 800">
        <defs>
          <pattern id="circ" width="120" height="120" patternUnits="userSpaceOnUse">
            <path
              d="M 10 10 H 50 V 50 H 90 M 50 50 V 110 M 90 90 H 110 M 30 70 V 90 H 10"
              fill="none"
              stroke="hsl(var(--hud) / 0.12)"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="2.5" fill="hsl(var(--hud) / 0.25)" />
            <circle cx="90" cy="90" r="2" fill="hsl(var(--hud) / 0.2)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circ)" />
      </svg>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgb(4 10 18 / 0.85) 100%)' }} />
    </div>
  );
}

const ESTRELLAS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137.5) % 100,
  y: ((i * 61.8) % 97) + 1.5,
  t: (i % 3) + 1.5,
  o: 0.15 + ((i * 7) % 10) / 16,
  d: (i % 12) * 0.4,
}));
