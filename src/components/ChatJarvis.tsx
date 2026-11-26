import { useEffect, useRef, useState } from 'react';
import { X, Settings, Send, Sparkles, Trash2, ClipboardList } from 'lucide-react';
import type { MensajeIA, ConfigIA, RutinaIA, ProveedorId } from '../ia';
import { PROVEEDORES, consultarIA, extraerJSON } from '../ia';
import type { DatosApp } from '../store';
import { idUnico } from '../store';
import type { Rutina } from '../types';

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  datos: DatosApp;
  alActualizar: (n: Partial<DatosApp>) => void;
  nombre: string;
  alGuardarNombre: (n: string) => void;
}

const CLAVE_HIST = 'jarvis-chat-v1';
const CLAVE_IA = 'jarvis-ia-v1';
const PROVEEDORES_CONSEJO: ProveedorId[] = ['openai', 'claude', 'gemini'];

function cargarHistorial(): MensajeIA[] {
  try {
    const raw = localStorage.getItem(CLAVE_HIST);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(-60) : [];
  } catch {
    return [];
  }
}

function normalizarConfigIA(rawObj?: Partial<ConfigIA> | null): ConfigIA {
  const proveedor: ProveedorId =
    rawObj?.proveedor && rawObj.proveedor in PROVEEDORES ? rawObj.proveedor : 'openai';
  const claves: Partial<Record<ProveedorId, string>> = {
    ...(rawObj?.claves ?? {}),
  };
  const apiKeyDirecta = typeof rawObj?.apiKey === 'string' ? rawObj.apiKey : '';
  if (apiKeyDirecta.trim() && !claves[proveedor]?.trim()) {
    claves[proveedor] = apiKeyDirecta;
  }
  const apiKeyActiva = claves[proveedor] ?? apiKeyDirecta ?? '';

  return {
    proveedor,
    modelo: typeof rawObj?.modelo === 'string' ? rawObj.modelo : '',
    apiKey: apiKeyActiva,
    claves,
    modoConsejo: Boolean(rawObj?.modoConsejo),
  };
}

function cargarIA(): ConfigIA {
  try {
    const raw = localStorage.getItem(CLAVE_IA);
    if (!raw) return normalizarConfigIA();
    return normalizarConfigIA(JSON.parse(raw));
  } catch {
    return normalizarConfigIA();
  }
}

export default function ChatJarvis({ abierto, alCerrar, datos, alActualizar, nombre, alGuardarNombre }: Props) {
  const [historial, setHistorial] = useState<MensajeIA[]>(cargarHistorial);
  const [ia, setIa] = useState<ConfigIA>(cargarIA);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verConfig, setVerConfig] = useState(false);
  const [nombreTemp, setNombreTemp] = useState(nombre);
  const [rutinaSugerida, setRutinaSugerida] = useState<RutinaIA | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(CLAVE_HIST, JSON.stringify(historial.slice(-60))); } catch { /* lleno */ }
  }, [historial]);

  useEffect(() => {
    try { localStorage.setItem(CLAVE_IA, JSON.stringify(ia)); } catch { /* lleno */ }
  }, [ia]);

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [abierto, historial, cargando]);

  if (!abierto) return null;

  const clavesCargadas = Object.values(ia.claves ?? {}).filter(
    (k): k is string => typeof k === 'string' && k.trim().length > 0
  ).length;
  const iaConfigurada = Boolean(ia.apiKey.trim()) || clavesCargadas > 0;

  const actualizarClaveProveedor = (prov: ProveedorId, valor: string) => {
    const nuevasClaves: Partial<Record<ProveedorId, string>> = {
      ...(ia.claves ?? {}),
      [prov]: valor,
    };
    setIa({
      ...ia,
      claves: nuevasClaves,
      apiKey: prov === ia.proveedor ? valor : ia.apiKey,
    });
  };

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || cargando) return;
    if (!iaConfigurada) {
      setVerConfig(true);
      setError('Falta configurar al menos una API key para que JARVIS pueda responder.');
      return;
    }
    setError(null);
    const nuevo: MensajeIA[] = [...historial, { rol: 'usuario' as const, texto }];
    setHistorial(nuevo);
    setInput('');
    setCargando(true);
    try {
      const crudo = await consultarIA(ia, nuevo);
      const parsed = extraerJSON(crudo);
      const respuesta = parsed?.respuesta ?? crudo;
      setHistorial((h) => [...h, { rol: 'jarvis', texto: respuesta }]);
      if (parsed?.rutina) setRutinaSugerida(parsed.rutina);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión con la IA.');
    } finally {
      setCargando(false);
    }
  };

  const importarRutina = () => {
    if (!rutinaSugerida) return;
    const rutina: Rutina = {
      id: idUnico(),
      nombre: rutinaSugerida.nombre,
      dias: [0, 1, 2, 3, 4, 5, 6],
      tareas: rutinaSugerida.tareas.map((t) => ({ id: idUnico(), texto: `${t.texto} (${t.duracionMin}m)`, dias: [0, 1, 2, 3, 4, 5, 6] })),
    };
    alActualizar({ rutinas: [...datos.rutinas, rutina] });
    setRutinaSugerida(null);
    setHistorial((h) => [...h, { rol: 'jarvis', texto: `Rutina "${rutina.nombre}" importada a tus rutinas. Lista para usar con ENFOQUE.` }]);
  };

  const guardarNombre = () => {
    const n = nombreTemp.trim();
    if (n) alGuardarNombre(n);
  };

  return (
    <div
      className="panel-hud fixed z-50 flex flex-col"
      style={{
        position: 'fixed',
        left: 'auto',
        right: '108px',
        bottom: '84px',
        top: 'auto',
        transform: 'none',
        width: '340px',
        maxHeight: '80vh',
        overflowY: 'auto',
        background: 'rgb(5 12 20 / 0.96)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(var(--hud)/0.25)]">
        <div>
          <span className="font-hud text-xs font-bold tracking-[0.2em] texto-glow text-white">J.A.R.V.I.S.</span>
          <span className="font-mono-hud text-[8px] uppercase tracking-widest opacity-60 ml-2">
            {iaConfigurada ? (ia.modoConsejo ? 'CONSEJO IA' : 'EN LÍNEA') : 'SIN CONFIGURAR'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setVerConfig(!verConfig)} className="btn-hud p-1.5" title="Configurar IA"><Settings size={13} /></button>
          <button
            onClick={() => { if (confirm('¿Borrar todo el historial del chat?')) { setHistorial([]); setRutinaSugerida(null); } }}
            className="btn-hud p-1.5" title="Borrar historial"
          ><Trash2 size={13} /></button>
          <button onClick={alCerrar} className="btn-hud p-1.5"><X size={13} /></button>
        </div>
      </div>

      {verConfig ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-60 mb-1.5">Tu nombre</div>
            <div className="flex gap-1.5">
              <input
                value={nombreTemp}
                onChange={(e) => setNombreTemp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && guardarNombre()}
                placeholder="¿Cómo te llamás?"
                className="flex-1 bg-black/40 border border-[hsl(var(--hud)/0.25)] px-2.5 py-1.5 font-mono-hud text-xs text-white/90 placeholder:text-white/30"
              />
              <button onClick={guardarNombre} className="btn-hud activo px-3 font-mono-hud text-xs">OK</button>
            </div>
          </div>

          <div>
            <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-60 mb-1.5">Proveedor principal</div>
            <select
              value={ia.proveedor}
              onChange={(e) => {
                const prov = e.target.value as ProveedorId;
                const claveProv = ia.claves?.[prov] ?? '';
                setIa({
                  ...ia,
                  proveedor: prov,
                  modelo: PROVEEDORES[prov].modelo,
                  apiKey: claveProv,
                });
              }}
              className="w-full bg-black/40 border border-[hsl(var(--hud)/0.25)] px-2.5 py-1.5 font-mono-hud text-xs text-white/90"
            >
              {Object.entries(PROVEEDORES).map(([id, p]) => <option key={id} value={id}>{p.nombre}</option>)}
            </select>
          </div>

          <div>
            <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-60 mb-1.5">Modelo</div>
            <input
              value={ia.modelo}
              onChange={(e) => setIa({ ...ia, modelo: e.target.value })}
              placeholder={PROVEEDORES[ia.proveedor].modelo}
              className="w-full bg-black/40 border border-[hsl(var(--hud)/0.25)] px-2.5 py-1.5 font-mono-hud text-xs text-white/90 placeholder:text-white/30"
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-[hsl(var(--hud)/0.15)]">
            <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-70">Claves de IA (ChatGPT · Claude · Gemini)</div>
            {PROVEEDORES_CONSEJO.map((provId) => (
              <div key={provId}>
                <div className="font-mono-hud text-[8px] uppercase tracking-widest opacity-55 mb-1">
                  {PROVEEDORES[provId].nombre}
                </div>
                <input
                  type="password"
                  value={ia.claves?.[provId] ?? (provId === ia.proveedor ? ia.apiKey : '')}
                  onChange={(e) => actualizarClaveProveedor(provId, e.target.value)}
                  placeholder={`API key de ${PROVEEDORES[provId].nombre}`}
                  className="w-full bg-black/40 border border-[hsl(var(--hud)/0.25)] px-2.5 py-1.5 font-mono-hud text-xs text-white/90 placeholder:text-white/30"
                />
              </div>
            ))}
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(ia.modoConsejo)}
                onChange={(e) => setIa({ ...ia, modoConsejo: e.target.checked })}
                className="accent-[hsl(var(--hud))]"
              />
              <span className="font-mono-hud text-[10px] text-white/85">
                Modo Consejo (unir respuestas de las claves cargadas)
              </span>
            </label>
            <p className="font-mono-hud text-[8px] opacity-40">
              Se guarda solo en este dispositivo (localStorage) y viaja únicamente a los proveedores configurados.
            </p>
          </div>

          {error && <p className="font-mono-hud text-[10px] text-red-400 border border-red-500/30 bg-red-500/10 px-2 py-1.5">{error}</p>}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="border border-[hsl(var(--hud)/0.3)] bg-[hsl(var(--hud)/0.08)] px-3 py-2.5">
              <div className="font-mono-hud text-[8px] uppercase tracking-widest text-[hsl(var(--hud-glow))] mb-1">JARVIS</div>
              <p className="text-sm text-white/90 font-medium">
                {nombre ? `¿Qué necesitás, ${nombre}?` : '¿Qué necesitás? Podés decirme tu nombre en la configuración (engranaje arriba).'}
              </p>
            </div>

            {historial.map((m, i) => (
              <div key={i} className={`px-3 py-2 border ${m.rol === 'usuario' ? 'ml-6 border-[hsl(var(--hud)/0.2)] bg-black/30' : 'border-[hsl(var(--hud)/0.3)] bg-[hsl(var(--hud)/0.07)]'}`}>
                <div className="font-mono-hud text-[8px] uppercase tracking-widest text-[hsl(var(--hud-glow))] mb-0.5">{m.rol === 'usuario' ? nombre || 'VOS' : 'JARVIS'}</div>
                <p className="text-xs text-white/85 leading-relaxed">{m.texto}</p>
              </div>
            ))}

            {cargando && (
              <div className="px-3 py-2 border border-[hsl(var(--hud)/0.3)] bg-[hsl(var(--hud)/0.07)]">
                <div className="font-mono-hud text-[8px] uppercase tracking-widest text-[hsl(var(--hud-glow))] parpadeo">JARVIS está procesando...</div>
              </div>
            )}

            {rutinaSugerida && (
              <div className="border border-[hsl(var(--hud)/0.5)] bg-[hsl(var(--hud)/0.08)] p-3">
                <div className="flex items-center gap-1.5 font-hud text-[10px] font-bold tracking-widest text-white uppercase mb-1">
                  <ClipboardList size={12} /> {rutinaSugerida.nombre}
                </div>
                <ul className="space-y-0.5 mb-2.5">
                  {rutinaSugerida.tareas.map((t, i) => (
                    <li key={i} className="font-mono-hud text-[10px] text-white/75 flex justify-between gap-2">
                      <span>▸ {t.texto}</span><span className="opacity-60 shrink-0">{t.duracionMin}m</span>
                    </li>
                  ))}
                </ul>
                <button onClick={importarRutina} className="btn-hud activo w-full py-1.5 font-mono-hud text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Sparkles size={11} /> Importar a mis rutinas
                </button>
              </div>
            )}

            {error && !verConfig && (
              <p className="font-mono-hud text-[10px] text-red-400 border border-red-500/30 bg-red-500/10 px-2 py-1.5">{error}</p>
            )}
            <div ref={finRef} />
          </div>

          <div className="p-3 border-t border-[hsl(var(--hud)/0.25)]">
            <div className="flex gap-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviar()}
                placeholder="Contame tu día y cuánto tiempo tenés..."
                className="flex-1 bg-black/40 border border-[hsl(var(--hud)/0.25)] px-2.5 py-2 text-xs text-white/90 placeholder:text-white/30"
              />
              <button onClick={enviar} disabled={cargando} className="btn-hud activo px-3 disabled:opacity-40" title="Enviar"><Send size={13} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}