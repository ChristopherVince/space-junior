// Estado central del juego. Toda decisión pasa por dispatch(accion).
// Así el multijugador (si llega) solo tiene que enviar acciones por red.
import balance from '../data/balance.json';
import type { Action, CrewId, CrewMember, GameState, ModuleId } from './types';

// Módulo de cada bot: a dónde va la energía cuando el jugador acepta su petición.
const MODULO_DE: Record<Exclude<CrewId, 'comandante'>, ModuleId> = {
  ingeniero: 'energia',
  medico: 'enfermeria',
  cientifico: 'invernadero',
};

export function estadoInicial(): GameState {
  return {
    sol: 1,
    hora: 0,
    fase: 'aviso',
    recursos: {
      energia: balance.energiaPorSol,
      soporteVital: balance.soporteVitalInicial,
      blindaje: 0,
    },
    energiaAsignada: {},
    pronostico: null,
    eventoId: null,
    tripulacion: {
      comandante: { id: 'comandante', modulo: 'pasillo', dosis: 0 },
      ingeniero: { id: 'ingeniero', modulo: 'energia', dosis: 0 },
      medico: { id: 'medico', modulo: 'enfermeria', dosis: 0 },
      cientifico: { id: 'cientifico', modulo: 'invernadero', dosis: 0 },
    },
    peticionActiva: null,
    tareaPendiente: null,
    pausado: false,
    horaInicioTormenta: null,
    motivoFin: null,
  };
}

const limitar = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

const energiaEn = (e: GameState, m: ModuleId) => e.energiaAsignada[m] ?? 0;

// Cambia la energía de un módulo respetando el total disponible.
function asignar(e: GameState, modulo: ModuleId, unidades: number): GameState {
  const nuevas = Math.max(0, Math.floor(unidades));
  const delta = nuevas - energiaEn(e, modulo);
  if (delta > e.recursos.energia) return e; // no alcanza
  return {
    ...e,
    energiaAsignada: { ...e.energiaAsignada, [modulo]: nuevas },
    recursos: { ...e.recursos, energia: e.recursos.energia - delta },
  };
}

// Dosis que recibe un tripulante en una hora (microgray).
function dosisPorHora(e: GameState, t: CrewMember): number {
  let dosis = balance.dosisBasePorHora;
  if (e.fase === 'tormenta') {
    const proteccion =
      t.modulo === 'refugio' ? (e.recursos.blindaje / 100) * balance.proteccionMaximaRefugio : 0;
    dosis += balance.dosisFueraPorHora * (1 - proteccion);
  }
  return dosis;
}

// Aplica los efectos de una sola hora de juego.
function unaHora(e: GameState): GameState {
  const hora = e.hora + 1;
  const sol = Math.floor(hora / balance.horasPorSol) + 1;
  const enTormenta = e.fase === 'tormenta' || e.fase === 'refugio';

  // Durante la alerta y la tormenta todos están en el refugio: nadie atiende
  // el invernadero ni los paneles, así que no producen.
  const invernadero = enTormenta ? 0 : energiaEn(e, 'invernadero') * balance.invernaderoPorUnidadHora;
  const blindaje = enTormenta ? 0 : energiaEn(e, 'energia') * balance.blindajePorUnidadHora;

  const tripulacion = { ...e.tripulacion };
  for (const id of Object.keys(tripulacion) as CrewId[]) {
    const t = tripulacion[id];
    tripulacion[id] = { ...t, dosis: t.dosis + dosisPorHora(e, t) };
  }

  let siguiente: GameState = {
    ...e,
    hora,
    sol,
    tripulacion,
    recursos: {
      ...e.recursos,
      soporteVital: limitar(e.recursos.soporteVital - balance.consumoSoporteVitalPorHora + invernadero),
      blindaje: limitar(e.recursos.blindaje + blindaje),
    },
  };

  siguiente = actualizarTormenta(siguiente);
  if (siguiente.fase !== 'preparacion') siguiente = { ...siguiente, tareaPendiente: null, peticionActiva: null };

  if (siguiente.fase !== 'reporte' && siguiente.recursos.soporteVital <= 0) {
    siguiente = { ...siguiente, fase: 'reporte', motivoFin: 'sinSoporteVital' };
  }
  return siguiente;
}

// Cambia de fase según la llegada REAL del evento, no la pronosticada.
function actualizarTormenta(e: GameState): GameState {
  if (!e.pronostico) return e;
  const llegada = e.pronostico.horasReales;

  if (e.fase === 'preparacion' || e.fase === 'aviso') {
    if (e.hora >= llegada) return { ...e, fase: 'tormenta', horaInicioTormenta: e.hora };
    const hayAlerta = energiaEn(e, 'comunicaciones') > 0;
    if (hayAlerta && e.hora >= llegada - balance.horasAlertaComunicaciones) {
      return { ...e, fase: 'refugio' };
    }
  }
  if (e.fase === 'refugio' && e.hora >= llegada) {
    return { ...e, fase: 'tormenta', horaInicioTormenta: e.hora };
  }
  if (
    e.fase === 'tormenta' &&
    e.horaInicioTormenta !== null &&
    e.hora >= e.horaInicioTormenta + balance.duracionTormentaHoras
  ) {
    return { ...e, fase: 'reporte', motivoFin: 'tormentaSuperada' };
  }
  return e;
}

export function reducer(estado: GameState, accion: Action): GameState {
  switch (accion.type) {
    case 'INICIAR_PARTIDA':
      return {
        ...estadoInicial(),
        eventoId: accion.eventoId,
        pronostico: accion.pronostico,
        fase: 'preparacion',
      };

    case 'AVANZAR_HORAS': {
      if (estado.fase === 'reporte' || estado.pausado) return estado;
      let e = estado;
      for (let i = 0; i < accion.horas && e.fase !== 'reporte'; i++) e = unaHora(e);
      return e;
    }

    case 'ASIGNAR_ENERGIA': {
      if (estado.fase === 'reporte') return estado;
      // Durante la alerta y la tormenta todos están en el refugio: nadie puede
      // ir a los módulos a cambiar la energía.
      if (estado.fase === 'refugio' || estado.fase === 'tormenta') return estado;
      if (estado.tareaPendiente?.modulo === accion.modulo &&
          estado.tripulacion.comandante.modulo !== accion.modulo &&
          accion.unidades > energiaEn(estado, accion.modulo)) return estado;
      const siguiente = asignar(estado, accion.modulo, accion.unidades);
      if (siguiente.tareaPendiente?.modulo === accion.modulo &&
          estado.tripulacion.comandante.modulo === accion.modulo &&
          energiaEn(siguiente, accion.modulo) >= siguiente.tareaPendiente.energiaObjetivo) {
        return { ...siguiente, tareaPendiente: null };
      }
      return siguiente;
    }

    case 'MOVER_TRIPULANTE':
      return {
        ...estado,
        tripulacion: {
          ...estado.tripulacion,
          [accion.quien]: { ...estado.tripulacion[accion.quien], modulo: accion.modulo },
        },
      };

    case 'MOSTRAR_PETICION':
      return {
        ...estado,
        peticionActiva: accion.modulo
          ? { de: accion.de, textoId: accion.textoId, modulo: accion.modulo }
          : { de: accion.de, textoId: accion.textoId },
      };

    case 'RESOLVER_PETICION': {
      const peticion = estado.peticionActiva;
      const e: GameState = { ...estado, peticionActiva: null };
      if (!peticion || !accion.aceptada || peticion.de === 'comandante' || estado.fase !== 'preparacion') return e;
      const destino = peticion.modulo ?? MODULO_DE[peticion.de];
      return { ...e, tareaPendiente: { de: peticion.de, modulo: destino, energiaObjetivo: energiaEn(e, destino) + (accion.unidades ?? 1) } };
    }

    case 'CANCELAR_TAREA':
      return estado.tareaPendiente ? { ...estado, tareaPendiente: null } : estado;

    case 'IR_AL_REFUGIO':
      if (estado.fase !== 'preparacion') return estado;
      return { ...estado, fase: 'refugio', tareaPendiente: null, peticionActiva: null };

    case 'PAUSAR':
      return { ...estado, pausado: accion.pausado };

    case 'TERMINAR_PARTIDA':
      return { ...estado, fase: 'reporte', motivoFin: accion.motivo, tareaPendiente: null, peticionActiva: null };

    case 'ABANDONAR_PARTIDA':
      return estadoInicial();
  }
}

type Listener = (estado: GameState) => void;

let estado = estadoInicial();
const listeners = new Set<Listener>();

export const store = {
  getState: () => estado,
  dispatch(accion: Action) {
    const anterior = estado;
    estado = reducer(estado, accion);
    if (estado !== anterior) listeners.forEach((l) => l(estado));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
