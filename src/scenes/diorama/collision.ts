import type { ModuleId } from '../../state/types';

export interface CajaColision {
  x: number;
  z: number;
  ancho: number;
  fondo: number;
}

export interface ZonaModulo {
  id: ModuleId;
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
}

export const LIMITES_MAPA = {
  xMin: -9.65,
  xMax: 9.65,
  zMin: -4.65,
  zMax: 4.65,
} as const;

const G = 0.16;

/** Cajas de colisión correspondientes a los muros interiores de MarsDuneAlphaMap. */
export const MUROS_COLISION: CajaColision[] = [
  // 4 habitaciones (izquierda)
  { x: -8.1, z: -2.5, ancho: 3.8, fondo: G },
  { x: -8.1, z: 0, ancho: 3.8, fondo: G },
  { x: -8.1, z: 2.5, ancho: 3.8, fondo: G },
  { x: -6.2, z: -4.55, ancho: G, fondo: 0.9 },
  { x: -6.2, z: -2.5, ancho: G, fondo: 1.3 },
  { x: -6.2, z: 0, ancho: G, fondo: 1.3 },
  { x: -6.2, z: 2.5, ancho: G, fondo: 1.3 },
  { x: -6.2, z: 4.55, ancho: G, fondo: 0.9 },

  // Bloque central WC / Ducha en invernadero
  { x: -3.65, z: -2.2, ancho: 2.3, fondo: G },
  { x: -3.65, z: 2.2, ancho: 2.3, fondo: G },
  { x: -2.5, z: 0, ancho: G, fondo: 4.4 },
  { x: -3.65, z: 0, ancho: 2.1, fondo: G },
  { x: -4.8, z: -1.45, ancho: G, fondo: 1.5 },
  { x: -4.8, z: 1.45, ancho: G, fondo: 1.5 },

  // Separación centro <-> derecha
  { x: 1.8, z: -3.15, ancho: G, fondo: 3.7 },
  { x: 1.8, z: 3.15, ancho: G, fondo: 3.7 },

  // Bloque superior derecho (gimnasio + baños)
  { x: 2.75, z: -1.6, ancho: 1.9, fondo: G },
  { x: 5.95, z: -1.6, ancho: 2.3, fondo: G },
  { x: 9.15, z: -1.6, ancho: 1.7, fondo: G },
  { x: 6.0, z: -3.3, ancho: G, fondo: 3.3 },
  { x: 7.2, z: -3.6, ancho: G, fondo: 2.6 },

  // Bloque inferior derecho (robótica + enfermería)
  { x: 2.45, z: 1.8, ancho: 1.3, fondo: G },
  { x: 5.55, z: 1.8, ancho: 2.9, fondo: G },
  { x: 9.15, z: 1.8, ancho: 1.7, fondo: G },
  { x: 5.4, z: 3.4, ancho: G, fondo: 3.1 },
];

export const ZONAS_MODULOS: ZonaModulo[] = [
  { id: 'refugio', xMin: -10, xMax: -6.2, zMin: -5, zMax: 5 },
  { id: 'invernadero', xMin: -6.2, xMax: -1.6, zMin: -5, zMax: 5 },
  { id: 'pasillo', xMin: -1.6, xMax: 1.8, zMin: -5, zMax: 5 },
  { id: 'energia', xMin: 1.8, xMax: 6.0, zMin: -5, zMax: -1.6 },
  { id: 'energia', xMin: 1.8, xMax: 5.4, zMin: 1.8, zMax: 5 },
  { id: 'comunicaciones', xMin: 1.8, xMax: 10, zMin: -1.6, zMax: 1.8 },
  { id: 'enfermeria', xMin: 5.4, xMax: 10, zMin: 1.8, zMax: 5 },
];

export function colisionaConMuros(x: number, z: number, radio: number): boolean {
  if (
    x - radio < LIMITES_MAPA.xMin ||
    x + radio > LIMITES_MAPA.xMax ||
    z - radio < LIMITES_MAPA.zMin ||
    z + radio > LIMITES_MAPA.zMax
  ) {
    return true;
  }

  for (const m of MUROS_COLISION) {
    const halfW = m.ancho / 2;
    const halfD = m.fondo / 2;
    if (
      x + radio > m.x - halfW &&
      x - radio < m.x + halfW &&
      z + radio > m.z - halfD &&
      z - radio < m.z + halfD
    ) {
      return true;
    }
  }
  return false;
}

export function detectarModulo(x: number, z: number): ModuleId | null {
  const zona = ZONAS_MODULOS.find(
    (m) => x >= m.xMin && x <= m.xMax && z >= m.zMin && z <= m.zMax,
  );
  return zona ? zona.id : null;
}

