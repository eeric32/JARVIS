import type { ColorId } from './types';

export function hslAHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (n: number) => Math.round(255 * f(n)).toString(16).padStart(2, '0');
  return `#${hex(0)}${hex(8)}${hex(4)}`;
}

export function hexAHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export const COLORES: Record<ColorId, { nombre: string; h: number; s: number; l: number }> = {
  cian: { nombre: 'Cian J.A.R.V.I.S.', h: 190, s: 100, l: 50 },
  ambar: { nombre: 'Dorado / Ámbar', h: 38, s: 100, l: 55 },
  verde: { nombre: 'Verde Neón', h: 140, s: 90, l: 48 },
  rojo: { nombre: 'Rojo', h: 0, s: 95, l: 55 },
};

export function aplicarColor(color: ColorId) {
  const c = COLORES[color] || COLORES.cian;
  aplicarColorLibre(`hsl(${c.h} ${c.s}% ${c.l}%)`);
}

export function aplicarColorLibre(color: string) {
  const root = document.documentElement;
  if (color.startsWith('#')) {
    const { h, s, l } = hexAHsl(color);
    root.style.setProperty('--hud', `${h} ${s}% ${l}%`);
    root.style.setProperty('--hud-dim', `${h} ${Math.min(s, 85)}% ${Math.min(l + 12, 85)}%`);
    root.style.setProperty('--hud-glow', `${h} ${s}% ${Math.min(l + 18, 90)}%`);
  } else {
    const [h, s, l] = color.replace(/[hsl()%]/g, '').trim().split(/\s+/).map(Number);
    root.style.setProperty('--hud', `${h} ${s}% ${l}%`);
    root.style.setProperty('--hud-dim', `${h} ${Math.min(s, 85)}% ${Math.min(l + 12, 85)}%`);
    root.style.setProperty('--hud-glow', `${h} ${s}% ${Math.min(l + 18, 90)}%`);
  }
}

export function anilloSvg(progreso: number, tamano: number, grosor: number, extra?: string) {
  const r = (tamano - grosor) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(progreso, 0), 1));
  return { r, c, offset, tamano, grosor };
}

export function formatoHora(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatoHorasDecimal(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

export function inicioSemana(d: Date): Date {
  const copia = new Date(d);
  const dia = (copia.getDay() + 6) % 7;
  copia.setDate(copia.getDate() - dia);
  copia.setHours(0, 0, 0, 0);
  return copia;
}
