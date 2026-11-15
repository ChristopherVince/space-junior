import type { CrewId, ModuleId, Phase } from '../state/types';

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
  | 'pasilloNorte'
  | 'pasilloCentro'
  | 'comunicaciones'
  | 'comunicacionesEnergia'
  | 'puertaEnergia'
  | 'energia'
  | 'comunicacionesEnfermeria'
  | 'puertaEnfermeria'
  | 'enfermeria';

const NODOS: Record<NodoId, PuntoRuta> = {
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

function nodoMasCercano(x: number, z: number): NodoId {
  let mejor: NodoId = 'pasilloCentro';
  let mejorDist = Infinity;
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
  const fin = NODO_POR_MODULO[destino];
  if (inicio === fin) return [NODOS[fin]];

  const cola: NodoId[][] = [[inicio]];
  const visitados = new Set<NodoId>([inicio]);

  while (cola.length > 0) {
    const camino = cola.shift()!;
    const actual = camino[camino.length - 1];
    if (actual === fin) {
      return camino.slice(1).map((id) => NODOS[id]);
    }
    for (const vecino of CONEXIONES[actual]) {
      if (!visitados.has(vecino)) {
        visitados.add(vecino);
        cola.push([...camino, vecino]);
      }
    }
  }
  return [NODOS[fin]];
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
