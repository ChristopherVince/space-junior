import { RoundedBox } from '@react-three/drei';
import { PALETA } from '../scene/palette';
import { Cimiento, Riba, Ventana } from './primitives';

const SACOS = [
  { x: -2.35, z: 2.55, giro: 0.4 },
  { x: -0.9, z: 2.62, giro: 1.1 },
  { x: 0.95, z: 2.6, giro: 2.2 },
  { x: 2.4, z: 2.5, giro: 0.8 },
  { x: 3.25, z: 0.55, giro: 1.7 },
  { x: 3.22, z: -1.25, giro: 0.2 },
];

/** Refugio: bajo, macizo y reforzado. La puerta sellada y el blindaje son el mensaje. */
export function ShelterModule() {
  return (
    <group>
      <Cimiento ancho={6.2} fondo={4.8} alto={0.34} radio={0.18} color={PALETA.refugio} />

      <RoundedBox
        args={[5.6, 1.6, 4.2]}
        radius={0.16}
        smoothness={2}
        bevelSegments={2}
        position={[0, 1.14, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.refugio} roughness={0.95} flatShading />
      </RoundedBox>

      {/* Costillas laterales de refuerzo */}
      {[-2.2, -1.1, 1.1, 2.2].map((x) => (
        <Riba key={x} posicion={[x, 1.14, 0]} largo={0.2} alto={1.62} fondo={4.24} />
      ))}

      <RoundedBox
        args={[6, 0.55, 4.6]}
        radius={0.14}
        smoothness={2}
        bevelSegments={2}
        position={[0, 2.21, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.refugioOscuro} roughness={0.95} flatShading />
      </RoundedBox>

      {/* Escotilla superior */}
      <RoundedBox
        args={[1.3, 0.22, 1.1]}
        radius={0.06}
        smoothness={2}
        position={[0.5, 2.58, -0.5]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.6} metalness={0.25} flatShading />
      </RoundedBox>

      {/* Puerta sellada hacia el hábitat */}
      <group position={[0, 0, -2.08]}>
        <mesh position={[0, 1.16, 0]} castShadow>
          <boxGeometry args={[1.8, 1.72, 0.14]} />
          <meshStandardMaterial color={PALETA.refugioOscuro} roughness={0.95} flatShading />
        </mesh>
        <mesh position={[0, 1.16, -0.06]} castShadow>
          <boxGeometry args={[1.5, 1.46, 0.14]} />
          <meshStandardMaterial color={PALETA.metal} roughness={0.55} metalness={0.3} flatShading />
        </mesh>
        <mesh position={[0, 1.16, -0.16]}>
          <torusGeometry args={[0.28, 0.055, 6, 20]} />
          <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.52, -0.15]}>
          <boxGeometry args={[1.3, 0.09, 0.04]} />
          <meshStandardMaterial color={PALETA.coral} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.36, -0.15]}>
          <boxGeometry args={[1.3, 0.09, 0.04]} />
          <meshStandardMaterial color={PALETA.coral} roughness={0.8} />
        </mesh>
      </group>

      {/* Compuerta circular en la cara visible */}
      <mesh position={[0.9, 1.2, 2.12]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.16, 16]} />
        <meshStandardMaterial color={PALETA.metal} roughness={0.55} metalness={0.3} flatShading />
      </mesh>
      <mesh position={[0.9, 1.2, 2.21]}>
        <torusGeometry args={[0.62, 0.055, 6, 24]} />
        <meshStandardMaterial color={PALETA.refugioOscuro} roughness={0.8} />
      </mesh>

      <Ventana posicion={[-1.5, 1.5, 2.11]} ancho={0.5} alto={0.36} />

      {/* Baliza sobre el techo */}
      <mesh position={[2.45, 2.6, 1.7]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.26, 8]} />
        <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[2.45, 2.78, 1.7]}>
        <sphereGeometry args={[0.075, 10, 8]} />
        <meshStandardMaterial
          color={PALETA.coral}
          emissive={PALETA.coral}
          emissiveIntensity={1.4}
          roughness={0.4}
        />
      </mesh>

      {/* Berma de sacos de arena: blindaje improvisado */}
      {SACOS.map((saco) => (
        <mesh
          key={`${saco.x}-${saco.z}`}
          position={[saco.x, 0.16, saco.z]}
          rotation={[0.2, saco.giro, 0.1]}
          scale={[0.55, 0.3, 0.46]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={PALETA.rocaOscura} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}
