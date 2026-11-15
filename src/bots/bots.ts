// Frente 3 · Bots y diálogos (#13): reglas deterministas sin IA.
// Cada bot revisa su sistema y, si está en riesgo, pide energía al comandante
// rotando entre los 3 compañeros y alternando sus frases de i18n.
import { store } from '../state/store';
import type { CrewId, GameState } from '../state/types';

export type BotId = Exclude<CrewId, 'comandante'>;

export interface ReglaBot {
  quien: BotId;
  enRiesgo: (e: GameState) => boolean;
  textoId: string;
  textos: readonly string[];
}

export const REGLAS: ReglaBot[] = [
  {
    quien: 'cientifico',
    enRiesgo: (e) => (e.energiaAsignada.invernadero ?? 0) < 3 || e.recursos.soporteVital < 85,
    textoId: 'bot.cientifico.invernadero',
    textos: ['bot.cientifico.invernadero', 'bot.cientifico.2', 'bot.cientifico.3'],
  },
  {
    quien: 'ingeniero',
    enRiesgo: (e) => e.recursos.blindaje < 60 && (e.energiaAsignada.energia ?? 0) < 4,
    textoId: 'bot.ingeniero.blindaje',
    textos: ['bot.ingeniero.blindaje', 'bot.ingeniero.2', 'bot.ingeniero.3'],
  },
  {
    quien: 'medico',
    enRiesgo: (e) =>
      ((e.energiaAsignada.enfermeria ?? 0) < 2 && e.tripulacion.comandante.dosis >= 80) ||
      e.tripulacion.comandante.dosis > 350,
    textoId: 'bot.medico.dosis',
    textos: ['bot.medico.dosis', 'bot.medico.2', 'bot.medico.3'],
  },
];

// Orden rotativo para que los 3 bots se turnen cuando varios sistemas compiten por energía.
let cursorBot = 0;
let horaUltimaPeticion = -99;
const indiceFrase: Record<BotId, number> = {
  cientifico: 0,
  ingeniero: 0,
  medico: 0,
};

const HORAS_ENTRE_PETICIONES = 2;

export function revisarBots() {
  const e = store.getState();
  if (e.peticionActiva || e.fase === 'reporte' || e.fase === 'tormenta') return;

  // Si se reinició la partida, reiniciamos el contador de horas.
  if (e.hora < horaUltimaPeticion) {
    horaUltimaPeticion = -99;
  }

  if (e.hora - horaUltimaPeticion < HORAS_ENTRE_PETICIONES) return;

  for (let offset = 0; offset < REGLAS.length; offset++) {
    const idx = (cursorBot + offset) % REGLAS.length;
    const regla = REGLAS[idx];
    if (regla.enRiesgo(e)) {
      const turnoFrase = indiceFrase[regla.quien] % regla.textos.length;
      const textoElegido = regla.textos[turnoFrase];

      indiceFrase[regla.quien] = turnoFrase + 1;
      cursorBot = (idx + 1) % REGLAS.length;
      horaUltimaPeticion = e.hora;

      store.dispatch({
        type: 'MOSTRAR_PETICION',
        de: regla.quien,
        textoId: textoElegido,
      });
      return;
    }
  }
}
