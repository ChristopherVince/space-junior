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

    case 'ASIGNAR_ENERGIA':
      if (estado.fase === 'reporte') return estado;
      return asignar(estado, accion.modulo, accion.unidades);

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
      let e: GameState = { ...estado, peticionActiva: null };
      if (!peticion || !accion.aceptada || peticion.de === 'comandante') return e;

      // Aceptar = dar 1 unidad al módulo del bot. Si no queda energía libre,
      // se quita al módulo con más energía (siempre se descuida otra cosa).
      const destino = peticion.modulo ?? MODULO_DE[peticion.de];
      if (e.recursos.energia === 0) {
        const donante = (Object.keys(e.energiaAsignada) as ModuleId[])
          .filter((m) => m !== destino && energiaEn(e, m) > 0)
          .sort((a, b) => energiaEn(e, b) - energiaEn(e, a))[0];
        if (!donante) return e;
        e = asignar(e, donante, energiaEn(e, donante) - 1);
      }
      return asignar(e, destino, energiaEn(e, destino) + 1);
    }

    case 'IR_AL_REFUGIO':
      if (estado.fase !== 'preparacion') return estado;
      return { ...estado, fase: 'refugio' };

    case 'PAUSAR':
      return { ...estado, pausado: accion.pausado };

    case 'TERMINAR_PARTIDA':
      return { ...estado, fase: 'reporte', motivoFin: accion.motivo };

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
