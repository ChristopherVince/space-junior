// Pantalla final: resultado de un vistazo (estrellas), radiación de cada
// tripulante con barras y contadores animados, comparación que un niño entienda
// (días normales en Marte), la curva real de Curiosity y consejos según lo que hizo.
import curiosityDatos from '../data/curiosity_mayo2024.json';
import eventos from '../data/events.json';
import { getIdioma, t } from '../i18n';
import { abandonarPartida } from '../state/partida';
import { analizarPartida, DOSIS_DIA_NORMAL, type Resultado } from '../state/resultado';
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

function graficaCuriosity(): HTMLElement {
  const figura = document.createElement('figure');
  figura.className = 'reporte-grafica';
  const leyenda = document.createElement('figcaption');
  leyenda.textContent = t('reporte.graficaTitulo');
  figura.append(leyenda);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 640 210');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', t('reporte.graficaAccesible'));
  const datos = curiosityDatos.curvaHoraria;
  const maximo = Math.max(...datos.map((p) => p.tasaMicrograyPorHora ?? 0), 1);
  const limite = Math.ceil(maximo / 50) * 50;
  const y = (valor: number) => 165 - valor / limite * 140;
  for (let tick = 0; tick <= limite; tick += 50) {
    const linea = document.createElementNS(ns, 'line');
    linea.setAttribute('x1', '50'); linea.setAttribute('x2', '625');
    linea.setAttribute('y1', String(y(tick))); linea.setAttribute('y2', String(y(tick)));
    linea.setAttribute('class', 'reporte-grafica-rejilla'); svg.append(linea);
    const etiqueta = document.createElementNS(ns, 'text');
    etiqueta.setAttribute('x', '44'); etiqueta.setAttribute('y', String(y(tick) + 4));
    etiqueta.setAttribute('text-anchor', 'end'); etiqueta.textContent = numero(tick); svg.append(etiqueta);
  }
  let segmento: string[] = [];
  function cerrarSegmento() {
    if (!segmento.length) return;
    const trazo = document.createElementNS(ns, 'polyline');
    trazo.setAttribute('points', segmento.join(' '));
    trazo.setAttribute('class', 'reporte-grafica-linea');
    // pathLength = 1 permite animar el trazo dibujándose, sin medir su longitud.
    trazo.setAttribute('pathLength', '1');
    svg.append(trazo); segmento = [];
  }
  datos.forEach((p, indice) => {
    if (p.tasaMicrograyPorHora === null) { cerrarSegmento(); return; }
    segmento.push(`${50 + indice / (datos.length - 1) * 575},${y(p.tasaMicrograyPorHora)}`);
  });
  cerrarSegmento();
  [19, 20, 21, 22].forEach((dia, indice) => {
    const etiqueta = document.createElementNS(ns, 'text');
    etiqueta.setAttribute('x', String(50 + indice * 24 / (datos.length - 1) * 575));
    etiqueta.setAttribute('y', '187'); etiqueta.setAttribute('text-anchor', 'middle');
    etiqueta.textContent = `${dia}/05`; svg.append(etiqueta);
  });
  figura.append(svg, texto('p', t('reporte.graficaNota')));
  return figura;
}

function lineaPronostico(estado: GameState): HTMLElement {
  const evento = eventos.eventos.find((item) => item.id === estado.eventoId);
  if (!evento || evento.esEjemplo !== false || !Number.isFinite(evento.horasPronosticadas) || !Number.isFinite(evento.horasReales)) {
    return texto('p', t('reporte.pronosticoNoDisponible'));
  }
  const diferencia = evento.horasReales - evento.horasPronosticadas;
  const horas = numero(Math.abs(diferencia), 1);
  const clave = Math.abs(diferencia) < 1
    ? 'reporte.pronosticoExacto'
    : diferencia < 0 ? 'reporte.pronosticoAntes' : 'reporte.pronosticoDespues';
  return texto('p', t(clave, { horas, fecha: evento.fecha }), 'reporte-pronostico');
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

    // 3. Lo que pasó de verdad
    panel.append(texto('h2', t('reporte.deVerdad')), lineaPronostico(estado), texto('p', t('reporte.curiosity')), graficaCuriosity());

    // 4. Consejos según lo que hizo
    panel.append(texto('h2', t('reporte.proximaVez')));
    const consejos = document.createElement('ul');
    consejos.className = 'reporte-consejos';
    for (const c of resultado.consejos) consejos.append(texto('li', t(c.clave, c.vars)));
    panel.append(consejos);

    // 5. Fuentes y volver a jugar
    const fuentes = document.createElement('p');
    fuentes.className = 'reporte-fuentes';
    fuentes.append(document.createTextNode(t('reporte.fuentes') + ' '));
    const curiosity = enlace(FUENTE_CURIOSITY, t('reporte.fuenteCuriosity'));
    if (curiosity) fuentes.append(curiosity);
    const evento = eventos.eventos.find((item) => item.id === estado.eventoId);
    const fuenteEvento = evento && evento.esEjemplo === false ? enlace(evento.fuente, t('reporte.fuentePronostico')) : null;
    if (fuenteEvento) fuentes.append(document.createTextNode(' · '), fuenteEvento);
    panel.append(fuentes);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = t('reporte.repetir');
    boton.addEventListener('click', () => abandonarPartida());
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

  const desuscribir = store.subscribe(pintar);
  pintar(store.getState());
  return () => { desuscribir(); pantalla.remove(); };
}
