import type { CrewId, ModuleId, Phase } from '../state/types';
import { segmentoTransitable } from './diorama/collision.ts';

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
  | 'habitacionSur'
  | 'habitacionExtremoSur'
  | 'oesteNorte'
  | 'oesteSur'
  | 'oesteExtremoSur'
  | 'surCentral';

export const NODOS: Record<NodoId, PuntoRuta> = {
  habitacionNorte: { x: -7.6, z: -3.65 },
  habitacionSur: { x: -7.6, z: 1.25 },
  habitacionExtremoSur: { x: -7.6, z: 3.65 },
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
  habitacionNorte: ['oesteNorte'],
  habitacionSur: ['oesteSur'],
  habitacionExtremoSur: ['oesteExtremoSur'],
  oesteNorte: ['habitacionNorte', 'invernaderoOesteNorte'],
  oesteSur: ['habitacionSur', 'invernaderoPasillo', 'oesteExtremoSur'],
  oesteExtremoSur: ['habitacionExtremoSur', 'oesteSur', 'surCentral'],
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

const POSICIONES_REFUGIO: Record<CrewId, PuntoRuta> = {
  comandante: { x: -7.65, z: -0.68 },
  cientifico: { x: -7.0, z: -0.68 },
  ingeniero: { x: -7.55, z: -1.92 },
  medico: { x: -7.55, z: -1.25 },
};

function nodoMasCercano(x: number, z: number): NodoId | null {
  let mejor: NodoId | null = null;
  let mejorDist = Infinity;
  for (const [id, p] of Object.entries(NODOS) as [NodoId, PuntoRuta][]) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < mejorDist && segmentoTransitable({ x, z }, p)) {
      mejorDist = d;
      mejor = id;
    }
  }
  if (mejor) return mejor;
  // Si el personaje está pegado a un borde y ningún segmento directo pasa con holgura,
  // elige el nodo más cercano en distancia euclidiana para desatorarlo suavemente.
  for (const [id, p] of Object.entries(NODOS) as [NodoId, PuntoRuta][]) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < mejorDist) {
      mejorDist = d;
      mejor = id;
    }
  }
  return mejor;
}

/**
 * Calcula una ruta fija por los pasillos y puertas de Mars Dune Alpha
 * desde la posición actual hasta el módulo destino.
 */
export function calcularRutaFija(desdeX: number, desdeZ: number, destino: ModuleId): PuntoRuta[] {
  const inicio = nodoMasCercano(desdeX, desdeZ);
  if (!inicio) return [];
  const fin = NODO_POR_MODULO[destino];
  if (inicio === fin) return [NODOS[fin]];

  const cola: NodoId[][] = [[inicio]];
  const visitados = new Set<NodoId>([inicio]);

  while (cola.length > 0) {
    const camino = cola.shift()!;
    const actual = camino[camino.length - 1];
    if (actual === fin) {
      return camino.map((id) => NODOS[id]);
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
