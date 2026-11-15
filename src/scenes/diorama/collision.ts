import type { ModuleId } from '../../state/types';

export interface CajaColision {
  x: number;
  z: number;
  ancho: number;
  fondo: number;
}

export interface ZonaModulo {
  id: ModuleId;
  x: number;
  z: number;
  w: number;
  d: number;
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  color: string;
  icono: string;
  etiquetaPos: [number, number, number];
}

export const LIMITES_MAPA = {
  xMin: -9.65,
  xMax: 9.65,
  zMin: -4.65,
  zMax: 4.65,
} as const;

export const GROSOR_MURO = 0.16;
const G = GROSOR_MURO;

/**
 * Muros interiores de Mars Dune Alpha declarados una sola vez (#44):
 * se usan tanto para renderizar en MarsDuneAlphaMap como para colisiones.
 */
export const MUROS_INTERIORES: readonly CajaColision[] = [
  // 4 habitaciones / refugio (izquierda)
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

  // Bloque inferior derecho (energía/robótica + enfermería)
  { x: 2.45, z: 1.8, ancho: 1.3, fondo: G },
  { x: 5.55, z: 1.8, ancho: 2.9, fondo: G },
  { x: 9.15, z: 1.8, ancho: 1.7, fondo: G },
  { x: 5.4, z: 3.4, ancho: G, fondo: 3.1 },
];

/**
 * Centro Z de los cuartos con cama y estante. El cuarto en z = -1.25 es el
 * refugio blindado: no lleva muebles para que quepa la tripulación completa
 * (sus puestos están en rutas.ts). Si se le ponen muebles, los bots se atoran.
 */
export const REFUGIO_Z = -1.25;
export const HABITACIONES_Z = [-3.75, 1.25, 3.75] as const;

export const PLANTAS_INVERNADERO: readonly { x: number; z: number }[] = [
  { x: -4.8, z: -3.9 },
  { x: -3.1, z: -3.9 },
  { x: -4.8, z: 3.9 },
  { x: -3.1, z: 3.9 },
];

export const SILLAS_COMUNICACIONES_X = [4.7, 6.1, 7.5] as const;

/**
 * Cajas sólidas del mobiliario interior (#44): camas, estantes, macetas,
 * mesas, sillas, equipo médico y estaciones de trabajo.
 */
export const MUEBLES_SOLIDOS: readonly CajaColision[] = [
  // Camas y estantes en los 3 dormitorios (el cuarto del refugio queda libre)
  ...HABITACIONES_Z.flatMap((z) => [
    { x: -8.9, z: z - 0.35, ancho: 1.45, fondo: 0.85 },
    { x: -8.6, z: z + 0.88, ancho: 1.1, fondo: 0.42 },
  ]),

  // Estantes y macetas del invernadero
  { x: -4.4, z: -4.65, ancho: 2.4, fondo: 0.45 },
  { x: -4.4, z: 4.65, ancho: 2.4, fondo: 0.45 },
  ...PLANTAS_INVERNADERO.map((p) => ({ x: p.x, z: p.z, ancho: 0.9, fondo: 0.5 })),

  // WC central
  { x: -3.3, z: -1.5, ancho: 0.5, fondo: 0.5 },

  // Sala de recreación en pasillo norte
  { x: -0.1, z: -4.65, ancho: 2.6, fondo: 0.45 },
  { x: -0.5, z: -2.6, ancho: 0.7, fondo: 1.5 },
  { x: 0.25, z: -2.6, ancho: 0.45, fondo: 0.85 },
  { x: 0.85, z: -2.95, ancho: 0.36, fondo: 0.36 },
  { x: 0.85, z: -2.15, ancho: 0.36, fondo: 0.36 },

  // Cocina y comedor en pasillo sur
  { x: -0.1, z: 4.65, ancho: 2.6, fondo: 0.45 },
  { x: 0.1, z: 2.65, ancho: 1.6, fondo: 1.0 },
  { x: -0.4, z: 1.95, ancho: 0.36, fondo: 0.36 },
  { x: 0.6, z: 1.95, ancho: 0.36, fondo: 0.36 },
  { x: -0.4, z: 3.35, ancho: 0.36, fondo: 0.36 },
  { x: 0.6, z: 3.35, ancho: 0.36, fondo: 0.36 },

  // Gimnasio arriba-derecha
  { x: 3.4, z: -3.9, ancho: 1.3, fondo: 0.45 },
  { x: 3.2, z: -2.7, ancho: 0.8, fondo: 0.4 },

  // Comunicaciones e investigación: mesa larga, sillas y estante
  { x: 2.45, z: -0.95, ancho: 0.8, fondo: 0.7 },
  { x: 6.1, z: 0.0, ancho: 3.6, fondo: 1.0 },
  ...SILLAS_COMUNICACIONES_X.flatMap((sx) => [
    { x: sx, z: -0.68, ancho: 0.36, fondo: 0.36 },
    { x: sx, z: 0.68, ancho: 0.36, fondo: 0.36 },
  ]),

  // Energía / estación de robótica
  { x: 2.8, z: 4.35, ancho: 1.1, fondo: 0.6 },
  { x: 4.4, z: 4.35, ancho: 1.1, fondo: 0.6 },
  { x: 2.4, z: 3.2, ancho: 0.35, fondo: 0.35 },

  // Enfermería: camillas laterales
  { x: 9.2, z: 3.4, ancho: 0.9, fondo: 1.9 },
  { x: 6.1, z: 3.4, ancho: 0.7, fondo: 1.5 },
];

/** Lista combinada de todos los obstáculos sólidos de la base (muros + muebles). */
export const MUROS_COLISION: readonly CajaColision[] = [
  ...MUROS_INTERIORES,
  ...MUEBLES_SOLIDOS,
];

/**
 * Fuente única de zonas de módulos (#43):
 * se usa tanto para resaltar/tocar en MarsDioramaScene como en detectarModulo().
 */
export const ZONAS_MODULOS: readonly ZonaModulo[] = [
  {
    id: 'refugio',
    x: -8.1,
    z: 0,
    w: 3.8,
    d: 9.8,
    xMin: -10,
    xMax: -6.2,
    zMin: -5,
    zMax: 5,
    color: '#38bdf8',
    icono: '🛡️',
    etiquetaPos: [-8.3, 1.55, -2.2],
  },
  {
    id: 'invernadero',
    x: -3.9,
    z: 0,
    w: 4.6,
    d: 9.8,
    xMin: -6.2,
    xMax: -1.6,
    zMin: -5,
    zMax: 5,
    color: '#4ade80',
    icono: '🌱',
    etiquetaPos: [-4.2, 1.55, 2.4],
  },
  {
    id: 'pasillo',
    x: 0.1,
    z: 0,
    w: 3.4,
    d: 9.8,
    xMin: -1.6,
    xMax: 1.8,
    zMin: -5,
    zMax: 5,
    color: '#fbbf24',
    icono: '🧭',
    etiquetaPos: [0.1, 1.55, -1.8],
  },
  {
    id: 'comunicaciones',
    x: 5.9,
    z: 0.1,
    w: 8.2,
    d: 3.4,
    xMin: 1.8,
    xMax: 10,
    zMin: -1.6,
    zMax: 1.8,
    color: '#a78bfa',
    icono: '📡',
    etiquetaPos: [6.8, 1.55, -0.5],
  },
  {
    id: 'energia',
    x: 3.6,
    z: 3.4,
    w: 3.6,
    d: 3.2,
    xMin: 1.8,
    xMax: 5.4,
    zMin: 1.8,
    zMax: 5,
    color: '#f59e0b',
    icono: '⚡',
    etiquetaPos: [3.4, 1.55, 3.6],
  },
  {
    id: 'enfermeria',
    x: 7.7,
    z: 3.4,
    w: 4.6,
    d: 3.2,
    xMin: 5.4,
    xMax: 10,
    zMin: 1.8,
    zMax: 5,
    color: '#fb7185',
    icono: '➕',
    etiquetaPos: [8.0, 1.55, 3.6],
  },
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

/** Aplica un desplazamiento X/Z por ejes para conservar el deslizamiento junto a los muros y muebles. */
export function resolverMovimientoConMuros(
  x: number,
  z: number,
  dx: number,
  dz: number,
  radio: number,
): { x: number; z: number } {
  let siguienteX = x;
  let siguienteZ = z;

  // Pasos de hasta 2·radio: el obstáculo más delgado (muro de 0.16) mide
  // 0.16 + 2·radio al expandirlo, así que ningún paso puede atravesarlo.
  // Pasos más finos harían que el personaje se arrime hasta tocar la pared
  // en lugar de detenerse, y cambiarían el deslizamiento en diagonal.
  const pasos = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (radio * 2)));
  for (let i = 0; i < pasos; i++) {
    if (!colisionaConMuros(siguienteX + dx / pasos, siguienteZ, radio)) siguienteX += dx / pasos;
    if (!colisionaConMuros(siguienteX, siguienteZ + dz / pasos, radio)) siguienteZ += dz / pasos;
  }

  return { x: siguienteX, z: siguienteZ };
}

/** Intersección exacta del segmento con AABB expandidas por el radio. */
export function segmentoTransitable(a: { x: number; z: number }, b: { x: number; z: number }, radio = 0.26): boolean {
  if (colisionaConMuros(a.x, a.z, radio) || colisionaConMuros(b.x, b.z, radio)) return false;
  return !MUROS_COLISION.some((m) => {
    let entrada = 0;
    let salida = 1;
    for (const [inicio, delta, minimo, maximo] of [
      [a.x, b.x - a.x, m.x - m.ancho / 2 - radio, m.x + m.ancho / 2 + radio],
      [a.z, b.z - a.z, m.z - m.fondo / 2 - radio, m.z + m.fondo / 2 + radio],
    ]) {
      if (Math.abs(delta) < 1e-12) {
        if (inicio <= minimo || inicio >= maximo) return false;
      } else {
        const t1 = (minimo - inicio) / delta;
        const t2 = (maximo - inicio) / delta;
        entrada = Math.max(entrada, Math.min(t1, t2));
        salida = Math.min(salida, Math.max(t1, t2));
        if (entrada >= salida) return false;
      }
    }
    return entrada < salida;
  });
}

export function detectarModulo(x: number, z: number): ModuleId | null {
  const zona = ZONAS_MODULOS.find(
    (m) => x >= m.xMin && x <= m.xMax && z >= m.zMin && z <= m.zMax,
  );
  return zona ? zona.id : null;
}
