// Final de la partida en tres pasos: puntuación → animación "¿Qué pasó en realidad?"
// (historia.ts) → pantalla de fin.
// La puntuación muestra estrellas, la radiación de cada tripulante con barras y
// contadores animados, la comparación en días normales en Marte y consejos.
import curiosityDatos from '../data/curiosity_mayo2024.json';
import eventos from '../data/events.json';
import { getIdioma, t } from '../i18n';
import { abandonarPartida, iniciarPartida } from '../state/partida';
import { analizarPartida, DOSIS_DIA_NORMAL, type Resultado } from '../state/resultado';
import { mostrarHistoria } from './historia';
import { store } from '../state/store';
import type { GameState } from '../state/types';
import './reporte.css';

const FUENTE_CURIOSITY = curiosityDatos.fuente;
const DURACION_ANIMACION_MS = 1400;

function texto(tag: string, contenido: string, clase?: string): HTMLElement {
  const elemento = document.createElement(tag);
  elemento.textContent = contenido;
  if (clase) elemento.className = clase;
  return elemento;
}

function enlace(url: string, etiqueta: string): HTMLAnchorElement | null {
  try {
    const destino = new URL(url);
    if (destino.protocol !== 'https:') return null;
    const link = document.createElement('a');
    link.href = destino.href;
    link.textContent = etiqueta;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  } catch {
    return null;
  }
}

function numero(valor: number, decimales = 0): string {
  return new Intl.NumberFormat(getIdioma(), { maximumFractionDigits: decimales }).format(valor);
}

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Cuenta de 0 al valor final en un elemento (usa temporizador, no depende de que la pantalla dibuje). */
function contar(elemento: HTMLElement, final: number, formato: (v: number) => string, retrasoMs: number) {
  if (sinMovimiento()) { elemento.textContent = formato(final); return; }
  elemento.textContent = formato(0);
  const inicio = performance.now() + retrasoMs;
  const id = window.setInterval(() => {
    const avance = Math.min(1, Math.max(0, (performance.now() - inicio) / DURACION_ANIMACION_MS));
    const suave = 1 - (1 - avance) ** 3;
    elemento.textContent = formato(final * suave);
    if (avance >= 1) window.clearInterval(id);
  }, 40);
}

function estrellas(resultado: Resultado): HTMLElement {
  const fila = document.createElement('div');
  fila.className = 'reporte-estrellas';
  fila.setAttribute('role', 'img');
  fila.setAttribute('aria-label', t('reporte.estrellasAccesible', { n: resultado.estrellas }));
  for (let i = 1; i <= 3; i++) {
    const estrella = document.createElement('span');
    estrella.className = `reporte-estrella ${i <= resultado.estrellas ? 'reporte-estrella--llena' : ''}`;
    estrella.style.animationDelay = `${0.15 + i * 0.25}s`;
    estrella.textContent = '★';
    estrella.setAttribute('aria-hidden', 'true');
    fila.append(estrella);
  }
  return fila;
}

function barra(etiqueta: string, dosis: number, maximo: number, detalle: string, clase: string, indice: number): HTMLElement {
  const fila = document.createElement('div');
  fila.className = `reporte-barra ${clase}`;
  const cabecera = document.createElement('div');
  cabecera.className = 'reporte-barra__cabecera';
  const nombre = texto('span', etiqueta, 'reporte-barra__nombre');
  const valor = texto('span', '', 'reporte-barra__valor');
  cabecera.append(nombre, valor);
  const pista = document.createElement('div');
  pista.className = 'reporte-barra__pista';
  const relleno = document.createElement('div');
  relleno.className = 'reporte-barra__relleno';
  const pct = maximo > 0 ? Math.min(100, (dosis / maximo) * 100) : 0;
  const retraso = 0.9 + indice * 0.15;
  relleno.style.transitionDelay = `${retraso}s`;
  relleno.dataset.ancho = `${pct}%`;
  pista.append(relleno);
  fila.append(cabecera, pista, texto('span', detalle, 'reporte-barra__detalle'));
  contar(valor, dosis, (v) => `${numero(v)} µGy`, retraso * 1000);
  return fila;
}

export function montarReporte(raiz: HTMLElement): () => void {
  const pantalla = document.createElement('section');
  pantalla.className = 'reporte';
  pantalla.hidden = true;
  pantalla.setAttribute('aria-labelledby', 'reporte-titulo');
  raiz.append(pantalla);
  let visible = false;

  function pintar(estado: GameState) {
    if (estado.fase !== 'reporte') {
      pantalla.hidden = true;
      visible = false;
      return;
    }
    if (visible) return;
    visible = true;
    pantalla.hidden = false;
    pantalla.replaceChildren();

    const resultado = analizarPartida(estado);
    const panel = document.createElement('div');
    panel.className = 'reporte-panel';
    if (sinMovimiento()) panel.classList.add('reporte-panel--sin-animacion');

    // 1. Resultado de un vistazo
    const titulo = texto('h1', t(resultado.tituloClave));
    titulo.id = 'reporte-titulo';
    panel.append(estrellas(resultado), titulo);

    // 2. Radiación de la tripulación, animada, contra "sin refugio"
    panel.append(texto('h2', t('reporte.tuTripulacion')));
    const barras = document.createElement('div');
    barras.className = 'reporte-barras';
    const maximo = Math.max(resultado.dosisSinRefugio, ...resultado.tripulacion.map((m) => m.dosis), 1);
    resultado.tripulacion.forEach((m, i) => {
      const detalle = m.proteccion === null
        ? t('reporte.dias', { dias: numero(m.diasNormales, 1) })
        : `${t('reporte.protegido', { pct: Math.round(m.proteccion * 100) })} · ${t('reporte.dias', { dias: numero(m.diasNormales, 1) })}`;
      barras.append(barra(t(`reporte.rol.${m.id}`), m.dosis, maximo, detalle, '', i));
    });
    if (resultado.horasTormenta > 0) {
      barras.append(barra(
        t('reporte.sinRefugio'),
        resultado.dosisSinRefugio,
        maximo,
        t('reporte.dias', { dias: numero(resultado.dosisSinRefugio / DOSIS_DIA_NORMAL, 1) }),
        'reporte-barra--referencia',
        resultado.tripulacion.length,
      ));
    }
    panel.append(barras, texto('p', t('reporte.explicaDias', { dia: numero(DOSIS_DIA_NORMAL) }), 'reporte-explica'));

    // 3. Consejos según lo que hizo
    panel.append(texto('h2', t('reporte.proximaVez')));
    const consejos = document.createElement('ul');
    consejos.className = 'reporte-consejos';
    for (const c of resultado.consejos) consejos.append(texto('li', t(c.clave, c.vars)));
    panel.append(consejos);

    // 4. Siguiente paso: la animación de lo que pasó en realidad
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'reporte-ver-historia';
    boton.textContent = t('reporte.verHistoria');
    boton.addEventListener('click', () => {
      mostrarHistoria(pantalla, estado, resultado, { alTerminar: () => mostrarFin(estado, resultado) });
    });
    panel.append(boton);
    pantalla.append(panel);
    pantalla.scrollTop = 0;

    // Las barras crecen después de que el panel entra en pantalla.
    window.setTimeout(() => {
      panel.querySelectorAll<HTMLElement>('.reporte-barra__relleno').forEach((r) => { r.style.width = r.dataset.ancho ?? '0%'; });
    }, 50);

    titulo.tabIndex = -1;
    titulo.focus();
  }

  function mostrarFin(estado: GameState, resultado: Resultado) {
    pantalla.replaceChildren();
    const panel = document.createElement('div');
    panel.className = 'reporte-panel historia-fin';
    const titulo = texto('h1', t('fin.titulo'), 'historia-fin__titulo');
    titulo.id = 'reporte-titulo';
    panel.append(titulo, texto('p', t(resultado.estrellas === 3 ? 'fin.texto3' : 'fin.texto'), 'historia-fin__texto'));

    const acciones = document.createElement('div');
    acciones.className = 'historia-fin__acciones';
    const boton = (clave: string, clase: string, accion: () => void) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = clase;
      b.textContent = t(clave);
      b.addEventListener('click', accion);
      acciones.append(b);
      return b;
    };
    const jugar = boton('reporte.repetir', 'reporte-ver-historia', () => { abandonarPartida(); iniciarPartida(); });
    boton('fin.verOtraVez', 'historia-fin__secundario', () => {
      mostrarHistoria(pantalla, estado, resultado, { alTerminar: () => mostrarFin(estado, resultado) });
    });
    boton('fin.menu', 'historia-fin__secundario', () => abandonarPartida());
    panel.append(acciones);

    const fuentes = document.createElement('p');
    fuentes.className = 'historia-fin__fuentes';
    fuentes.append(document.createTextNode(t('reporte.fuentes') + ' '));
    const curiosity = enlace(FUENTE_CURIOSITY, t('reporte.fuenteCuriosity'));
    if (curiosity) fuentes.append(curiosity);
    const evento = eventos.eventos.find((item) => item.id === estado.eventoId);
    const fuenteEvento = evento && evento.esEjemplo === false ? enlace(evento.fuente, t('reporte.fuentePronostico')) : null;
    if (fuenteEvento) fuentes.append(document.createTextNode(' · '), fuenteEvento);
    panel.append(fuentes);

    pantalla.append(panel);
    pantalla.scrollTop = 0;
    jugar.focus();
  }

  const desuscribir = store.subscribe(pintar);
  pintar(store.getState());
  return () => { desuscribir(); pantalla.remove(); };
}
