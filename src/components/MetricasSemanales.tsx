import { useMemo } from 'react';
import { Flame, TrendingUp, Zap } from 'lucide-react';
import type { DatosApp } from '../store';
import { obtenerRegistro, porcentajeDia } from '../store';
import { inicioSemana } from '../hud';
import AnilloProgreso from './AnilloProgreso';

export default function MetricasSemanales({ datos }: { datos: DatosApp }) {
  const semana = useMemo(() => {
    const lunes = inicioSemana(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const reg = obtenerRegistro(datos, iso);
      const total = contarTareas(datos, iso);
      const pct = total > 0 ? porcentajeDia(reg, total) : null;
      const futuro = d.getTime() > Date.now() && iso !== fechaHoyISO();
      return { iso, esManana: i > 0, dia: i, horas: reg.horas, pct, futuro, total };
    });
  }, [datos]);

  const diasPasados = semana.filter((s) => !s.futuro);
  const racha = calcularRacha(datos);
  const maxHoras = Math.max(...semana.map((s) => s.horas), 0.5);
  const pctSemana = diasPasados.length > 0
    ? Math.round(diasPasados.reduce((a, s) => a + (s.pct ?? 0), 0) / diasPasados.length)
    : 0;

  const sincro = calcularSincronizacion(pctSemana, racha.actual, diasPasados);

  return (
    <div className="panel-hud p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-hud text-sm sm:text-base font-semibold text-white/90 tracking-wider">IMPULSO SEMANAL</h2>
          <p className="font-mono-hud text-[10px] uppercase tracking-widest opacity-60">Semana en curso · lunes a domingo</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-amber-400" />
            <div>
              <div className="font-hud text-lg font-bold texto-glow leading-none">{racha.actual}</div>
              <div className="font-mono-hud text-[8px] uppercase tracking-widest opacity-60">Racha · máx {racha.max}</div>
            </div>
          </div>
          <AnilloProgreso progreso={sincro / 100} tamano={58} grosor={4} etiqueta="sincro">
            <span className="font-hud text-xs font-bold texto-glow">{sincro}%</span>
          </AnilloProgreso>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-end h-36">
        {semana.map((s) => {
          const nombre = ['L', 'M', 'X', 'J', 'V', 'S', 'D'][s.dia];
          return (
            <div key={s.iso} className="flex flex-col items-center gap-1 h-full justify-end">
              <span className="font-mono-hud text-[8px] opacity-60">{s.horas > 0 ? `${s.horas.toFixed(1)}h` : ''}</span>
              <div
                className={`w-full transition-all duration-500 ${s.futuro ? 'opacity-20' : ''}`}
                style={{
                  height: s.horas > 0 ? `${Math.max((s.horas / maxHoras) * 100, 8)}%` : '0px',
                  background: s.horas > 0 ? 'linear-gradient(180deg, hsl(var(--hud-glow)), hsl(var(--hud) / 0.4))' : 'transparent',
                  boxShadow: s.horas > 0 ? '0 0 10px hsl(var(--hud) / 0.35)' : 'none',
                }}
              />
              <div className={`w-full h-1 ${s.pct !== null && s.pct >= 100 ? 'bg-[hsl(var(--hud-glow))]' : s.pct !== null && s.pct > 0 ? 'bg-amber-400/70' : 'bg-white/10'}`} />
              <span className={`font-mono-hud text-[9px] ${s.dia === (new Date().getDay() + 6) % 7 ? 'texto-glow text-white font-bold' : 'opacity-60'}`}>{nombre}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[hsl(var(--hud)/0.15)]">
        <MiniStat icono={<TrendingUp size={12} />} valor={`${pctSemana}%`} etiqueta="Éxito semanal" />
        <MiniStat icono={<Zap size={12} />} valor={`${diasPasados.reduce((a, s) => a + s.horas, 0).toFixed(1)}h`} etiqueta="Horas semana" />
        <MiniStat icono={<Flame size={12} />} valor={`${racha.max}`} etiqueta="Récord racha" />
      </div>
    </div>
  );
}

function MiniStat({ icono, valor, etiqueta }: { icono: React.ReactNode; valor: string; etiqueta: string }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <span className="text-[hsl(var(--hud-glow))]">{icono}</span>
      <div>
        <div className="font-hud text-sm font-bold text-white/90 leading-none">{valor}</div>
        <div className="font-mono-hud text-[8px] uppercase tracking-widest opacity-50">{etiqueta}</div>
      </div>
    </div>
  );
}

function contarTareas(datos: DatosApp, fecha: string): number {
  const d = new Date(fecha + 'T12:00:00');
  const idx = (d.getDay() + 6) % 7;
  return datos.rutinas.reduce((acc, r) => acc + r.tareas.filter((t) => t.dias.includes(idx)).length, 0);
}

function fechaHoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcularRacha(datos: DatosApp): { actual: number; max: number } {
  const fechas = Object.keys(datos.registros).sort();
  if (fechas.length === 0) return { actual: 0, max: 0 };

  let max = 0;
  let racha = 0;
  let previa: Date | null = null;

  for (const f of fechas) {
    const reg = datos.registros[f];
    const total = contarTareas(datos, f);
    const ok = total > 0 && porcentajeDia(reg, total) >= 100;
    if (!ok) { racha = 0; previa = null; continue; }
    const d = new Date(f + 'T12:00:00');
    if (previa && (d.getTime() - previa.getTime()) / 86400000 === 1) racha++;
    else racha = 1;
    previa = d;
    max = Math.max(max, racha);
  }

  let actual = 0;
  const hoy = new Date();
  for (let i = 0; i < 400; i++) {
    const dd = new Date(hoy);
    dd.setDate(hoy.getDate() - i);
    const iso = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
    const reg = datos.registros[iso];
    if (!reg) break;
    const total = contarTareas(datos, iso);
    if (total > 0 && porcentajeDia(reg, total) >= 100) actual++;
    else if (i > 0 || total === 0) break;
  }

  return { actual, max: Math.max(max, actual) };
}

function calcularSincronizacion(pctSemana: number, racha: number, diasPasados: Array<{ horas: number }>): number {
  const base = pctSemana * 0.7;
  const rachaPuntos = Math.min(racha, 7) * 2;
  const horasPuntos = diasPasados.some((d) => d.horas > 0) ? 6 : 0;
  return Math.min(Math.round(base + rachaPuntos + horasPuntos), 100);
}
