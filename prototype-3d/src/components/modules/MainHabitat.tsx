import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PALETA } from '../scene/palette';
import { Capsula, Cimiento, Esclusa, Ventana } from './primitives';

/**
 * Hábitat central: el volumen más grande del diorama.
 * Cápsula acostada + anexo trasero bajo + cupulilla cenital, como la zona común de Mars Dune Alpha.
 */
export function MainHabitat() {
  return (
    <group>
      <Cimiento ancho={9.6} fondo={5.6} alto={0.3} />

      {/* Cuerpo principal */}
      <Capsula radio={1.55} largo={3.6} posicion={[0, 1.62, 0.3]} />

      {/* Anexo trasero, más bajo y cálido */}
      <Capsula radio={0.95} largo={2.6} posicion={[0.35, 1.0, -1.85]} color={PALETA.muroCalido} />

      {/* Bandas terracota alrededor del cuerpo */}
      {[-1.25, 1.25].map((x) => (
        <mesh key={x} position={[x, 1.62, 0.3]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[1.57, 0.065, 6, 28]} />
          <meshStandardMaterial color={PALETA.acento} roughness={0.75} flatShading />
        </mesh>
      ))}

      {/* Cupulilla cenital cálida */}
      <mesh position={[1.05, 3.14, 0.3]} castShadow>
        <cylinderGeometry args={[0.66, 0.7, 0.16, 16]} />
        <meshStandardMaterial color={PALETA.muro} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[1.05, 3.2, 0.3]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.58, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={PALETA.ventana}
          emissive={PALETA.ventana}
          emissiveIntensity={0.3}
          transparent
          opacity={0.62}
          roughness={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Ventanas al frente y en el extremo visible */}
      <Ventana posicion={[-1.35, 2.3, 1.86]} />
      <Ventana posicion={[1.75, 2.3, 1.86]} />
      <Ventana posicion={[3.31, 1.85, 0.3]} giro={Math.PI / 2} ancho={0.5} alto={0.5} />

      {/* Esclusa de entrada principal */}
      <Esclusa posicion={[0.35, 0.3, 1.9]} color={PALETA.muro} colorPuerta={PALETA.acento} />

      {/* Compuerta trasera, hacia el módulo de investigación */}
      <mesh position={[0.35, 1.05, -2.78]} castShadow>
        <boxGeometry args={[1.15, 1.15, 0.1]} />
        <meshStandardMaterial color={PALETA.muroCalido} roughness={0.85} flatShading />
      </mesh>
      <Ventana posicion={[0.35, 1.1, -2.84]} giro={Math.PI} ancho={0.34} alto={0.34} />

      {/* Paneles térmicos sobre el anexo */}
      {[-0.55, 0.95].map((x) => (
        <RoundedBox
          key={x}
          args={[1.15, 0.1, 0.95]}
          radius={0.04}
          smoothness={2}
          bevelSegments={2}
          position={[x, 1.89, -1.85]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={PALETA.panelSolar} roughness={0.35} metalness={0.15} flatShading />
        </RoundedBox>
      ))}
    </group>
  );
}
