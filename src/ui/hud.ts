// Frente 3 · HUD: cápsula central de recursos, aviso de tormenta arriba a la derecha,
// menú de pausa (#46) y paneles laterales interactivos (#45: Módulos, Tripulación, Registro).
import balance from '../data/balance.json';
import { getIdioma, t } from '../i18n';
import { abandonarPartida } from '../state/partida';
import { store } from '../state/store';
import type { CrewId, GameState, ModuleId } from '../state/types';
import type { ControlFuentes } from './fuentes';
import { montarPanelModulo } from './panelModulo';
import {
  formatearEntradaRegistro,
  iniciarSeguimientoRegistro,
  obtenerEntradasRegistro,
} from './registro';

type BotId = Exclude<CrewId, 'comandante'>;
export type PanelLateralId = 'modulos' | 'tripulacion' | 'registro';

const MODULOS_ORDEN: readonly ModuleId[] = [
  'invernadero',
  'energia',
  'comunicaciones',
  'enfermeria',
  'refugio',
  'pasillo',
];

const TRIPULACION_ORDEN: readonly CrewId[] = ['comandante', 'ingeniero', 'medico', 'cientifico'];

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
      <circle cx="48" cy="48" r="44" fill="#f2d6c1" stroke="#fff8f0" stroke-width="3"/>
      <rect x="22" y="42" width="52" height="36" rx="10" fill="#d9cfc5"/>
      <rect x="13" y="34" width="10" height="18" rx="5" fill="${c.primario}"/>
      <rect x="73" y="34" width="10" height="18" rx="5" fill="${c.primario}"/>
      <path d="M22 86 C22 66, 74 66, 74 86 Z" fill="#f7f4ef" stroke="#d5c7b8" stroke-width="2"/>
      <rect x="34" y="70" width="28" height="14" rx="4" fill="${c.secundario}" opacity="0.9"/>
      <circle cx="48" cy="77" r="3.5" fill="#fff8f0"/>
      <rect x="20" y="16" width="56" height="50" rx="25" fill="#fbf9f5" stroke="#ded2c5" stroke-width="2"/>
      <path d="M36 17 Q48 14 60 17 L57 24 Q48 22 39 24 Z" fill="${c.primario}"/>
      <rect x="27" y="26" width="42" height="30" rx="15" fill="url(#visor-${quien})" stroke="#d5c7b8" stroke-width="2"/>
      <ellipse cx="36" cy="33" rx="6" ry="3" transform="rotate(-18 36 33)" fill="#ffffff" opacity="0.45"/>
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
const ICONO_TRIPULACION = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const ICONO_REGISTRO = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
const ICONO_PAUSA = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;

function chip(clase: 'energia' | 'soporte' | 'blindaje', labelKey: string, pct: number): string {
  const bajo = pct < UMBRAL_BAJO;
  return `
    <div class="hud-chip ${bajo ? 'hud-chip--bajo' : ''}" title="${t(labelKey)}: ${pct}%">
      <span class="hud-chip__icono" aria-hidden="true">${ICONOS_RECURSO[clase]}</span>
      <div class="hud-chip__info">
        <div class="hud-chip__fila-texto">
          <span class="hud-chip__nombre">${t(labelKey)}</span>
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

function renderizarContenidoPanel(panel: PanelLateralId, e: GameState): { titulo: string; cuerpo: string } {
  if (panel === 'modulos') {
    const items = MODULOS_ORDEN.map((id) => {
      const unidades = e.energiaAsignada[id] ?? 0;
      const esPasillo = id === 'pasillo';
      return `
        <li class="hud-panel__item">
          <div class="hud-panel__item-cabecera">
            <strong>${t(`modulo.${id}`)}</strong>
            ${
              esPasillo
                ? ''
                : `<span class="hud-panel__badge">⚡ ${t('panelLateral.modulos.energia', { unidades })}</span>`
            }
          </div>
          <p class="hud-panel__item-desc">${t(`panelModulo.desc.${id}`)}</p>
        </li>`;
    }).join('');
    return {
      titulo: t('panelLateral.modulos.titulo'),
      cuerpo: `<ul class="hud-panel__lista">${items}</ul>`,
    };
  }

  if (panel === 'tripulacion') {
    const fmt = new Intl.NumberFormat(getIdioma(), { maximumFractionDigits: 0 });
    const items = TRIPULACION_ORDEN.map((id) => {
      const m = e.tripulacion[id];
      const dosis = fmt.format(Math.round(m.dosis));
      return `
        <li class="hud-panel__item">
          <div class="hud-panel__item-cabecera">
            <strong>${t(`reporte.rol.${id}`)}</strong>
            <span class="hud-panel__badge">${t('panelLateral.tripulacion.dosis', { dosis })}</span>
          </div>
          <p class="hud-panel__item-desc">${t('panelLateral.tripulacion.ubicacion', { modulo: t(`modulo.${m.modulo}`) })}</p>
        </li>`;
    }).join('');
    return {
      titulo: t('panelLateral.tripulacion.titulo'),
      cuerpo: `<ul class="hud-panel__lista">${items}</ul>`,
    };
  }

  const entradas = obtenerEntradasRegistro();
  if (entradas.length === 0) {
    return {
      titulo: t('panelLateral.registro.titulo'),
      cuerpo: `<p class="hud-panel__vacio">${t('panelLateral.registro.vacio')}</p>`,
    };
  }
  const items = [...entradas]
    .reverse()
    .map(
      (item) => `
      <li class="hud-panel__item">
        <div class="hud-panel__item-cabecera">
          <span class="hud-panel__hora">${t('panelLateral.registro.hora', { sol: item.sol, hora: item.hora })}</span>
        </div>
        <p class="hud-panel__item-desc">${formatearEntradaRegistro(item)}</p>
      </li>`,
    )
    .join('');
  return {
    titulo: t('panelLateral.registro.titulo'),
    cuerpo: `<ul class="hud-panel__lista">${items}</ul>`,
  };
}

export function montarHud(raiz: HTMLElement, fuentes?: ControlFuentes) {
  iniciarSeguimientoRegistro();

  const hud = document.createElement('div');
  hud.className = 'hud';

  const hudEstado = document.createElement('div');
  hudEstado.className = 'hud-estado';

  const btnPausa = document.createElement('button');
  btnPausa.type = 'button';
  btnPausa.className = 'hud-pausa-btn';
  btnPausa.setAttribute('aria-haspopup', 'dialog');

  const menuLateral = document.createElement('aside');
  menuLateral.className = 'hud-menu-lateral';

  const backdropPanel = document.createElement('div');
  backdropPanel.className = 'hud-panel-backdrop';
  backdropPanel.hidden = true;

  const panelLateral = document.createElement('aside');
  panelLateral.className = 'hud-panel-lateral';
  panelLateral.setAttribute('role', 'dialog');
  panelLateral.setAttribute('aria-labelledby', 'hud-panel-titulo');
  panelLateral.hidden = true;

  const dialogo = document.createElement('div');
  dialogo.className = 'dialogo';
  dialogo.hidden = true;

  const modalPausa = document.createElement('dialog');
  modalPausa.className = 'pausa-dialogo';
  modalPausa.setAttribute('aria-labelledby', 'pausa-titulo');

  hud.append(hudEstado, btnPausa, menuLateral, backdropPanel, panelLateral);
  raiz.append(hud, dialogo, modalPausa);
  montarPanelModulo(raiz);

  let panelActivo: PanelLateralId | null = null;
  let estabaPausadoAntesPanel = false;
  let estabaPausadoAntesModal = false;
  let confirmandoAbandono = false;
  let ultimoIdiomaHud = '';
  let ultimoPanelPintado: PanelLateralId | null | undefined = undefined;
  let pausadoPorDialogo = false;

  const pintarMenuLateral = () => {
    ultimoPanelPintado = panelActivo;
    const botones: { id: PanelLateralId; icono: string; clave: string }[] = [
      { id: 'modulos', icono: ICONO_CAPAS, clave: 'hud.menu.modulos' },
      { id: 'tripulacion', icono: ICONO_TRIPULACION, clave: 'hud.menu.tripulacion' },
      { id: 'registro', icono: ICONO_REGISTRO, clave: 'hud.menu.registro' },
    ];
    menuLateral.setAttribute('aria-label', t('hud.titulo'));
    menuLateral.innerHTML = botones
      .map((b) => {
        const activo = panelActivo === b.id;
        return `
          <button
            type="button"
            class="hud-menu-btn ${activo ? 'hud-menu-btn--activo' : ''}"
            data-panel="${b.id}"
            aria-pressed="${activo}"
          >
            <span class="hud-menu-btn__icono" aria-hidden="true">${b.icono}</span>
            <span class="hud-menu-btn__texto">${t(b.clave)}</span>
          </button>`;
      })
      .join('');
  };

  const pintarPanelLateral = (e: GameState) => {
    if (!panelActivo) {
      panelLateral.hidden = true;
      backdropPanel.hidden = true;
      return;
    }
    panelLateral.hidden = false;
    backdropPanel.hidden = false;
    const { titulo, cuerpo } = renderizarContenidoPanel(panelActivo, e);
    panelLateral.innerHTML = `
      <div class="hud-panel__cabecera">
        <h2 id="hud-panel-titulo" class="hud-panel__titulo">${titulo}</h2>
        <button type="button" class="hud-panel__cerrar" data-cerrar-panel="1" aria-label="${t('panelLateral.cerrar')}">✕</button>
      </div>
      <div class="hud-panel__cuerpo">
        ${cuerpo}
      </div>
    `;
  };

  const cerrarPanelLateral = (restaurarPausa = true) => {
    if (!panelActivo) return;
    panelActivo = null;
    panelLateral.hidden = true;
    backdropPanel.hidden = true;
    pintarMenuLateral();
    if (restaurarPausa && !estabaPausadoAntesPanel && !modalPausa.open) {
      store.dispatch({ type: 'PAUSAR', pausado: false });
    }
  };

  const abrirPanelLateral = (id: PanelLateralId) => {
    if (panelActivo === id) {
      cerrarPanelLateral(true);
      return;
    }
    if (!panelActivo) {
      estabaPausadoAntesPanel = store.getState().pausado;
      if (!estabaPausadoAntesPanel) {
        store.dispatch({ type: 'PAUSAR', pausado: true });
      }
    }
    panelActivo = id;
    pintarMenuLateral();
    pintarPanelLateral(store.getState());
  };

  const pintarModalPausa = () => {
    modalPausa.innerHTML = `
      <div class="pausa-dialogo__contenido">
        <h1 id="pausa-titulo" class="pausa-dialogo__titulo">${t('pausa.titulo')}</h1>
        ${
          confirmandoAbandono
            ? `
              <p class="pausa-dialogo__confirmar">${t('pausa.confirmar')}</p>
              <div class="pausa-dialogo__acciones">
                <button type="button" class="dialogo__btn dialogo__btn--si" data-pausa="confirmar-si">${t('pausa.confirmarSi')}</button>
                <button type="button" class="dialogo__btn dialogo__btn--no" data-pausa="confirmar-no">${t('pausa.confirmarNo')}</button>
              </div>
            `
            : `
              <div class="pausa-dialogo__acciones">
                <button type="button" class="dialogo__btn dialogo__btn--si" data-pausa="continuar">${t('pausa.continuar')}</button>
                <button type="button" class="dialogo__btn dialogo__btn--no" data-pausa="fuentes">${t('fuentes.abrir')}</button>
                <button type="button" class="dialogo__btn dialogo__btn--no pausa-dialogo__abandonar" data-pausa="abandonar">${t('pausa.abandonar')}</button>
              </div>
            `
        }
      </div>
    `;
  };

  const abrirModalPausa = () => {
    if (modalPausa.open) return;
    if (panelActivo) {
      cerrarPanelLateral(false);
      estabaPausadoAntesModal = estabaPausadoAntesPanel;
    } else {
      estabaPausadoAntesModal = store.getState().pausado;
    }
    confirmandoAbandono = false;
    pintarModalPausa();
    modalPausa.showModal();
    if (!store.getState().pausado) {
      store.dispatch({ type: 'PAUSAR', pausado: true });
    }
  };

  btnPausa.addEventListener('click', () => abrirModalPausa());

  modalPausa.addEventListener('close', () => {
    confirmandoAbandono = false;
    const fase = store.getState().fase;
    if (fase !== 'aviso' && fase !== 'reporte' && !estabaPausadoAntesModal) {
      store.dispatch({ type: 'PAUSAR', pausado: false });
    }
  });

  modalPausa.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-pausa]');
    if (!btn) return;
    const accion = btn.dataset.pausa;
    if (accion === 'continuar') {
      modalPausa.close();
    } else if (accion === 'fuentes') {
      fuentes?.abrir(btn);
    } else if (accion === 'abandonar') {
      confirmandoAbandono = true;
      pintarModalPausa();
    } else if (accion === 'confirmar-no') {
      confirmandoAbandono = false;
      pintarModalPausa();
    } else if (accion === 'confirmar-si') {
      estabaPausadoAntesModal = false;
      modalPausa.close();
      abandonarPartida();
    }
  });

  menuLateral.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-panel]');
    if (!btn) return;
    const id = btn.dataset.panel as PanelLateralId;
    abrirPanelLateral(id);
  });

  panelLateral.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-cerrar-panel]');
    if (btn) cerrarPanelLateral(true);
  });

  backdropPanel.addEventListener('click', () => cerrarPanelLateral(true));

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && panelActivo && !modalPausa.open && !fuentes?.estaAbierto()) {
      cerrarPanelLateral(true);
    }
  });

  const pintar = (e: GameState) => {
    if (e.fase === 'aviso' || e.fase === 'reporte') {
      hud.hidden = true;
      dialogo.hidden = true;
      pausadoPorDialogo = false;
      if (panelActivo) cerrarPanelLateral(false);
      if (modalPausa.open) modalPausa.close();
      return;
    }

    hud.hidden = false;
    const idiomaActual = getIdioma();
    const idiomaCambio = idiomaActual !== ultimoIdiomaHud;
    if (idiomaCambio) {
      btnPausa.innerHTML = `<span class="hud-pausa-btn__icono" aria-hidden="true">${ICONO_PAUSA}</span><span>${t('pausa.abrir')}</span>`;
      btnPausa.setAttribute('aria-label', t('pausa.abrir'));
    }

    const pctEn = Math.round((e.recursos.energia / balance.energiaPorSol) * 100);
    const pctSV = Math.round(e.recursos.soporteVital);
    const pctBl = Math.round(e.recursos.blindaje);

    hudEstado.innerHTML = `
      <div class="hud-centro">
        <div class="hud-dia">
          <span class="hud-dia__estrella" aria-hidden="true">✦</span>
          <span>${t('hud.dia')} ${e.sol} (${t('glosario.etiquetaSol')})</span>
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
    `;

    if (idiomaCambio || panelActivo !== ultimoPanelPintado) {
      pintarMenuLateral();
    }
    if (panelActivo) pintarPanelLateral(e);
    if (modalPausa.open && idiomaCambio) pintarModalPausa();
    ultimoIdiomaHud = idiomaActual;

    const botEnLugarDelComandante =
      e.peticionActiva &&
      e.peticionActiva.de !== 'comandante' &&
      e.tripulacion[e.peticionActiva.de].modulo === e.tripulacion.comandante.modulo;

    if (e.peticionActiva && e.peticionActiva.de !== 'comandante' && botEnLugarDelComandante) {
      const quien = e.peticionActiva.de;
      const color = COLOR_BOT[quien];
      const recienAbierto = dialogo.hidden;
      dialogo.hidden = false;
      // Pausa el juego mientras el niño lee y decide.
      if (recienAbierto && !e.pausado) {
        pausadoPorDialogo = true;
        queueMicrotask(() => store.dispatch({ type: 'PAUSAR', pausado: true }));
      }
      dialogo.innerHTML = `
        <div class="dialogo__tarjeta" role="dialog" aria-modal="true" aria-labelledby="dialogo-rol">
        <div class="dialogo__retrato" style="--bot-color:${color.primario}">
          ${retratoBot(quien)}
        </div>
        <div class="dialogo__cuerpo">
          <div class="dialogo__encabezado">
            <span class="dialogo__medalla" style="background:${color.primario}">
              ${INSIGNIA_BOT[quien]}
            </span>
            <b class="dialogo__rol" id="dialogo-rol">${t(`rol.${quien}`)}</b>
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
        </div>
      `;
      if (recienAbierto) dialogo.querySelector<HTMLButtonElement>('[data-r="si"]')?.focus();
    } else {
      dialogo.hidden = true;
      if (pausadoPorDialogo) {
        pausadoPorDialogo = false;
        if (e.fase === 'preparacion' || e.fase === 'refugio' || e.fase === 'tormenta') {
          queueMicrotask(() => store.dispatch({ type: 'PAUSAR', pausado: false }));
        }
      }
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
