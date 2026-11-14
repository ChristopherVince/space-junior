// Frente 3 · HUD: cápsula central de recursos, aviso de tormenta arriba a la derecha
// y botones laterales estáticos de referencia.
import balance from '../data/balance.json';
import { t } from '../i18n';
import { store } from '../state/store';
import type { GameState } from '../state/types';

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

    if (e.peticionActiva) {
      dialogo.hidden = false;
      dialogo.innerHTML = `
        <b>${t(`rol.${e.peticionActiva.de}`)}</b>
        <p>${t(e.peticionActiva.textoId)}</p>
        <button data-r="si">${t('dialogo.aceptar')}</button>
        <button data-r="no">${t('dialogo.rechazar')}</button>
      `;
    } else {
      dialogo.hidden = true;
    }
  };

  dialogo.addEventListener('click', (ev) => {
    const r = (ev.target as HTMLElement).dataset.r;
    if (r) store.dispatch({ type: 'RESOLVER_PETICION', aceptada: r === 'si' });
  });

  store.subscribe(pintar);
  pintar(store.getState());
}
