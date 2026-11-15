import type { CrewId, ModuleId, Phase } from '../state/types';
import { colisionaConMuros, segmentoTransitable } from './diorama/collision.ts';

export interface PuntoRuta {
  x: number;
  z: number;
}

type NodoId =
  | 'refugio'
  | 'puertaRefugio'
  | 'aproximacionRefugio'
  | 'invernaderoPasillo'
  | 'invernaderoOesteNorte'
  | 'invernaderoNorte'
  | 'invernaderoEsteNorte'
  | 'invernaderoEsteCentro'
  | 'invernaderoEsteSur'
  | 'pasilloCentro'
  | 'pasilloEste'
  | 'comunicaciones'
  | 'comunicacionesEnergia'
  | 'puertaEnergia'
  | 'energia'
  | 'comunicacionesEnfermeria'
  | 'puertaEnfermeria'
  | 'enfermeria'
  | 'habitacionNorte'
  | 'puertaHabitacionNorte'
  | 'habitacionSur'
  | 'habitacionExtremoSur'
  | 'puertaHabitacionExtremoSur'
  | 'salidaHabitacionExtremoSur'
  | 'oesteNorte'
  | 'oesteSur'
  | 'oesteExtremoSur'
  | 'surCentral';

export const NODOS: Record<NodoId, PuntoRuta> = {
  habitacionNorte: { x: -7.6, z: -3.65 },
  // Centro de las puertas de los cuartos extremos (muro x = -6.2, hueco de z ±3.15 a ±4.1):
  // sin estos puntos, la línea al invernadero roza la orilla del muro.
  puertaHabitacionNorte: { x: -6.2, z: -3.625 },
  habitacionSur: { x: -7.6, z: 1.25 },
  habitacionExtremoSur: { x: -7.6, z: 3.65 },
  puertaHabitacionExtremoSur: { x: -6.2, z: 3.625 },
  // Sale derecho de la puerta antes de girar: en diagonal roza la esquina del muro.
  salidaHabitacionExtremoSur: { x: -5.6, z: 3.625 },
  oesteNorte: { x: -5.5, z: -3.35 },
  oesteSur: { x: -5.5, z: 1.25 },
  oesteExtremoSur: { x: -5.5, z: 2.95 },
  surCentral: { x: -3.6, z: 2.95 },
  refugio: { x: -7.55, z: -1.25 },
  puertaRefugio: { x: -6.2, z: -1.25 },
  aproximacionRefugio: { x: -5.5, z: -1.25 },
  invernaderoPasillo: { x: -5.5, z: 0 },
  invernaderoOesteNorte: { x: -5.5, z: -2.95 },
  invernaderoNorte: { x: -3.6, z: -2.95 },
  invernaderoEsteNorte: { x: -1.85, z: -2.95 },
  invernaderoEsteCentro: { x: -1.85, z: 0 },
  invernaderoEsteSur: { x: -1.85, z: 2.95 },
  pasilloCentro: { x: 0.1, z: 0 },
  pasilloEste: { x: 1.8, z: 0.2 },
  comunicaciones: { x: 3.55, z: 0.2 },
  comunicacionesEnergia: { x: 3.6, z: 1.32 },
  puertaEnergia: { x: 3.6, z: 1.8 },
  energia: { x: 3.6, z: 3.15 },
  comunicacionesEnfermeria: { x: 7.6, z: 1.32 },
  puertaEnfermeria: { x: 7.6, z: 1.8 },
  enfermeria: { x: 7.6, z: 3.15 },
};

const CONEXIONES: Record<NodoId, NodoId[]> = {
  habitacionNorte: ['puertaHabitacionNorte'],
  puertaHabitacionNorte: ['habitacionNorte', 'oesteNorte'],
  habitacionSur: ['oesteSur'],
  habitacionExtremoSur: ['puertaHabitacionExtremoSur'],
  puertaHabitacionExtremoSur: ['habitacionExtremoSur', 'salidaHabitacionExtremoSur'],
  salidaHabitacionExtremoSur: ['puertaHabitacionExtremoSur', 'oesteExtremoSur'],
  oesteNorte: ['puertaHabitacionNorte', 'invernaderoOesteNorte'],
  oesteSur: ['habitacionSur', 'invernaderoPasillo', 'oesteExtremoSur'],
  oesteExtremoSur: ['salidaHabitacionExtremoSur', 'oesteSur', 'surCentral'],
  surCentral: ['oesteExtremoSur', 'invernaderoEsteSur'],
  invernaderoEsteSur: ['surCentral', 'invernaderoEsteCentro'],
  refugio: ['puertaRefugio'],
  puertaRefugio: ['refugio', 'aproximacionRefugio'],
  aproximacionRefugio: ['puertaRefugio', 'invernaderoPasillo', 'invernaderoOesteNorte'],
  invernaderoPasillo: ['aproximacionRefugio', 'invernaderoOesteNorte', 'oesteSur'],
  invernaderoOesteNorte: ['aproximacionRefugio', 'invernaderoPasillo', 'invernaderoNorte', 'oesteNorte'],
  invernaderoNorte: ['invernaderoOesteNorte', 'invernaderoEsteNorte'],
  invernaderoEsteNorte: ['invernaderoNorte', 'invernaderoEsteCentro'],
  invernaderoEsteCentro: ['invernaderoEsteNorte', 'invernaderoEsteSur', 'pasilloCentro'],
  pasilloCentro: ['invernaderoEsteCentro', 'pasilloEste'],
  pasilloEste: ['pasilloCentro', 'comunicaciones'],
  comunicaciones: ['pasilloEste', 'comunicacionesEnergia'],
  comunicacionesEnergia: ['comunicaciones', 'puertaEnergia', 'comunicacionesEnfermeria'],
  puertaEnergia: ['comunicacionesEnergia', 'energia'],
  energia: ['puertaEnergia'],
  comunicacionesEnfermeria: ['comunicacionesEnergia', 'puertaEnfermeria'],
  puertaEnfermeria: ['comunicacionesEnfermeria', 'enfermeria'],
  enfermeria: ['puertaEnfermeria'],
};

for (const [id, vecinos] of Object.entries(CONEXIONES) as [NodoId, NodoId[]][]) {
  for (const vecino of vecinos) {
    if (!CONEXIONES[vecino].includes(id)) CONEXIONES[vecino].push(id);
  }
}

const NODO_POR_MODULO: Record<ModuleId, NodoId> = {
  refugio: 'refugio',
  invernadero: 'invernaderoPasillo',
  pasillo: 'pasilloCentro',
  energia: 'energia',
  comunicaciones: 'comunicaciones',
  enfermeria: 'enfermeria',
};

// Puestos dentro del cuarto del refugio (sin muebles; ver REFUGIO_Z en collision.ts).
const POSICIONES_REFUGIO: Record<CrewId, PuntoRuta> = {
  comandante: { x: -8.7, z: -0.7 },
  cientifico: { x: -7.7, z: -0.7 },
  ingeniero: { x: -8.7, z: -1.8 },
  medico: { x: -7.7, z: -1.8 },
};

/** Nodo visible en línea recta más cercano, o null si un mueble o muro los tapa todos. */
function nodoVisible(x: number, z: number): NodoId | null {
  let mejor: NodoId | null = null;
  let mejorDist = Infinity;
  for (const [id, p] of Object.entries(NODOS) as [NodoId, PuntoRuta][]) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < mejorDist && segmentoTransitable({ x, z }, p)) {
      mejorDist = d;
      mejor = id;
    }
  }
  return mejor;
}

const PASO_REJILLA = 0.1;
const RADIO_RUTA = 0.26;

/**
 * Desde un rincón (por ejemplo, detrás de una cama) puede no verse ningún nodo.
 * Busca en una rejilla fina, alineada a la posición del personaje, el camino libre
 * más corto hasta un punto que sí vea uno, y lo devuelve simplificado a pocos
 * puntos. Solo se usa en esos rincones.
 *
 * Los pasos de la rejilla (0.1) son menores que el obstáculo más delgado
 * expandido por el radio (0.16 + 0.52), así que si dos celdas vecinas están
 * libres, el tramo entre ellas también lo está.
 */
function salidaHastaVerNodo(x: number, z: number): { puntos: PuntoRuta[]; nodo: NodoId } | null {
  const ALCANCE = 200; // celdas hacia cada lado; cubre todo el mapa
  const ANCHO = ALCANCE * 2 + 1;
  const clave = (i: number, j: number) => (i + ALCANCE) * ANCHO + (j + ALCANCE);
  const aPunto = (i: number, j: number): PuntoRuta => ({ x: x + i * PASO_REJILLA, z: z + j * PASO_REJILLA });
  const desClave = (k: number): [number, number] => [Math.floor(k / ANCHO) - ALCANCE, (k % ANCHO) - ALCANCE];
  const libre = (p: PuntoRuta) => !colisionaConMuros(p.x, p.z, RADIO_RUTA);

  const origen = { x, z };
  const previo = new Map<number, number>([[clave(0, 0), -1]]);
  const cola: number[] = [clave(0, 0)];

  for (let n = 0; n < cola.length; n++) {
    const k = cola[n];
    const [i, j] = desClave(k);
    const p = aPunto(i, j);
    const nodo = n === 0 ? null : nodoVisible(p.x, p.z);
    if (nodo) {
      // Reconstruye el camino (sin el origen) y lo simplifica con línea de vista.
      const celdas: PuntoRuta[] = [];
      for (let c = k; previo.get(c) !== -1; c = previo.get(c)!) celdas.unshift(aPunto(...desClave(c)));
      const puntos: PuntoRuta[] = [];
      let desde = origen;
      let a = 0;
      while (a < celdas.length) {
        let lejos = a;
        while (lejos + 1 < celdas.length && segmentoTransitable(desde, celdas[lejos + 1], RADIO_RUTA)) lejos++;
        puntos.push(celdas[lejos]);
        desde = celdas[lejos];
        a = lejos + 1;
      }
      return { puntos, nodo };
    }
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (Math.abs(ni) > ALCANCE || Math.abs(nj) > ALCANCE) continue;
      const nk = clave(ni, nj);
      if (previo.has(nk) || !libre(aPunto(ni, nj))) continue;
      previo.set(nk, k);
      cola.push(nk);
    }
  }
  return null;
}

/**
 * Calcula una ruta fija por los pasillos y puertas de Mars Dune Alpha
 * desde la posición actual hasta el módulo destino.
 */
export function calcularRutaFija(desdeX: number, desdeZ: number, destino: ModuleId): PuntoRuta[] {
  let previos: PuntoRuta[] = [];
  let inicio = nodoVisible(desdeX, desdeZ);
  if (!inicio) {
    const salida = salidaHastaVerNodo(desdeX, desdeZ);
    if (!salida) return [];
    previos = salida.puntos;
    inicio = salida.nodo;
  }
  const fin = NODO_POR_MODULO[destino];
  if (inicio === fin) return [...previos, NODOS[fin]];

  const cola: NodoId[][] = [[inicio]];
  const visitados = new Set<NodoId>([inicio]);

  while (cola.length > 0) {
    const camino = cola.shift()!;
    const actual = camino[camino.length - 1];
    if (actual === fin) {
      return [...previos, ...camino.map((id) => NODOS[id])];
    }
    for (const vecino of CONEXIONES[actual]) {
      if (!visitados.has(vecino)) {
        visitados.add(vecino);
        cola.push([...camino, vecino]);
      }
    }
  }
  return [];
}

/** Lleva a cada tripulante a un puesto separado dentro del cuarto seguro del refugio. */
export function calcularRutaAlRefugio(quien: CrewId, desdeX: number, desdeZ: number): PuntoRuta[] {
  return [...calcularRutaFija(desdeX, desdeZ, 'refugio'), POSICIONES_REFUGIO[quien]];
}

export type TransicionRefugio = 'iniciar' | 'continuar' | 'liberar' | 'inactivo';

/** Decide el cambio de control sin reiniciar rutas entre alerta y tormenta. */
export function resolverTransicionRefugio(fase: Phase, activo: boolean): TransicionRefugio {
  const debeRefugiarse = fase === 'refugio' || fase === 'tormenta';
  if (debeRefugiarse) return activo ? 'continuar' : 'iniciar';
  return activo ? 'liberar' : 'inactivo';
}
