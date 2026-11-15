import { t } from '../i18n';
import { retenerReloj } from '../state/reloj';
import { store } from '../state/store';
import type { GameState, ModuleId } from '../state/types';
import './guia.css';

const CLAVE = 'space-junior.guia-completada';
type Paso = 'caminar' | 'invernadero' | 'energia' | 'refugio';
let objetivo: ModuleId | null = null;
const observadores = new Set<(modulo: ModuleId | null) => void>();

export function observarObjetivoGuia(fn: (modulo: ModuleId | null) => void): () => void {
  observadores.add(fn);
  fn(objetivo);
  return () => { observadores.delete(fn); };
}

function cambiarObjetivo(modulo: ModuleId | null) {
  objetivo = modulo;
  observadores.forEach((fn) => fn(modulo));
}

function yaCompletada(): boolean {
  try { return localStorage.getItem(CLAVE) === '1'; } catch { return false; }
}

function guardar() {
  try { localStorage.setItem(CLAVE, '1'); } catch { /* Se conserva solo durante esta sesión. */ }
}

export function montarGuia(raiz: HTMLElement): () => void {
  const panel = document.createElement('section');
  panel.className = 'guia';
  panel.hidden = true;
  panel.setAttribute('aria-label', t('guia.titulo'));
  const titulo = document.createElement('strong');
  const instruccion = document.createElement('p');
  instruccion.setAttribute('aria-live', 'polite');
  const saltar = document.createElement('button');
  saltar.type = 'button';
  panel.append(titulo, instruccion, saltar);
  raiz.append(panel);
  const medir = () => raiz.style.setProperty('--guia-altura', `${panel.offsetHeight}px`);
  const observadorTamano = new ResizeObserver(medir);
  observadorTamano.observe(panel);

  let completada = yaCompletada();
  let activa = false;
  let paso: Paso = 'caminar';
  let anteriorFase = store.getState().fase;

  function pintar() {
    titulo.textContent = t('guia.titulo');
    instruccion.textContent = t(`guia.${paso}`);
    saltar.textContent = t('guia.saltar');
  }

  // Oculta la guía y suelta el reloj. Solo se marca como completada si el
  // jugador la terminó o la saltó; si abandona la partida, se repite la próxima vez.
  function cerrar(marcarCompletada: boolean) {
    if (!activa) return;
    activa = false;
    if (marcarCompletada) {
      completada = true;
      guardar();
    }
    panel.hidden = true;
    raiz.classList.remove('guia-activa');
    cambiarObjetivo(null);
    retenerReloj('guia', false);
  }
  const terminar = () => cerrar(true);

  saltar.addEventListener('click', terminar);

  function actualizar(e: GameState) {
    const inicio = anteriorFase === 'aviso' && e.fase === 'preparacion';
    anteriorFase = e.fase;
    if (inicio && !completada) {
      activa = true;
      paso = 'caminar';
      panel.hidden = false;
      raiz.classList.add('guia-activa');
      cambiarObjetivo('invernadero');
      pintar();
      medir();
      // Detiene solo el reloj: con PAUSAR el comandante no podría caminar
      // y el primer paso de la guía sería imposible.
      retenerReloj('guia', true);
      return;
    }
    if (!activa) return;
    if (e.fase === 'aviso') { cerrar(false); return; } // abandonó la partida
    if (e.fase === 'reporte') { terminar(); return; }
    const modulo = e.tripulacion.comandante.modulo;
    if (paso === 'caminar' && modulo === 'invernadero') {
      paso = 'invernadero';
    }
    if (paso === 'invernadero' && (e.energiaAsignada.invernadero ?? 0) >= 4) {
      paso = 'energia';
      cambiarObjetivo('energia');
    }
    if (paso === 'energia' && (e.energiaAsignada.energia ?? 0) >= 2) {
      paso = 'refugio';
      cambiarObjetivo('refugio');
    }
    if (paso === 'refugio' && modulo === 'refugio') { terminar(); return; }
    pintar();
  }

  const desuscribir = store.subscribe(actualizar);
  return () => { terminar(); desuscribir(); observadorTamano.disconnect(); raiz.style.removeProperty('--guia-altura'); panel.remove(); };
}
