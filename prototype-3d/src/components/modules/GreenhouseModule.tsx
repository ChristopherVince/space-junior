import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PALETA } from '../scene/palette';
import { Cimiento } from './primitives';

const CULTIVOS = [-1.8, -0.9, 0, 0.9, 1.8];

/** Invernadero: muros bajos, cúpula translúcida y bancales con cultivos low poly. */
export function GreenhouseModule() {
  return (
    <group>
      <Cimiento ancho={4.8} fondo={6.2} alto={0.28} />

      <RoundedBox
        args={[4.3, 1, 5.7]}
        radius={0.14}
        smoothness={2}
        bevelSegments={2}
        position={[0, 0.78, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.muro} roughness={0.85} flatShading />
      </RoundedBox>

      {/* Bancales y cultivos, visibles a través del vidrio */}
      {[-1.15, 1.15].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.44, 0]} receiveShadow>
            <boxGeometry args={[0.78, 0.32, 4.6]} />
            <meshStandardMaterial color={PALETA.sueloCultivo} roughness={1} flatShading />
          </mesh>
          {CULTIVOS.map((z, indice) => (
            <mesh
              key={z}
              position={[x + ((indice % 2) - 0.5) * 0.16, 0.68, z]}
              scale={[1, 0.85, 1]}
              castShadow
            >
              <icosahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial
                color={indice % 2 === 0 ? PALETA.cultivo : PALETA.cultivoClaro}
                roughness={0.9}
                flatShading
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Cúpula de vidrio alargada */}
      <mesh position={[0, 1.28, 0]} scale={[1.06, 0.62, 1.42]}>
        <sphereGeometry args={[2, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={PALETA.vidrio}
          transparent
          opacity={0.42}
          roughness={0.18}
          metalness={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 1.285, 0]} rotation-x={-Math.PI / 2} scale={[2.12, 2.84, 1]}>
        <torusGeometry args={[1, 0.05, 6, 48]} />
        <meshStandardMaterial color={PALETA.vidrioBorde} roughness={0.5} />
      </mesh>

      {/* Remate de ventilación en la cúspide */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.14, 10]} />
        <meshStandardMaterial color={PALETA.muro} roughness={0.8} flatShading />
      </mesh>

      {/* Puerta sobre el muro este, hacia el sendero */}
      <group position={[2.15, 0, 2.2]}>
        <mesh position={[0, 0.82, 0]} castShadow>
          <boxGeometry args={[0.08, 0.92, 0.92]} />
          <meshStandardMaterial color={PALETA.muroCalido} roughness={0.85} />
        </mesh>
        <mesh position={[0.05, 0.78, 0]} castShadow>
          <boxGeometry args={[0.08, 0.72, 0.7]} />
          <meshStandardMaterial color={PALETA.acento} roughness={0.75} />
        </mesh>
        <mesh position={[0.1, 0.9, 0]}>
          <boxGeometry args={[0.02, 0.34, 0.34]} />
          <meshStandardMaterial
            color={PALETA.ventana}
            emissive={PALETA.ventana}
            emissiveIntensity={0.4}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0.27, 1.2, 0]} castShadow>
          <boxGeometry args={[0.62, 0.09, 1.15]} />
          <meshStandardMaterial color={PALETA.muroCalido} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.36, 0.06, 0]} receiveShadow>
          <boxGeometry args={[0.55, 0.12, 1.15]} />
          <meshStandardMaterial color={PALETA.losaBorde} roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}
