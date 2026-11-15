import { Canvas } from '@react-three/fiber';
import { createRoot } from 'react-dom/client';
import './style.css';
import { revisarBots } from './bots/bots';
import eventos from './data/events.json';
import { MarsDioramaScene } from './scenes/diorama/MarsDioramaScene';
import { iniciarReloj } from './state/reloj';
import { store } from './state/store';
import { montarHud } from './ui/hud';
import { montarReporte } from './ui/reporte';
import { montarFuentes } from './ui/fuentes';

const juegoRaiz = document.getElementById('juego')!;
const escena = createRoot(juegoRaiz);
function renderizarEscena(pausada: boolean) {
  escena.render(
  <Canvas
    frameloop={pausada ? 'never' : 'always'}
    shadows
    orthographic
    dpr={[1, 2]}
    camera={{ position: [19, 17, 19], zoom: 34, near: 1, far: 200 }}
    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
  >
    <MarsDioramaScene />
  </Canvas>,
  );
}
renderizarEscena(false);

montarHud(document.getElementById('interfaz')!);
montarReporte(document.getElementById('interfaz')!);
let estabaPausado = false;
montarFuentes(document.getElementById('interfaz')!, () => {
  estabaPausado = store.getState().pausado;
  if (!estabaPausado) store.dispatch({ type: 'PAUSAR', pausado: true });
  renderizarEscena(true);
}, () => {
  if (!estabaPausado) store.dispatch({ type: 'PAUSAR', pausado: false });
  renderizarEscena(false);
});

const evento = eventos.eventos[0];
store.dispatch({
  type: 'INICIAR_PARTIDA',
  eventoId: evento.id,
  pronostico: {
    horasPronosticadas: evento.horasPronosticadas,
    margenHoras: evento.margenHoras,
    horasReales: evento.horasReales,
  },
});

iniciarReloj(revisarBots);

