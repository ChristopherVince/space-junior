import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PALETA } from '../scene/palette';
import { Capsula, Cimiento, Ventana } from './primitives';

const CUBICULOS = [-2.05, -0.68, 0.69, 2.06];
const RADIO_CUBICULO = 0.78;
const ALTURA_CUBICULO = 0.98;

/**
 * Ala de tripulación: cuatro cápsulas en hilera, una puerta por cubículo.
 * Referencia directa a los cuatro dormitorios del hábitat CHAPEA.
 */
export function CrewWing() {
  return (
    <group>
      <Cimiento ancho={3.2} fondo={6.8} alto={0.3} />

      {CUBICULOS.map((z) => (
        <group key={z}>
          <Capsula
            radio={RADIO_CUBICULO}
            largo={1.1}
            posicion={[0, ALTURA_CUBICULO, z]}
            rotacion={[Math.PI / 2, 0, 0]}
          />

          {/* Puerta del cubículo, hacia el pasillo interior */}
          <mesh position={[RADIO_CUBICULO, ALTURA_CUBICULO, z]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.82, 0.62]} />
            <meshStandardMaterial color={PALETA.muroCalido} roughness={0.85} flatShading />
          </mesh>
          <mesh position={[RADIO_CUBICULO + 0.085, ALTURA_CUBICULO, z]}>
            <boxGeometry args={[0.02, 0.54, 0.44]} />
            <meshStandardMaterial color={PALETA.acento} roughness={0.75} />
          </mesh>
          <mesh position={[RADIO_CUBICULO + 0.105, ALTURA_CUBICULO + 0.12, z]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.1, 0.1, 0.03, 10]} />
            <meshStandardMaterial
              color={PALETA.ventana}
              emissive={PALETA.ventana}
              emissiveIntensity={0.45}
              roughness={0.4}
            />
          </mesh>

          {/* Lucernario cenital */}
          <mesh position={[0, ALTURA_CUBICULO + RADIO_CUBICULO - 0.03, z]} castShadow>
            <cylinderGeometry args={[0.24, 0.26, 0.1, 12]} />
            <meshStandardMaterial color={PALETA.muro} roughness={0.8} flatShading />
          </mesh>
          <mesh position={[0, ALTURA_CUBICULO + RADIO_CUBICULO + 0.02, z]}>
            <sphereGeometry args={[0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color={PALETA.ventana}
              emissive={PALETA.ventana}
              emissiveIntensity={0.28}
              transparent
              opacity={0.7}
              roughness={0.25}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* Pasillo técnico delante de las puertas */}
      <mesh position={[1.12, 0.34, 0]} receiveShadow>
        <boxGeometry args={[0.88, 0.08, 6.2]} />
        <meshStandardMaterial color={PALETA.cimientoOscuro} roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Módulo de investigación y robótica: cúpula técnica, antena y compuerta. */
export function ResearchModule() {
  return (
    <group>
      <Cimiento ancho={4.4} fondo={3.8} alto={0.28} />

      <RoundedBox
        args={[3.8, 1.3, 3.2]}
        radius={0.14}
        smoothness={2}
        bevelSegments={2}
        position={[0, 0.93, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.muro} roughness={0.84} flatShading />
      </RoundedBox>

      {/* Cúpula técnica */}
      <mesh position={[0, 1.58, 0]} scale={[1, 0.55, 1]} castShadow receiveShadow>
        <sphereGeometry args={[1.15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={PALETA.metal} roughness={0.55} metalness={0.3} flatShading />
      </mesh>
      <mesh position={[0, 1.585, 0]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[1.15, 0.05, 6, 32]} />
        <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Mástil de comunicaciones */}
      <mesh position={[1.05, 2.5, -0.75]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 1.9, 8]} />
        <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[1.05, 3.42, -0.75]} rotation={[0, 0, -0.6]}>
        <sphereGeometry args={[0.4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={PALETA.muroCalido}
          roughness={0.55}
          metalness={0.2}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      <mesh position={[1.05, 3.6, -0.75]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial
          color={PALETA.coral}
          emissive={PALETA.coral}
          emissiveIntensity={1.3}
          roughness={0.4}
        />
      </mesh>

      {/* Equipo auxiliar sobre el techo */}
      <mesh position={[-1.3, 1.73, 0.7]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.3, 0.55]} />
        <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.6} metalness={0.25} flatShading />
      </mesh>

      {/* Compuerta de acceso */}
      <group position={[0, 0, 1.6]}>
        <mesh position={[0, 0.92, 0]} castShadow>
          <boxGeometry args={[1.1, 1.05, 0.1]} />
          <meshStandardMaterial color={PALETA.muroCalido} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.88, 0.06]} castShadow>
          <boxGeometry args={[0.85, 0.85, 0.08]} />
          <meshStandardMaterial color={PALETA.acento} roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0, 1.06, 0.11]}>
          <boxGeometry args={[0.34, 0.3, 0.02]} />
          <meshStandardMaterial
            color={PALETA.ventana}
            emissive={PALETA.ventana}
            emissiveIntensity={0.4}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 1.52, 0.28]} castShadow>
          <boxGeometry args={[1.4, 0.08, 0.62]} />
          <meshStandardMaterial color={PALETA.muroCalido} roughness={0.85} flatShading />
        </mesh>
      </group>

      <Ventana posicion={[1.93, 1.15, -0.9]} giro={Math.PI / 2} ancho={0.44} alto={0.34} />
    </group>
  );
}
