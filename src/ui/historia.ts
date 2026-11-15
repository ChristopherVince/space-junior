// "¿Qué pasó en realidad?": animación por escenas que se muestra después de la
// puntuación. Dibujos SVG animados con CSS + una frase corta por escena, pensada
// para un niño de ~10 años, con los datos reales de la partida que jugó.
// Flujo: puntuación → esta animación → pantalla de fin.
import curiosityDatos from '../data/curiosity_mayo2024.json';
import eventos from '../data/events.json';
import { getIdioma, t } from '../i18n';
import { DOSIS_DIA_NORMAL, type Resultado } from '../state/resultado';
import type { GameState } from '../state/types';
import './historia.css';

interface Escena {
  id: string;
  dibujo: string;
  titulo: string;
  texto: string;
  duracionMs: number;
}

const numero = (v: number, decimales = 0) =>
  new Intl.NumberFormat(getIdioma(), { maximumFractionDigits: decimales }).format(v);

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// ── Piezas de dibujo reutilizables ──────────────────────────────
const ESTRELLAS = Array.from({ length: 26 }, (_, i) => {
  const x = (i * 97) % 400, y = (i * 53) % 240, r = (i % 3) * 0.4 + 0.6;
  return `<circle class="h-estrella" cx="${x}" cy="${y}" r="${r}" style="animation-delay:${(i % 7) * 0.4}s"/>`;
}).join('');
const ESPACIO = `<rect width="400" height="240" fill="#0b1426"/>${ESTRELLAS}`;
const SOL = (x: number, y: number, r: number) => `
  <g class="h-sol" transform="translate(${x} ${y})">
    <circle r="${r * 1.7}" fill="url(#h-gradBrillo)" class="h-brillo"/>
    <g class="h-rayos">${Array.from({ length: 12 }, (_, i) =>
      `<rect x="-3" y="${-r * 1.45}" width="6" height="${r * 0.35}" rx="3" fill="#f9a03f" transform="rotate(${i * 30})"/>`).join('')}</g>
    <circle r="${r}" fill="url(#h-gradSol)"/>
  </g>`;
const MARTE = (x: number, y: number, r: number) => `
  <g transform="translate(${x} ${y})">
    <circle r="${r}" fill="#c1440e"/>
    <circle cx="${-r * 0.3}" cy="${-r * 0.2}" r="${r * 0.18}" fill="#9a3410"/>
    <circle cx="${r * 0.35}" cy="${r * 0.3}" r="${r * 0.12}" fill="#9a3410"/>
    <ellipse cx="0" cy="${-r * 0.85}" rx="${r * 0.35}" ry="${r * 0.1}" fill="#f5e6da" opacity="0.8"/>
  </g>`;
const TIERRA = (x: number, y: number, r: number) => `
  <g transform="translate(${x} ${y})">
    <circle r="${r}" fill="#2f7fd1"/>
    <path d="M${-r * 0.5} ${-r * 0.4} q${r * 0.3} ${-r * 0.3} ${r * 0.6} 0 t${r * 0.2} ${r * 0.5} -${r * 0.5} ${r * 0.3}z" fill="#5fbf5a"/>
    <path d="M${r * 0.1} ${r * 0.2} q${r * 0.4} 0 ${r * 0.5} ${r * 0.4} t-${r * 0.6} ${r * 0.2}z" fill="#5fbf5a"/>
  </g>`;
const SUELO_MARTE = `
  <rect width="400" height="240" fill="#f3c9a8"/>
  <rect y="0" width="400" height="150" fill="#e9b28a"/>
  <path d="M0 150 Q100 125 200 145 T400 138 V240 H0Z" fill="#c8693a"/>
  <path d="M0 190 Q120 170 260 188 T400 182 V240 H0Z" fill="#a9532b"/>
  <circle cx="60" cy="205" r="6" fill="#8f4322"/><circle cx="330" cy="215" r="9" fill="#8f4322"/>`;
const CURIOSITY = `
  <g class="h-rover" transform="translate(150 150)">
    <rect x="0" y="0" width="70" height="26" rx="5" fill="#f2efe9" stroke="#7b6a5c" stroke-width="2"/>
    <rect x="50" y="-34" width="5" height="36" fill="#7b6a5c"/>
    <rect x="42" y="-44" width="22" height="12" rx="3" fill="#f2efe9" stroke="#7b6a5c" stroke-width="2"/>
    <circle cx="48" cy="-38" r="2.5" fill="#2c4c7e"/><circle cx="58" cy="-38" r="2.5" fill="#2c4c7e"/>
    <rect x="8" y="-8" width="22" height="8" rx="2" fill="#4895d9"/>
    <g fill="#3a2f28">${[8, 35, 62].map((cx) => `<circle cx="${cx}" cy="34" r="9"/><circle cx="${cx}" cy="34" r="3.5" fill="#b8a99a"/>`).join('')}</g>
  </g>`;
const ASTRONAUTA = (x: number, y: number, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-12" y="0" width="24" height="30" rx="8" fill="#f7f4ef" stroke="#d5c7b8" stroke-width="2"/>
    <circle cx="0" cy="-10" r="14" fill="#fbf9f5" stroke="#d5c7b8" stroke-width="2"/>
    <rect x="-9" y="-16" width="18" height="12" rx="6" fill="#2c4c7e"/>
    <rect x="-12" y="28" width="9" height="12" rx="3" fill="#f7f4ef"/><rect x="3" y="28" width="9" height="12" rx="3" fill="#f7f4ef"/>
  </g>`;
const PARTICULAS = (n: number, desdeX: number, hastaX: number, y0: number, alto: number) =>
  Array.from({ length: n }, (_, i) => {
    const y = y0 + ((i * 37) % alto);
    return `<circle class="h-particula" cx="${desdeX}" cy="${y}" r="${2 + (i % 3)}" fill="#ffd56b"
      style="--h-dx:${hastaX - desdeX}px; animation-delay:${(i * 0.23) % 2.4}s; animation-duration:${1.8 + (i % 4) * 0.35}s"/>`;
  }).join('');
const DEFS = `<defs>
  <radialGradient id="h-gradBrillo"><stop offset="45%" stop-color="#ffd56b" stop-opacity="0.55"/><stop offset="100%" stop-color="#ffd56b" stop-opacity="0"/></radialGradient>
  <radialGradient id="h-gradSol"><stop offset="0%" stop-color="#fff3b0"/><stop offset="60%" stop-color="#f9c846"/><stop offset="100%" stop-color="#f2853a"/></radialGradient>
</defs>`;
const svg = (contenido: string, etiqueta: string) =>
  `<svg viewBox="0 0 400 240" role="img" aria-label="${etiqueta}" preserveAspectRatio="xMidYMid meet">${DEFS}${contenido}</svg>`;

// ── Gráfica real de Curiosity (RadLab) que se dibuja sola ──────
function curvaCuriosity(): string {
  const datos = curiosityDatos.curvaHoraria;
  const max = Math.max(...datos.map((p) => p.tasaMicrograyPorHora ?? 0), 1);
  const x = (i: number) => 30 + (i / (datos.length - 1)) * 350;
  const y = (v: number) => 196 - (v / max) * 150;
  const tramos: string[] = [];
  let actual: string[] = [];
  datos.forEach((p, i) => {
    if (p.tasaMicrograyPorHora === null) { if (actual.length) tramos.push(actual.join(' ')); actual = []; return; }
    actual.push(`${x(i).toFixed(1)},${y(p.tasaMicrograyPorHora).toFixed(1)}`);
  });
  if (actual.length) tramos.push(actual.join(' '));
  const yFondo = y(curiosityDatos.fondo.promedioMicrograyPorHora);
  return `
    <rect width="400" height="240" fill="#13203a"/>
    <line x1="30" y1="196" x2="385" y2="196" stroke="#64768a" stroke-width="1.5"/>
    <line x1="30" y1="${yFondo.toFixed(1)}" x2="385" y2="${yFondo.toFixed(1)}" stroke="#7fd0a8" stroke-width="2" stroke-dasharray="6 5"/>
    <rect x="200" y="${(yFondo - 30).toFixed(1)}" width="182" height="22" rx="11" fill="#13203a" stroke="#7fd0a8" stroke-width="1.5"/>
    <text x="291" y="${(yFondo - 14).toFixed(1)}" text-anchor="middle" class="h-etiqueta h-etiqueta--verde">${t('historia.diaNormal')}</text>
    ${tramos.map((p) => `<polyline points="${p}" class="h-curva" pathLength="1"/>`).join('')}
    <text x="${x(datos.findIndex((p) => p.tasaMicrograyPorHora === max)) + 8}" y="44" class="h-etiqueta">${t('historia.pico', { valor: numero(max) })}</text>
    ${[19, 20, 21, 22].map((d, i) => `<text x="${(30 + i * 24 / (datos.length - 1) * 350).toFixed(1)}" y="216" class="h-etiqueta h-etiqueta--gris" text-anchor="middle">${d}/05</text>`).join('')}`;
}

function barras(items: { etiqueta: string; valor: number; clase: string }[], maximo: number): string {
  const ancho = 300;
  return items.map((it, i) => {
    const y = 60 + i * 62;
    const w = Math.max(6, (it.valor / maximo) * ancho);
    return `
      <text x="50" y="${y - 10}" class="h-etiqueta">${it.etiqueta}</text>
      <rect x="50" y="${y}" width="${ancho}" height="26" rx="13" fill="#0b1426"/>
      <rect x="50" y="${y}" width="${w.toFixed(1)}" height="26" rx="13" class="h-barra ${it.clase}" style="animation-delay:${0.4 + i * 0.5}s"/>
      <text x="${50 + ancho}" y="${y - 10}" text-anchor="end" class="h-etiqueta h-valor" style="animation-delay:${0.9 + i * 0.5}s">${numero(it.valor)} µGy</text>`;
  }).join('');
}

// ── Guion ───────────────────────────────────────────────────────
function construirEscenas(estado: GameState, resultado: Resultado): Escena[] {
  const evento = eventos.eventos.find((e) => e.id === estado.eventoId);
  const total = curiosityDatos.evento.dosisTotalMicrogray;
  const veces = Math.round(total / DOSIS_DIA_NORMAL);
  const comandante = resultado.tripulacion[0];

  let textoPronostico = t('historia.pronostico.generico');
  if (evento && evento.esEjemplo === false) {
    const dif = evento.horasReales - evento.horasPronosticadas;
    const clave = Math.abs(dif) < 1 ? 'historia.pronostico.exacto' : dif < 0 ? 'historia.pronostico.antes' : 'historia.pronostico.despues';
    textoPronostico = t(clave, { horas: numero(Math.abs(dif), 1) });
  }

  return [
    {
      id: 'inicio', duracionMs: 5500,
      titulo: t('historia.inicio.titulo'), texto: t('historia.inicio.texto'),
      dibujo: svg(`${ESPACIO}${SOL(80, 120, 38)}${MARTE(320, 130, 26)}
        <path d="M130 120 Q220 70 290 125" stroke="#ffd56b" stroke-width="3" fill="none" stroke-dasharray="8 8" class="h-trazo"/>`, t('historia.inicio.titulo')),
    },
    {
      id: 'sol', duracionMs: 7500,
      titulo: t('historia.sol.titulo'), texto: t('historia.sol.texto'),
      dibujo: svg(`${ESPACIO}${SOL(200, 125, 62)}
        <circle cx="200" cy="125" r="62" fill="none" stroke="#ffb15c" stroke-width="6" class="h-onda"/>
        <circle cx="200" cy="125" r="62" fill="none" stroke="#ffd56b" stroke-width="4" class="h-onda" style="animation-delay:1.2s"/>
        ${PARTICULAS(14, 230, 420, 70, 110)}`, t('historia.sol.titulo')),
    },
    {
      id: 'viaje', duracionMs: 7500,
      titulo: t('historia.viaje.titulo'), texto: t('historia.viaje.texto'),
      dibujo: svg(`${ESPACIO}${SOL(40, 120, 30)}${MARTE(355, 120, 24)}
        ${PARTICULAS(18, 75, 330, 70, 100)}
        <ellipse cx="110" cy="120" rx="34" ry="46" fill="#ffb15c" opacity="0.25" class="h-nube"/>
        <text x="200" y="40" text-anchor="middle" class="h-etiqueta">${t('historia.viaje.minutos')}</text>
        <text x="200" y="222" text-anchor="middle" class="h-etiqueta h-etiqueta--naranja">${t('historia.viaje.dias')}</text>`, t('historia.viaje.titulo')),
    },
    {
      id: 'pronostico', duracionMs: 8500,
      titulo: t('historia.pronostico.titulo'), texto: textoPronostico,
      dibujo: svg(`${ESPACIO}${TIERRA(85, 120, 48)}
        <g transform="translate(85 70)"><rect x="-3" y="-28" width="6" height="28" fill="#c9d3e0"/><path d="M-16 -30 Q0 -44 16 -30" stroke="#c9d3e0" stroke-width="4" fill="none"/>
          <circle r="4" cy="-30" fill="#ffd56b" class="h-parpadeo"/></g>
        <g transform="translate(285 115)">
          <circle r="62" fill="#fff8ef" stroke="#f2853a" stroke-width="6"/>
          ${Array.from({ length: 12 }, (_, i) => `<rect x="-2" y="-56" width="4" height="10" fill="#b4521e" transform="rotate(${i * 30})"/>`).join('')}
          <rect x="-3" y="-44" width="6" height="46" rx="3" fill="#3f2417" class="h-aguja"/>
          <circle r="7" fill="#3f2417"/>
          <text y="90" text-anchor="middle" class="h-etiqueta h-signo">?</text>
        </g>`, t('historia.pronostico.titulo')),
    },
    {
      id: 'marte', duracionMs: 8000,
      titulo: t('historia.marte.titulo'), texto: t('historia.marte.texto'),
      dibujo: svg(`${SUELO_MARTE}
        ${Array.from({ length: 16 }, (_, i) => `<line x1="${20 + i * 24}" y1="-20" x2="${10 + i * 24}" y2="0" stroke="#ffd56b" stroke-width="3" stroke-linecap="round" class="h-lluvia" style="animation-delay:${(i * 0.17) % 1.4}s"/>`).join('')}
        ${CURIOSITY}
        <circle cx="205" cy="106" r="16" fill="none" stroke="#ffd56b" stroke-width="3" class="h-onda h-onda--chica"/>`, t('historia.marte.titulo')),
    },
    {
      id: 'medicion', duracionMs: 9500,
      titulo: t('historia.medicion.titulo'),
      texto: t('historia.medicion.texto', { veces: numero(veces) }),
      dibujo: svg(curvaCuriosity(), t('reporte.graficaAccesible')),
    },
    {
      id: 'comparacion', duracionMs: 7500,
      titulo: t('historia.comparacion.titulo', { veces: numero(veces) }),
      texto: t('historia.comparacion.texto', { veces: numero(veces) }),
      dibujo: svg(`<rect width="400" height="240" fill="#13203a"/>${barras([
        { etiqueta: t('historia.diaNormal'), valor: DOSIS_DIA_NORMAL, clase: 'h-barra--verde' },
        { etiqueta: t('historia.laTormenta'), valor: total, clase: 'h-barra--roja' },
      ], total)}`, t('historia.comparacion.titulo', { veces: numero(veces) })),
    },
    {
      id: 'nadie', duracionMs: 8000,
      titulo: t('historia.nadie.titulo'), texto: t('historia.nadie.texto'),
      dibujo: svg(`${SUELO_MARTE}
        <g transform="translate(200 150)">
          <path d="M-90 0 A90 70 0 0 1 90 0Z" fill="#e8e1d8" stroke="#bfb2a3" stroke-width="3"/>
          <path d="M-60 0 A60 46 0 0 1 60 0" fill="none" stroke="#4895d9" stroke-width="10" class="h-escudo"/>
          <rect x="-14" y="-28" width="28" height="28" rx="6" fill="#bfb2a3"/>
        </g>
        ${ASTRONAUTA(110, 132, 0.8)}${ASTRONAUTA(292, 132, 0.8)}
        <text x="200" y="40" text-anchor="middle" class="h-etiqueta h-etiqueta--oscura">${t('historia.nadie.futuro')}</text>`, t('historia.nadie.titulo')),
    },
    {
      id: 'tierra', duracionMs: 8500,
      titulo: t('historia.tierra.titulo'), texto: t('historia.tierra.texto'),
      dibujo: svg(`${ESPACIO}
        ${[60, 85, 110].map((rx, i) => `<ellipse cx="270" cy="120" rx="${rx}" ry="${rx * 0.62}" fill="none" stroke="#7fd0a8" stroke-width="2" opacity="${0.8 - i * 0.2}" class="h-campo" style="animation-delay:${i * 0.4}s"/>`).join('')}
        ${TIERRA(270, 120, 40)}
        ${Array.from({ length: 9 }, (_, i) => `<circle cx="10" cy="${45 + i * 18}" r="3.5" fill="#ffd56b" class="h-rebote" style="animation-delay:${(i * 0.25) % 2}s"/>`).join('')}`, t('historia.tierra.titulo')),
    },
    {
      id: 'tu', duracionMs: 9000,
      titulo: t('historia.tu.titulo'),
      texto: resultado.horasTormenta > 0
        ? t('historia.tu.texto', { dosis: numero(comandante.dosis), dias: numero(comandante.diasNormales, 1), sin: numero(resultado.dosisSinRefugio) })
        : t('historia.tu.sinTormenta'),
      dibujo: svg(`<rect width="400" height="240" fill="#13203a"/>
        <g class="h-estrellas-final">${[0, 1, 2].map((i) => `<text x="${150 + i * 50}" y="48" text-anchor="middle" class="h-estrella-final ${i < resultado.estrellas ? 'h-estrella-final--llena' : ''}" style="animation-delay:${0.2 + i * 0.3}s">★</text>`).join('')}</g>
        <g transform="translate(0 40)">${barras([
          { etiqueta: t('historia.tuTripulacion'), valor: comandante.dosis, clase: 'h-barra--amarilla' },
          { etiqueta: t('reporte.sinRefugio'), valor: resultado.dosisSinRefugio, clase: 'h-barra--roja' },
        ], Math.max(comandante.dosis, resultado.dosisSinRefugio, 1))}</g>`, t('historia.tu.titulo')),
    },
  ];
}

// ── Reproductor ─────────────────────────────────────────────────
export interface OpcionesHistoria {
  alTerminar: () => void;
}

export function mostrarHistoria(contenedor: HTMLElement, estado: GameState, resultado: Resultado, opciones: OpcionesHistoria): () => void {
  const escenas = construirEscenas(estado, resultado);
  const raiz = document.createElement('section');
  raiz.className = 'historia';
  raiz.setAttribute('aria-roledescription', 'presentación');
  raiz.setAttribute('aria-label', t('historia.titulo'));
  if (sinMovimiento()) raiz.classList.add('historia--sin-animacion');

  const progreso = document.createElement('div');
  progreso.className = 'historia__progreso';
  const segmentos = escenas.map(() => {
    const s = document.createElement('div');
    s.className = 'historia__segmento';
    const r = document.createElement('div');
    r.className = 'historia__segmento-relleno';
    s.append(r);
    progreso.append(s);
    return r;
  });

  const lienzo = document.createElement('div');
  lienzo.className = 'historia__lienzo';
  const titulo = document.createElement('h2');
  titulo.className = 'historia__titulo';
  const texto = document.createElement('p');
  texto.className = 'historia__texto';
  texto.setAttribute('aria-live', 'polite');

  const controles = document.createElement('div');
  controles.className = 'historia__controles';
  const boton = (clase: string, contenido: string, etiqueta: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `historia__btn ${clase}`;
    b.textContent = contenido;
    b.setAttribute('aria-label', etiqueta);
    b.title = etiqueta;
    return b;
  };
  const btnAnterior = boton('', '◀', t('historia.anterior'));
  const btnPausa = boton('historia__btn--grande', '⏸', t('historia.pausar'));
  const btnSiguiente = boton('', '▶', t('historia.siguiente'));
  const puedeHablar = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const btnVoz = boton('historia__btn--voz', '🔇', t('historia.escuchar'));
  const btnSaltar = boton('historia__btn--saltar', t('historia.saltar'), t('historia.saltar'));
  controles.append(btnAnterior, btnPausa, btnSiguiente);
  if (puedeHablar) controles.append(btnVoz);
  controles.append(btnSaltar);

  raiz.append(progreso, lienzo, titulo, texto, controles);
  contenedor.append(raiz);

  let indice = 0;
  let pausado = false;
  let conVoz = false;
  let restanteMs = 0;
  let inicioMs = 0;
  let temporizador: number | undefined;
  let terminado = false;

  const hablar = () => {
    if (!puedeHablar) return;
    window.speechSynthesis.cancel();
    if (!conVoz) return;
    const e = escenas[indice];
    const voz = new SpeechSynthesisUtterance(`${e.titulo}. ${e.texto}`);
    voz.lang = getIdioma() === 'es' ? 'es-MX' : 'en-US';
    voz.rate = 0.95;
    window.speechSynthesis.speak(voz);
  };

  const pintarSegmentos = () => {
    segmentos.forEach((s, i) => {
      s.style.transition = 'none';
      s.style.width = i < indice ? '100%' : '0%';
    });
  };

  const animarSegmento = () => {
    const s = segmentos[indice];
    s.style.transition = 'none';
    const hecho = 1 - restanteMs / escenas[indice].duracionMs;
    s.style.width = `${hecho * 100}%`;
    void s.offsetWidth;
    s.style.transition = `width ${restanteMs}ms linear`;
    s.style.width = '100%';
  };

  const programar = () => {
    if (temporizador !== undefined) window.clearTimeout(temporizador);
    inicioMs = performance.now();
    temporizador = window.setTimeout(siguiente, restanteMs);
    animarSegmento();
  };

  const mostrar = (i: number) => {
    indice = Math.max(0, Math.min(escenas.length - 1, i));
    const e = escenas[indice];
    lienzo.innerHTML = e.dibujo; // SVG generado aquí; solo números y textos propios
    lienzo.dataset.escena = e.id;
    titulo.textContent = e.titulo;
    texto.textContent = e.texto;
    raiz.classList.remove('historia--entra');
    void raiz.offsetWidth;
    raiz.classList.add('historia--entra');
    btnAnterior.disabled = indice === 0;
    pintarSegmentos();
    restanteMs = e.duracionMs;
    if (!pausado) programar();
    hablar();
  };

  function terminar() {
    if (terminado) return;
    terminado = true;
    if (temporizador !== undefined) window.clearTimeout(temporizador);
    if (puedeHablar) window.speechSynthesis.cancel();
    raiz.remove();
    opciones.alTerminar();
  }

  function siguiente() {
    if (indice >= escenas.length - 1) terminar();
    else mostrar(indice + 1);
  }

  const alternarPausa = () => {
    pausado = !pausado;
    raiz.classList.toggle('historia--pausada', pausado);
    btnPausa.textContent = pausado ? '▶' : '⏸';
    btnPausa.setAttribute('aria-label', pausado ? t('historia.continuar') : t('historia.pausar'));
    btnPausa.title = btnPausa.getAttribute('aria-label') ?? '';
    const s = segmentos[indice];
    if (pausado) {
      if (temporizador !== undefined) window.clearTimeout(temporizador);
      restanteMs = Math.max(0, restanteMs - (performance.now() - inicioMs));
      s.style.width = getComputedStyle(s).width;
      s.style.transition = 'none';
      if (puedeHablar) window.speechSynthesis.pause();
    } else {
      programar();
      if (puedeHablar) window.speechSynthesis.resume();
    }
  };

  btnAnterior.addEventListener('click', () => mostrar(indice - 1));
  btnSiguiente.addEventListener('click', siguiente);
  btnPausa.addEventListener('click', alternarPausa);
  btnSaltar.addEventListener('click', terminar);
  btnVoz.addEventListener('click', () => {
    conVoz = !conVoz;
    btnVoz.textContent = conVoz ? '🔊' : '🔇';
    btnVoz.setAttribute('aria-pressed', String(conVoz));
    hablar();
  });
  raiz.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') siguiente();
    else if (ev.key === 'ArrowLeft') mostrar(indice - 1);
    else if (ev.key === ' ') { ev.preventDefault(); alternarPausa(); }
  });

  mostrar(0);
  btnPausa.focus();
  return terminar;
}
