export type ModuleKey =
  | 'dormitorios'
  | 'invernadero'
  | 'habitat'
  | 'investigacion'
  | 'enfermeria'
  | 'energia';

export interface ModuloEscena {
  /** Centro X/Z de la zona interactiva dentro de la planta de Mars Dune Alpha. */
  posicion: [number, number];
  /** Radios del anillo de resalte. */
  anchoResalte: number;
  fondoResalte: number;
  /** Altura del tooltip flotante. */
  alturaEtiqueta: number;
}

export const MODULOS: Record<ModuleKey, ModuloEscena> = {
  dormitorios: { posicion: [-8.1, 0], anchoResalte: 2.2, fondoResalte: 5.1, alturaEtiqueta: 2.1 },
  invernadero: { posicion: [-3.9, 0], anchoResalte: 2.5, fondoResalte: 5.1, alturaEtiqueta: 2.1 },
  habitat: { posicion: [0.1, 0], anchoResalte: 1.9, fondoResalte: 5.1, alturaEtiqueta: 2.1 },
  investigacion: { posicion: [5.9, 0.1], anchoResalte: 4.2, fondoResalte: 1.9, alturaEtiqueta: 2.1 },
  enfermeria: { posicion: [7.7, 3.4], anchoResalte: 2.4, fondoResalte: 1.7, alturaEtiqueta: 2.1 },
  energia: { posicion: [0, -7.1], anchoResalte: 3.4, fondoResalte: 1.6, alturaEtiqueta: 2.2 },
};

export interface Tramo {
  desde: [number, number];
  hasta: [number, number];
}

/** Senderos exteriores que unen las esclusas del hábitat con los paneles solares y el acceso. */
export const CAMINOS: Tramo[] = [
  { desde: [0, -5.2], hasta: [0, -6.2] },
  { desde: [-5.3, 5.2], hasta: [-5.3, 6.6] },
  { desde: [7.4, 5.2], hasta: [7.4, 6.6] },
];

export const PLAZOLETAS: [number, number][] = CAMINOS.map((tramo) => tramo.hasta);
