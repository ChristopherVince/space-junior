// Globos de aviso de la tripulación: mensajes cortos en momentos clave
// (alerta de tormenta, llegada de la tormenta). No detienen el juego y se van solos.
import { suscribirAvisos, type AvisoTripulacion } from '../bots/bots';
import { t } from '../i18n';
import { store } from '../state/store';
import './avisos.css';

const DURACION_MS = 5500;

export function montarAvisos(raiz: HTMLElement): () => void {
  const globo = document.createElement('div');
  globo.className = 'aviso-tripulacion';
  globo.setAttribute('role', 'status');
  globo.setAttribute('aria-live', 'polite');
  globo.hidden = true;
  raiz.append(globo);

  const cola: AvisoTripulacion[] = [];
  let temporizador: number | undefined;

  function ocultar() {
    globo.hidden = true;
    temporizador = undefined;
    siguiente();
  }

  function siguiente() {
    if (temporizador !== undefined) return;
    const aviso = cola.shift();
    if (!aviso) return;
    globo.replaceChildren();
    const nombre = document.createElement('strong');
    nombre.textContent = t(`rol.${aviso.de}`);
    const texto = document.createElement('span');
    texto.textContent = t(aviso.textoId);
    globo.append(nombre, texto);
    globo.dataset.de = aviso.de;
    globo.hidden = false;
    temporizador = window.setTimeout(ocultar, DURACION_MS);
  }

  globo.addEventListener('click', () => {
    if (temporizador !== undefined) window.clearTimeout(temporizador);
    ocultar();
  });

  const desuscribirAvisos = suscribirAvisos((aviso) => {
    cola.push(aviso);
    siguiente();
  });

  // Al abandonar o terminar la partida, los avisos pendientes ya no tienen sentido.
  const desuscribirEstado = store.subscribe((e) => {
    if (e.fase !== 'aviso' && e.fase !== 'reporte') return;
    cola.length = 0;
    if (temporizador !== undefined) window.clearTimeout(temporizador);
    temporizador = undefined;
    globo.hidden = true;
  });

  return () => {
    desuscribirAvisos();
    desuscribirEstado();
    if (temporizador !== undefined) window.clearTimeout(temporizador);
    globo.remove();
  };
}
