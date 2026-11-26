export type AccionTarea = 'completada' | 'fallada' | null;

export interface RegistroTarea {
  estado: AccionTarea;
  nota?: string;
}

export interface RegistroDia {
  tareas: Record<string, RegistroTarea>;
  horas: number;
  sesiones: Array<{
    inicio: number;
    duracion: number;
    tarea?: string;
    modo: string;
  }>;
}

export interface Rutina {
  id: string;
  nombre: string;
  dias: number[];
  tareas: Array<{
    id: string;
    texto: string;
    dias: number[];
  }>;
}

export type ColorId = 'cian' | 'ambar' | 'verde' | 'rojo';
export type FondoId = 'rejilla' | 'espacio' | 'circuito' | 'imagen';

export interface Preferencias {
  color: ColorId;
  fondo: FondoId;
  imagenFondo?: string;
  colorLibre?: string;
}

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
