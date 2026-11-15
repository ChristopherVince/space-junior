// Pantalla de inicio (#32): título, aclaración honesta de los datos,
// botones Jugar y Cómo jugar, y selector de idioma.
// HTML encima del juego, con el mismo estilo cálido que el diálogo de los bots.
import { getIdioma, setIdioma, t } from '../i18n';
import { iniciarPartida } from '../state/partida';
import { store } from '../state/store';

export function montarInicio(raiz: HTMLElement) {
  const pantalla = document.createElement('div');
  pantalla.className = 'inicio';
  raiz.append(pantalla);

  let mostrarAyuda = false;

  const pintar = () => {
    const idioma = getIdioma();
    pantalla.innerHTML = `
      <div class="inicio__tarjeta" role="dialog" aria-labelledby="inicio-titulo">
        <div class="inicio__idiomas" role="group" aria-label="${t('inicio.idioma')}">
          <button class="inicio__idioma ${idioma === 'es' ? 'inicio__idioma--activo' : ''}" data-idioma="es" aria-pressed="${idioma === 'es'}">ES</button>
          <button class="inicio__idioma ${idioma === 'en' ? 'inicio__idioma--activo' : ''}" data-idioma="en" aria-pressed="${idioma === 'en'}">EN</button>
        </div>
        <p class="inicio__antetitulo">${t('inicio.antetitulo')}</p>
        <h1 id="inicio-titulo" class="inicio__titulo">${t('inicio.titulo')}</h1>
        <p class="inicio__subtitulo">${t('inicio.subtitulo')}</p>
        <p class="inicio__honestidad">${t('inicio.honestidad')}</p>
        ${
          mostrarAyuda
            ? `<ol class="inicio__pasos">
                <li>${t('inicio.paso1')}</li>
                <li>${t('inicio.paso2')}</li>
                <li>${t('inicio.paso3')}</li>
                <li>${t('inicio.paso4')}</li>
              </ol>`
            : ''
        }
        <div class="inicio__acciones">
          <button class="dialogo__btn dialogo__btn--si inicio__jugar" data-accion="jugar">${t('inicio.jugar')}</button>
          <button class="dialogo__btn dialogo__btn--no" data-accion="ayuda" aria-expanded="${mostrarAyuda}">
            ${mostrarAyuda ? t('inicio.ocultarAyuda') : t('inicio.comoJugar')}
          </button>
        </div>
      </div>
    `;
  };

  pantalla.addEventListener('click', (ev) => {
    const boton = (ev.target as HTMLElement).closest('button');
    if (!boton) return;

    const idioma = boton.dataset.idioma;
    if (idioma === 'es' || idioma === 'en') {
      setIdioma(idioma);
      document.documentElement.lang = idioma;
      // Fuerza a que el HUD se vuelva a pintar con el idioma nuevo.
      store.dispatch({ type: 'PAUSAR', pausado: store.getState().pausado });
      pintar();
      return;
    }

    if (boton.dataset.accion === 'ayuda') {
      mostrarAyuda = !mostrarAyuda;
      pintar();
      return;
    }

    if (boton.dataset.accion === 'jugar') {
      pantalla.hidden = true;
      iniciarPartida();
    }
  });

  pintar();
}
