// TODO(Frente 3: interfaz): barras, aviso de tormenta y diálogo de los bots.
// La interfaz es HTML encima del canvas de Phaser; solo lee el estado y despacha acciones.
import { t } from '../i18n';
import { store } from '../state/store';
import type { GameState } from '../state/types';

export function montarHud(raiz: HTMLElement) {
  const hud = document.createElement('div');
  hud.className = 'hud';
  const dialogo = document.createElement('div');
  dialogo.className = 'dialogo';
  raiz.append(hud, dialogo);

  const pintar = (e: GameState) => {
    const p = e.pronostico;
    hud.innerHTML = `
      <span>${t('hud.energia')}: ${e.recursos.energia}</span>
      <span>${t('hud.soporteVital')}: ${e.recursos.soporteVital}</span>
      <span>${t('hud.blindaje')}: ${e.recursos.blindaje}</span>
      ${p ? `<span class="alerta">${t('hud.tormenta', { horas: p.horasPronosticadas - e.hora, margen: p.margenHoras })}</span>` : ''}
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
