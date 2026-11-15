// Reloj del juego: cada `segundosRealesPorHora` avanza una hora de juego.
// Se detiene si el juego está en pausa, si hay una petición de un bot abierta,
// si la partida no ha empezado (fase 'aviso', pantalla de inicio), si terminó
// o si alguna parte de la interfaz lo retiene (por ejemplo, la guía del primer sol).
import balance from '../data/balance.json';
import { store } from './store';

// Motivos que detienen solo el reloj, sin pausar el juego: a diferencia de
// PAUSAR, el comandante puede seguir caminando y la escena sigue animada.
const retenciones = new Set<string>();

export function retenerReloj(motivo: string, activo: boolean) {
  if (activo) retenciones.add(motivo);
  else retenciones.delete(motivo);
}

export function iniciarReloj(alAvanzar?: () => void): () => void {
  const id = window.setInterval(() => {
    const e = store.getState();
    if (e.pausado || e.peticionActiva || e.fase === 'aviso' || e.fase === 'reporte') return;
    if (retenciones.size > 0) return;
    store.dispatch({ type: 'AVANZAR_HORAS', horas: 1 });
    alAvanzar?.();
  }, balance.segundosRealesPorHora * 1000);
  return () => window.clearInterval(id);
}
