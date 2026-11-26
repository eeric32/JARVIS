import { useEffect, useState } from 'react';
import type { RegistroDia, Rutina, Preferencias } from './types';

const CLAVE = 'jarvis-tracker-v1';

export interface DatosApp {
  registros: Record<string, RegistroDia>;
  rutinas: Rutina[];
  preferencias: Preferencias;
}

export function obtenerFechaHoy(): string {
  return fechaAISO(new Date());
}

export function fechaAISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

function porDefecto(): DatosApp {
  return { registros: {}, rutinas: [], preferencias: { color: 'cian', fondo: 'rejilla' } };
}

export function cargar(): DatosApp {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return porDefecto();
    const parsed = JSON.parse(raw);
    return { ...porDefecto(), ...parsed };
  } catch {
    return porDefecto();
  }
}

export function guardar(datos: DatosApp) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    // almacenamiento lleno, ignorar
  }
}

export function useAppData(): [DatosApp, (nuevos: Partial<DatosApp>) => void] {
  const [datos, setDatos] = useState<DatosApp>(cargar);

  useEffect(() => {
    guardar(datos);
  }, [datos]);

  const actualizar = (nuevos: Partial<DatosApp>) => {
    setDatos((prev) => ({ ...prev, ...nuevos }));
  };

  return [datos, actualizar];
}

export function registroVacio(): RegistroDia {
  return { tareas: {}, horas: 0, sesiones: [] };
}

export function obtenerRegistro(datos: DatosApp, fecha: string): RegistroDia {
  return datos.registros[fecha] || registroVacio();
}

export function porcentajeDia(reg: RegistroDia, totalTareas: number): number {
  if (totalTareas === 0) {
    return reg.horas > 0 ? 100 : 0;
  }
  const estados = Object.values(reg.tareas);
  if (estados.length === 0) return reg.horas > 0 ? 50 : 0;
  const completadas = estados.filter((t) => t.estado === 'completada').length;
  return Math.round((completadas / totalTareas) * 100);
}

export function idUnico(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
