// Inicio y reinicio de partidas con un evento real al azar (rejugabilidad).
// El botón "Jugar otra vez" del reporte (#17) y "Abandonar partida" (#47) usan estas funciones.
import { reiniciarBots } from '../bots/bots';
import datos from '../data/events.json';
import { store } from './store';

interface Evento {
  id: string;
  esEjemplo?: boolean;
  horasPronosticadas: number;
  margenHoras: number;
  horasReales: number;
}

const eventos: Evento[] = datos.eventos;

// Solo eventos reales; si no hay ninguno, se usa lo que haya (ejemplo).
const reales = eventos.filter((e) => !e.esEjemplo);
const disponibles = reales.length > 0 ? reales : eventos;

let ultimoId: string | null = null;

/** Elige un evento al azar, evitando repetir el de la partida anterior. */
export function eventoAlAzar(): Evento {
  const opciones = disponibles.length > 1 ? disponibles.filter((e) => e.id !== ultimoId) : disponibles;
  return opciones[Math.floor(Math.random() * opciones.length)];
}

export function iniciarPartida(evento: Evento = eventoAlAzar()) {
  ultimoId = evento.id;
  reiniciarBots();
  const horasPronosticadas = Math.max(8, Math.round(evento.horasPronosticadas));
  const margenHoras = Math.min(7, Math.max(1, Math.round(evento.margenHoras || 7)));
  // La tormenta se activa de forma aleatoria entre 7 y 0 horas antes de que el contador llegue a 0.
  const adelanto = Math.floor(Math.random() * (margenHoras + 1));
  const horasReales = Math.max(1, horasPronosticadas - adelanto);
  store.dispatch({
    type: 'INICIAR_PARTIDA',
    eventoId: evento.id,
    pronostico: {
      horasPronosticadas,
      margenHoras,
      horasReales,
    },
  });
}

export function abandonarPartida() {
  reiniciarBots();
  store.dispatch({ type: 'ABANDONAR_PARTIDA' });
}
