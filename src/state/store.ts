// Estado central del juego. Toda decisión pasa por dispatch(accion).
// Así el multijugador (si llega) solo tiene que enviar acciones por red.
import balance from '../data/balance.json';
import type { Action, GameState } from './types';

export function estadoInicial(): GameState {
  return {
    sol: 1,
    hora: 0,
    fase: 'aviso',
    recursos: {
      energia: balance.energiaPorSol,
      soporteVital: 100,
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
  };
}

// TODO(Frente 2: estado y reglas): completar cada caso con las reglas reales.
export function reducer(estado: GameState, accion: Action): GameState {
  switch (accion.type) {
    case 'INICIAR_PARTIDA':
      return {
        ...estadoInicial(),
        eventoId: accion.eventoId,
        pronostico: accion.pronostico,
        fase: 'preparacion',
      };
    case 'AVANZAR_HORAS':
      return { ...estado, hora: estado.hora + accion.horas };
    case 'ASIGNAR_ENERGIA': {
      const actual = estado.energiaAsignada[accion.modulo] ?? 0;
      const delta = accion.unidades - actual;
      if (delta > estado.recursos.energia) return estado; // no alcanza
      return {
        ...estado,
        energiaAsignada: { ...estado.energiaAsignada, [accion.modulo]: accion.unidades },
        recursos: { ...estado.recursos, energia: estado.recursos.energia - delta },
      };
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
      return { ...estado, peticionActiva: { de: accion.de, textoId: accion.textoId } };
    case 'RESOLVER_PETICION':
      return { ...estado, peticionActiva: null };
    case 'IR_AL_REFUGIO':
      return { ...estado, fase: 'refugio' };
    case 'TERMINAR_PARTIDA':
      return { ...estado, fase: 'reporte' };
  }
}

type Listener = (estado: GameState) => void;

let estado = estadoInicial();
const listeners = new Set<Listener>();

export const store = {
  getState: () => estado,
  dispatch(accion: Action) {
    estado = reducer(estado, accion);
    listeners.forEach((l) => l(estado));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
