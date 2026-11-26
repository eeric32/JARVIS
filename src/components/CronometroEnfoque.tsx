import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Timer, Infinity as Infinito } from 'lucide-react';
import type { DatosApp } from '../store';
import { obtenerFechaHoy, obtenerRegistro } from '../store';
import AnilloProgreso from './AnilloProgreso';
import { formatoHora } from '../hud';

interface Props {
  datos: DatosApp;
  alActualizar: (n: Partial<DatosApp>) => void;
  tareasHoy: Array<{ id: string; texto: string }>;
}

const PRESETS = [
  { minutos: 60, etiqueta: '60m' },
  { minutos: 120, etiqueta: '2h' },
  { minutos: 240, etiqueta: '4h' },
  { minutos: 480, etiqueta: '8h' },
];
const MAX_MIN = 480;

export default function CronometroEnfoque({ datos, alActualizar, tareasHoy }: Props) {
  const [modo, setModo] = useState<'libre' | 'cuenta'>('cuenta');
  const [minutos, setMinutos] = useState(25);
  const [personalizado, setPersonalizado] = useState('');
  const [tareaId, setTareaId] = useState('');
  const [corriendo, setCorriendo] = useState(false);
  const [transcurrido, setTranscurrido] = useState(0);
  const inicioRef = useRef<number | null>(null);

  const limite = modo === 'cuenta' ? minutos * 60 : null;

  useEffect(() => {
    if (!corriendo) return;
    inicioRef.current = Date.now() - transcurrido * 1000;
    const iv = setInterval(() => {
      const t = (Date.now() - (inicioRef.current || Date.now())) / 1000;
      setTranscurrido(Math.min(t, MAX_MIN * 60));
      if (limite !== null && t >= limite) {
        detener(true);
      }
    }, 250);
    return () => clearInterval(iv);
  }, [corriendo, limite]);

  const detener = (completar: boolean) => {
    setCorriendo(false);
    const duracion = limite !== null && completar ? limite : Math.floor(transcurrido);
    if (duracion >= 10) {
      guardarSesion(Math.round(duracion), completar);
    }
    setTranscurrido(0);
  };

  const guardarSesion = (duracionSeg: number, _completa: boolean) => {
    const fecha = obtenerFechaHoy();
    const registros = { ...datos.registros };
    const reg = obtenerRegistro(datos, fecha);
    const tarea = tareasHoy.find((t) => t.id === tareaId);
    registros[fecha] = {
      ...reg,
      horas: reg.horas + duracionSeg / 3600,
      sesiones: [...reg.sesiones, { inicio: Date.now() - duracionSeg * 1000, duracion: duracionSeg, tarea: tarea?.texto, modo: modo === 'cuenta' ? `${minutos}min` : 'libre' }],
    };
    alActualizar({ registros });
  };

  const reiniciar = () => {
    setCorriendo(false);
    setTranscurrido(0);
  };

  const aplicarMinutos = (m: number) => {
    setMinutos(Math.min(Math.max(m, 1), MAX_MIN));
    setModo('cuenta');
    reiniciar();
  };

  const aplicarPersonalizado = () => {
    const m = parseInt(personalizado, 10);
    if (!isNaN(m) && m > 0 && m <= MAX_MIN) {
      aplicarMinutos(m);
      setPersonalizado('');
    }
  };

  const restante = limite !== null ? Math.max(limite - transcurrido, 0) : transcurrido;
  const progreso = limite !== null ? transcurrido / limite : 0;

  return (
    <div className="panel-hud p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="font-hud text-sm sm:text-base font-semibold text-white/90 tracking-wider">ENFOQUE</h2>
          <p className="font-mono-hud text-[10px] uppercase tracking-widest opacity-60">
            {corriendo ? '● GRABANDO' : 'EN ESPERA'} · HOY: {(obtenerRegistro(datos, obtenerFechaHoy()).horas).toFixed(1)}h
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => { setModo('cuenta'); reiniciar(); }} className={`btn-hud px-2.5 py-1 font-mono-hud text-[10px] uppercase flex items-center gap-1 ${modo === 'cuenta' ? 'activo' : ''}`}><Timer size={11} /> Cuenta</button>
          <button onClick={() => { setModo('libre'); reiniciar(); }} className={`btn-hud px-2.5 py-1 font-mono-hud text-[10px] uppercase flex items-center gap-1 ${modo === 'libre' ? 'activo' : ''}`}><Infinito size={11} /> Libre</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative" style={{ position: 'relative', width: 176, height: 176 }}>
          <AnilloProgreso progreso={limite !== null ? progreso : 1} tamano={176} grosor={7} girando={corriendo} />
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none',
            }}
          >
            <span
              className="font-mono-hud tabular-nums"
              style={{
                color: '#ffffff',
                fontSize: restante >= 3600 ? '1.5rem' : '2.2rem',
                lineHeight: 1,
                textShadow: '0 0 14px hsl(var(--hud) / 0.8), 0 0 4px rgba(0,0,0,0.9)',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              {formatoHora(Math.floor(restante))}
            </span>
            <span
              className="font-mono-hud uppercase"
              style={{
                color: 'hsl(var(--hud-glow))', fontSize: '10px', letterSpacing: '0.25em',
                marginTop: 6, textShadow: '0 0 8px hsl(var(--hud) / 0.6)',
              }}
            >
              {limite !== null ? 'restante' : 'transcurrido'}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          {modo === 'cuenta' && (
            <div className="flex gap-1.5 flex-wrap items-center">
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => aplicarMinutos(p.minutos)} className={`btn-hud px-2.5 py-1.5 font-mono-hud text-xs ${minutos === p.minutos ? 'activo' : ''}`}>{p.etiqueta}</button>
              ))}
              <div className="flex">
                <input
                  value={personalizado}
                  onChange={(e) => setPersonalizado(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && aplicarPersonalizado()}
                  placeholder="min"
                  className="w-14 bg-black/30 border border-[hsl(var(--hud)/0.25)] px-2 py-1.5 font-mono-hud text-xs text-white/85 placeholder:text-white/30"
                />
                <button onClick={aplicarPersonalizado} className="btn-hud px-2 py-1.5 font-mono-hud text-xs border-l-0">OK</button>
              </div>
            </div>
          )}

          <select value={tareaId} onChange={(e) => setTareaId(e.target.value)} className="w-full bg-black/40 border border-[hsl(var(--hud)/0.25)] px-2.5 py-2 font-mono-hud text-xs text-white/85">
            <option value="">Sin tarea vinculada</option>
            {tareasHoy.map((t) => <option key={t.id} value={t.id}>{t.texto}</option>)}
          </select>

          <div className="flex gap-2">
            {!corriendo ? (
              <button onClick={() => setCorriendo(true)} className="btn-hud activo flex-1 flex items-center justify-center gap-2 py-2 font-mono-hud text-xs uppercase tracking-widest">
                <Play size={14} /> Iniciar
              </button>
            ) : (
              <button onClick={() => detener(false)} className="btn-hud flex-1 flex items-center justify-center gap-2 py-2 font-mono-hud text-xs uppercase tracking-widest border-amber-400/60 text-amber-300">
                <Pause size={14} /> Detener y guardar
              </button>
            )}
            <button onClick={reiniciar} className="btn-hud px-3" title="Reiniciar"><RotateCcw size={14} /></button>
          </div>

          <p className="font-mono-hud text-[9px] uppercase tracking-widest opacity-50">
            {limite !== null ? `Al llegar a ${minutos} min la sesión se guarda sola · máx 8h` : 'Modo libre: se guarda al detener · máx 8h'}
          </p>
        </div>
      </div>
    </div>
  );
}
