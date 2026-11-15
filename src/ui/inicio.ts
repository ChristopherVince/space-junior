// Pantalla de inicio (#32, #42, #46, #47): portada estilo ilustración marciana con
// el astronauta saludando, título SPACE JUNIOR, subtítulo CHAPEA y los 3 botones
// apilados (Jugar / Play, Cómo jugar / How to play, Datos reales de NASA / Real NASA data).
import { getIdioma, setIdioma, t } from '../i18n';
import { iniciarPartida } from '../state/partida';
import { store } from '../state/store';
import type { ControlFuentes } from './fuentes';

function svgInsigniaEstrella(): string {
  return `
    <svg class="inicio__insignia" viewBox="0 0 56 56" width="52" height="52" aria-hidden="true">
      <rect x="3" y="3" width="50" height="50" rx="15" fill="rgba(255, 245, 235, 0.12)" stroke="rgba(255, 245, 235, 0.88)" stroke-width="2.6" />
      <g stroke="#fff8f0" stroke-width="2.5" stroke-linecap="round">
        <line x1="28" y1="13" x2="28" y2="43" />
        <line x1="13" y1="28" x2="43" y2="28" />
        <line x1="18" y1="18" x2="38" y2="38" />
        <line x1="38" y1="18" x2="18" y2="38" />
      </g>
      <circle cx="28" cy="28" r="2.6" fill="#fff8f0" />
    </svg>
  `;
}

function svgPaisajeFondo(): string {
  return `
    <svg class="inicio__paisaje" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="cieloPortada" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#c37a5e" />
          <stop offset="48%" stop-color="#df9778" />
          <stop offset="100%" stop-color="#f2b899" />
        </linearGradient>
        <linearGradient id="sueloPortada" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e39472" />
          <stop offset="100%" stop-color="#cf7b59" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#cieloPortada)" />
      <!-- Montañas y rocas lejanas izquierda -->
      <polygon points="0,585 95,485 185,515 245,595 0,610" fill="#bd6d50" opacity="0.88" />
      <polygon points="95,485 185,515 148,590 70,585" fill="#a85c41" opacity="0.85" />
      <polygon points="180,555 245,520 305,565 295,605 165,605" fill="#c7785b" opacity="0.9" />
      <!-- Montañas y rocas lejanas derecha -->
      <polygon points="940,565 1075,455 1145,470 1200,545 1200,615 920,615" fill="#c8795b" opacity="0.85" />
      <polygon points="1075,455 1145,470 1110,590 1015,585" fill="#b16246" opacity="0.85" />
      <polygon points="1095,535 1178,492 1200,515 1200,610 1070,610" fill="#a2553a" opacity="0.9" />
      <!-- Suelo marciano -->
      <path d="M0,585 Q340,565 650,580 T1200,572 L1200,720 L0,720 Z" fill="url(#sueloPortada)" />
    </svg>
  `;
}

function svgAstronautaPortada(): string {
  return `
    <svg class="inicio__astronauta-svg" viewBox="0 0 460 520" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="cascoLuz" x1="0.15" y1="0.1" x2="0.85" y2="0.9">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="65%" stop-color="#f5ece4" />
          <stop offset="100%" stop-color="#dfc9b8" />
        </linearGradient>
        <linearGradient id="visorGrad" x1="0.2" y1="0.1" x2="0.8" y2="0.95">
          <stop offset="0%" stop-color="#1e4976" />
          <stop offset="55%" stop-color="#102c4c" />
          <stop offset="100%" stop-color="#091b32" />
        </linearGradient>
        <linearGradient id="azulTraje" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5882c4" />
          <stop offset="100%" stop-color="#355b99" />
        </linearGradient>
        <linearGradient id="amarilloDetalle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffd25a" />
          <stop offset="100%" stop-color="#f2a92c" />
        </linearGradient>
      </defs>

      <!-- Rocas decorativas alrededor del pedestal -->
      <g transform="translate(36, 404)">
        <polygon points="12,52 30,14 68,10 88,36 78,60 18,62" fill="#c97455" />
        <polygon points="30,14 68,10 56,42 18,46" fill="#db8869" />
        <polygon points="68,10 88,36 78,60 56,42" fill="#ab5a3e" />
      </g>
      <g transform="translate(348, 422)">
        <polygon points="6,36 22,12 52,14 62,34 50,44 12,44" fill="#c97455" />
        <polygon points="22,12 52,14 42,30 14,30" fill="#df8d6e" />
      </g>

      <!-- Pedestal de roca marciana -->
      <ellipse cx="235" cy="482" rx="148" ry="22" fill="#b86446" opacity="0.55" />
      <polygon points="96,476 126,444 338,444 372,476 340,492 122,492" fill="#e59876" />
      <polygon points="96,476 126,444 235,452 215,492 122,492" fill="#eeaa8a" />
      <polygon points="235,452 338,444 372,476 340,492 215,492" fill="#cf7d5c" />
      <ellipse cx="232" cy="448" rx="95" ry="14" fill="#c47353" opacity="0.45" />

      <!-- Mochila de soporte vital (detrás del torso) -->
      <rect x="134" y="232" width="62" height="106" rx="18" fill="#dfd0c3" stroke="#cbb8a8" stroke-width="2" />
      <rect x="142" y="242" width="36" height="86" rx="12" fill="#efe4da" />

      <!-- Brazo derecho (saludando hacia afuera a la derecha) -->
      <g transform="rotate(42 286 268)">
        <rect x="272" y="192" width="50" height="90" rx="25" fill="url(#cascoLuz)" />
        <!-- Guante azul saludando -->
        <ellipse cx="297" cy="182" rx="27" ry="25" fill="url(#azulTraje)" />
        <ellipse cx="277" cy="188" rx="11" ry="14" transform="rotate(-28 277 188)" fill="url(#azulTraje)" />
        <ellipse cx="292" cy="172" rx="11" ry="6.5" fill="#7aa2df" opacity="0.45" />
      </g>

      <!-- Pierna izquierda -->
      <rect x="166" y="346" width="56" height="86" rx="22" fill="url(#cascoLuz)" />
      <rect x="166" y="384" width="56" height="14" rx="4" fill="url(#amarilloDetalle)" />
      <!-- Pierna derecha -->
      <rect x="234" y="346" width="56" height="86" rx="22" fill="url(#cascoLuz)" />
      <rect x="234" y="384" width="56" height="14" rx="4" fill="url(#amarilloDetalle)" />

      <!-- Botas azules -->
      <path d="M154,432 C154,408 224,408 224,432 L226,448 C226,455 152,455 152,448 Z" fill="url(#azulTraje)" />
      <rect x="150" y="444" width="78" height="11" rx="5.5" fill="#29487a" />
      <path d="M230,432 C230,408 300,408 300,432 L302,448 C302,455 228,455 228,448 Z" fill="url(#azulTraje)" />
      <rect x="226" y="444" width="78" height="11" rx="5.5" fill="#29487a" />

      <!-- Torso del traje -->
      <rect x="162" y="236" width="132" height="128" rx="44" fill="url(#cascoLuz)" />
      <!-- Franja amarilla en cintura -->
      <rect x="174" y="298" width="108" height="14" rx="6" fill="url(#amarilloDetalle)" />
      <!-- Arnés y cinturón azul -->
      <path d="M182,240 L198,240 L204,332 L184,332 Z" fill="url(#azulTraje)" />
      <path d="M258,240 L274,240 L272,332 L252,332 Z" fill="url(#azulTraje)" />
      <rect x="172" y="314" width="112" height="20" rx="9" fill="url(#azulTraje)" />

      <!-- Módulo pectoral blanco con estrella dorada -->
      <rect x="202" y="256" width="68" height="62" rx="14" fill="#fffaf5" stroke="#dfd0c2" stroke-width="3" />
      <g stroke="#f4b333" stroke-width="2.6" stroke-linecap="round">
        <line x1="236" y1="271" x2="236" y2="303" />
        <line x1="220" y1="287" x2="252" y2="287" />
        <line x1="226" y1="277" x2="246" y2="297" />
        <line x1="246" y1="277" x2="226" y2="297" />
      </g>

      <!-- Brazo izquierdo (abajo junto al cuerpo) -->
      <g transform="rotate(14 162 268)">
        <rect x="128" y="246" width="50" height="86" rx="25" fill="url(#cascoLuz)" />
        <ellipse cx="153" cy="336" rx="26" ry="24" fill="url(#azulTraje)" />
        <ellipse cx="169" cy="332" rx="10" ry="12" fill="#2c4d82" />
      </g>

      <!-- Casco redondeado 3D -->
      <!-- Orejeras amarillas -->
      <rect x="102" y="132" width="32" height="62" rx="16" fill="#f3e6da" stroke="#decab8" stroke-width="2" />
      <ellipse cx="112" cy="163" rx="10" ry="22" fill="url(#amarilloDetalle)" />
      <rect x="322" y="132" width="32" height="62" rx="16" fill="#f3e6da" stroke="#decab8" stroke-width="2" />
      <ellipse cx="344" cy="163" rx="10" ry="22" fill="url(#amarilloDetalle)" />

      <!-- Esfera principal del casco -->
      <rect x="118" y="48" width="220" height="198" rx="98" fill="url(#cascoLuz)" />
      <!-- Reborde interior del visor -->
      <rect x="142" y="74" width="178" height="148" rx="72" fill="#e5d5c6" />
      <!-- Visor azul oscuro -->
      <rect x="148" y="80" width="166" height="136" rx="66" fill="url(#visorGrad)" />
      <!-- Brillo cristalino superior izquierdo del visor -->
      <ellipse cx="192" cy="112" rx="26" ry="13" transform="rotate(-26 192 112)" fill="#8ec5fc" opacity="0.52" />
      <circle cx="170" cy="132" r="5" fill="#8ec5fc" opacity="0.4" />
      <!-- Ojos blancos luminosos del astronauta -->
      <rect x="214" y="132" width="15" height="34" rx="7.5" fill="#ffffff" />
      <rect x="258" y="130" width="15" height="34" rx="7.5" fill="#ffffff" />
    </svg>
  `;
}

export function montarInicio(raiz: HTMLElement, fuentes?: ControlFuentes) {
  const pantalla = document.createElement('div');
  pantalla.className = 'inicio';
  raiz.append(pantalla);

  let mostrarAyuda = false;
  let ultimaFase = store.getState().fase;

  const pintar = () => {
    const idioma = getIdioma();
    pantalla.innerHTML = `
      <div class="inicio__escena" role="dialog" aria-labelledby="inicio-titulo">
        ${svgPaisajeFondo()}

        <div class="inicio__idiomas" role="group" aria-label="${t('inicio.idioma')}">
          <button type="button" class="inicio__idioma ${idioma === 'es' ? 'inicio__idioma--activo' : ''}" data-idioma="es" aria-pressed="${idioma === 'es'}">ES</button>
          <button type="button" class="inicio__idioma ${idioma === 'en' ? 'inicio__idioma--activo' : ''}" data-idioma="en" aria-pressed="${idioma === 'en'}">EN</button>
        </div>

        <div class="inicio__contenido">
          <div class="inicio__columna-izq">
            ${svgInsigniaEstrella()}

            <h1 id="inicio-titulo" class="inicio__titulo" aria-label="${t('inicio.titulo')}">
              <span class="inicio__titulo-blanco">${t('inicio.tituloLinea1')}</span>
              <span class="inicio__titulo-amarillo">${t('inicio.tituloLinea2')}</span>
            </h1>

            <p class="inicio__subtitulo">${t('inicio.subtituloChapea')}</p>

            <div class="inicio__acciones">
              <button type="button" class="inicio__pill inicio__pill--jugar" data-accion="jugar">
                <span class="inicio__pill-icono" aria-hidden="true">▶</span>
                <span>${t('inicio.jugar')}</span>
              </button>
              <button type="button" class="inicio__pill inicio__pill--secundario" data-accion="ayuda" aria-expanded="${mostrarAyuda}">
                <span class="inicio__pill-icono" aria-hidden="true">
                  <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2.5 4.5h5a2.5 2.5 0 0 1 2.5 2.5v9a2 2 0 0 0-2-2h-5.5z" />
                    <path d="M17.5 4.5h-5a2.5 2.5 0 0 0-2.5 2.5v9a2 2 0 0 1 2-2h5.5z" />
                  </svg>
                </span>
                <span>${mostrarAyuda ? t('inicio.ocultarAyuda') : t('inicio.comoJugar')}</span>
              </button>
              <button type="button" class="inicio__pill inicio__pill--secundario" data-accion="fuentes" aria-haspopup="dialog">
                <span class="inicio__pill-icono" aria-hidden="true">⚙</span>
                <span>${t('fuentes.abrir')}</span>
              </button>
            </div>

            ${
              mostrarAyuda
                ? `<div class="inicio__ayuda-caja">
                    <p class="inicio__honestidad"><strong>🛰️ ${t('inicio.honestidadTitulo')}:</strong> ${t('inicio.honestidad')}</p>
                    <ol class="inicio__pasos">
                      <li>${t('inicio.paso1')}</li>
                      <li>${t('inicio.paso2')}</li>
                      <li>${t('inicio.paso3')}</li>
                      <li>${t('inicio.paso4')}</li>
                    </ol>
                  </div>`
                : ''
            }
          </div>

          <div class="inicio__columna-der">
            ${svgAstronautaPortada()}
          </div>
        </div>
      </div>
    `;
  };

  pantalla.addEventListener('click', (ev) => {
    const boton = (ev.target as HTMLElement).closest('button');
    if (!boton) return;

    const idioma = boton.dataset.idioma;
    if (idioma === 'es' || idioma === 'en') {
      setIdioma(idioma);
      document.documentElement.lang = idioma;
      store.dispatch({ type: 'PAUSAR', pausado: store.getState().pausado });
      pintar();
      return;
    }

    if (boton.dataset.accion === 'ayuda') {
      mostrarAyuda = !mostrarAyuda;
      pintar();
      return;
    }

    if (boton.dataset.accion === 'fuentes') {
      fuentes?.abrir(boton);
      return;
    }

    if (boton.dataset.accion === 'jugar') {
      pantalla.hidden = true;
      iniciarPartida();
    }
  });

  store.subscribe((estado) => {
    const visible = estado.fase === 'aviso';
    pantalla.hidden = !visible;
    if (visible && ultimaFase !== 'aviso') {
      mostrarAyuda = false;
      pintar();
    }
    ultimaFase = estado.fase;
  });

  pantalla.hidden = store.getState().fase !== 'aviso';
  pintar();
}
