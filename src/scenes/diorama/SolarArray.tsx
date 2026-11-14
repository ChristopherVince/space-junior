import { RoundedBox } from '@react-three/drei';
import { PALETA } from './palette';
import { Cimiento, PanelSolar } from './primitives';

/** Zona de energía: cuatro paneles inclinados y una unidad de baterías al costado. */
export function SolarArray() {
  return (
    <group>
      <Cimiento ancho={5} fondo={4.4} alto={0.24} />

      {[-1.05, 1.05].map((x) =>
        [-0.95, 0.95].map((z) => (
          <PanelSolar
            key={`${x}-${z}`}
            posicion={[x, 0.24, z]}
            inclinacion={z > 0 ? -0.5 : -0.42}
          />
        )),
      )}

      {/* Unidad de baterías y transformador */}
      <RoundedBox
        args={[0.95, 1.05, 0.9]}
        radius={0.08}
        smoothness={2}
        bevelSegments={2}
        position={[2, 0.765, -1.95]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.muroCalido} roughness={0.8} flatShading />
      </RoundedBox>
      <mesh position={[2, 0.78, -1.49]} castShadow>
        <boxGeometry args={[0.7, 0.8, 0.05]} />
        <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.55} metalness={0.3} />
      </mesh>
      <mesh position={[2, 1.2, -1.46]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial
          color={PALETA.coral}
          emissive={PALETA.coral}
          emissiveIntensity={1.2}
          roughness={0.4}
        />
      </mesh>
      {[1.78, 2.2].map((x) => (
        <mesh key={x} position={[x, 1.34, -2.12]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.14, 10]} />
          <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.55} metalness={0.3} flatShading />
        </mesh>
      ))}
    </group>
  );
}
