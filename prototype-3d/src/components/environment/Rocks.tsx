import { useMemo } from 'react';
import { PALETA } from '../scene/palette';
import { alturaArena } from './terrainShape';

interface Roca {
  x: number;
  z: number;
  s: number;
  color: string;
  giro: number;
}

// Rocas grandes: perímetro libre, sin tapar caminos ni módulos.
const ROCAS: Roca[] = [
  { x: -11.9, z: -8.7, s: 1.15, color: PALETA.roca, giro: 0.4 },
  { x: -11.3, z: -6.4, s: 0.62, color: PALETA.rocaOscura, giro: 1.9 },
  { x: -12.1, z: -2.0, s: 0.82, color: PALETA.roca, giro: 0.9 },
  { x: -11.7, z: 5.9, s: 0.95, color: PALETA.roca, giro: 2.6 },
  { x: -12.2, z: 7.7, s: 0.55, color: PALETA.rocaOscura, giro: 1.2 },
  { x: -10.6, z: 9.1, s: 0.5, color: PALETA.roca, giro: 0.2 },
  { x: -5.2, z: 9.2, s: 0.72, color: PALETA.rocaOscura, giro: 2.2 },
  { x: -3.6, z: 9.3, s: 0.4, color: PALETA.roca, giro: 1.5 },
  { x: 3.9, z: 9.2, s: 0.58, color: PALETA.roca, giro: 0.7 },
  { x: 7.0, z: 8.7, s: 0.78, color: PALETA.rocaOscura, giro: 2.9 },
  { x: 10.4, z: 8.9, s: 0.46, color: PALETA.roca, giro: 1.1 },
  { x: 12.2, z: 6.9, s: 0.88, color: PALETA.roca, giro: 0.5 },
  { x: 12.4, z: 2.6, s: 0.66, color: PALETA.rocaOscura, giro: 2.4 },
  { x: 11.9, z: -4.9, s: 0.52, color: PALETA.roca, giro: 1.7 },
  { x: 12.0, z: -7.7, s: 1.0, color: PALETA.roca, giro: 0.8 },
  { x: 10.5, z: -9.2, s: 0.55, color: PALETA.rocaOscura, giro: 2.0 },
  { x: 6.6, z: -9.3, s: 0.44, color: PALETA.roca, giro: 0.3 },
  { x: 2.9, z: -9.4, s: 0.5, color: PALETA.rocaOscura, giro: 1.4 },
  { x: -1.9, z: -9.3, s: 0.58, color: PALETA.roca, giro: 2.7 },
  { x: -4.8, z: -9.1, s: 0.4, color: PALETA.rocaOscura, giro: 0.6 },
];

function semillaAleatoria(semilla: number) {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Piedra {
  x: number;
  z: number;
  s: number;
  color: string;
  giro: number;
}

/** Piedritas alrededor de cada roca grande: da escala y textura al suelo. */
const PIEDRAS: Piedra[] = (() => {
  const azar = semillaAleatoria(20260514);
  const colores = [PALETA.roca, PALETA.rocaOscura, PALETA.arenaHonda];
  return ROCAS.flatMap((roca) =>
    Array.from({ length: 2 + (azar() > 0.5 ? 1 : 0) }, () => {
      const angulo = azar() * Math.PI * 2;
      const distancia = roca.s * (0.95 + azar() * 0.9);
      return {
        x: roca.x + Math.cos(angulo) * distancia,
        z: roca.z + Math.sin(angulo) * distancia,
        s: 0.1 + azar() * 0.13,
        color: colores[Math.floor(azar() * colores.length)] ?? PALETA.roca,
        giro: azar() * Math.PI,
      };
    }),
  );
})();

function Bloque({ x, z, s, color, giro }: Roca | Piedra) {
  const alto = s * 0.62;
  return (
    <mesh
      position={[x, alturaArena(x, z) + alto * 0.72, z]}
      rotation={[0.14, giro, 0.1]}
      scale={[s * 0.95, alto, s * 0.85]}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  );
}

function Piedrita({ x, z, s, color, giro }: Piedra) {
  return (
    <mesh
      position={[x, alturaArena(x, z) + s * 0.34, z]}
      rotation={[0.3, giro, 0.2]}
      scale={[s, s * 0.7, s * 0.9]}
      castShadow
      receiveShadow
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={1} flatShading />
    </mesh>
  );
}

export function Rocks() {
  const piedras = useMemo(() => PIEDRAS, []);
  return (
    <group>
      {ROCAS.map((roca) => (
        <Bloque key={`${roca.x}-${roca.z}`} {...roca} />
      ))}
      {piedras.map((piedra, indice) => (
        <Piedrita key={`${piedra.x.toFixed(2)}-${piedra.z.toFixed(2)}-${indice}`} {...piedra} />
      ))}
    </group>
  );
}
