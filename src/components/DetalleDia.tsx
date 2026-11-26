import { useState } from 'react';
import { Check, X, Plus, Trash2, Clock } from 'lucide-react';
import type { DatosApp } from '../store';
import { obtenerRegistro, idUnico, obtenerFechaHoy } from '../store';
import type { RegistroTarea } from '../types';
import { DIAS_SEMANA } from '../types';
import AnilloProgreso from './AnilloProgreso';
import { formatoHorasDecimal } from '../hud';

interface Props {
  datos: DatosApp;
  fecha: string;
  esHoy: boolean;
  alActualizar: (n: Partial<DatosApp>) => void;
}

export default function DetalleDia({ datos, fecha, esHoy, alActualizar }: Props) {
  const [nuevaTarea, setNuevaTarea] = useState('');
  const [diaNuevo, setDiaNuevo] = useState((new Date(fecha + 'T12:00:00').getDay() + 6) % 7);

  const diaSemana = (new Date(fecha + 'T12:00:00').getDay() + 6) % 7;
  const reg = obtenerRegistro(datos, fecha);

  const tareasDelDia = datos.rutinas.flatMap((rutina) =>
    rutina.tareas.filter((t) => t.dias.includes(diaSemana)).map((t) => ({ ...t, rutina: rutina.nombre }))
  );

  const total = tareasDelDia.length;
  const estados = tareasDelDia.map((t) => reg.tareas[t.id]?.estado ?? null);
  const completadas = estados.filter((e) => e === 'completada').length;
  const falladas = estados.filter((e) => e === 'fallada').length;
  const pendientes = total - completadas - falladas;
  const pct = total > 0 ? completadas / total : 0;

  const marcar = (tareaId: string, estado: 'completada' | 'fallada') => {
    const registros = { ...datos.registros };
    const actual = registros[fecha] || { tareas: {}, horas: 0, sesiones: [] };
    const previo: RegistroTarea = actual.tareas[tareaId] || { estado: null };
    const nuevoEstado = previo.estado === estado ? null : estado;
    registros[fecha] = { ...actual, tareas: { ...actual.tareas, [tareaId]: { ...previo, estado: nuevoEstado } } };
    alActualizar({ registros });
  };

  const anotarFallo = (tareaId: string, nota: string) => {
    const registros = { ...datos.registros };
    const actual = registros[fecha] || { tareas: {}, horas: 0, sesiones: [] };
    const previo: RegistroTarea = actual.tareas[tareaId] || { estado: null };
    registros[fecha] = { ...actual, tareas: { ...actual.tareas, [tareaId]: { ...previo, nota } } };
    alActualizar({ registros });
  };

  const agregarTarea = () => {
    if (!nuevaTarea.trim()) return;
    const rutinas = [...datos.rutinas];
    if (rutinas.length === 0) {
      rutinas.push({ id: idUnico(), nombre: 'Rutina general', dias: [0,1,2,3,4,5,6], tareas: [] });
    }
    rutinas[0].tareas.push({ id: idUnico(), texto: nuevaTarea.trim(), dias: [diaNuevo] });
    alActualizar({ rutinas });
    setNuevaTarea('');
  };

  const borrarTarea = (rutinaId: string, tareaId: string) => {
    alActualizar({ rutinas: datos.rutinas.map((r) => r.id === rutinaId ? { ...r, tareas: r.tareas.filter((t) => t.id !== tareaId) } : r) });
  };

  const d = new Date(fecha + 'T12:00:00');
  const fechaTxt = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="panel-hud p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="font-hud text-sm sm:text-base font-semibold text-white/90 tracking-wider capitalize">{fechaTxt}</h2>
          <p className="font-mono-hud text-[10px] uppercase tracking-widest opacity-60">
            {esHoy ? '● HOY' : 'REGISTRO'} · {formatoHorasDecimal(reg.horas)} registradas
          </p>
        </div>
        <AnilloProgreso progreso={pct} tamano={72} grosor={5} etiqueta="progreso">
          <span className="font-hud text-base font-bold texto-glow">{Math.round(pct * 100)}%</span>
        </AnilloProgreso>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat valor={completadas} total={total} etiqueta="OK" color="hsl(var(--hud))" />
        <Stat valor={falladas} total={total} etiqueta="Falladas" color="rgba(239,68,68,0.9)" />
        <Stat valor={pendientes} total={total} etiqueta="Pendientes" color="rgba(148,163,184,0.7)" />
      </div>

      <div className="space-y-2">
        {tareasDelDia.length === 0 && (
          <p className="font-mono-hud text-xs opacity-50 py-4 text-center">No hay tareas asignadas para {DIAS_SEMANA[diaSemana]}.</p>
        )}
        {tareasDelDia.map((t) => {
          const estado = reg.tareas[t.id]?.estado ?? null;
          const nota = reg.tareas[t.id]?.nota || '';
          const rutina = datos.rutinas.find((r) => r.tareas.some((x) => x.id === t.id));
          return (
            <div key={t.id} className={`border p-2.5 transition-all ${estado === 'completada' ? 'border-[hsl(var(--hud)/0.5)] bg-[hsl(var(--hud)/0.07)]' : estado === 'fallada' ? 'border-red-500/40 bg-red-500/5' : 'border-[hsl(var(--hud)/0.15)]'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <div className="text-sm text-white/85 font-medium">{t.texto}</div>
                  <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-50">{t.rutina}</div>
                </div>
                <button onClick={() => marcar(t.id, 'completada')} title="Completada" className={`p-1.5 border transition-all ${estado === 'completada' ? 'border-[hsl(var(--hud))] bg-[hsl(var(--hud)/0.2)] text-[hsl(var(--hud-glow))]' : 'border-[hsl(var(--hud)/0.25)] text-white/40 hover:text-[hsl(var(--hud-glow))]'}`}>
                  <Check size={14} />
                </button>
                <button onClick={() => marcar(t.id, 'fallada')} title="Fallada" className={`p-1.5 border transition-all ${estado === 'fallada' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-[hsl(var(--hud)/0.25)] text-white/40 hover:text-red-400'}`}>
                  <X size={14} />
                </button>
                {rutina && !esHoy && (
                  <button onClick={() => borrarTarea(rutina.id, t.id)} title="Eliminar tarea" className="p-1.5 text-white/25 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              {estado === 'fallada' && (
                <input
                  value={nota}
                  onChange={(e) => anotarFallo(t.id, e.target.value)}
                  placeholder="¿Por qué falló? (nota breve)"
                  className="w-full mt-2 bg-black/30 border border-red-500/25 px-2 py-1.5 font-mono-hud text-xs text-red-200/90 placeholder:text-red-200/30"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-[hsl(var(--hud)/0.15)]">
        <div className="flex gap-2 items-center flex-wrap">
          <select value={diaNuevo} onChange={(e) => setDiaNuevo(Number(e.target.value))} className="bg-black/40 border border-[hsl(var(--hud)/0.25)] px-2 py-1.5 font-mono-hud text-xs text-white/80">
            {DIAS_SEMANA.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
          <input
            value={nuevaTarea}
            onChange={(e) => setNuevaTarea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregarTarea()}
            placeholder="Nueva tarea para la rutina..."
            className="flex-1 min-w-[160px] bg-black/30 border border-[hsl(var(--hud)/0.25)] px-2.5 py-1.5 font-mono-hud text-xs text-white/85 placeholder:text-white/30"
          />
          <button onClick={agregarTarea} className="btn-hud flex items-center gap-1.5 px-3 py-1.5 font-mono-hud text-xs">
            <Plus size={13} /> Añadir
          </button>
        </div>
        {reg.sesiones.length > 0 && (
          <div className="mt-3 font-mono-hud text-[10px] opacity-60 flex items-center gap-2 flex-wrap">
            <Clock size={11} />
            {reg.sesiones.map((s, i) => (
              <span key={i} className="border border-[hsl(var(--hud)/0.2)] px-1.5 py-0.5">
                {s.tarea ? `${s.tarea}: ` : ''}{Math.round((s.duracion / 60) * 10) / 10}h · {s.modo}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ valor, total, etiqueta, color }: { valor: number; total: number; etiqueta: string; color: string }) {
  return (
    <div className="border border-[hsl(var(--hud)/0.15)] px-3 py-2 text-center">
      <div className="font-hud text-xl font-bold" style={{ color }}>{valor}<span className="text-xs opacity-50">/{total}</span></div>
      <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-60">{etiqueta}</div>
    </div>
  );
}
