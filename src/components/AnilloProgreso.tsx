interface Props {
  progreso: number;
  tamano: number;
  grosor?: number;
  girando?: boolean;
  hijos?: React.ReactNode;
  etiqueta?: string;
  children?: React.ReactNode;
}

export default function AnilloProgreso({ progreso, tamano, grosor = 6, girando = false, hijos, etiqueta }: Props) {
  const r = (tamano - grosor) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(Math.max(progreso, 0), 1);
  const offset = c * (1 - p);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className={girando ? 'anillo-girando' : ''} style={girando ? { transformOrigin: 'center' } : undefined}>
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke="hsl(var(--hud) / 0.12)" strokeWidth={grosor} />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--hud))"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease',
            filter: 'drop-shadow(0 0 6px hsl(var(--hud) / 0.7))',
          }}
        />
        {girando && (
          <circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={r - grosor - 4}
            fill="none"
            stroke="hsl(var(--hud) / 0.3)"
            strokeWidth={1.5}
            strokeDasharray={`${c * 0.12} ${c * 0.88}`}
            transform={`rotate(45 ${tamano / 2} ${tamano / 2})`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {hijos}
        {etiqueta && <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-60 mt-0.5">{etiqueta}</div>}
      </div>
    </div>
  );
}
