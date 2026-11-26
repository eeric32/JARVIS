import { useState } from 'react';
import { Plus, Trash2, FolderPlus, X, Check } from 'lucide-react';
import type { DatosApp } from '../store';
import { idUnico } from '../store';
import type { Rutina } from '../types';
import { DIAS_SEMANA } from '../types';

interface Props {
  datos: DatosApp;
  alActualizar: (n: Partial<DatosApp>) => void;
}

export default function GestorRutinas({ datos, alActualizar }: Props) {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [expandida, setExpandida] = useState<string | null>(datos.rutinas[0]?.id || null);

  const crearRutina = () => {
    if (!nuevoNombre.trim()) return;
    const rutina: Rutina = { id: idUnico(), nombre: nuevoNombre.trim(), dias: [0, 1, 2, 3, 4], tareas: [] };
    alActualizar({ rutinas: [...datos.rutinas, rutina] });
    setExpandida(rutina.id);
    setNuevoNombre('');
  };

  const borrarRutina = (id: string) => {
    alActualizar({ rutinas: datos.rutinas.filter((r) => r.id !== id) });
  };

  return (
    <div className="panel-hud p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-hud text-sm sm:text-base font-semibold text-white/90 tracking-wider">RUTINAS</h2>
          <p className="font-mono-hud text-[10px] uppercase tracking-widest opacity-60">{datos.rutinas.length} programas activos</p>
        </div>
        <div className="flex gap-2">
          <input
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && crearRutina()}
            placeholder="Nombre de rutina..."
            className="bg-black/30 border border-[hsl(var(--hud)/0.25)] px-2.5 py-1.5 font-mono-hud text-xs text-white/85 placeholder:text-white/30 w-40"
          />
          <button onClick={crearRutina} className="btn-hud flex items-center gap-1.5 px-3 py-1.5 font-mono-hud text-xs">
            <FolderPlus size={13} /> Crear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {datos.rutinas.length === 0 && (
          <p className="font-mono-hud text-xs opacity-50 py-4 text-center">Sin rutinas. Crea una para empezar a asignar tareas.</p>
        )}
        {datos.rutinas.map((r) => (
          <RutinaItem key={r.id} rutina={r} datos={datos} alActualizar={alActualizar} abierta={expandida === r.id} alAlternar={() => setExpandida(expandida === r.id ? null : r.id)} alBorrar={borrarRutina} />
        ))}
      </div>
    </div>
  );
}

function RutinaItem({ rutina, datos, alActualizar, abierta, alAlternar, alBorrar }: {
  rutina: Rutina; datos: DatosApp; alActualizar: (n: Partial<DatosApp>) => void;
  abierta: boolean; alAlternar: () => void; alBorrar: (id: string) => void;
}) {
  const [texto, setTexto] = useState('');
  const [diasSel, setDiasSel] = useState<number[]>([0, 1, 2, 3, 4]);

  const alternarDia = (i: number) => {
    setDiasSel(diasSel.includes(i) ? diasSel.filter((d) => d !== i) : [...diasSel, i].sort());
  };

  const agregarTarea = () => {
    if (!texto.trim() || diasSel.length === 0) return;
    const rutinas = datos.rutinas.map((r) =>
      r.id === rutina.id ? { ...r, tareas: [...r.tareas, { id: idUnico(), texto: texto.trim(), dias: [...diasSel] }] } : r
    );
    alActualizar({ rutinas });
    setTexto('');
  };

  const alternarDiaTarea = (tareaId: string, dia: number) => {
    const rutinas = datos.rutinas.map((r) =>
      r.id === rutina.id
        ? { ...r, tareas: r.tareas.map((t) => t.id === tareaId ? { ...t, dias: t.dias.includes(dia) ? t.dias.filter((d) => d !== dia) : [...t.dias, dia].sort() } : t) }
        : r
    );
    alActualizar({ rutinas });
  };

  const borrarTarea = (tareaId: string) => {
    alActualizar({ rutinas: datos.rutinas.map((r) => r.id === rutina.id ? { ...r, tareas: r.tareas.filter((t) => t.id !== tareaId) } : r) });
  };

  return (
    <div className={`border transition-all ${abierta ? 'border-[hsl(var(--hud)/0.45)] bg-[hsl(var(--hud)/0.05)]' : 'border-[hsl(var(--hud)/0.18)]'}`}>
      <button onClick={alAlternar} className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[hsl(var(--hud)/0.05)] transition-colors">
        <div>
          <span className="font-hud text-xs font-semibold text-white/85 tracking-wider">{rutina.nombre}</span>
          <span className="font-mono-hud text-[9px] uppercase tracking-widest opacity-50 ml-3">{rutina.tareas.length} tareas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {rutina.tareas.flatMap((t) => t.dias).filter((v: number, i: number, a: number[]) => a.indexOf(v) === i).sort().map((d: number) => (
              <span key={d} className="font-mono-hud text-[8px] px-1 border border-[hsl(var(--hud)/0.3)] text-[hsl(var(--hud-glow))]">{DIAS_SEMANA[d].slice(0, 2).toUpperCase()}</span>
            ))}
          </div>
          <Trash2
            size={13}
            className="text-white/25 hover:text-red-400 transition-colors"
            onClick={(e) => { e.stopPropagation(); alBorrar(rutina.id); }}
          />
        </div>
      </button>

      {abierta && (
        <div className="px-3 pb-3 border-t border-[hsl(var(--hud)/0.15)] pt-3 space-y-2">
          {rutina.tareas.map((t) => (
            <div key={t.id} className="flex items-center gap-2 flex-wrap border border-[hsl(var(--hud)/0.12)] px-2 py-1.5">
              <span className="text-xs text-white/80 flex-1 min-w-[120px]">{t.texto}</span>
              <div className="flex gap-0.5">
                {DIAS_SEMANA.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => alternarDiaTarea(t.id, i)}
                    title={d}
                    className={`w-5 h-5 font-mono-hud text-[8px] border transition-all ${t.dias.includes(i) ? 'border-[hsl(var(--hud))] bg-[hsl(var(--hud)/0.2)] text-[hsl(var(--hud-glow))]' : 'border-[hsl(var(--hud)/0.15)] text-white/30 hover:border-[hsl(var(--hud)/0.4)]'}`}
                  >
                    {d.slice(0, 1)}
                  </button>
                ))}
              </div>
              <button onClick={() => borrarTarea(t.id)} className="text-white/25 hover:text-red-400 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}

          <div className="flex gap-2 items-center flex-wrap pt-1">
            <div className="flex gap-0.5">
              {DIAS_SEMANA.map((d, i) => (
                <button
                  key={d}
                  onClick={() => alternarDia(i)}
                  title={d}
                  className={`w-6 h-6 font-mono-hud text-[9px] border transition-all ${diasSel.includes(i) ? 'border-[hsl(var(--hud))] bg-[hsl(var(--hud)/0.2)] text-[hsl(var(--hud-glow))]' : 'border-[hsl(var(--hud)/0.15)] text-white/30 hover:border-[hsl(var(--hud)/0.4)]'}`}
                >
                  {diasSel.includes(i) ? <Check size={10} className="mx-auto" /> : d.slice(0, 1)}
                </button>
              ))}
            </div>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregarTarea()}
              placeholder="Nueva tarea..."
              className="flex-1 min-w-[140px] bg-black/30 border border-[hsl(var(--hud)/0.25)] px-2.5 py-1.5 font-mono-hud text-xs text-white/85 placeholder:text-white/30"
            />
            <button onClick={agregarTarea} className="btn-hud p-1.5" title="Añadir tarea"><Plus size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
