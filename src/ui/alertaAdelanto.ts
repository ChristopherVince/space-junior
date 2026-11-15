// Aviso gigante cuando la tormenta llega ANTES de lo que decía el pronóstico.
// Pausa el juego hasta que el niño lo cierra y luego todos corren al refugio.
import { getIdioma, t } from '../i18n';
import { store } from '../state/store';
import type { GameState } from '../state/types';
import './alertaAdelanto.css';

/** Horas de adelanto respecto al pronóstico (0 si llegó a tiempo o tarde). */
export function horasDeAdelanto(e: GameState): number {
  if (!e.pronostico || e.horaInicioTormenta === null) return 0;
  return Math.max(0, e.pronostico.horasPronosticadas - e.horaInicioTormenta);
}

export function montarAlertaAdelanto(raiz: HTMLElement): () => void {
  const fondo = document.createElement('div');
  fondo.className = 'alerta-adelanto';
  fondo.hidden = true;
  raiz.append(fondo);

  let pausadoPorAlerta = false;
  let faseAnterior = store.getState().fase;

  const cerrar = () => {
    if (fondo.hidden) return;
    fondo.hidden = true;
    if (pausadoPorAlerta) {
      pausadoPorAlerta = false;
      if (store.getState().fase === 'tormenta') store.dispatch({ type: 'PAUSAR', pausado: false });
    }
  };

  const mostrar = (e: GameState, adelanto: number, huboAlerta: boolean) => {
    const numero = new Intl.NumberFormat(getIdioma(), { maximumFractionDigits: 1 });
    fondo.replaceChildren();
    const tarjeta = document.createElement('div');
    tarjeta.className = 'alerta-adelanto__tarjeta';
    tarjeta.setAttribute('role', 'alertdialog');
    tarjeta.setAttribute('aria-modal', 'true');
    tarjeta.setAttribute('aria-labelledby', 'alerta-adelanto-titulo');
    tarjeta.setAttribute('aria-describedby', 'alerta-adelanto-texto');

    const icono = document.createElement('div');
    icono.className = 'alerta-adelanto__icono';
    icono.setAttribute('aria-hidden', 'true');
    icono.textContent = '☀️';

    const titulo = document.createElement('h2');
    titulo.id = 'alerta-adelanto-titulo';
    titulo.className = 'alerta-adelanto__titulo';
    titulo.textContent = t('adelanto.titulo');

    const horas = document.createElement('p');
    horas.className = 'alerta-adelanto__horas';
    horas.textContent = t('adelanto.horas', { horas: numero.format(adelanto) });

    const texto = document.createElement('p');
    texto.id = 'alerta-adelanto-texto';
    texto.className = 'alerta-adelanto__texto';
    texto.textContent = t('adelanto.texto', { pronostico: numero.format(e.pronostico?.horasPronosticadas ?? 0) });

    const nota = document.createElement('p');
    nota.className = 'alerta-adelanto__nota';
    nota.textContent = t(huboAlerta ? 'adelanto.conAlerta' : 'adelanto.sinAlerta');

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'alerta-adelanto__boton';
    boton.textContent = t('adelanto.boton');
    boton.addEventListener('click', cerrar);

    tarjeta.append(icono, titulo, horas, texto, nota, boton);
    fondo.append(tarjeta);
    fondo.hidden = false;

    if (!e.pausado) {
      pausadoPorAlerta = true;
      queueMicrotask(() => store.dispatch({ type: 'PAUSAR', pausado: true }));
    }
    boton.focus();
  };

  const desuscribir = store.subscribe((e) => {
    const anterior = faseAnterior;
    faseAnterior = e.fase;
    if (e.fase === 'aviso' || e.fase === 'reporte') {
      pausadoPorAlerta = false;
      fondo.hidden = true;
      return;
    }
    if (e.fase === 'tormenta' && anterior !== 'tormenta') {
      const adelanto = horasDeAdelanto(e);
      if (adelanto >= 1) mostrar(e, adelanto, anterior === 'refugio');
    }
  });

  const alTeclear = (ev: KeyboardEvent) => {
    if (!fondo.hidden && (ev.key === 'Escape' || ev.key === 'Enter')) { ev.preventDefault(); ev.stopPropagation(); cerrar(); }
  };
  window.addEventListener('keydown', alTeclear, true);

  return () => { desuscribir(); window.removeEventListener('keydown', alTeclear, true); fondo.remove(); };
}
