import * as THREE from 'three';
import {
  HABITACIONES_Z,
  MUROS_INTERIORES,
  PLANTAS_INVERNADERO,
  SILLAS_COMUNICACIONES_X,
} from './collision';
import { PALETA } from './palette';

const ALTURA_MURO = 1.12;

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

function Piso({
  x,
  z,
  ancho,
  fondo,
  color,
  y = 0.145,
}: {
  x: number;
  z: number;
  ancho: number;
  fondo: number;
  color: string;
  y?: number;
}) {
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
 * Base cerrada con una única esclusa norte hacia los paneles solares (#44),
 * y muros/muebles sincronizados con las cajas sólidas de collision.ts.
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
      <Piso x={-3.65} z={0} ancho={2.3} fondo={4.4} color="#b4b9bf" y={0.15} />
      <Piso x={8.0} z={-3.3} ancho={4.0} fondo={3.3} color="#b4b9bf" y={0.15} />

      {/* --- MUROS EXTERIORES ONDULADOS (cerrados con una sola entrada al norte en x = 0) --- */}
      {/* Norte (z = -5): única esclusa en x = -0.55 .. +0.55 hacia los paneles solares */}
      <MuroOnduladoHorizontal x0={-10} x1={-0.55} z={-5} />
      <MuroOnduladoHorizontal x0={0.55} x1={10} z={-5} />
      {/* Marco de esclusa en la única entrada norte */}
      <Muro x={-0.55} z={-4.9} ancho={0.18} fondo={0.32} alto={1.24} color="#7d8790" />
      <Muro x={0.55} z={-4.9} ancho={0.18} fondo={0.32} alto={1.24} color="#7d8790" />
      {/* Sur (z = +5): cerrado de extremo a extremo */}
      <MuroOnduladoHorizontal x0={-10} x1={10} z={5} />
      {/* Oeste (x = -10): cerrado de extremo a extremo */}
      <MuroOnduladoVertical x={-10} z0={-5} z1={5} />
      {/* Este (x = +10): cerrado de extremo a extremo */}
      <MuroOnduladoVertical x={10} z0={-5} z1={5} />

      {/* --- MUROS INTERIORES (generados desde MUROS_INTERIORES en collision.ts) --- */}
      {MUROS_INTERIORES.map((m, i) => (
        <Muro key={i} x={m.x} z={m.z} ancho={m.ancho} fondo={m.fondo} />
      ))}

      {/* --- MOBILIARIO Y DETALLES LOW POLY (sincronizados con MUEBLES_SOLIDOS) --- */}
      {/* 4 camas y estantes en habitaciones del refugio */}
      {HABITACIONES_Z.map((z) => (
        <group key={z}>
          <Cama x={-8.9} z={z - 0.35} />
          <Estante x={-8.6} z={z + 0.88} ancho={1.1} fondo={0.42} />
        </group>
      ))}

      {/* Cultivos y almacenamiento en invernadero */}
      <Estante x={-4.4} z={-4.65} ancho={2.4} fondo={0.45} />
      <Estante x={-4.4} z={4.65} ancho={2.4} fondo={0.45} />
      {PLANTAS_INVERNADERO.map((p, i) => (
        <Planta key={i} x={p.x} z={p.z} />
      ))}

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
      <mesh position={[-0.5, 0.38, -2.6]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.45, 1.5]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.25, 0.3, -2.6]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.3, 0.85]} />
        <meshStandardMaterial color="#e0cbb3" roughness={0.8} flatShading />
      </mesh>
      <Silla x={0.85} z={-2.95} />
      <Silla x={0.85} z={-2.15} />

      {/* Cocina y comedor: mesa ovalada con 4 sillas y estantería */}
      <Estante x={-0.1} z={4.65} ancho={2.6} fondo={0.45} />
      <mesh position={[0.1, 0.48, 2.65]} scale={[1.15, 1, 0.72]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.1, 14]} />
        <meshStandardMaterial color="#f2e6d8" roughness={0.75} flatShading />
      </mesh>
      <Silla x={-0.4} z={1.95} />
      <Silla x={0.6} z={1.95} />
      <Silla x={-0.4} z={3.35} />
      <Silla x={0.6} z={3.35} />

      {/* Acondicionamiento físico */}
      <mesh position={[3.4, 0.38, -3.9]} castShadow>
        <boxGeometry args={[1.3, 0.3, 0.45]} />
        <meshStandardMaterial color="#6e7396" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[3.2, 0.48, -2.7]} castShadow>
        <boxGeometry args={[0.8, 0.55, 0.4]} />
        <meshStandardMaterial color="#878cb0" roughness={0.7} flatShading />
      </mesh>

      {/* Área de trabajo e investigación (Comunicaciones): mesa larga + 6 sillas + monitor */}
      <mesh position={[6.1, 0.48, 0.0]} scale={[2.25, 1, 0.62]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
        <meshStandardMaterial color="#f5f7fa" roughness={0.7} flatShading />
      </mesh>
      {SILLAS_COMUNICACIONES_X.map((sx) => (
        <group key={sx}>
          <Silla x={sx} z={-0.68} />
          <Silla x={sx} z={0.68} />
        </group>
      ))}
      <mesh position={[6.1, 0.78, -1.25]} castShadow>
        <boxGeometry args={[0.8, 0.45, 0.1]} />
        <meshStandardMaterial color="#4a7096" roughness={0.4} flatShading />
      </mesh>
      <Estante x={2.45} z={-0.95} ancho={0.8} fondo={0.7} />

      {/* Estación de robótica / Energía */}
      <mesh position={[2.8, 0.45, 4.35]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.6, 0.6]} />
        <meshStandardMaterial color="#cfd7e8" roughness={0.75} flatShading />
      </mesh>
      <mesh position={[4.4, 0.45, 4.35]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.6, 0.6]} />
        <meshStandardMaterial color="#cfd7e8" roughness={0.75} flatShading />
      </mesh>
      {/* Brazo robótico lateral */}
      <mesh position={[2.4, 0.55, 3.2]} rotation={[0.3, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.8, 8]} />
        <meshStandardMaterial color="#7f87b0" roughness={0.55} flatShading />
      </mesh>

      {/* Sala de tratamiento / Enfermería: camillas + cruz médica */}
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

      {/* Única rampa de esclusa exterior hacia los paneles solares al norte (#44) */}
      <mesh position={[0, 0.06, -5.25]} receiveShadow>
        <boxGeometry args={[1.1, 0.12, 0.5]} />
        <meshStandardMaterial color={PALETA.losa} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

export { THREE };
