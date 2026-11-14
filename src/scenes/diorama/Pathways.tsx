import { PALETA } from './palette';
import { CAMINOS, PLAZOLETAS, type Tramo } from './layout';

const ANCHO_LOSA = 1.35;

function Losa({ desde, hasta }: Tramo) {
  const dx = hasta[0] - desde[0];
  const dz = hasta[1] - desde[1];
  const largo = Math.hypot(dx, dz);
  const giro = -Math.atan2(dz, dx);
  const juntas = Math.max(0, Math.floor(largo / 0.95) - 1);

  return (
    <group
      position={[(desde[0] + hasta[0]) / 2, 0, (desde[1] + hasta[1]) / 2]}
      rotation-y={giro}
    >
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[largo + 0.2, 0.06, ANCHO_LOSA + 0.22]} />
        <meshStandardMaterial color={PALETA.losaBorde} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.085, 0]} receiveShadow>
        <boxGeometry args={[largo, 0.07, ANCHO_LOSA]} />
        <meshStandardMaterial color={PALETA.losa} roughness={0.92} />
      </mesh>
      {Array.from({ length: juntas }, (_, indice) => (
        <mesh
          key={indice}
          position={[-largo / 2 + (largo / (juntas + 1)) * (indice + 1), 0.123, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.16, 0.012, ANCHO_LOSA]} />
          <meshStandardMaterial color={PALETA.losaBorde} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Plazoleta({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.06, 16]} />
        <meshStandardMaterial color={PALETA.losaBorde} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.088, 0]} receiveShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.07, 16]} />
        <meshStandardMaterial color={PALETA.losa} roughness={0.92} />
      </mesh>
    </group>
  );
}

/** Senderos y plazolitas que unen el hábitat central con cada módulo. */
export function Pathways() {
  return (
    <group>
      {CAMINOS.map((tramo) => (
        <Losa key={`${tramo.desde[0]}-${tramo.desde[1]}-${tramo.hasta[0]}-${tramo.hasta[1]}`} {...tramo} />
      ))}
      {PLAZOLETAS.map(([x, z]) => (
        <Plazoleta key={`${x}-${z}`} x={x} z={z} />
      ))}
    </group>
  );
}
