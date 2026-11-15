import { t } from '../i18n';
import './fuentes.css';

const FUENTES = [
  { clave: 'donki', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/' },
  { clave: 'scoreboard', url: 'https://ccmc.gsfc.nasa.gov/scoreboards/cme/earth/' },
  { clave: 'curiosity', url: 'https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/' },
  { clave: 'sol', url: 'https://science.nasa.gov/blog/sols-4219-4221-its-a-complex-morning/' },
  { clave: 'chapea', url: 'https://www.nasa.gov/humans-in-space/chapea/about-chapea/' },
] as const;

export function montarFuentes(raiz: HTMLElement, alAbrir: () => void, alCerrar: () => void): () => boolean {
  const abrir = document.createElement('button');
  abrir.type = 'button';
  abrir.className = 'fuentes-abrir';
  abrir.textContent = t('fuentes.abrir');
  abrir.setAttribute('aria-haspopup', 'dialog');

  const dialogo = document.createElement('dialog');
  dialogo.className = 'fuentes-dialogo';
  dialogo.setAttribute('aria-labelledby', 'fuentes-titulo');
  const titulo = document.createElement('h1');
  titulo.id = 'fuentes-titulo';
  titulo.textContent = t('fuentes.titulo');
  const introduccion = document.createElement('p');
  introduccion.textContent = t('fuentes.introduccion');
  dialogo.append(titulo, introduccion);

  for (const { clave, url } of FUENTES) {
    const seccion = document.createElement('section');
    const subtitulo = document.createElement('h2');
    subtitulo.textContent = t(`fuentes.${clave}.titulo`);
    const descripcion = document.createElement('p');
    descripcion.textContent = t(`fuentes.${clave}.texto`);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.textContent = t(`fuentes.${clave}.enlace`);
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    seccion.append(subtitulo, descripcion, enlace);
    dialogo.append(seccion);
  }

  const simplificaciones = document.createElement('section');
  const subtitulo = document.createElement('h2');
  subtitulo.textContent = t('fuentes.simplificado.titulo');
  const descripcion = document.createElement('p');
  descripcion.textContent = t('fuentes.simplificado.texto');
  simplificaciones.append(subtitulo, descripcion);
  const cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.textContent = t('fuentes.cerrar');
  cerrar.addEventListener('click', () => dialogo.close());
  dialogo.append(simplificaciones, cerrar);
  raiz.append(abrir, dialogo);

  abrir.addEventListener('click', () => {
    dialogo.showModal();
    alAbrir();
    titulo.tabIndex = -1;
    titulo.focus();
  });
  dialogo.addEventListener('close', () => {
    alCerrar();
    abrir.focus();
  });
  return () => dialogo.open;
}
