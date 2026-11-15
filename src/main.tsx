import { Canvas } from '@react-three/fiber';
import { createRoot } from 'react-dom/client';
import './style.css';
import { revisarBots } from './bots/bots';
import { MarsDioramaScene } from './scenes/diorama/MarsDioramaScene';
import { iniciarReloj } from './state/reloj';
import { store } from './state/store';
import { montarHud } from './ui/hud';
import { montarInicio } from './ui/inicio';
import { montarReporte } from './ui/reporte';
import { montarFuentes } from './ui/fuentes';
import { montarGlosario } from './ui/glosario';
import { montarGuia } from './ui/guia';

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

const interfaz = document.getElementById('interfaz')!;
montarGlosario(interfaz);
montarHud(interfaz);
montarGuia(interfaz);
montarInicio(interfaz);
montarReporte(interfaz);
let estabaPausado = false;
montarFuentes(interfaz, () => {
  estabaPausado = store.getState().pausado;
  if (!estabaPausado) store.dispatch({ type: 'PAUSAR', pausado: true });
  renderizarEscena(true);
}, () => {
  if (!estabaPausado) store.dispatch({ type: 'PAUSAR', pausado: false });
  renderizarEscena(false);
});

iniciarReloj(revisarBots);
