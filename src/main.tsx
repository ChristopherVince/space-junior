import { Canvas } from '@react-three/fiber';
import { createRoot } from 'react-dom/client';
import './style.css';
import { revisarBots } from './bots/bots';
import eventos from './data/events.json';
import { MarsDioramaScene } from './scenes/diorama/MarsDioramaScene';
import { iniciarReloj } from './state/reloj';
import { store } from './state/store';
import { montarHud } from './ui/hud';

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

montarHud(document.getElementById('interfaz')!);

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

