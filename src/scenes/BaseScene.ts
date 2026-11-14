// TODO(Frente 1: base y movimiento): reemplazar los rectángulos por el mapa de
// Tiled con tiles de Kenney, agregar caminos fijos y tocar-para-caminar en celular.
import Phaser from 'phaser';
import { store } from '../state/store';
import type { ModuleId } from '../state/types';

interface ModuloPos {
  id: ModuleId;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Posiciones provisionales, inspiradas en el boceto del documento de diseño.
export const MODULOS: ModuloPos[] = [
  { id: 'invernadero', x: 140, y: 180, w: 200, h: 130 },
  { id: 'pasillo', x: 480, y: 180, w: 130, h: 110 },
  { id: 'energia', x: 820, y: 180, w: 200, h: 130 },
  { id: 'refugio', x: 140, y: 420, w: 200, h: 130 },
  { id: 'comunicaciones', x: 480, y: 420, w: 180, h: 120 },
  { id: 'enfermeria', x: 820, y: 420, w: 200, h: 130 },
];

const VELOCIDAD = 220;

export class BaseScene extends Phaser.Scene {
  private jugador!: Phaser.GameObjects.Arc;
  private teclas!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('BaseScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#2b1a12');

    for (const m of MODULOS) {
      this.add.rectangle(m.x, m.y, m.w, m.h, 0x3a2a22).setStrokeStyle(2, 0xd8c3a5);
      this.add.text(m.x, m.y, m.id, { fontSize: '18px', color: '#f5f2ec' }).setOrigin(0.5);
    }

    this.jugador = this.add.circle(480, 300, 14, 0xf2853a);
    this.teclas = this.input.keyboard!.createCursorKeys();
  }

  update(_t: number, dtMs: number) {
    const dt = dtMs / 1000;
    const { left, right, up, down } = this.teclas;
    const dx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
    const dy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);
    this.jugador.x += dx * VELOCIDAD * dt;
    this.jugador.y += dy * VELOCIDAD * dt;

    const dentro = MODULOS.find(
      (m) => Math.abs(this.jugador.x - m.x) < m.w / 2 && Math.abs(this.jugador.y - m.y) < m.h / 2,
    );
    const actual = store.getState().tripulacion.comandante.modulo;
    if (dentro && dentro.id !== actual) {
      store.dispatch({ type: 'MOVER_TRIPULANTE', quien: 'comandante', modulo: dentro.id });
    }
  }
}
