import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface AstronautProps {
  caminando: boolean;
}

/**
 * Personaje 3D low poly del comandante: casco blanco, visor oscuro redondeado,
 * traje azul acero con parche en el pecho y aro dorado en la base.
 */
export function Astronaut({ caminando }: AstronautProps) {
  const cuerpo = useRef<THREE.Group>(null);
  const piernaIzq = useRef<THREE.Mesh>(null);
  const piernaDer = useRef<THREE.Mesh>(null);
  const brazoIzq = useRef<THREE.Mesh>(null);
  const brazoDer = useRef<THREE.Mesh>(null);
  const fase = useRef(0);

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
      {/* Aro dorado/arena en la base */}
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[0.36, 0.03, 8, 28]} />
        <meshBasicMaterial color="#f3d5a5" />
      </mesh>

      <group ref={cuerpo}>
        {/* Piernas blancas */}
        <mesh ref={piernaIzq} position={[-0.1, 0.16, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.14, 4, 8]} />
          <meshStandardMaterial color="#f4f2ee" roughness={0.75} />
        </mesh>
        <mesh ref={piernaDer} position={[0.1, 0.16, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.14, 4, 8]} />
          <meshStandardMaterial color="#f4f2ee" roughness={0.75} />
        </mesh>

        {/* Torso azul acero */}
        <mesh position={[0, 0.41, 0]} castShadow>
          <capsuleGeometry args={[0.19, 0.2, 6, 12]} />
          <meshStandardMaterial color="#5e86ad" roughness={0.72} />
        </mesh>

        {/* Parche blanco en el pecho */}
        <mesh position={[0, 0.44, 0.18]} castShadow>
          <boxGeometry args={[0.15, 0.11, 0.04]} />
          <meshStandardMaterial color="#f5f3ef" roughness={0.7} />
        </mesh>

        {/* Mochila de soporte vital */}
        <mesh position={[0, 0.43, -0.18]} castShadow>
          <boxGeometry args={[0.24, 0.28, 0.12]} />
          <meshStandardMaterial color="#eef1f5" roughness={0.75} />
        </mesh>

        {/* Brazos azul acero */}
        <mesh ref={brazoIzq} position={[-0.24, 0.41, 0]} rotation-z={0.18} castShadow>
          <capsuleGeometry args={[0.065, 0.18, 4, 8]} />
          <meshStandardMaterial color="#5e86ad" roughness={0.72} />
        </mesh>
        <mesh ref={brazoDer} position={[0.24, 0.41, 0]} rotation-z={-0.18} castShadow>
          <capsuleGeometry args={[0.065, 0.18, 4, 8]} />
          <meshStandardMaterial color="#5e86ad" roughness={0.72} />
        </mesh>

        {/* Casco blanco */}
        <mesh position={[0, 0.76, 0]} castShadow>
          <sphereGeometry args={[0.24, 16, 12]} />
          <meshStandardMaterial color="#f7f6f2" roughness={0.62} />
        </mesh>

        {/* Visor oscuro redondeado */}
        <mesh position={[0, 0.74, 0.13]} scale={[1.05, 0.92, 0.85]}>
          <sphereGeometry args={[0.15, 14, 10]} />
          <meshStandardMaterial color="#2f4552" roughness={0.22} metalness={0.18} />
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

