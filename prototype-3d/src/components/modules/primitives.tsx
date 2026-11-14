import { RoundedBox } from '@react-three/drei';
import { PALETA } from '../scene/palette';

type Vec3 = [number, number, number];

interface CimientoProps {
  ancho: number;
  fondo: number;
  alto?: number;
  radio?: number;
  color?: string;
}

/** Losa de cimentación baja y redondeada sobre la que se apoya cada módulo. */
export function Cimiento({ ancho, fondo, alto = 0.3, radio = 0.14, color = PALETA.cimiento }: CimientoProps) {
  return (
    <RoundedBox
      args={[ancho, alto, fondo]}
      radius={Math.min(radio, alto / 2 - 0.01, ancho / 2 - 0.01, fondo / 2 - 0.01)}
      smoothness={2}
      bevelSegments={2}
      position={[0, alto / 2, 0]}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial color={color} roughness={0.92} flatShading />
    </RoundedBox>
  );
}

interface CapsulaProps {
  radio: number;
  largo: number;
  posicion?: Vec3;
  rotacion?: Vec3;
  color?: string;
  rugosidad?: number;
}

/**
 * Volumen principal de los hábitats: cápsula low poly.
 * Por defecto su eje queda sobre X (cápsula "acostada").
 */
export function Capsula({
  radio,
  largo,
  posicion = [0, 0, 0],
  rotacion = [0, 0, Math.PI / 2],
  color = PALETA.muro,
  rugosidad = 0.82,
}: CapsulaProps) {
  return (
    <mesh position={posicion} rotation={rotacion} castShadow receiveShadow>
      <capsuleGeometry args={[radio, largo, 4, 14]} />
      <meshStandardMaterial color={color} roughness={rugosidad} flatShading />
    </mesh>
  );
}

interface EsclusaProps {
  posicion?: Vec3;
  giro?: number;
  escala?: number;
  color?: string;
  colorPuerta?: string;
}

/** Pequeña esclusa de entrada con puerta, ventanilla y peldano. */
export function Esclusa({
  posicion = [0, 0, 0],
  giro = 0,
  escala = 1,
  color = PALETA.muroCalido,
  colorPuerta = PALETA.acento,
}: EsclusaProps) {
  return (
    <group position={posicion} rotation-y={giro} scale={escala}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.66, 1.1, 14]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 1.17, 0]} castShadow>
        <cylinderGeometry args={[0.66, 0.6, 0.14, 14]} />
        <meshStandardMaterial color={PALETA.muro} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.55, 0.6]} castShadow>
        <boxGeometry args={[0.54, 0.84, 0.09]} />
        <meshStandardMaterial color={colorPuerta} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.62, 0.655]}>
        <boxGeometry args={[0.3, 0.44, 0.02]} />
        <meshStandardMaterial
          color={PALETA.resalte}
          emissive={PALETA.ventana}
          emissiveIntensity={0.45}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.05, 0.86]} receiveShadow>
        <boxGeometry args={[1.12, 0.1, 0.52]} />
        <meshStandardMaterial color={PALETA.losaBorde} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.34, 0.5]} castShadow>
        <boxGeometry args={[0.92, 0.1, 0.54]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

interface VentanaProps {
  posicion?: Vec3;
  giro?: number;
  ancho?: number;
  alto?: number;
  intensidad?: number;
}

/** Ventana mínima con marco y luz cálida de interior. */
export function Ventana({ posicion = [0, 0, 0], giro = 0, ancho = 0.62, alto = 0.4, intensidad = 0.5 }: VentanaProps) {
  return (
    <group position={posicion} rotation-y={giro}>
      <mesh>
        <boxGeometry args={[ancho + 0.14, alto + 0.14, 0.07]} />
        <meshStandardMaterial color={PALETA.cimientoOscuro} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[ancho, alto, 0.04]} />
        <meshStandardMaterial
          color={PALETA.ventana}
          emissive={PALETA.ventana}
          emissiveIntensity={intensidad}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

interface PanelSolarProps {
  posicion?: Vec3;
  inclinacion?: number;
  giro?: number;
}

/** Panel solar inclinado con mástil, marco claro y celdas azules. */
export function PanelSolar({ posicion = [0, 0, 0], inclinacion = -0.46, giro = 0 }: PanelSolarProps) {
  return (
    <group position={posicion} rotation-y={giro}>
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.72, 8]} />
        <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.55} metalness={0.35} flatShading />
      </mesh>
      <group position={[0, 0.78, 0]} rotation-x={inclinacion}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.78, 0.07, 1.16]} />
          <meshStandardMaterial color={PALETA.muroCalido} roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[1.64, 0.03, 1.04]} />
          <meshStandardMaterial color={PALETA.panelSolar} roughness={0.3} metalness={0.18} />
        </mesh>
        {[-0.42, 0, 0.42].map((dx) => (
          <mesh key={dx} position={[dx, 0.074, 0]}>
            <boxGeometry args={[0.024, 0.02, 1.04]} />
            <meshStandardMaterial color={PALETA.panelSolarBrillo} roughness={0.45} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

interface RibaProps {
  posicion?: Vec3;
  largo: number;
  alto: number;
  fondo: number;
  color?: string;
}

/** Costilla de refuerzo vertical (refugio y módulos robustos). */
export function Riba({ posicion = [0, 0, 0], largo, alto, fondo, color = PALETA.refugioOscuro }: RibaProps) {
  return (
    <mesh position={posicion} castShadow receiveShadow>
      <boxGeometry args={[largo, alto, fondo]} />
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </mesh>
  );
}
