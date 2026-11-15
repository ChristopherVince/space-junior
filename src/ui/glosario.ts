import { getIdioma, t } from '../i18n';
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

const vistos = new Set<Termino>();
let temporizador: number | undefined;
let aviso: HTMLElement | null = null;
let revision: number | undefined;

function cerrar() {
  if (temporizador !== undefined) window.clearTimeout(temporizador);
  aviso?.remove();
  aviso = null;
  temporizador = undefined;
  programar();
}

function mostrar(elemento: HTMLElement, termino: Termino) {
  if (aviso) { window.clearTimeout(temporizador); aviso.remove(); }
  vistos.add(termino);
  const ventana = document.createElement('div');
  ventana.className = 'glosario-aviso';
  if (document.querySelector('.dialogo:not([hidden])')) ventana.classList.add('glosario-aviso--dialogo');
  ventana.setAttribute('role', 'status');
  ventana.textContent = t(`glosario.${termino}`);
  ventana.addEventListener('click', cerrar);
  (elemento.closest('dialog[open]') ?? document.body).append(ventana);
  const ancho = ventana.offsetWidth;
  const alto = ventana.offsetHeight;
  const obstaculos = Array.from(document.querySelectorAll<HTMLElement>('button:not(.glosario-termino), .dialogo:not([hidden])'))
    .filter(visible).map((nodo) => nodo.getBoundingClientRect());
  const candidatos = [
    [12, innerHeight - alto - 12], [innerWidth - ancho - 12, innerHeight - alto - 12],
    [12, 12], [innerWidth - ancho - 12, 12],
    [12, (innerHeight - alto) / 2], [innerWidth - ancho - 12, (innerHeight - alto) / 2],
  ];
  const areaSolapada = ([x, y]: number[]) => obstaculos.reduce((area, caja) =>
    area + Math.max(0, Math.min(x + ancho, caja.right) - Math.max(x, caja.left)) *
    Math.max(0, Math.min(y + alto, caja.bottom) - Math.max(y, caja.top)), 0);
  candidatos.sort((a, b) => areaSolapada(a) - areaSolapada(b));
  ventana.style.left = `${Math.max(0, candidatos[0][0])}px`;
  ventana.style.top = `${Math.max(0, candidatos[0][1])}px`;
  ventana.style.bottom = 'auto';
  ventana.style.transform = 'none';
  aviso = ventana;
  temporizador = window.setTimeout(cerrar, 7000);
}

function marcar(raiz: HTMLElement) {
  const caminante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const textos: Text[] = [];
  while (caminante.nextNode()) textos.push(caminante.currentNode as Text);
  for (const nodo of textos) {
    const padre = nodo.parentElement;
    if (!padre || padre.closest('button, a, svg, script, style, .glosario-termino, .glosario-aviso')) continue;
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

function revisar() {
  revision = undefined;
  const raiz = document.getElementById('interfaz');
  if (!raiz) return;
  marcar(raiz);
  if (aviso) return;
  for (const termino of raiz.querySelectorAll<HTMLElement>('.glosario-termino')) {
    const clave = termino.dataset.termino as Termino;
    if (!vistos.has(clave) && visible(termino)) { mostrar(termino, clave); break; }
  }
}

function programar() {
  if (revision === undefined) revision = window.requestAnimationFrame(revisar);
}

export function montarGlosario(raiz: HTMLElement) {
  raiz.addEventListener('click', (evento) => {
    const boton = (evento.target as HTMLElement).closest<HTMLElement>('.glosario-termino');
    if (!boton) return;
    evento.stopPropagation();
    mostrar(boton, boton.dataset.termino as Termino);
  }, true);
  const observador = new MutationObserver(programar);
  observador.observe(raiz, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'open'] });
  window.addEventListener('scroll', programar, true);
  programar();
}
