import { getIdioma, t } from '../i18n';
import { store } from '../state/store';
import './fuentes.css';

const FUENTES = [
  { clave: 'donki', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/' },
  { clave: 'scoreboard', url: 'https://ccmc.gsfc.nasa.gov/scoreboards/cme/earth/' },
  { clave: 'curiosity', url: 'https://visualization.osdr.nasa.gov/radlab/gui/knowledgebase/MSL-RAD-Surface' },
  { clave: 'sol', url: 'https://science.nasa.gov/blog/sols-4219-4221-its-a-complex-morning/' },
  { clave: 'chapea', url: 'https://www.nasa.gov/humans-in-space/chapea/about-chapea/' },
] as const;

export interface ControlFuentes {
  abrir: (origen?: HTMLElement | null) => void;
  estaAbierto: () => boolean;
}

export function montarFuentes(raiz: HTMLElement, alAbrir: () => void, alCerrar: () => void): ControlFuentes {
  const traducciones: { elemento: HTMLElement; clave: string }[] = [];
  function traducir(elemento: HTMLElement, clave: string) {
    traducciones.push({ elemento, clave });
    elemento.textContent = t(clave);
  }
  let origenFoco: HTMLElement | null = null;

  const dialogo = document.createElement('dialog');
  dialogo.className = 'fuentes-dialogo';
  dialogo.setAttribute('aria-labelledby', 'fuentes-titulo');
  const titulo = document.createElement('h1');
  titulo.id = 'fuentes-titulo';
  traducir(titulo, 'fuentes.titulo');
  const introduccion = document.createElement('p');
  traducir(introduccion, 'fuentes.introduccion');
  dialogo.append(titulo, introduccion);

  for (const { clave, url } of FUENTES) {
    const seccion = document.createElement('section');
    const subtitulo = document.createElement('h2');
    traducir(subtitulo, `fuentes.${clave}.titulo`);
    const descripcion = document.createElement('p');
    traducir(descripcion, `fuentes.${clave}.texto`);
    const enlace = document.createElement('a');
    enlace.href = url;
    traducir(enlace, `fuentes.${clave}.enlace`);
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    seccion.append(subtitulo, descripcion, enlace);
    dialogo.append(seccion);
  }

  const simplificaciones = document.createElement('section');
  const subtitulo = document.createElement('h2');
  traducir(subtitulo, 'fuentes.simplificado.titulo');
  const descripcion = document.createElement('p');
  traducir(descripcion, 'fuentes.simplificado.texto');
  simplificaciones.append(subtitulo, descripcion);
  const cerrar = document.createElement('button');
  cerrar.type = 'button';
  traducir(cerrar, 'fuentes.cerrar');
  cerrar.addEventListener('click', () => dialogo.close());
  dialogo.append(simplificaciones, cerrar);
  raiz.append(dialogo);
  let idioma = getIdioma();
  store.subscribe(() => {
    if (idioma === getIdioma()) return;
    idioma = getIdioma();
    for (const { elemento, clave } of traducciones) elemento.textContent = t(clave);
  });

  dialogo.addEventListener('close', () => {
    alCerrar();
    origenFoco?.focus();
    origenFoco = null;
  });

  return {
    abrir(origen?: HTMLElement | null) {
      if (dialogo.open) return;
      origenFoco = origen ?? null;
      dialogo.showModal();
      alAbrir();
      titulo.tabIndex = -1;
      titulo.focus();
    },
    estaAbierto: () => dialogo.open,
  };
}
