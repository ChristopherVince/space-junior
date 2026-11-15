// Frente 3 · Tripulación (bots sin IA).
//
// Dos formas de hablar:
// - Peticiones (detienen el reloj): solo cuando hay un problema que el niño PUEDE
//   resolver llevando energía al módulo correspondiente.
// - Avisos (no detienen nada): globos cortos en momentos clave (alerta, tormenta).
//
// Reglas para que no aburra:
// - Cada situación habla una vez cuando aparece; vuelve a hablar solo si el
//   problema se arregla y después regresa.
// - Ninguna frase se repite en la misma partida; si se acaban, ese personaje calla.
// - Espera mínima entre peticiones y tope por partida.
import balance from '../data/balance.json';
import { store } from '../state/store';
import type { CrewId, GameState, ModuleId, Phase } from '../state/types';

export type BotId = Exclude<CrewId, 'comandante'>;

export interface ConfigBotEscena {
  id: BotId;
  moduloBase: ModuleId;
  posInicial: [number, number];
  offset: [number, number];
}

// Posiciones iniciales dentro de cada módulo en la planta interior de Mars Dune Alpha (#14).
export const BOTS_ESCENA: readonly ConfigBotEscena[] = [
  { id: 'ingeniero', moduloBase: 'energia', posInicial: [3.6, 3.15], offset: [-0.45, 0.25] },
  { id: 'medico', moduloBase: 'enfermeria', posInicial: [7.6, 3.15], offset: [0.4, -0.25] },
  { id: 'cientifico', moduloBase: 'invernadero', posInicial: [-5.5, 0], offset: [-0.25, 0.55] },
];

/** Determina a qué módulo debe dirigirse un bot según el estado actual (#14). */
export function destinoDeBot(e: GameState, bot: ConfigBotEscena): ModuleId {
  if (e.fase === 'refugio' || e.fase === 'tormenta') {
    return 'refugio';
  }
  if (e.peticionActiva?.de === bot.id) {
    return e.tripulacion.comandante.modulo;
  }
  return bot.moduloBase;
}

const energiaEn = (e: GameState, m: ModuleId) => e.energiaAsignada[m] ?? 0;
/** Horas que faltan para la llegada que dice el pronóstico (lo que sabe el jugador). */
const horasHastaPronostico = (e: GameState) =>
  e.pronostico ? e.pronostico.horasPronosticadas - e.hora : Infinity;
/** "La tormenta se acerca": a menos de un sol más el margen del pronóstico. */
const tormentaCerca = (e: GameState) =>
  horasHastaPronostico(e) <= balance.horasPorSol + (e.pronostico?.margenHoras ?? 0);

export interface SituacionPeticion {
  id: string;
  quien: BotId;
  /** Módulo al que debe ir el jugador si acepta. */
  modulo: ModuleId;
  activa: (e: GameState) => boolean;
  /** Frases posibles; cada una se dice como máximo una vez por partida. */
  textos: readonly string[];
}

/** En orden de prioridad: si varias aplican, habla la primera. */
export const SITUACIONES: readonly SituacionPeticion[] = [
  {
    id: 'soporteCritico',
    quien: 'cientifico',
    modulo: 'invernadero',
    activa: (e) => e.recursos.soporteVital < 50,
    textos: ['bot.cientifico.critico1', 'bot.cientifico.critico2'],
  },
  {
    id: 'blindajeTormentaCerca',
    quien: 'ingeniero',
    modulo: 'energia',
    activa: (e) => tormentaCerca(e) && e.recursos.blindaje < 60 && energiaEn(e, 'energia') < 5,
    textos: ['bot.ingeniero.blindaje', 'bot.ingeniero.2', 'bot.ingeniero.3'],
  },
  {
    id: 'invernaderoSinEnergia',
    quien: 'cientifico',
    modulo: 'invernadero',
    activa: (e) => energiaEn(e, 'invernadero') < 3,
    textos: ['bot.cientifico.invernadero', 'bot.cientifico.2', 'bot.cientifico.3'],
  },
  {
    id: 'sinComunicaciones',
    quien: 'cientifico',
    modulo: 'comunicaciones',
    activa: (e) => tormentaCerca(e) && energiaEn(e, 'comunicaciones') === 0,
    textos: ['bot.cientifico.comunicaciones1', 'bot.cientifico.comunicaciones2'],
  },
];

/** Horas de juego mínimas entre dos peticiones (~18 s reales con 1.5 s por hora). */
export const HORAS_ENTRE_PETICIONES = 12;
/** Peticiones máximas por partida. */
export const MAX_PETICIONES = 8;

export interface AvisoTripulacion {
  de: BotId;
  textoId: string;
}
const oyentesAvisos = new Set<(aviso: AvisoTripulacion) => void>();

/** La interfaz se suscribe para mostrar los avisos como globos que se van solos. */
export function suscribirAvisos(fn: (aviso: AvisoTripulacion) => void): () => void {
  oyentesAvisos.add(fn);
  return () => { oyentesAvisos.delete(fn); };
}

// Estado de la tripulación durante la partida (se reinicia con reiniciarBots).
let horaUltimaPeticion = -Infinity;
let peticionesHechas = 0;
const frasesDichas = new Set<string>();
const situacionesAvisadas = new Set<string>();
let faseAnterior: Phase | null = null;

export function reiniciarBots() {
  horaUltimaPeticion = -Infinity;
  peticionesHechas = 0;
  frasesDichas.clear();
  situacionesAvisadas.clear();
  faseAnterior = null;
}

function avisar(de: BotId, textoId: string) {
  if (frasesDichas.has(textoId)) return;
  frasesDichas.add(textoId);
  oyentesAvisos.forEach((fn) => fn({ de, textoId }));
}

/** Avisos en los momentos clave; se detectan al cambiar de fase. */
function revisarAvisos(e: GameState) {
  const anterior = faseAnterior;
  faseAnterior = e.fase;
  if (anterior === null || anterior === e.fase) return;

  if (e.fase === 'refugio') {
    avisar('medico', 'bot.medico.alerta');
  } else if (e.fase === 'tormenta') {
    if (anterior === 'preparacion') {
      // Llegó sin alerta temprana: no había energía en Comunicaciones.
      avisar('ingeniero', 'bot.ingeniero.sinAlerta');
    }
    avisar('medico', e.tripulacion.comandante.modulo === 'refugio' ? 'bot.medico.enRefugio' : 'bot.medico.fueraRefugio');
  }
}

export function revisarBots() {
  const e = store.getState();
  if (e.fase === 'aviso' || e.fase === 'reporte') return;

  revisarAvisos(e);

  // Una situación que dejó de aplicar puede volver a hablar si regresa.
  for (const s of SITUACIONES) if (!s.activa(e)) situacionesAvisadas.delete(s.id);

  if (e.peticionActiva || e.tareaPendiente || e.fase !== 'preparacion') return;
  if (peticionesHechas >= MAX_PETICIONES) return;
  if (e.hora - horaUltimaPeticion < HORAS_ENTRE_PETICIONES) return;

  for (const s of SITUACIONES) {
    if (situacionesAvisadas.has(s.id) || !s.activa(e)) continue;
    situacionesAvisadas.add(s.id);
    const texto = s.textos.find((id) => !frasesDichas.has(id));
    if (!texto) continue; // ya no quedan frases nuevas: este problema no se vuelve a pedir

    frasesDichas.add(texto);
    peticionesHechas++;
    horaUltimaPeticion = e.hora;
    store.dispatch({ type: 'MOSTRAR_PETICION', de: s.quien, textoId: texto, modulo: s.modulo });
    return;
  }
}
