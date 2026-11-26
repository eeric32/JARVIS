import { useRef, useState } from 'react';
import { Settings, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import type { ColorId, FondoId, Preferencias } from '../types';
import { COLORES, hslAHex } from '../hud';

const FONDOS: Array<{ id: FondoId; nombre: string }> = [
  { id: 'rejilla', nombre: 'Rejilla holográfica' },
  { id: 'espacio', nombre: 'Espacio profundo' },
  { id: 'circuito', nombre: 'Circuito oscuro' },
  { id: 'imagen', nombre: 'Imagen propia' },
];

interface Props {
  prefs: Preferencias;
  alCambiar: (p: Partial<Preferencias>) => void;
}

export default function PanelConfig({ prefs, alCambiar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);

  const subirImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      alCambiar({ fondo: 'imagen', imagenFondo: String(lector.result) });
    };
    lector.readAsDataURL(archivo);
  };

  return (
    <div className="relative">
      <button onClick={() => setAbierto(!abierto)} className={`btn-hud p-2 ${abierto ? 'activo' : ''}`} title="Configuración HUD">
        <Settings size={16} className={abierto ? 'parpadeo' : ''} />
      </button>

      {abierto && (
        <div 
          style={{ transform: 'translateY(-24px)' }}
          className="absolute right-0 top-8 w-64 panel-hud p-3 z-50 bg-black/90">
          <div className="flex items-center justify-between mb-3">
            <span className="font-hud text-xs font-semibold tracking-widest text-white/90 uppercase">HUD / Fondo</span>
            <button onClick={() => setAbierto(false)} className="text-white/40 hover:text-white transition-colors"><X size={14} /></button>
          </div>

          <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-60 mb-2">Color principal</div>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {(Object.keys(COLORES) as ColorId[]).map((id) => {
              const c = COLORES[id];
              return (
                <button
                  key={id}
                  onClick={() => alCambiar({ color: id })}
                  className={`flex items-center gap-2 border px-2 py-1.5 font-mono-hud text-[9px] uppercase tracking-wider transition-all ${prefs.color === id ? 'border-[hsl(var(--hud))] text-white bg-[hsl(var(--hud)/0.1)]' : 'border-[hsl(var(--hud)/0.2)] text-white/50 hover:border-[hsl(var(--hud)/0.5)]'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: `hsl(${c.h} ${c.s}% ${c.l}%)`, boxShadow: `0 0 6px hsl(${c.h} ${c.s}% ${c.l}%)` }} />
                  {c.nombre.split(' ')[0]}
                </button>
              );
            })}
            <label
              className={`flex items-center gap-2 border px-2 py-1.5 font-mono-hud text-[9px] uppercase tracking-wider cursor-pointer transition-all ${
                prefs.colorLibre
                  ? 'border-[hsl(var(--hud))] text-white bg-[hsl(var(--hud)/0.1)]'
                  : 'border-[hsl(var(--hud)/0.2)] text-white/50 hover:border-[hsl(var(--hud)/0.5)]'
              }`}
              title="Color personalizado"
            >
              <input
                type="color"
                value={prefs.colorLibre || hslAHex(190, 100, 50)}
                onChange={(e) => alCambiar({ colorLibre: e.target.value })}
                className="w-4 h-4 p-0 border-0 bg-transparent cursor-pointer"
                style={{ appearance: 'none' }}
              />
              Libre
            </label>
          </div>

          <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-60 mb-2">Fondo</div>
          <div className="space-y-1.5">
            {FONDOS.map((f) => (
              <button
                key={f.id}
                onClick={() => f.id === 'imagen' ? inputArchivo.current?.click() : alCambiar({ fondo: f.id })}
                className={`w-full flex items-center gap-2 border px-2 py-1.5 font-mono-hud text-[10px] transition-all ${prefs.fondo === f.id ? 'border-[hsl(var(--hud))] text-white bg-[hsl(var(--hud)/0.1)]' : 'border-[hsl(var(--hud)/0.2)] text-white/50 hover:border-[hsl(var(--hud)/0.5)]'}`}
              >
                {f.id === 'imagen' ? <ImageIcon size={11} /> : <span className="w-2.5 h-2.5 border border-current" />}
                {f.nombre}
                {f.id === 'imagen' && prefs.imagenFondo && (
                  <Trash2
                    size={11}
                    className="ml-auto hover:text-red-400"
                    onClick={(e) => { e.stopPropagation(); alCambiar({ fondo: 'rejilla', imagenFondo: undefined }); }}
                  />
                )}
              </button>
            ))}
          </div>
          <input ref={inputArchivo} type="file" accept="image/*" className="hidden" onChange={subirImagen} />
        </div>
      )}
    </div>
  );
}
