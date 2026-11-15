// Frente 3 · Panel de energía al entrar a un módulo (#12).
// Se muestra cuando el comandante entra a cualquier módulo distinto del pasillo central.
import { t } from '../i18n';
import { store } from '../state/store';
import type { GameState, ModuleId } from '../state/types';

type ModuloConPanel = Exclude<ModuleId, 'pasillo'>;

const ICONOS_MODULO: Record<ModuloConPanel, string> = {
  invernadero: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-8"/><path d="M17 8c0-5-5-5-5-5s0 5 5 5z"/><path d="M7 11c0-5 5-5 5-5s0 5-5 5z"/><path d="M17 14c-4 0-5 3-5 3s1-3-5-3"/></svg>`,
  energia: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  refugio: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  comunicaciones: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>`,
  enfermeria: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
};

export function montarPanelModulo(raiz: HTMLElement) {
  const panel = document.createElement('section');
  panel.className = 'panel-modulo';
  panel.hidden = true;
  raiz.append(panel);

  let avisoSinEnergiaForzado = false;
  let ultimoModulo: ModuleId = store.getState().tripulacion.comandante.modulo;
  let contenidoAnterior = '';

  const pintar = (e: GameState) => {
    const modulo = e.tripulacion.comandante.modulo;

    if (modulo !== ultimoModulo) {
      ultimoModulo = modulo;
      avisoSinEnergiaForzado = false;
    }

    // El pasillo central no tiene panel; tampoco se muestra en la portada ni en el reporte final.
    if ((modulo === 'pasillo' && !e.tareaPendiente) || e.fase === 'reporte' || e.fase === 'aviso') {
      panel.hidden = true;
      return;
    }

    panel.hidden = false;
    const actual = e.energiaAsignada[modulo] ?? 0;
    const libre = e.recursos.energia;
    const sinEnergia = libre <= 0;
    // En alerta o tormenta la energía queda congelada (las reglas también lo impiden).
    const bloqueado = e.fase === 'refugio' || e.fase === 'tormenta';
    panel.classList.toggle('panel-modulo--bloqueado', bloqueado);
    const tarea = e.tareaPendiente;
    const pendiente = tarea ? `<div class="panel-modulo__tarea" role="status">
      <strong>${t('tarea.titulo')}</strong>
      <p>${t('tarea.instruccion', { modulo: t(`modulo.${tarea.modulo}`), unidades: Math.max(0, tarea.energiaObjetivo - (e.energiaAsignada[tarea.modulo] ?? 0)) })}</p>
      ${sinEnergia ? `<p>${t('tarea.sinEnergia')}</p>` : ''}
      <button type="button" data-accion="cancelar">${t('tarea.cancelar')}</button>
    </div>` : '';

    const contenido = `${pendiente}${modulo === 'pasillo' ? '' : `
      <div class="panel-modulo__cabecera">
        <div class="panel-modulo__icono" aria-hidden="true">${ICONOS_MODULO[modulo]}</div>
        <div class="panel-modulo__titulos">
          <span class="panel-modulo__subtitulo">${t('panelModulo.subtitulo')}</span>
          <h3 class="panel-modulo__nombre">${t(`modulo.${modulo}`)}</h3>
        </div>
      </div>

      <p class="panel-modulo__desc">${t(`panelModulo.desc.${modulo}`)}</p>

      <div class="panel-modulo__energia-caja">
        <div class="panel-modulo__energia-info">
          <span class="panel-modulo__energia-label">${t('panelModulo.energiaModulo')}</span>
          <span class="panel-modulo__disponible">${t('panelModulo.disponible', { unidades: libre })}</span>
        </div>

        <div class="panel-modulo__controles">
          <button
            type="button"
            class="panel-modulo__btn panel-modulo__btn--menos"
            data-accion="menos"
            aria-label="${t('panelModulo.quitar')}"
            ${actual <= 0 || bloqueado ? 'disabled' : ''}
          >−</button>

          <div class="panel-modulo__valor" aria-live="polite">
            <span class="panel-modulo__rayo" aria-hidden="true">⚡</span>
            <span class="panel-modulo__numero">${actual}</span>
          </div>

          <button
            type="button"
            class="panel-modulo__btn panel-modulo__btn--mas ${sinEnergia ? 'panel-modulo__btn--agotado' : ''}"
            data-accion="mas"
            aria-label="${t('panelModulo.dar')}"
            ${bloqueado ? 'disabled' : ''}
          >+</button>
        </div>
      </div>

      ${
        bloqueado
          ? `<div class="panel-modulo__bloqueo" role="status">🔒 ${t('panelModulo.bloqueadoTormenta')}</div>`
          : sinEnergia || avisoSinEnergiaForzado
            ? `<div class="panel-modulo__alerta" role="status">${t('panelModulo.sinEnergia')}</div>`
            : ''
      }
    `}`;
    if (contenido !== contenidoAnterior) {
      panel.innerHTML = contenido;
      contenidoAnterior = contenido;
    }
  };

  panel.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-accion]');
    if (!btn) return;

    const e = store.getState();
    const modulo = e.tripulacion.comandante.modulo;
    if (e.fase === 'refugio' || e.fase === 'tormenta') return;
    if (btn.dataset.accion === 'cancelar') {
      store.dispatch({ type: 'CANCELAR_TAREA' });
      return;
    }
    if (modulo === 'pasillo') return;

    const actual = e.energiaAsignada[modulo] ?? 0;
    const accion = btn.dataset.accion;

    if (accion === 'menos' && actual > 0) {
      avisoSinEnergiaForzado = false;
      store.dispatch({ type: 'ASIGNAR_ENERGIA', modulo, unidades: actual - 1 });
    } else if (accion === 'mas') {
      if (e.recursos.energia > 0) {
        avisoSinEnergiaForzado = false;
        store.dispatch({ type: 'ASIGNAR_ENERGIA', modulo, unidades: actual + 1 });
      } else {
        avisoSinEnergiaForzado = true;
        pintar(store.getState());
      }
    }
  });

  store.subscribe(pintar);
  pintar(store.getState());
}
