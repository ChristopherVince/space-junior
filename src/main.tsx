import { Canvas } from '@react-three/fiber';
import { createRoot } from 'react-dom/client';
import './style.css';
import { revisarBots } from './bots/bots';
import { MarsDioramaScene } from './scenes/diorama/MarsDioramaScene';
import { iniciarReloj } from './state/reloj';
import { store } from './state/store';
import { montarFuentes } from './ui/fuentes';
import { montarHud } from './ui/hud';
import { montarInicio } from './ui/inicio';
import { montarReporte } from './ui/reporte';
import { montarGlosario } from './ui/glosario';
import { montarGuia } from './ui/guia';
import { montarAvisos } from './ui/avisos';

const escena = createRoot(document.getElementById('juego')!);
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

let ultimoPausado = store.getState().pausado;
store.subscribe((e) => {
  if (e.pausado !== ultimoPausado) {
    ultimoPausado = e.pausado;
    renderizarEscena(ultimoPausado);
  }
});

const interfaz = document.getElementById('interfaz')!;
let estabaPausadoFuentes = false;
const controlFuentes = montarFuentes(
  interfaz,
  () => {
    estabaPausadoFuentes = store.getState().pausado;
    if (!estabaPausadoFuentes) store.dispatch({ type: 'PAUSAR', pausado: true });
  },
  () => {
    if (!estabaPausadoFuentes) store.dispatch({ type: 'PAUSAR', pausado: false });
  },
);

montarGlosario(interfaz);
montarHud(interfaz, controlFuentes);
montarGuia(interfaz);
montarAvisos(interfaz);
montarInicio(interfaz, controlFuentes);
montarReporte(interfaz);

iniciarReloj(revisarBots);
