// Frente 3 · HUD: cápsula de recursos estilo referencia (Sol X + barras).
// La interfaz es HTML encima del canvas; solo lee el estado y despacha acciones.
import balance from '../data/balance.json';
import { t } from '../i18n';
import { store } from '../state/store';
import type { GameState } from '../state/types';

const UMBRAL_BAJO = 30;

/** Un chip de recurso: icono + porcentaje + barra fina de color */
function chip(icono: string, pct: number, clase: string): string {
  const bajo = pct < UMBRAL_BAJO;
  return `
    <div class="hud-chip">
      <span class="hud-chip__icono">${icono}</span>
      <span class="hud-chip__pct ${bajo ? 'hud-chip__pct--bajo' : ''}">${pct}%</span>
      <div class="hud-chip__pista">
        <div class="hud-chip__relleno hud-chip__relleno--${clase} ${bajo ? 'hud-chip__relleno--bajo' : ''}"
             style="width:${pct}%"></div>
      </div>
    </div>`;
}

/** Badge de aviso de tormenta; devuelve '' si no hay pronóstico en curso */
function avisoTormenta(e: GameState): string {
  const p = e.pronostico;
  if (!p) return '';
  if (e.fase === 'tormenta') return `<div class="hud-tormenta hud-tormenta--activa">☀️ ${t('hud.tormentaActiva')}</div>`;
  if (e.fase === 'refugio')  return `<div class="hud-tormenta hud-tormenta--refugio">⚠ ${t('hud.refugio')}</div>`;
  const restantes = p.horasPronosticadas - e.hora;
  const min = Math.max(0, Math.round(restantes - p.margenHoras));
  const max = Math.max(0, Math.round(restantes + p.margenHoras));
  return `<div class="hud-tormenta hud-tormenta--aviso">☀️ ${t('hud.tormenta', { min, max })}</div>`;
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
      <div class="hud-capsula">
        <div class="hud-sol">☀ ${t('hud.sol')} ${e.sol}</div>
        ${chip('⚡', pctEn, 'energia')}
        ${chip('🌱', pctSV, 'soporte')}
        ${chip('🛡', pctBl, 'blindaje')}
      </div>
      ${avisoTormenta(e)}
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
