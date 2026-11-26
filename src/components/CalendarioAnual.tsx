import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DatosApp } from '../store';
import { obtenerRegistro, porcentajeDia } from '../store';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface Props {
  datos: DatosApp;
  fechaSeleccionada: string;
  alSeleccionar: (fecha: string) => void;
}

export default function CalendarioAnual({ datos, fechaSeleccionada, alSeleccionar }: Props) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState<number | null>(null);

  const resumenAnual = useMemo(() => {
    let dias = 0;
    let completados = 0;
    for (const fecha in datos.registros) {
      if (!fecha.startsWith(String(anio))) continue;
      const reg = datos.registros[fecha];
      if (reg.horas > 0 || Object.keys(reg.tareas).length > 0) {
        dias++;
        const total = contarTareasDia(datos, fecha);
        if (total > 0 && porcentajeDia(reg, total) >= 100) completados++;
      }
    }
    return { dias, completados };
  }, [datos, anio]);

  return (
    <div className="panel-hud p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-hud text-sm sm:text-base font-semibold text-white/90 tracking-wider">MAPA ANUAL</h2>
          <p className="font-mono-hud text-[10px] uppercase tracking-widest opacity-60">
            {resumenAnual.dias} días registrados · {resumenAnual.completados} completados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAnio(anio - 1)} className="btn-hud px-2 py-1"><ChevronLeft size={14} /></button>
          <span className="font-hud text-lg font-bold texto-glow w-16 text-center">{anio}</span>
          <button onClick={() => setAnio(anio + 1)} className="btn-hud px-2 py-1"><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {MESES.map((m, i) => (
          <button
            key={m}
            onClick={() => setMes(mes === i ? null : i)}
            className={`font-mono-hud text-[10px] uppercase tracking-wider px-2 py-1 border transition-all ${
              mes === i
                ? 'border-[hsl(var(--hud))] text-[hsl(var(--hud-glow))] bg-[hsl(var(--hud)/0.1)]'
                : 'border-[hsl(var(--hud)/0.2)] text-white/50 hover:border-[hsl(var(--hud)/0.5)]'
            }`}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className={`grid gap-3 ${mes !== null ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
        {MESES.map((nombreMes, i) => {
          if (mes !== null && mes !== i) return null;
          return <MesMini key={nombreMes} anio={anio} mes={i} nombre={nombreMes} datos={datos} alSeleccionar={alSeleccionar} fechaSeleccionada={fechaSeleccionada} expandido={mes === i} />;
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 font-mono-hud text-[9px] uppercase tracking-widest opacity-70 flex-wrap">
        <span>Leyenda:</span>
        <Leyenda nivel={0} texto="Sin actividad" />
        <Leyenda nivel={1} texto="Bajo" />
        <Leyenda nivel={2} texto="Medio" />
        <Leyenda nivel={3} texto="Completo" />
        <Leyenda nivel={-1} texto="Fallado" />
      </div>
    </div>
  );
}

function Leyenda({ nivel, texto }: { nivel: number; texto: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3" style={{ background: colorNivel(nivel) }} />
      {texto}
    </span>
  );
}

function colorNivel(nivel: number): string {
  switch (nivel) {
    case -1: return 'rgba(239, 68, 68, 0.55)';
    case 0: return 'rgba(148, 163, 184, 0.12)';
    case 1: return 'hsl(var(--hud) / 0.3)';
    case 2: return 'hsl(var(--hud) / 0.6)';
    case 3: return 'hsl(var(--hud) / 0.95)';
    default: return 'rgba(148, 163, 184, 0.12)';
  }
}

function MesMini({ anio, mes, nombre, datos, alSeleccionar, fechaSeleccionada, expandido }: {
  anio: number; mes: number; nombre: string; datos: DatosApp;
  alSeleccionar: (f: string) => void; fechaSeleccionada: string; expandido: boolean;
}) {
  const primerDia = new Date(anio, mes, 1);
  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const offset = (primerDia.getDay() + 6) % 7;
  const celdas: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const hoyISO = fechaAISLocal();

  return (
    <div className={`border border-[hsl(var(--hud)/0.15)] p-2.5 ${expandido ? 'bg-[hsl(var(--hud)/0.04)]' : ''}`}>
      <div className="font-hud text-[10px] font-semibold tracking-widest uppercase text-white/80 mb-2">{nombre}</div>
      <div className="grid grid-cols-7 gap-1">
        {DIAS_CORTOS.map((d, i) => (
          <div key={`h${i}`} className="font-mono-hud text-[8px] text-center opacity-40">{d}</div>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`v${i}`} />;
          const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          const reg = obtenerRegistro(datos, fecha);
          const total = contarTareasDia(datos, fecha);
          const pct = porcentajeDia(reg, total);
          const hayFallo = Object.values(reg.tareas).some((t) => t.estado === 'fallada');
          const esHoy = fecha === hoyISO;
          const sel = fecha === fechaSeleccionada;

          let nivel = 0;
          if (pct >= 100) nivel = 3;
          else if (pct >= 50) nivel = 2;
          else if (pct > 0) nivel = 1;

          return (
            <button
              key={fecha}
              onClick={() => alSeleccionar(fecha)}
              title={`${dia} ${nombre}: ${pct}% · ${reg.horas.toFixed(1)}h`}
              className={`aspect-square font-mono-hud text-[8px] sm:text-[9px] flex items-center justify-center transition-all border ${
                sel ? 'border-[hsl(var(--hud-glow))] scale-110 z-10' : esHoy ? 'border-white/60' : 'border-transparent hover:border-[hsl(var(--hud)/0.5)]'
              }`}
              style={{
                background: hayFallo && nivel === 0 ? colorNivel(-1) : colorNivel(nivel),
                color: nivel >= 2 ? '#fff' : 'rgba(255,255,255,0.45)',
              }}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function fechaAISLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function contarTareasDia(datos: DatosApp, fecha: string): number {
  const d = new Date(fecha + 'T12:00:00');
  const idx = (d.getDay() + 6) % 7;
  return datos.rutinas.reduce((acc, r) => acc + r.tareas.filter((t) => t.dias.includes(idx)).length, 0);
}
