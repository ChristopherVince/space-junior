import eventos from '../data/events.json';
import { getIdioma, t } from '../i18n';
import { store } from '../state/store';
import type { CrewId, GameState } from '../state/types';
import './reporte.css';

const FUENTE_CURIOSITY = 'https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/';
const TRIPULACION: CrewId[] = ['comandante', 'ingeniero', 'medico', 'cientifico'];

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

function numero(valor: number): string {
  return new Intl.NumberFormat(getIdioma(), { maximumFractionDigits: 2 }).format(valor);
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

    const panel = document.createElement('div');
    panel.className = 'reporte-panel';
    const titulo = texto('h1', t(estado.motivoFin === 'sinSoporteVital' ? 'reporte.sinSoporteVital' : 'reporte.titulo'));
    titulo.id = 'reporte-titulo';
    panel.append(titulo, texto('p', t('reporte.dosisIntro')));

    const lista = document.createElement('ul');
    lista.className = 'reporte-tripulacion';
    for (const id of TRIPULACION) {
      const dosis = estado.tripulacion[id]?.dosis;
      lista.append(texto('li', t('reporte.dosisTripulante', {
        rol: t(`reporte.rol.${id}`),
        dosis: typeof dosis === 'number' && Number.isFinite(dosis) && dosis >= 0 ? numero(dosis) : t('reporte.desconocido'),
        referencia: numero(8100),
      })));
    }
    panel.append(lista, texto('p', t('reporte.curiosity')));

    const evento = eventos.eventos.find((item) => item.id === estado.eventoId);
    if (evento && evento.esEjemplo === false && Number.isFinite(evento.horasPronosticadas) && Number.isFinite(evento.horasReales)) {
      const error = Math.abs(evento.horasReales - evento.horasPronosticadas);
      panel.append(texto('p', t('reporte.pronostico', { fecha: evento.fecha, horas: numero(error) })));
    } else {
      panel.append(texto('p', t('reporte.pronosticoNoDisponible')));
    }
    panel.append(texto('h2', t('reporte.proximaVez')), texto('p', t('reporte.consejo')));

    const fuentes = document.createElement('p');
    fuentes.append(document.createTextNode(t('reporte.fuentes') + ' '));
    const curiosity = enlace(FUENTE_CURIOSITY, t('reporte.fuenteCuriosity'));
    if (curiosity) fuentes.append(curiosity);
    const fuenteEvento = evento && evento.esEjemplo === false ? enlace(evento.fuente, t('reporte.fuentePronostico')) : null;
    if (fuenteEvento) fuentes.append(document.createTextNode(' · '), fuenteEvento);
    panel.append(fuentes);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = t('reporte.repetir');
    boton.addEventListener('click', () => window.location.reload());
    panel.append(boton);
    pantalla.append(panel);
    titulo.tabIndex = -1;
    titulo.focus();
  }

  const desuscribir = store.subscribe(pintar);
  pintar(store.getState());
  return () => { desuscribir(); pantalla.remove(); };
}
