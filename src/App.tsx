import { useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import { useAppData, obtenerFechaHoy } from './store';
import { aplicarColor, aplicarColorLibre, COLORES } from './hud';
import type { ColorId } from './types';
import FondoHUD from './components/FondoHUD';
import CalendarioAnual from './components/CalendarioAnual';
import DetalleDia from './components/DetalleDia';
import GestorRutinas from './components/GestorRutinas';
import CronometroEnfoque from './components/CronometroEnfoque';
import MetricasSemanales from './components/MetricasSemanales';
import PanelConfig from './components/PanelConfig';
import NucleoParticulas from './components/NucleoParticulas';
import ChatJarvis from './components/ChatJarvis';

const CLAVE_NOMBRE = 'jarvis-nombre';

export default function App() {
  const [datos, actualizar] = useAppData();
  const [fechaSel, setFechaSel] = useState(obtenerFechaHoy());
  const [chatAbierto, setChatAbierto] = useState(false);
  const [nombre, setNombre] = useState(() => localStorage.getItem(CLAVE_NOMBRE) || '');

  const guardarNombre = (n: string) => {
    setNombre(n);
    try { localStorage.setItem(CLAVE_NOMBRE, n); } catch { /* lleno */ }
  };

  useEffect(() => {
    if (datos.preferencias.colorLibre) {
      aplicarColorLibre(datos.preferencias.colorLibre);
    } else {
      aplicarColor(datos.preferencias.color);
    }
  }, [datos.preferencias.color, datos.preferencias.colorLibre]);

  const hoy = obtenerFechaHoy();
  const esHoy = fechaSel === hoy;
  const diaSemanaHoy = (new Date().getDay() + 6) % 7;

  const tareasHoy = useMemo(() => {
    const reg = datos.registros[hoy];
    return datos.rutinas
      .flatMap((r) => r.tareas.filter((t) => t.dias.includes(diaSemanaHoy)).map((t) => ({ id: t.id, texto: t.texto })))
      .filter((t) => reg?.tareas[t.id]?.estado !== 'fallada');
  }, [datos.rutinas, datos.registros, diaSemanaHoy, hoy]);

  const cambiarPrefs = (p: Partial<typeof datos.preferencias>) => {
    const nuevas = { ...datos.preferencias, ...p };
    if ('color' in p) nuevas.colorLibre = undefined;
    if ('colorLibre' in p) nuevas.color = 'cian';
    actualizar({ preferencias: nuevas });
  };

  return (
    <div className="min-h-screen relative">
      <FondoHUD fondo={datos.preferencias.fondo} imagen={datos.preferencias.imagenFondo} />

      <header className="sticky top-0 z-40 border-b border-[hsl(var(--hud)/0.2)] bg-black/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full anillo-girando-lento">
                <circle cx="20" cy="20" r="17" fill="none" stroke="hsl(var(--hud) / 0.4)" strokeWidth="1.5" strokeDasharray="60 20" />
                <circle cx="20" cy="20" r="13" fill="none" stroke="hsl(var(--hud) / 0.25)" strokeWidth="1" strokeDasharray="10 8" />
              </svg>
              <Activity size={15} className="text-[hsl(var(--hud-glow))]" />
            </div>
            <div>
              <h1 className="font-hud text-sm sm:text-base font-bold tracking-[0.25em] texto-glow text-white">J.A.R.V.I.S.</h1>
              <p className="font-mono-hud text-[9px] uppercase tracking-[0.3em] opacity-60">Seguimiento · Rutinas · Enfoque</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="font-mono-hud text-[10px] uppercase tracking-widest opacity-60">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              <div className="font-hud text-xs text-[hsl(var(--hud-glow))] parpadeo">
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
            <PanelConfig prefs={datos.preferencias} alCambiar={cambiarPrefs} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <CronometroEnfoque datos={datos} alActualizar={actualizar} tareasHoy={tareasHoy} />
          <MetricasSemanales datos={datos} />
        </div>
        <DetalleDia datos={datos} fecha={fechaSel} esHoy={esHoy} alActualizar={actualizar} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <CalendarioAnual datos={datos} fechaSeleccionada={fechaSel} alSeleccionar={setFechaSel} />
          <GestorRutinas datos={datos} alActualizar={actualizar} />
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-6 pt-2 relative z-10">
        <p className="font-mono-hud text-[9px] uppercase tracking-[0.3em] opacity-30 text-center">
          Datos guardados localmente · {COLORES[datos.preferencias.color as ColorId]?.nombre || 'Cian'}
        </p>
      </footer>

      <NucleoParticulas onClick={() => setChatAbierto(true)} />
      <ChatJarvis
        abierto={chatAbierto}
        alCerrar={() => setChatAbierto(false)}
        datos={datos}
        alActualizar={actualizar}
        nombre={nombre}
        alGuardarNombre={guardarNombre}
      />
    </div>
  );
}
