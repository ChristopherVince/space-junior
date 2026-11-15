// Frente 3 · HUD: cápsula central de recursos, aviso de tormenta arriba a la derecha
// y botones laterales estáticos de referencia.
import balance from '../data/balance.json';
import { t } from '../i18n';
import { store } from '../state/store';
import type { CrewId, GameState } from '../state/types';
import { montarPanelModulo } from './panelModulo';

type BotId = Exclude<CrewId, 'comandante'>;

const COLOR_BOT: Record<BotId, { primario: string; secundario: string }> = {
  cientifico: { primario: '#d98a3c', secundario: '#78b856' },
  ingeniero: { primario: '#e2a32b', secundario: '#4895d9' },
  medico: { primario: '#d9534f', secundario: '#f08a78' },
};

const INSIGNIA_BOT: Record<BotId, string> = {
  cientifico: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff8f0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31l-4.89 8.15A2 2 0 0 0 6.83 20.5h10.34a2 2 0 0 0 1.72-3.04L14 9.31V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>`,
  ingeniero: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff8f0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  medico: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff8f0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
};

function retratoBot(quien: BotId): string {
  const c = COLOR_BOT[quien];
  return `
    <svg viewBox="0 0 96 96" width="84" height="84" aria-hidden="true">
      <defs>
        <linearGradient id="visor-${quien}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2c4c7e"/>
          <stop offset="100%" stop-color="#152642"/>
        </linearGradient>
      </defs>
      <!-- Fondo circular suave -->
      <circle cx="48" cy="48" r="44" fill="#f2d6c1" stroke="#fff8f0" stroke-width="3"/>
      <!-- Mochila espacial -->
      <rect x="22" y="42" width="52" height="36" rx="10" fill="#d9cfc5"/>
      <!-- Orejeras del casco con el color del bot -->
      <rect x="13" y="34" width="10" height="18" rx="5" fill="${c.primario}"/>
      <rect x="73" y="34" width="10" height="18" rx="5" fill="${c.primario}"/>
      <!-- Traje / torso -->
      <path d="M22 86 C22 66, 74 66, 74 86 Z" fill="#f7f4ef" stroke="#d5c7b8" stroke-width="2"/>
      <rect x="34" y="70" width="28" height="14" rx="4" fill="${c.secundario}" opacity="0.9"/>
      <circle cx="48" cy="77" r="3.5" fill="#fff8f0"/>
      <!-- Casco redondeado -->
      <rect x="20" y="16" width="56" height="50" rx="25" fill="#fbf9f5" stroke="#ded2c5" stroke-width="2"/>
      <!-- Franja superior del color del bot -->
      <path d="M36 17 Q48 14 60 17 L57 24 Q48 22 39 24 Z" fill="${c.primario}"/>
      <!-- Visor azul espacial -->
      <rect x="27" y="26" width="42" height="30" rx="15" fill="url(#visor-${quien})" stroke="#d5c7b8" stroke-width="2"/>
      <!-- Brillo del visor -->
      <ellipse cx="36" cy="33" rx="6" ry="3" transform="rotate(-18 36 33)" fill="#ffffff" opacity="0.45"/>
      <!-- Ojos amigables en el visor -->
      <rect x="37" y="38" width="5" height="9" rx="2.5" fill="#e6f4ff"/>
      <rect x="54" y="38" width="5" height="9" rx="2.5" fill="#e6f4ff"/>
    </svg>`;
}

const UMBRAL_BAJO = 30;

const ICONOS_RECURSO: Record<string, string> = {
  energia: `<svg viewBox="0 0 24 24" width="26" height="26" fill="#f7c844"><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"/></svg>`,
  soporte: `<svg viewBox="0 0 24 24" width="26" height="26" fill="#68c964"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>`,
  blindaje: `<svg viewBox="0 0 24 24" width="26" height="26" fill="#3daee9"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91c4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.13-2.8 7.99-6 9.03V4.18z"/></svg>`,
};

const ICONO_CAPAS = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>`;
const ICONO_TAREAS = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/></svg>`;
const ICONO_TRIPULACION = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const ICONO_REGISTRO = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;

/** Un chip de recurso dentro de la cápsula central: icono a la izq + (% y barra) a la der */
function chip(clase: 'energia' | 'soporte' | 'blindaje', labelKey: string, pct: number): string {
  const bajo = pct < UMBRAL_BAJO;
  return `
    <div class="hud-chip ${bajo ? 'hud-chip--bajo' : ''}" title="${t(labelKey)}: ${pct}%">
      <span class="hud-chip__icono" aria-hidden="true">${ICONOS_RECURSO[clase]}</span>
      <div class="hud-chip__info">
        <div class="hud-chip__fila-texto">
          <span class="hud-chip__pct">${pct}%</span>
          ${bajo ? `<span class="hud-chip__bajo">${t('hud.bajo')}</span>` : ''}
        </div>
        <div class="hud-chip__pista" role="progressbar" aria-label="${t(labelKey)}" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="hud-chip__relleno hud-chip__relleno--${clase} ${bajo ? 'hud-chip__relleno--bajo' : ''}"
               style="width:${pct}%"></div>
        </div>
      </div>
    </div>`;
}

/** Píldora de aviso de tormenta en la esquina superior derecha */
function avisoTormenta(e: GameState): string {
  const p = e.pronostico;
  if (!p) return '';
  if (e.fase === 'tormenta') {
    return `
      <div class="hud-tormenta hud-tormenta--activa">
        <span class="hud-tormenta__icono" aria-hidden="true">${ICONO_CAPAS}</span>
        <span>${t('hud.tormentaActiva')}</span>
      </div>`;
  }
  if (e.fase === 'refugio') {
    return `
      <div class="hud-tormenta hud-tormenta--refugio">
        <span class="hud-tormenta__icono" aria-hidden="true">${ICONO_CAPAS}</span>
        <span>${t('hud.refugio')}</span>
      </div>`;
  }

  const restantes = Math.max(0, Number((p.horasPronosticadas - e.hora).toFixed(1)));
  const margen = Number(p.margenHoras.toFixed(0));
  const franjaPct = Math.min(100, Math.max(0, ((p.horasPronosticadas - e.hora) / p.horasPronosticadas) * 100));

  return `
    <div class="hud-tormenta hud-tormenta--aviso">
      <span class="hud-tormenta__icono" aria-hidden="true">${ICONO_CAPAS}</span>
      <div class="hud-tormenta__contenido">
        <span class="hud-tormenta__texto">${t('hud.tormenta', { horas: restantes, margen })}</span>
        <div class="hud-tormenta__pista">
          <div class="hud-tormenta__franja" style="width:${franjaPct}%"></div>
        </div>
      </div>
    </div>`;
}

/** Menú lateral derecho estático (Módulos, Tareas, Tripulación, Registro) */
function menuLateralEstatico(): string {
  return `
    <aside class="hud-menu-lateral" aria-label="Menú de base">
      <div class="hud-menu-btn">
        <span class="hud-menu-btn__icono">${ICONO_CAPAS}</span>
        <span class="hud-menu-btn__texto">${t('hud.menu.modulos')}</span>
      </div>
      <div class="hud-menu-btn">
        <span class="hud-menu-btn__icono">${ICONO_TAREAS}</span>
        <span class="hud-menu-btn__texto">${t('hud.menu.tareas')}</span>
      </div>
      <div class="hud-menu-btn">
        <span class="hud-menu-btn__icono">${ICONO_TRIPULACION}</span>
        <span class="hud-menu-btn__texto">${t('hud.menu.tripulacion')}</span>
      </div>
      <div class="hud-menu-btn">
        <span class="hud-menu-btn__icono">${ICONO_REGISTRO}</span>
        <span class="hud-menu-btn__texto">${t('hud.menu.registro')}</span>
      </div>
    </aside>`;
}

export function montarHud(raiz: HTMLElement) {
  const hud = document.createElement('div');
  hud.className = 'hud';
  const dialogo = document.createElement('div');
  dialogo.className = 'dialogo';
  dialogo.hidden = true;
  raiz.append(hud, dialogo);
  montarPanelModulo(raiz);

  const pintar = (e: GameState) => {
    const pctEn = Math.round((e.recursos.energia / balance.energiaPorSol) * 100);
    const pctSV = Math.round(e.recursos.soporteVital);
    const pctBl = Math.round(e.recursos.blindaje);

    hud.innerHTML = `
      <div class="hud-centro">
        <div class="hud-dia">
          <span class="hud-dia__estrella" aria-hidden="true">✦</span>
          <span>${t('hud.dia')} ${e.sol}</span>
        </div>
        <div class="hud-capsula">
          ${chip('energia',  'hud.energia',      pctEn)}
          ${chip('soporte',  'hud.soporteVital', pctSV)}
          ${chip('blindaje', 'hud.blindaje',     pctBl)}
        </div>
      </div>
      <div class="hud-derecha-arriba">
        ${avisoTormenta(e)}
      </div>
      ${menuLateralEstatico()}
    `;

    const botEnLugarDelComandante =
      e.peticionActiva &&
      e.peticionActiva.de !== 'comandante' &&
      e.tripulacion[e.peticionActiva.de].modulo === e.tripulacion.comandante.modulo;

    if (e.peticionActiva && e.peticionActiva.de !== 'comandante' && botEnLugarDelComandante) {
      const quien = e.peticionActiva.de;
      const color = COLOR_BOT[quien];
      dialogo.hidden = false;
      dialogo.innerHTML = `
        <div class="dialogo__retrato" style="--bot-color:${color.primario}">
          ${retratoBot(quien)}
        </div>
        <div class="dialogo__cuerpo">
          <div class="dialogo__encabezado">
            <span class="dialogo__medalla" style="background:${color.primario}">
              ${INSIGNIA_BOT[quien]}
            </span>
            <b class="dialogo__rol">${t(`rol.${quien}`)}</b>
          </div>
          <p class="dialogo__texto">${t(e.peticionActiva.textoId)}</p>
          <div class="dialogo__acciones">
            <button type="button" class="dialogo__btn dialogo__btn--si" data-r="si">
              <span class="dialogo__btn-icono" aria-hidden="true">⚡</span>
              <span>${t('dialogo.aceptar')}</span>
            </button>
            <button type="button" class="dialogo__btn dialogo__btn--no" data-r="no">
              <span class="dialogo__btn-icono" aria-hidden="true">✕</span>
              <span>${t('dialogo.rechazar')}</span>
            </button>
          </div>
        </div>
      `;
    } else {
      dialogo.hidden = true;
    }
  };

  dialogo.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-r]');
    const r = btn?.dataset.r;
    if (r) store.dispatch({ type: 'RESOLVER_PETICION', aceptada: r === 'si' });
  });

  store.subscribe(pintar);
  pintar(store.getState());
}
