// Forma del terreno compartida por el suelo y las rocas, para que nada flote
// ni se entierre sobre las dunas del borde.

export const ARENA = { ancho: 25.2, fondo: 19.2 } as const;

/** Altura (Y) de la arena en un punto. 0 en el centro llano; sube hacia el borde. */
export function alturaArena(x: number, z: number): number {
  const borde = Math.max(Math.abs(x) / (ARENA.ancho / 2), Math.abs(z) / (ARENA.fondo / 2));
  const t = Math.min(1, Math.max(0, (borde - 0.8) / 0.2));
  if (t === 0) return 0;
  const onda = 0.5 + 0.5 * Math.sin(x * 1.9 + z * 1.3) * Math.cos(z * 2.1 - x * 0.7);
  return t * t * (0.08 + 0.22 * onda);
}
