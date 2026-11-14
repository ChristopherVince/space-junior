// Reloj del juego: cada `segundosRealesPorHora` avanza una hora de juego.
// Se detiene si el juego está en pausa, si hay una petición de un bot abierta
// o si la partida terminó.
import balance from '../data/balance.json';
import { store } from './store';

export function iniciarReloj(alAvanzar?: () => void): () => void {
  const id = window.setInterval(() => {
    const e = store.getState();
    if (e.pausado || e.peticionActiva || e.fase === 'reporte') return;
    store.dispatch({ type: 'AVANZAR_HORAS', horas: 1 });
    alAvanzar?.();
  }, balance.segundosRealesPorHora * 1000);
  return () => window.clearInterval(id);
}
