export type ProveedorId = 'openai' | 'claude' | 'gemini' | 'groq' | 'openrouter';

export interface ConfigIA {
  proveedor: ProveedorId;
  modelo: string;
  apiKey: string;
  claves?: Partial<Record<ProveedorId, string>>;
  modoConsejo?: boolean;
}

export const PROVEEDORES: Record<ProveedorId, { nombre: string; url: string; modelo: string }> = {
  openai: {
    nombre: 'ChatGPT (OpenAI)',
    url: 'https://api.openai.com/v1/chat/completions',
    modelo: 'gpt-4o-mini',
  },
  claude: {
    nombre: 'Claude (Anthropic)',
    url: 'https://api.anthropic.com/v1/messages',
    modelo: 'claude-3-5-haiku-latest',
  },
  gemini: {
    nombre: 'Gemini (Google)',
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelo: 'gemini-2.5-flash',
  },
  groq: {
    nombre: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    modelo: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    nombre: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    modelo: 'openai/gpt-4o-mini',
  },
};

export const PROMPT_SISTEMA = `Sos JARVIS, asistente de productividad de una app de rutinas y enfoque en español.
Tono: práctico, motivador, cercano (usa "vos" cuando puedas). Respondés SIEMPRE en español y SOLO con un objeto JSON válido, sin markdown ni cercas de código, con esta forma:
{"respuesta": "texto motivador y accionable (máx 120 palabras)", "rutina": null}
Si el usuario describe qué hace en su día y cuánto tiempo tiene, además armale una rutina ordenada en bloques de tiempo compatibles con sesiones de enfoque de 25, 45 o 60 minutos con pausas de 10, usando esta forma:
{"respuesta": "breve motivación", "rutina": {"nombre": "Rutina del día", "tareas": [{"texto": "Descripción del bloque", "duracionMin": 45}]}}
Reglas de la rutina: los bloques suman como máximo el tiempo disponible, alterná enfoque y pausas, empezá por lo más importante, y máx 8 bloques. Si no piden rutina, "rutina" va en null.`;

export interface MensajeIA {
  rol: 'usuario' | 'jarvis';
  texto: string;
}

async function llamarOpenAICompatible(
  url: string,
  apiKey: string,
  modelo: string,
  historial: MensajeIA[],
  promptSistema = PROMPT_SISTEMA
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelo,
      temperature: 0.7,
      messages: [
        { role: 'system', content: promptSistema },
        ...historial.slice(-10).map((m) => ({
          role: m.rol === 'usuario' ? 'user' : 'assistant',
          content: m.texto,
        })),
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Conexión fallida (${res.status})`);
  }
  const data = await res.json();
  const texto = data?.choices?.[0]?.message?.content;
  if (typeof texto !== 'string' || !texto.trim()) {
    throw new Error('Respuesta vacía del modelo');
  }
  return texto;
}

async function llamarClaude(
  apiKey: string,
  modelo: string,
  historial: MensajeIA[],
  promptSistema = PROMPT_SISTEMA
): Promise<string> {
  const res = await fetch(PROVEEDORES.claude.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 1024,
      temperature: 0.7,
      system: promptSistema,
      messages: historial.slice(-10).map((m) => ({
        role: m.rol === 'usuario' ? 'user' : 'assistant',
        content: m.texto,
      })),
    }),
  });
  if (!res.ok) {
    throw new Error(`Conexión fallida (${res.status})`);
  }
  const data = await res.json();
  const texto = data?.content?.find((b: { type?: string; text?: string }) => b.type === 'text')?.text;
  if (typeof texto !== 'string' || !texto.trim()) {
    throw new Error('Respuesta vacía del modelo');
  }
  return texto;
}

async function llamarGemini(
  apiKey: string,
  modelo: string,
  historial: MensajeIA[],
  promptSistema = PROMPT_SISTEMA
): Promise<string> {
  const endpoint = `${PROVEEDORES.gemini.url}/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: promptSistema }],
      },
      generationConfig: {
        temperature: 0.7,
      },
      contents: historial.slice(-10).map((m) => ({
        role: m.rol === 'usuario' ? 'user' : 'model',
        parts: [{ text: m.texto }],
      })),
    }),
  });
  if (!res.ok) {
    throw new Error(`Conexión fallida (${res.status})`);
  }
  const data = await res.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof texto !== 'string' || !texto.trim()) {
    throw new Error('Respuesta vacía del modelo');
  }
  return texto;
}

export async function consultarProveedorIndividual(
  proveedor: ProveedorId,
  apiKey: string,
  modelo: string,
  historial: MensajeIA[],
  promptSistema = PROMPT_SISTEMA
): Promise<string> {
  const prov = PROVEEDORES[proveedor];
  const modeloFinal = modelo?.trim() || prov.modelo;

  if (proveedor === 'claude') {
    return llamarClaude(apiKey, modeloFinal, historial, promptSistema);
  }
  if (proveedor === 'gemini') {
    return llamarGemini(apiKey, modeloFinal, historial, promptSistema);
  }
  return llamarOpenAICompatible(prov.url, apiKey, modeloFinal, historial, promptSistema);
}

export async function consultarIA(cfg: ConfigIA, historial: MensajeIA[]): Promise<string> {
  const clavesMapa: Partial<Record<ProveedorId, string>> = {
    ...cfg.claves,
    ...(cfg.apiKey?.trim() ? { [cfg.proveedor]: cfg.apiKey.trim() } : {}),
  };

  const ordenConsejo: ProveedorId[] = ['openai', 'claude', 'gemini'];
  const activos = ordenConsejo
    .map((id) => ({ id, key: clavesMapa[id]?.trim() || '' }))
    .filter((item) => item.key.length > 0);

  if (cfg.modoConsejo && activos.length >= 2) {
    const resultados = await Promise.allSettled(
      activos.map(async (item) => {
        const raw = await consultarProveedorIndividual(
          item.id,
          item.key,
          item.id === cfg.proveedor && cfg.modelo ? cfg.modelo : PROVEEDORES[item.id].modelo,
          historial
        );
        const parsed = extraerJSON(raw);
        return {
          nombre: PROVEEDORES[item.id].nombre,
          texto: parsed ? parsed.respuesta : raw,
        };
      })
    );

    const exitosos = resultados
      .filter(
        (r): r is PromiseFulfilledResult<{ nombre: string; texto: string }> =>
          r.status === 'fulfilled'
      )
      .map((r) => r.value);

    if (exitosos.length === 1) {
      return JSON.stringify({ respuesta: exitosos[0].texto, rutina: null });
    }

    if (exitosos.length > 1) {
      const juez = activos[0];
      const resumenPropuestas = exitosos
        .map((e) => `- ${e.nombre}: ${e.texto}`)
        .join('\n');

      const promptSintesis = `${PROMPT_SISTEMA}
Tenés estas respuestas de distintos modelos sobre el último mensaje del usuario:
${resumenPropuestas}
Combiná lo mejor de cada una en UNA respuesta clara, práctica y motivadora, sin mencionar nombres de modelos ni decir "según el consejo".`;

      try {
        return await consultarProveedorIndividual(
          juez.id,
          juez.key,
          juez.id === cfg.proveedor && cfg.modelo ? cfg.modelo : PROVEEDORES[juez.id].modelo,
          historial,
          promptSintesis
        );
      } catch {
        return JSON.stringify({ respuesta: exitosos[0].texto, rutina: null });
      }
    }
  }

  const claveActual = cfg.apiKey?.trim() || clavesMapa[cfg.proveedor]?.trim() || '';
  return consultarProveedorIndividual(cfg.proveedor, claveActual, cfg.modelo, historial);
}

export interface RutinaIA {
  nombre: string;
  tareas: Array<{ texto: string; duracionMin: number }>;
}

export function extraerJSON(texto: string): { respuesta: string; rutina: RutinaIA | null } | null {
  const limpio = texto.replace(/```(?:json)?/gi, '').trim();
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio === -1 || fin <= inicio) return null;
  try {
    const obj = JSON.parse(limpio.slice(inicio, fin + 1));
    if (typeof obj.respuesta !== 'string') return null;
    return {
      respuesta: obj.respuesta,
      rutina:
        obj.rutina && Array.isArray(obj.rutina.tareas)
          ? {
              nombre: typeof obj.rutina.nombre === 'string' ? obj.rutina.nombre : 'Rutina IA',
              tareas: obj.rutina.tareas
                .filter((t: unknown) => t && typeof (t as { texto?: unknown }).texto === 'string')
                .map((t: { texto: string; duracionMin?: number }) => ({
                  texto: t.texto,
                  duracionMin: typeof t.duracionMin === 'number' && t.duracionMin > 0 ? t.duracionMin : 25,
                })),
            }
          : null,
    };
  } catch {
    return null;
  }
}