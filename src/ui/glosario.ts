// Glosario: subraya palabras difíciles en toda la interfaz para que el niño las
// toque y vea su significado en una ventana centrada que pausa el juego.
//
// Para no cortar el juego a cada rato, la ventana sale SOLA solo:
// - mientras se prepara la base (no en la portada ni durante la tormenta),
// - con palabras clave, una vez cada una,
// - como máximo 3 veces por partida y con al menos 25 s entre una y otra.
// Tocar una palabra subrayada la muestra siempre.
import { getIdioma, t } from '../i18n';
import { store } from '../state/store';
import type { GameState } from '../state/types';
import './glosario.css';

type Termino = 'sol' | 'tormenta' | 'radiacion' | 'microgray' | 'blindaje' | 'soporte' | 'pronostico' | 'cme' | 'rover';

const patrones: Record<'es' | 'en', [Termino, RegExp][]> = {
  es: [
    ['cme', /eyecci[oó]n(?:es)? de masa coronal|\bCME\b/giu],
    ['tormenta', /tormentas?(?: solar(?:es)?)?/giu],
    ['radiacion', /dosis de radiaci[oó]n|radiaci[oó]n|\bdosis\b/giu],
    ['microgray', /µGy(?:\/h)?|micrograys?/giu],
    ['blindaje', /blindaje/giu], ['soporte', /soporte vital/giu],
    ['pronostico', /pron[oó]sticos?/giu], ['rover', /\bCuriosity\b|\brover\b/giu],
    ['sol', /\bsol(?:es)?\b/gu],
  ],
  en: [
    ['cme', /coronal mass ejections?|\bCME\b/giu], ['tormenta', /(?:solar )?storms?/giu],
    ['radiacion', /radiation dose|radiation|\bdose\b/giu], ['microgray', /µGy(?:\/h)?|micrograys?/giu],
    ['blindaje', /shielding/giu], ['soporte', /life support/giu],
    ['pronostico', /forecasts?/giu], ['rover', /\bCuriosity\b|\brover\b/giu],
    ['sol', /\bsols?\b/gu],
  ],
};

const ICONOS: Record<Termino, string> = {
  sol: '🌗', tormenta: '☀️', radiacion: '☢️', microgray: '📏', blindaje: '🛡️',
  soporte: '🌱', pronostico: '📡', cme: '💥', rover: '🤖',
};

/** Palabras que pueden explicarse solas (las demás, solo al tocarlas). */
const TERMINOS_AUTO: ReadonlySet<Termino> = new Set(['tormenta', 'blindaje', 'soporte', 'radiacion', 'pronostico']);
const MAX_AUTO_POR_PARTIDA = 3;
const ESPERA_AUTO_MS = 25_000;
const FASES_DE_JUEGO: ReadonlySet<GameState['fase']> = new Set(['preparacion', 'refugio', 'tormenta']);

const vistos = new Set<Termino>();
let autoEnPartida = 0;
let ultimoAuto = -Infinity;
let modal: HTMLElement | null = null;
let pausadoPorGlosario = false;
let revision: number | undefined;

function hayOtraVentanaAbierta(): boolean {
  return Boolean(document.querySelector(
    '.dialogo:not([hidden]), dialog[open], .hud-panel-lateral:not([hidden]), .panel-modulo:not([hidden]), .guia:not([hidden]), .reporte:not([hidden])',
  ));
}

function cerrar() {
  if (!modal) return;
  modal.remove();
  modal = null;
  // La espera hasta el siguiente aviso automático cuenta desde que se cierra este.
  ultimoAuto = performance.now();
  if (pausadoPorGlosario) {
    pausadoPorGlosario = false;
    if (FASES_DE_JUEGO.has(store.getState().fase)) store.dispatch({ type: 'PAUSAR', pausado: false });
  }
  programar();
}

function mostrar(origen: HTMLElement, termino: Termino) {
  if (modal) cerrar();
  vistos.add(termino);

  // Pausa el juego mientras el niño lee (solo si estaba corriendo).
  const e = store.getState();
  if (FASES_DE_JUEGO.has(e.fase) && !e.pausado) {
    pausadoPorGlosario = true;
    store.dispatch({ type: 'PAUSAR', pausado: true });
  }

  const fondo = document.createElement('div');
  fondo.className = 'glosario-modal';
  const tarjeta = document.createElement('div');
  tarjeta.className = 'glosario-tarjeta';
  tarjeta.setAttribute('role', 'dialog');
  tarjeta.setAttribute('aria-modal', 'true');
  tarjeta.setAttribute('aria-labelledby', 'glosario-titulo');

  const icono = document.createElement('div');
  icono.className = 'glosario-tarjeta__icono';
  icono.setAttribute('aria-hidden', 'true');
  icono.textContent = ICONOS[termino];
  const antetitulo = document.createElement('p');
  antetitulo.className = 'glosario-tarjeta__antetitulo';
  antetitulo.textContent = t('glosario.queSignifica');
  const titulo = document.createElement('h2');
  titulo.id = 'glosario-titulo';
  titulo.className = 'glosario-tarjeta__titulo';
  const palabra = origen.textContent?.trim() || termino;
  titulo.textContent = palabra.charAt(0).toLocaleUpperCase(getIdioma()) + palabra.slice(1);
  const texto = document.createElement('p');
  texto.className = 'glosario-tarjeta__texto';
  texto.textContent = t(`glosario.${termino}`);
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'glosario-tarjeta__boton';
  boton.textContent = t('glosario.entendido');
  boton.addEventListener('click', cerrar);

  tarjeta.append(icono, antetitulo, titulo, texto, boton);
  fondo.append(tarjeta);
  fondo.addEventListener('click', (ev) => { if (ev.target === fondo) cerrar(); });
  // Dentro de un <dialog> abierto (fuentes, pausa) para quedar por encima de él.
  (origen.closest('dialog[open]') ?? document.body).append(fondo);
  modal = fondo;
  boton.focus();
}

function marcar(raiz: HTMLElement) {
  const caminante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const textos: Text[] = [];
  while (caminante.nextNode()) textos.push(caminante.currentNode as Text);
  for (const nodo of textos) {
    const padre = nodo.parentElement;
    if (!padre || padre.closest('button, a, svg, script, style, .glosario-termino, .glosario-modal')) continue;
    const texto = nodo.data;
    const coincidencias: { inicio: number; fin: number; termino: Termino }[] = [];
    for (const [termino, patron] of patrones[getIdioma()]) {
      patron.lastIndex = 0;
      for (const match of texto.matchAll(patron)) {
        const inicio = match.index;
        const fin = inicio + match[0].length;
        if (!coincidencias.some((c) => inicio < c.fin && fin > c.inicio)) coincidencias.push({ inicio, fin, termino });
      }
    }
    if (!coincidencias.length) continue;
    coincidencias.sort((a, b) => a.inicio - b.inicio);
    const fragmento = document.createDocumentFragment();
    let posicion = 0;
    for (const c of coincidencias) {
      fragmento.append(document.createTextNode(texto.slice(posicion, c.inicio)));
      const boton = document.createElement('button');
      boton.type = 'button'; boton.className = 'glosario-termino'; boton.dataset.termino = c.termino;
      boton.textContent = texto.slice(c.inicio, c.fin);
      boton.title = t('glosario.tocaParaVer');
      fragmento.append(boton); posicion = c.fin;
    }
    fragmento.append(document.createTextNode(texto.slice(posicion)));
    nodo.replaceWith(fragmento);
  }
}

function visible(elemento: HTMLElement): boolean {
  if (!elemento.isConnected || elemento.closest('[hidden], dialog:not([open])')) return false;
  const caja = elemento.getBoundingClientRect();
  if (!caja.width || !caja.height || caja.bottom <= 0 || caja.top >= innerHeight || caja.right <= 0 || caja.left >= innerWidth) return false;
  const x = Math.min(innerWidth - 1, Math.max(0, caja.left + caja.width / 2));
  const y = Math.min(innerHeight - 1, Math.max(0, caja.top + caja.height / 2));
  const arriba = document.elementFromPoint(x, y);
  return arriba === elemento || elemento.contains(arriba);
}

function puedeSalirSolo(e: GameState): boolean {
  return e.fase === 'preparacion' &&
    !e.pausado &&
    !e.peticionActiva &&
    !modal &&
    autoEnPartida < MAX_AUTO_POR_PARTIDA &&
    performance.now() - ultimoAuto >= ESPERA_AUTO_MS &&
    !hayOtraVentanaAbierta();
}

function revisar() {
  revision = undefined;
  const raiz = document.getElementById('interfaz');
  if (!raiz) return;
  marcar(raiz);
  if (!puedeSalirSolo(store.getState())) return;
  for (const termino of raiz.querySelectorAll<HTMLElement>('.glosario-termino')) {
    const clave = termino.dataset.termino as Termino;
    if (TERMINOS_AUTO.has(clave) && !vistos.has(clave) && visible(termino)) {
      autoEnPartida++;
      ultimoAuto = performance.now();
      mostrar(termino, clave);
      break;
    }
  }
}

// Con temporizador y no requestAnimationFrame: si la pestaña no dibuja, igual se revisa.
function programar() {
  if (revision === undefined) revision = window.setTimeout(revisar, 150);
}

export function montarGlosario(raiz: HTMLElement) {
  raiz.addEventListener('click', (evento) => {
    const boton = (evento.target as HTMLElement).closest<HTMLElement>('.glosario-termino');
    if (!boton) return;
    evento.stopPropagation();
    evento.preventDefault();
    mostrar(boton, boton.dataset.termino as Termino);
  }, true);
  window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && modal) { ev.stopPropagation(); cerrar(); } }, true);

  // Una partida nueva vuelve a permitir los avisos automáticos.
  let faseAnterior = store.getState().fase;
  store.subscribe((e) => {
    if (e.fase === 'preparacion' && faseAnterior === 'aviso') {
      autoEnPartida = 0;
      ultimoAuto = performance.now(); // deja jugar unos segundos antes del primero
    }
    if (e.fase === 'aviso' || e.fase === 'reporte') cerrar();
    faseAnterior = e.fase;
  });

  const observador = new MutationObserver(programar);
  observador.observe(raiz, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'open'] });
  window.addEventListener('scroll', programar, true);
  // Revisión periódica: la espera entre avisos vence aunque la pantalla no cambie.
  window.setInterval(programar, 5000);
  programar();
}
