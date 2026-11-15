import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { CrewId } from '../../state/types';

interface AstronautProps {
  caminando: boolean;
  rol?: CrewId;
}

const DISFRACES: Record<
  CrewId,
  {
    traje: string;
    casco: string;
    visor: string;
    mochila: string;
    aro: string;
    parche: string;
  }
> = {
  comandante: {
    traje: '#5e86ad',
    casco: '#f7f6f2',
    visor: '#2f4552',
    mochila: '#eef1f5',
    aro: '#f3d5a5',
    parche: '#f5f3ef',
  },
  ingeniero: {
    traje: '#d97724',
    casco: '#dde2e8',
    visor: '#422c1a',
    mochila: '#64748b',
    aro: '#fbbf24',
    parche: '#fef3c7',
  },
  medico: {
    traje: '#2b9e8f',
    casco: '#f8fafc',
    visor: '#1e3a4c',
    mochila: '#f1f5f9',
    aro: '#5eead4',
    parche: '#ffffff',
  },
  cientifico: {
    traje: '#4d8b55',
    casco: '#f3f4ee',
    visor: '#1e3a5f',
    mochila: '#cbd5e1',
    aro: '#86efac',
    parche: '#ecfdf5',
  },
};

/**
 * Personaje 3D low poly con disfraz diferenciado por rol de tripulación.
 */
export function Astronaut({ caminando, rol = 'comandante' }: AstronautProps) {
  const cuerpo = useRef<THREE.Group>(null);
  const piernaIzq = useRef<THREE.Mesh>(null);
  const piernaDer = useRef<THREE.Mesh>(null);
  const brazoIzq = useRef<THREE.Mesh>(null);
  const brazoDer = useRef<THREE.Mesh>(null);
  const fase = useRef(0);
  const d = DISFRACES[rol];

  useFrame((_, delta) => {
    if (caminando) {
      fase.current += delta * 12;
    } else {
      fase.current = 0;
    }
    const osc = caminando ? Math.sin(fase.current) : 0;
    const rebote = caminando ? Math.abs(Math.cos(fase.current)) * 0.04 : 0;

    if (cuerpo.current) cuerpo.current.position.y = rebote;
    if (piernaIzq.current) piernaIzq.current.rotation.x = osc * 0.55;
    if (piernaDer.current) piernaDer.current.rotation.x = -osc * 0.55;
    if (brazoIzq.current) brazoIzq.current.rotation.x = -osc * 0.45;
    if (brazoDer.current) brazoDer.current.rotation.x = osc * 0.45;
  });

  return (
    <group>
      {/* Aro identificador en la base */}
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[0.36, 0.03, 8, 28]} />
        <meshBasicMaterial color={d.aro} />
      </mesh>

      <group ref={cuerpo}>
        {/* Piernas */}
        <mesh ref={piernaIzq} position={[-0.1, 0.16, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.14, 4, 8]} />
          <meshStandardMaterial color="#f4f2ee" roughness={0.75} />
        </mesh>
        <mesh ref={piernaDer} position={[0.1, 0.16, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.14, 4, 8]} />
          <meshStandardMaterial color="#f4f2ee" roughness={0.75} />
        </mesh>

        {/* Torso */}
        <mesh position={[0, 0.41, 0]} castShadow>
          <capsuleGeometry args={[0.19, 0.2, 6, 12]} />
          <meshStandardMaterial color={d.traje} roughness={0.72} />
        </mesh>

        {/* Parche en el pecho */}
        <mesh position={[0, 0.44, 0.18]} castShadow>
          <boxGeometry args={[0.15, 0.11, 0.04]} />
          <meshStandardMaterial color={d.parche} roughness={0.7} />
        </mesh>

        {/* Cruz médica en el pecho para el oficial médico */}
        {rol === 'medico' && (
          <group position={[0, 0.44, 0.205]}>
            <mesh>
              <boxGeometry args={[0.08, 0.028, 0.015]} />
              <meshStandardMaterial color="#dc2626" roughness={0.5} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.028, 0.08, 0.015]} />
              <meshStandardMaterial color="#dc2626" roughness={0.5} />
            </mesh>
          </group>
        )}

        {/* Mochila de soporte vital */}
        <mesh position={[0, 0.43, -0.18]} castShadow>
          <boxGeometry args={[0.24, 0.28, 0.12]} />
          <meshStandardMaterial color={d.mochila} roughness={0.75} />
        </mesh>

        {/* Visor de ingeniería o antena científica/comandante */}
        {(rol === 'cientifico' || rol === 'comandante') && (
          <mesh position={[0.14, 0.98, -0.04]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.18, 6]} />
            <meshStandardMaterial color={rol === 'comandante' ? '#f3d5a5' : '#86efac'} roughness={0.5} />
          </mesh>
        )}

        {rol === 'ingeniero' && (
          <mesh position={[0, 0.96, 0.04]} castShadow>
            <boxGeometry args={[0.26, 0.06, 0.26]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.55} />
          </mesh>
        )}

        {/* Brazos */}
        <mesh ref={brazoIzq} position={[-0.24, 0.41, 0]} rotation-z={0.18} castShadow>
          <capsuleGeometry args={[0.065, 0.18, 4, 8]} />
          <meshStandardMaterial color={d.traje} roughness={0.72} />
        </mesh>
        <mesh ref={brazoDer} position={[0.24, 0.41, 0]} rotation-z={-0.18} castShadow>
          <capsuleGeometry args={[0.065, 0.18, 4, 8]} />
          <meshStandardMaterial color={d.traje} roughness={0.72} />
        </mesh>

        {/* Casco */}
        <mesh position={[0, 0.76, 0]} castShadow>
          <sphereGeometry args={[0.24, 16, 12]} />
          <meshStandardMaterial color={d.casco} roughness={0.62} />
        </mesh>

        {/* Visor */}
        <mesh position={[0, 0.74, 0.13]} scale={[1.05, 0.92, 0.85]}>
          <sphereGeometry args={[0.15, 14, 10]} />
          <meshStandardMaterial color={d.visor} roughness={0.22} metalness={0.18} />
        </mesh>

        {/* Brillo en el visor */}
        <mesh position={[-0.055, 0.71, 0.25]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}
