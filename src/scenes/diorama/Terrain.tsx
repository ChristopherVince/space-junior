import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { PALETA } from './palette';
import { ARENA, alturaArena } from './terrainShape';

/** Plataforma-diorama: base oscura, talud de roca y superficie de arena facetada. */
export function Terrain() {
  const arena = useMemo(() => {
    const geometria = new THREE.PlaneGeometry(ARENA.ancho, ARENA.fondo, 30, 24);
    geometria.rotateX(-Math.PI / 2);
    const posiciones = geometria.attributes.position;
    for (let i = 0; i < posiciones.count; i += 1) {
      posiciones.setY(i, alturaArena(posiciones.getX(i), posiciones.getZ(i)));
    }
    posiciones.needsUpdate = true;
    geometria.computeVertexNormals();
    return geometria;
  }, []);

  return (
    <group>
      {/* Base inferior, en roca oscura */}
      <RoundedBox
        args={[26.6, 0.9, 20.6]}
        radius={0.24}
        smoothness={2}
        bevelSegments={2}
        position={[0, -1.8, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color={PALETA.base} roughness={0.95} flatShading />
      </RoundedBox>

      {/* Talud de roca terracota (cara superior en y = -0.005, debajo de la arena) */}
      <RoundedBox
        args={[26, 1.35, 20]}
        radius={0.2}
        smoothness={2}
        bevelSegments={2}
        position={[0, -0.68, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color={PALETA.roca} roughness={0.95} flatShading />
      </RoundedBox>

      {/* Superficie de arena, con dunas solo hacia el borde */}
      <mesh geometry={arena} position={[0, 0.004, 0]} receiveShadow>
        <meshStandardMaterial color={PALETA.arena} roughness={1} flatShading side={THREE.DoubleSide} />
      </mesh>

      {/* Manchas de polvo más claro, apenas visibles */}
      {[
        { x: -3.4, z: -4.6, r: 1.9 },
        { x: 4.2, z: 0.6, r: 1.5 },
        { x: -2.4, z: 8.1, r: 1.6 },
      ].map((mancha) => (
        <mesh key={`${mancha.x}-${mancha.z}`} position={[mancha.x, 0.012, mancha.z]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[mancha.r, 9]} />
          <meshStandardMaterial color={PALETA.arenaClara} roughness={1} flatShading />
        </mesh>
      ))}

      {/* Montículos de arena en los huecos del perímetro */}
      {[
        { x: -11.9, z: -4.9, r: 1.1, alto: 0.16, color: PALETA.arenaHonda },
        { x: 11.7, z: -1.2, r: 1.25, alto: 0.19, color: PALETA.arenaClara },
        { x: 11.5, z: 8.7, r: 1.0, alto: 0.14, color: PALETA.arenaHonda },
        { x: -11.8, z: 8.9, r: 1.15, alto: 0.17, color: PALETA.arenaHonda },
        { x: -0.2, z: -9.2, r: 0.95, alto: 0.12, color: PALETA.arenaClara },
        { x: 4.6, z: 9.0, r: 1.05, alto: 0.15, color: PALETA.arenaHonda },
      ].map((duna) => (
        <mesh
          key={`${duna.x}-${duna.z}`}
          position={[duna.x, 0.02, duna.z]}
          scale={[duna.r, duna.alto, duna.r * 0.85]}
          receiveShadow
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={duna.color} roughness={1} flatShading />
        </mesh>
      ))}

      {/* Plano invisible que recoge la sombra proyectada del diorama */}
      <mesh position={[0, -2.35, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial transparent opacity={0.24} color="#5a2b18" />
      </mesh>
    </group>
  );
}
