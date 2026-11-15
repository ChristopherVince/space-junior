import { Canvas } from '@react-three/fiber';
import { createRoot } from 'react-dom/client';
import './style.css';
import { revisarBots } from './bots/bots';
import { MarsDioramaScene } from './scenes/diorama/MarsDioramaScene';
import { iniciarReloj } from './state/reloj';
import { montarHud } from './ui/hud';
import { montarInicio } from './ui/inicio';

const juegoRaiz = document.getElementById('juego')!;
createRoot(juegoRaiz).render(
  <Canvas
    shadows
    orthographic
    dpr={[1, 2]}
    camera={{ position: [19, 17, 19], zoom: 34, near: 1, far: 200 }}
    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
  >
    <MarsDioramaScene />
  </Canvas>,
);

const interfaz = document.getElementById('interfaz')!;
montarHud(interfaz);
// La partida empieza al pulsar "Jugar" en la pantalla de inicio (evento real al azar).
montarInicio(interfaz);

iniciarReloj(revisarBots);

