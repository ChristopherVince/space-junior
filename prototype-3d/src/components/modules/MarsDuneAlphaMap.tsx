import * as THREE from 'three';
import { PALETA } from '../scene/palette';

const ALTURA_MURO = 1.12;
const GROSOR_MURO = 0.16;

interface MuroProps {
  x: number;
  z: number;
  ancho: number;
  fondo: number;
  alto?: number;
  color?: string;
}

function Muro({ x, z, ancho, fondo, alto = ALTURA_MURO, color = PALETA.muroCalido }: MuroProps) {
  return (
    <mesh position={[x, 0.14 + alto / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[ancho, alto, fondo]} />
      <meshStandardMaterial color={color} roughness={0.88} flatShading />
    </mesh>
  );
}

/** Muro exterior con textura ondulada impresa en 3D, igual al contorno de Mars Dune Alpha. */
function MuroOnduladoHorizontal({ x0, x1, z }: { x0: number; x1: number; z: number }) {
  const largo = x1 - x0;
  const cx = (x0 + x1) / 2;
  const cantidad = Math.max(1, Math.floor(largo / 0.72));
  return (
    <group>
      <Muro x={cx} z={z} ancho={largo} fondo={0.2} color="#aeb6be" />
      {Array.from({ length: cantidad }, (_, i) => {
        const px = x0 + (i + 0.5) * (largo / cantidad);
        return (
          <mesh key={px} position={[px, 0.14 + ALTURA_MURO / 2, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.14, 0.15, ALTURA_MURO, 8]} />
            <meshStandardMaterial color="#9da6af" roughness={0.9} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function MuroOnduladoVertical({ x, z0, z1 }: { x: number; z0: number; z1: number }) {
  const largo = z1 - z0;
  const cz = (z0 + z1) / 2;
  const cantidad = Math.max(1, Math.floor(largo / 0.72));
  return (
    <group>
      <Muro x={x} z={cz} ancho={0.2} fondo={largo} color="#aeb6be" />
      {Array.from({ length: cantidad }, (_, i) => {
        const pz = z0 + (i + 0.5) * (largo / cantidad);
        return (
          <mesh key={pz} position={[x, 0.14 + ALTURA_MURO / 2, pz]} castShadow receiveShadow>
            <cylinderGeometry args={[0.14, 0.15, ALTURA_MURO, 8]} />
            <meshStandardMaterial color="#9da6af" roughness={0.9} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function Piso({ x, z, ancho, fondo, color, y = 0.145 }: { x: number; z: number; ancho: number; fondo: number; color: string; y?: number }) {
  return (
    <mesh position={[x, y, z]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[ancho, fondo]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  );
}

function Estante({ x, z, ancho, fondo }: { x: number; z: number; ancho: number; fondo: number }) {
  return (
    <mesh position={[x, 0.14 + 0.32, z]} castShadow receiveShadow>
      <boxGeometry args={[ancho, 0.64, fondo]} />
      <meshStandardMaterial color="#f5f3ef" roughness={0.82} flatShading />
    </mesh>
  );
}

function Cama({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.15, z]}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.45, 0.32, 0.85]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-0.5, 0.35, 0]} castShadow>
        <boxGeometry args={[0.32, 0.1, 0.62]} />
        <meshStandardMaterial color="#b8d2ef" roughness={0.75} flatShading />
      </mesh>
    </group>
  );
}

function Planta({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.15, z]}>
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.28, 0.5]} />
        <meshStandardMaterial color={PALETA.sueloCultivo} roughness={0.95} flatShading />
      </mesh>
      {[-0.24, 0, 0.24].map((ox) => (
        <mesh key={ox} position={[ox, 0.36, 0]} castShadow>
          <dodecahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color={PALETA.cultivo} roughness={0.82} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Silla({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.35, z]} castShadow receiveShadow>
      <boxGeometry args={[0.36, 0.4, 0.36]} />
      <meshStandardMaterial color="#ede9e2" roughness={0.85} flatShading />
    </mesh>
  );
}

/**
 * Maqueta 3D fiel a la planta arquitectónica de Mars Dune Alpha (CHAPEA).
 * Muros cortados a media altura para lectura isométrica completa del interior.
 */
export function MarsDuneAlphaMap() {
  return (
    <group>
      {/* Losa de cimentación general de cemento */}
      <mesh position={[0, 0.07, 0]} receiveShadow castShadow>
        <boxGeometry args={[20.5, 0.14, 10.5]} />
        <meshStandardMaterial color="#a6abb2" roughness={0.95} flatShading />
      </mesh>

      {/* --- PISO INTERIOR DE CEMENTO --- */}
      <Piso x={0} z={0} ancho={20.0} fondo={9.9} color="#c3c7cc" y={0.146} />
      {/* Ligeras variaciones de losa de cemento en baños y áreas húmedas */}
      <Piso x={-3.65} z={0} ancho={2.3} fondo={4.4} color="#b4b9bf" y={0.15} />
      <Piso x={8.0} z={-3.3} ancho={4.0} fondo={3.3} color="#b4b9bf" y={0.15} />

      {/* --- MUROS EXTERIORES ONDULADOS (con huecos de esclusas reales) --- */}
      {/* Norte (z = -5) con esclusa en x = 8.4..9.4 */}
      <MuroOnduladoHorizontal x0={-10} x1={8.3} z={-5} />
      <MuroOnduladoHorizontal x0={9.5} x1={10} z={-5} />
      {/* Sur (z = +5) con esclusas en x = -5.8..-4.9 y x = 6.9..7.9 */}
      <MuroOnduladoHorizontal x0={-10} x1={-5.8} z={5} />
      <MuroOnduladoHorizontal x0={-4.8} x1={6.9} z={5} />
      <MuroOnduladoHorizontal x0={7.9} x1={10} z={5} />
      {/* Oeste (x = -10) */}
      <MuroOnduladoVertical x={-10} z0={-5} z1={5} />
      {/* Este (x = +10) con esclusa en z = -0.1..+0.9 */}
      <MuroOnduladoVertical x={10} z0={-5} z1={-0.2} />
      <MuroOnduladoVertical x={10} z0={1.0} z1={5} />

      {/* --- MUROS INTERIORES: 4 HABITACIONES --- */}
      <Muro x={-8.1} z={-2.5} ancho={3.8} fondo={GROSOR_MURO} />
      <Muro x={-8.1} z={0} ancho={3.8} fondo={GROSOR_MURO} />
      <Muro x={-8.1} z={2.5} ancho={3.8} fondo={GROSOR_MURO} />
      {/* Muro derecho de habitaciones (x = -6.2) con 4 puertas */}
      <Muro x={-6.2} z={-4.55} ancho={GROSOR_MURO} fondo={0.9} />
      <Muro x={-6.2} z={-2.5} ancho={GROSOR_MURO} fondo={1.3} />
      <Muro x={-6.2} z={0} ancho={GROSOR_MURO} fondo={1.3} />
      <Muro x={-6.2} z={2.5} ancho={GROSOR_MURO} fondo={1.3} />
      <Muro x={-6.2} z={4.55} ancho={GROSOR_MURO} fondo={0.9} />

      {/* --- BLOQUE CENTRAL WC / DUCHA EN INVERNADERO --- */}
      <Muro x={-3.65} z={-2.2} ancho={2.3} fondo={GROSOR_MURO} />
      <Muro x={-3.65} z={2.2} ancho={2.3} fondo={GROSOR_MURO} />
      <Muro x={-2.5} z={0} ancho={GROSOR_MURO} fondo={4.4} />
      <Muro x={-3.65} z={0} ancho={2.1} fondo={GROSOR_MURO} />
      {/* Muro izquierdo con puerta al invernadero */}
      <Muro x={-4.8} z={-1.45} ancho={GROSOR_MURO} fondo={1.5} />
      <Muro x={-4.8} z={1.45} ancho={GROSOR_MURO} fondo={1.5} />

      {/* --- SEPARACIÓN CENTRO <-> DERECHA (x = +1.8) con paso amplio al centro --- */}
      <Muro x={1.8} z={-3.15} ancho={GROSOR_MURO} fondo={3.7} />
      <Muro x={1.8} z={3.15} ancho={GROSOR_MURO} fondo={3.7} />

      {/* --- BLOQUE SUPERIOR DERECHO (Gimnasio + Baños) --- */}
      {/* Muro sur en z = -1.6 con puertas en x = 4.2 y x = 7.6 */}
      <Muro x={2.75} z={-1.6} ancho={1.9} fondo={GROSOR_MURO} />
      <Muro x={5.95} z={-1.6} ancho={2.3} fondo={GROSOR_MURO} />
      <Muro x={9.15} z={-1.6} ancho={1.7} fondo={GROSOR_MURO} />
      {/* Divisiones internas baños arriba-derecha */}
      <Muro x={6.0} z={-3.3} ancho={GROSOR_MURO} fondo={3.3} />
      <Muro x={7.2} z={-3.6} ancho={GROSOR_MURO} fondo={2.6} />

      {/* --- BLOQUE INFERIOR DERECHO (Robótica + Enfermería) --- */}
      {/* Muro norte en z = +1.8 con puertas en x = 3.6 y x = 7.6 */}
      <Muro x={2.45} z={1.8} ancho={1.3} fondo={GROSOR_MURO} />
      <Muro x={5.55} z={1.8} ancho={2.9} fondo={GROSOR_MURO} />
      <Muro x={9.15} z={1.8} ancho={1.7} fondo={GROSOR_MURO} />
      {/* División Robótica / Enfermería */}
      <Muro x={5.4} z={3.4} ancho={GROSOR_MURO} fondo={3.1} />

      {/* --- MOBILIARIO Y DETALLES LOW POLY --- */}
      {/* 4 camas en habitaciones */}
      {[-3.75, -1.25, 1.25, 3.75].map((z) => (
        <group key={z}>
          <Cama x={-8.9} z={z - 0.35} />
          <Estante x={-6.75} z={z + 0.5} ancho={0.45} fondo={0.6} />
        </group>
      ))}

      {/* Cultivos y almacenamiento en invernadero */}
      <Estante x={-4.4} z={-4.65} ancho={2.4} fondo={0.45} />
      <Estante x={-4.4} z={4.65} ancho={2.4} fondo={0.45} />
      <Planta x={-4.8} z={-3.4} />
      <Planta x={-3.1} z={-3.4} />
      <Planta x={-4.8} z={3.4} />
      <Planta x={-3.1} z={3.4} />

      {/* WC y Ducha centrales */}
      <mesh position={[-3.3, 0.35, -1.5]} castShadow>
        <cylinderGeometry args={[0.25, 0.22, 0.4, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[-3.4, 0.2, 1.3]} receiveShadow>
        <boxGeometry args={[0.9, 0.1, 0.9]} />
        <meshStandardMaterial color="#c9d8e4" roughness={0.7} flatShading />
      </mesh>

      {/* Recreación: sofá, mesita, sillones y estantería */}
      <Estante x={-0.1} z={-4.65} ancho={2.6} fondo={0.45} />
      <mesh position={[-0.5, 0.38, -2.7]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.45, 1.6]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.25, 0.3, -2.7]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.3, 0.9]} />
        <meshStandardMaterial color="#e0cbb3" roughness={0.8} flatShading />
      </mesh>
      <Silla x={0.85} z={-3.35} />
      <Silla x={0.85} z={-2.05} />

      {/* Cocina y comedor: mesa ovalada con 4 sillas y estantería */}
      <Estante x={-0.1} z={4.65} ancho={2.6} fondo={0.45} />
      <mesh position={[0.1, 0.48, 2.5]} scale={[1.4, 1, 0.9]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.1, 14]} />
        <meshStandardMaterial color="#f2e6d8" roughness={0.75} flatShading />
      </mesh>
      <Silla x={-0.4} z={1.75} />
      <Silla x={0.6} z={1.75} />
      <Silla x={-0.4} z={3.25} />
      <Silla x={0.6} z={3.25} />

      {/* Acondicionamiento físico */}
      <mesh position={[3.4, 0.38, -3.9]} castShadow>
        <boxGeometry args={[1.3, 0.3, 0.45]} />
        <meshStandardMaterial color="#6e7396" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[3.2, 0.48, -2.7]} castShadow>
        <boxGeometry args={[0.8, 0.55, 0.4]} />
        <meshStandardMaterial color="#878cb0" roughness={0.7} flatShading />
      </mesh>

      {/* Área de trabajo e investigación: mesa larga + 6 sillas + monitor */}
      <mesh position={[6.1, 0.48, 0.1]} scale={[2.6, 1, 0.9]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
        <meshStandardMaterial color="#f5f7fa" roughness={0.7} flatShading />
      </mesh>
      {[4.6, 6.1, 7.6].map((sx) => (
        <group key={sx}>
          <Silla x={sx} z={-0.75} />
          <Silla x={sx} z={0.95} />
        </group>
      ))}
      <mesh position={[6.1, 0.78, -1.25]} castShadow>
        <boxGeometry args={[0.8, 0.45, 0.1]} />
        <meshStandardMaterial color="#4a7096" roughness={0.4} flatShading />
      </mesh>
      <Estante x={2.45} z={-0.75} ancho={0.9} fondo={0.9} />

      {/* Estación de robótica */}
      <mesh position={[3.0, 0.45, 4.3]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.6, 0.6]} />
        <meshStandardMaterial color="#cfd7e8" roughness={0.75} flatShading />
      </mesh>
      <mesh position={[4.5, 0.45, 4.3]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.6, 0.6]} />
        <meshStandardMaterial color="#cfd7e8" roughness={0.75} flatShading />
      </mesh>
      {/* Brazo robótico */}
      <mesh position={[3.7, 0.55, 3.1]} rotation={[0.3, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.8, 8]} />
        <meshStandardMaterial color="#7f87b0" roughness={0.55} flatShading />
      </mesh>

      {/* Sala de tratamiento / Enfermería: camilla + cruz médica */}
      <mesh position={[9.2, 0.42, 3.4]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.48, 1.9]} />
        <meshStandardMaterial color="#ffffff" roughness={0.75} flatShading />
      </mesh>
      <mesh position={[6.1, 0.42, 3.4]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.48, 1.5]} />
        <meshStandardMaterial color="#f5eef0" roughness={0.8} flatShading />
      </mesh>
      {/* Cruz médica roja sobre el piso */}
      <mesh position={[7.6, 0.16, 3.3]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.75, 0.22]} />
        <meshStandardMaterial color={PALETA.coral} roughness={0.7} />
      </mesh>
      <mesh position={[7.6, 0.16, 3.3]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.22, 0.75]} />
        <meshStandardMaterial color={PALETA.coral} roughness={0.7} />
      </mesh>

      {/* Pequeñas rampas de esclusas exteriores */}
      {[
        [-5.3, 5.25],
        [7.4, 5.25],
        [8.9, -5.25],
        [10.25, 0.4],
      ].map(([rx, rz], i) => (
        <mesh key={i} position={[rx, 0.06, rz]} receiveShadow>
          <boxGeometry args={[0.9, 0.12, 0.5]} />
          <meshStandardMaterial color={PALETA.losa} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// Reexportar THREE por si se necesita vectorización futura
export { THREE };

