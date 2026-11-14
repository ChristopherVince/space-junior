// Escena principal de la base marciana cargada desde el mapa de Tiled (assets/maps/base.json).
// TODO(Frente 1: movimiento): agregar caminos fijos y tocar-para-caminar en celular.
import Phaser from 'phaser';
import { t } from '../i18n';
import { store } from '../state/store';
import type { ModuleId } from '../state/types';

export interface ModuloZona {
  id: ModuleId;
  x: number;
  y: number;
  w: number;
  h: number;
}

const VELOCIDAD = 220;
const RADIO_JUGADOR = 11;

export class BaseScene extends Phaser.Scene {
  private jugador!: Phaser.GameObjects.Arc;
  private teclas!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private capaMuros: Phaser.Tilemaps.TilemapLayer | null = null;
  private zonas: ModuloZona[] = [];

  constructor() {
    super('BaseScene');
  }

  preload() {
    this.load.image('habitat-tiles', 'assets/maps/habitat.png');
    this.load.tilemapTiledJSON('base-map', 'assets/maps/base.json');
  }

  create() {
    this.cameras.main.setBackgroundColor('#2b1a12');

    const map = this.make.tilemap({ key: 'base-map' });
    const tileset = map.addTilesetImage('habitat', 'habitat-tiles');
    if (!tileset) return;

    map.createLayer('suelo', tileset, 0, 12);
    this.capaMuros = map.createLayer('muros', tileset, 0, 12);
    map.createLayer('detalles', tileset, 0, 12);

    this.zonas = this.cargarZonas(map, 0, 12);
    for (const z of this.zonas) {
      this.add
        .text(z.x + z.w / 2, z.y + z.h / 2, t(`modulo.${z.id}`), {
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#1e242b',
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5);
    }

    const inicio = this.zonas.find((z) => z.id === 'pasillo');
    const startX = inicio ? inicio.x + inicio.w / 2 : 480;
    const startY = inicio ? inicio.y + inicio.h / 2 : 320;

    this.jugador = this.add.circle(startX, startY, RADIO_JUGADOR, 0xf2853a).setStrokeStyle(2, 0x1e242b);
    this.teclas = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<
      'W' | 'A' | 'S' | 'D',
      Phaser.Input.Keyboard.Key
    >;
  }

  update(_t: number, dtMs: number) {
    if (!this.jugador) return;

    const dt = dtMs / 1000;
    const { left, right, up, down } = this.teclas;
    const dx = (right.isDown || this.wasd.D.isDown ? 1 : 0) - (left.isDown || this.wasd.A.isDown ? 1 : 0);
    const dy = (down.isDown || this.wasd.S.isDown ? 1 : 0) - (up.isDown || this.wasd.W.isDown ? 1 : 0);

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      const vx = (dx / len) * VELOCIDAD * dt;
      const vy = (dy / len) * VELOCIDAD * dt;

      if (!this.colisionaMuro(this.jugador.x + vx, this.jugador.y)) {
        this.jugador.x += vx;
      }
      if (!this.colisionaMuro(this.jugador.x, this.jugador.y + vy)) {
        this.jugador.y += vy;
      }
    }

    const dentro = this.zonas.find(
      (z) =>
        this.jugador.x >= z.x &&
        this.jugador.x <= z.x + z.w &&
        this.jugador.y >= z.y &&
        this.jugador.y <= z.y + z.h,
    );
    const actual = store.getState().tripulacion.comandante.modulo;
    if (dentro && dentro.id !== actual) {
      store.dispatch({ type: 'MOVER_TRIPULANTE', quien: 'comandante', modulo: dentro.id });
    }
  }

  private cargarZonas(map: Phaser.Tilemaps.Tilemap, offsetX: number, offsetY: number): ModuloZona[] {
    const capa = map.getObjectLayer('zonas');
    if (!capa) return [];

    const resultado: ModuloZona[] = [];
    for (const obj of capa.objects) {
      const prop = obj.properties?.find((p: { name: string }) => p.name === 'moduloId');
      const id = (prop?.value ?? obj.name) as ModuleId | undefined;
      if (!id || obj.x == null || obj.y == null || !obj.width || !obj.height) continue;
      resultado.push({
        id,
        x: obj.x + offsetX,
        y: obj.y + offsetY,
        w: obj.width,
        h: obj.height,
      });
    }
    return resultado;
  }

  private colisionaMuro(cx: number, cy: number): boolean {
    if (!this.capaMuros) return false;
    const r = RADIO_JUGADOR - 2;
    const puntos = [
      [cx - r, cy - r],
      [cx + r, cy - r],
      [cx - r, cy + r],
      [cx + r, cy + r],
    ];
    return puntos.some(([px, py]) => this.capaMuros!.hasTileAtWorldXY(px, py));
  }
}
