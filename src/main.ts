import Phaser from 'phaser';
import './style.css';
import { revisarBots } from './bots/bots';
import eventos from './data/events.json';
import { BaseScene } from './scenes/BaseScene';
import { store } from './state/store';
import { montarHud } from './ui/hud';
import { montarReporte } from './ui/reporte';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'juego',
  width: 960,
  height: 600,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BaseScene],
});

montarHud(document.getElementById('interfaz')!);
montarReporte(document.getElementById('interfaz')!);

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

// TODO(Frente 2): reemplazar por el reloj real del juego (horas por segundo).
setInterval(() => {
  store.dispatch({ type: 'AVANZAR_HORAS', horas: 1 });
  revisarBots();
}, 2000);
