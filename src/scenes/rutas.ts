import type { CrewId, ModuleId, Phase } from '../state/types';
import { segmentoTransitable } from './diorama/collision.ts';

export interface PuntoRuta {
  x: number;
  z: number;
}

type NodoBase =
  | 'refugio'
  | 'puertaRefugio'
  | 'aproximacionRefugio'
  | 'invernaderoPasillo'
  | 'invernaderoOesteNorte'
  | 'invernaderoNorte'
  | 'pasilloNorte'
  | 'pasilloCentro'
  | 'comunicaciones'
  | 'comunicacionesEnergia'
  | 'puertaEnergia'
  | 'energia'
  | 'comunicacionesEnfermeria'
  | 'puertaEnfermeria'
  | 'enfermeria';
type NodoId = NodoBase | 'habitacionNorte' | 'habitacionSur' | 'habitacionExtremoSur' | 'oesteNorte' | 'oesteSur' | 'oesteExtremoSur' | 'surCentral' | 'surPasillo' | 'wcNorte' | 'wcSur' | 'puertaWcNorte' | 'puertaWcSur' | 'gimnasio' | 'puertaGimnasio' | 'antesGimnasio' | 'banoEste' | 'puertaBano' | 'antesBano' | 'pasoBano' | 'banoCentral';

const NODOS: Record<NodoId, PuntoRuta> = {
  habitacionNorte: { x: -8, z: -3.65 },
  habitacionSur: { x: -8, z: 1.25 },
  habitacionExtremoSur: { x: -8, z: 3.65 },
  oesteNorte: { x: -5.5, z: -3.65 },
  oesteSur: { x: -5.5, z: 1.25 },
  oesteExtremoSur: { x: -5.5, z: 3.65 },
  surCentral: { x: -3.6, z: 3.3 },
  surPasillo: { x: 0.1, z: 3.3 },
  wcNorte: { x: -4.35, z: -0.39 },
  wcSur: { x: -4.35, z: 0.39 },
  puertaWcNorte: { x: -5.5, z: -0.39 },
  puertaWcSur: { x: -5.5, z: 0.39 },
  gimnasio: { x: 4.2, z: -3.3 },
  puertaGimnasio: { x: 4.2, z: -2.05 },
  antesGimnasio: { x: 4.2, z: -1.1 },
  banoEste: { x: 7.75, z: -3.3 },
  puertaBano: { x: 7.75, z: -2.05 },
  antesBano: { x: 7.75, z: -1.1 },
  pasoBano: { x: 6.6, z: -1.95 },
  banoCentral: { x: 6.6, z: -3.3 },
  refugio: { x: -7.8, z: -1.25 },
  puertaRefugio: { x: -6.2, z: -1.25 },
  aproximacionRefugio: { x: -5.6, z: -1.25 },
  invernaderoPasillo: { x: -5.5, z: 0 },
  invernaderoOesteNorte: { x: -5.5, z: -2.9 },
  invernaderoNorte: { x: -3.6, z: -3.3 },
  pasilloNorte: { x: 0.1, z: -3.3 },
  pasilloCentro: { x: 0.1, z: 0 },
  comunicaciones: { x: 4.0, z: 0.1 },
  comunicacionesEnergia: { x: 3.6, z: 1.2 },
  puertaEnergia: { x: 3.6, z: 1.8 },
  energia: { x: 3.6, z: 3.2 },
  comunicacionesEnfermeria: { x: 7.6, z: 1.2 },
  puertaEnfermeria: { x: 7.6, z: 1.8 },
  enfermeria: { x: 7.6, z: 3.2 },
};

const CONEXIONES: Record<NodoId, NodoId[]> = {
  habitacionNorte: ['oesteNorte'],
  habitacionSur: ['oesteSur'],
  habitacionExtremoSur: ['oesteExtremoSur'],
  oesteNorte: ['habitacionNorte', 'invernaderoOesteNorte'],
  oesteSur: ['habitacionSur', 'invernaderoPasillo', 'oesteExtremoSur'],
  oesteExtremoSur: ['habitacionExtremoSur', 'oesteSur', 'surCentral'],
  surCentral: ['oesteExtremoSur', 'surPasillo'],
  surPasillo: ['surCentral', 'pasilloCentro'],
  wcNorte: ['puertaWcNorte'],
  wcSur: ['puertaWcSur'],
  puertaWcNorte: ['wcNorte', 'invernaderoPasillo'],
  puertaWcSur: ['wcSur', 'invernaderoPasillo'],
  gimnasio: ['puertaGimnasio'],
  puertaGimnasio: ['gimnasio', 'antesGimnasio'],
  antesGimnasio: ['puertaGimnasio', 'comunicaciones'],
  banoEste: ['puertaBano'],
  puertaBano: ['banoEste', 'antesBano', 'pasoBano'],
  antesBano: ['puertaBano', 'comunicaciones'],
  pasoBano: ['puertaBano', 'banoCentral'],
  banoCentral: ['pasoBano'],
  refugio: ['puertaRefugio'],
  puertaRefugio: ['refugio', 'aproximacionRefugio'],
  aproximacionRefugio: ['puertaRefugio', 'invernaderoPasillo', 'invernaderoOesteNorte'],
  invernaderoPasillo: ['aproximacionRefugio', 'invernaderoOesteNorte'],
  invernaderoOesteNorte: ['aproximacionRefugio', 'invernaderoPasillo', 'invernaderoNorte'],
  invernaderoNorte: ['invernaderoOesteNorte', 'pasilloNorte'],
  pasilloNorte: ['invernaderoNorte', 'pasilloCentro'],
  pasilloCentro: ['pasilloNorte', 'comunicaciones'],
  comunicaciones: ['pasilloCentro', 'comunicacionesEnergia', 'comunicacionesEnfermeria'],
  comunicacionesEnergia: ['comunicaciones', 'puertaEnergia'],
  puertaEnergia: ['comunicacionesEnergia', 'energia'],
  energia: ['puertaEnergia'],
  comunicacionesEnfermeria: ['comunicaciones', 'puertaEnfermeria'],
  puertaEnfermeria: ['comunicacionesEnfermeria', 'enfermeria'],
  enfermeria: ['puertaEnfermeria'],
};

// Completar las conexiones inversas de las ramas fijas añadidas al mapa.
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
  comandante: { x: -8.7, z: -0.7 },
  ingeniero: { x: -8.7, z: -1.8 },
  medico: { x: -7.7, z: -1.8 },
  cientifico: { x: -7.7, z: -0.7 },
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
