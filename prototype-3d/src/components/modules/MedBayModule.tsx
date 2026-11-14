import { RoundedBox } from '@react-three/drei';
import { PALETA } from '../scene/palette';
import { Cimiento, Ventana } from './primitives';

/** Enfermería: módulo limpio en crema con acento coral y cruz médica en la fachada. */
export function MedBayModule() {
  return (
    <group>
      <Cimiento ancho={4.6} fondo={4.6} alto={0.3} />

      <RoundedBox
        args={[4, 2.1, 3.5]}
        radius={0.16}
        smoothness={2}
        bevelSegments={2}
        position={[0, 1.35, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.muro} roughness={0.82} flatShading />
      </RoundedBox>

      {/* Filete coral bajo el techo */}
      <mesh position={[0, 2.41, 0]} castShadow>
        <boxGeometry args={[4.06, 0.09, 3.56]} />
        <meshStandardMaterial color={PALETA.coral} roughness={0.8} flatShading />
      </mesh>

      <RoundedBox
        args={[4.25, 0.35, 3.75]}
        radius={0.12}
        smoothness={2}
        bevelSegments={2}
        position={[0, 2.575, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.muroCalido} roughness={0.85} flatShading />
      </RoundedBox>

      {/* Cruz médica en relieve */}
      <group position={[0, 1.78, 1.79]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 1, 0.1]} />
          <meshStandardMaterial color={PALETA.coral} roughness={0.7} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.26, 0.1]} />
          <meshStandardMaterial color={PALETA.coral} roughness={0.7} />
        </mesh>
      </group>

      {/* Puerta con toldo */}
      <group position={[-1.15, 0, 1.76]}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[1.05, 1.3, 0.08]} />
          <meshStandardMaterial color={PALETA.muroCalido} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.9, 0.05]} castShadow>
          <boxGeometry args={[0.85, 1.05, 0.07]} />
          <meshStandardMaterial color={PALETA.coral} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.05, 0.1]}>
          <boxGeometry args={[0.36, 0.4, 0.02]} />
          <meshStandardMaterial
            color={PALETA.ventana}
            emissive={PALETA.ventana}
            emissiveIntensity={0.42}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 1.98, 0]} castShadow>
          <boxGeometry args={[0.5, 0.09, 0.1]} />
          <meshStandardMaterial
            color={PALETA.coral}
            emissive={PALETA.coral}
            emissiveIntensity={0.35}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0, 1.72, 0.22]} castShadow>
          <boxGeometry args={[1.3, 0.08, 0.55]} />
          <meshStandardMaterial color={PALETA.muroCalido} roughness={0.85} />
        </mesh>
      </group>

      <Ventana posicion={[1.25, 1.9, 1.76]} />
      <Ventana posicion={[2.01, 1.9, -0.6]} giro={Math.PI / 2} ancho={0.5} alto={0.44} />

      {/* Unidad técnica en el techo */}
      <RoundedBox
        args={[1.05, 0.55, 0.95]}
        radius={0.08}
        smoothness={2}
        bevelSegments={2}
        position={[1.1, 3.02, -0.7]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.metal} roughness={0.6} metalness={0.25} flatShading />
      </RoundedBox>
      <mesh position={[1.1, 3.34, -0.7]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.16, 10]} />
        <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.55} metalness={0.3} flatShading />
      </mesh>
    </group>
  );
}
