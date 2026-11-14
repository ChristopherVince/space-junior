import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ModuleId } from '../../state/types';
import { AstronautController, type DestinoTactil } from './AstronautController';
import { MarsDuneAlphaMap } from './MarsDuneAlphaMap';
import { Pathways } from './Pathways';
import { Rocks } from './Rocks';
import { SolarArray } from './SolarArray';
import { Terrain } from './Terrain';
import { MODULOS } from './layout';

const ZOOM_MIN = 8.5;
const ZOOM_MAX = 54;

const ZONAS_TOQUE: { id: ModuleId; x: number; z: number; w: number; d: number }[] = [
  { id: 'refugio', x: -8.1, z: 0, w: 3.8, d: 9.8 },
  { id: 'invernadero', x: -3.9, z: 0, w: 4.5, d: 9.8 },
  { id: 'pasillo', x: 0.1, z: 0, w: 3.4, d: 9.8 },
  { id: 'comunicaciones', x: 5.9, z: 0.1, w: 8.1, d: 3.4 },
  { id: 'energia', x: 3.6, z: 3.4, w: 3.5, d: 3.1 },
  { id: 'enfermeria', x: 7.7, z: 3.4, w: 4.5, d: 3.1 },
];

function CamaraIsometrica() {
  const camara = useThree((estado) => estado.camera) as unknown as THREE.OrthographicCamera;
  const tamano = useThree((estado) => estado.size);

  useEffect(() => {
    const calculado = Math.min(
      Math.max(Math.min(tamano.width / 38, tamano.height / 25), ZOOM_MIN),
      ZOOM_MAX,
    );
    camara.zoom = calculado;
    camara.updateProjectionMatrix();
  }, [camara, tamano]);

  return null;
}

function Luces() {
  return (
    <>
      <ambientLight intensity={1.0} color="#fff5ea" />
      <hemisphereLight args={['#ffedd6', '#c47a58', 0.65]} />
      <directionalLight
        position={[16, 22, 12]}
        intensity={1.85}
        color="#fff6e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
      <directionalLight position={[-14, 9, -12]} intensity={0.55} color="#f0d2be" />
    </>
  );
}

/** Escena 3D principal del juego: Mars Dune Alpha + comandante controlable por teclado y toque. */
export function MarsDioramaScene() {
  const posicionJugadorRef = useRef({ x: 0.1, z: 0 });
  const prevJugadorRef = useRef({ x: 0.1, z: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const camara = useThree((estado) => estado.camera);
  const [destinoTactil, setDestinoTactil] = useState<DestinoTactil | null>(null);

  useFrame(() => {
    const curr = posicionJugadorRef.current;
    const prev = prevJugadorRef.current;
    const dx = curr.x - prev.x;
    const dz = curr.z - prev.z;

    if (dx !== 0 || dz !== 0) {
      if (controlsRef.current) {
        controlsRef.current.target.x += dx;
        controlsRef.current.target.z += dz;
        controlsRef.current.update();
      }
      camara.position.x += dx;
      camara.position.z += dz;
      prev.x = curr.x;
      prev.z = curr.z;
    }
  });

  const alTocarModulo = (id: ModuleId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return; // Ignorar arrastres de rotación de cámara
    setDestinoTactil((prev) => ({ modulo: id, seq: (prev?.seq ?? 0) + 1 }));
  };

  return (
    <>
      <CamaraIsometrica />
      <Luces />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0.1, 0.5, 0]}
        enablePan={false}
        enableRotate
        enableZoom
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.65}
        zoomSpeed={0.75}
        minPolarAngle={Math.PI / 2 - 1.05}
        maxPolarAngle={Math.PI / 2 - 0.25}
        minZoom={ZOOM_MIN}
        maxZoom={ZOOM_MAX}
      />

      <group>
        <Terrain />
        <Rocks />
        <Pathways />
        <MarsDuneAlphaMap />
        <group position={[MODULOS.energia.posicion[0], 0, MODULOS.energia.posicion[1]]}>
          <SolarArray />
        </group>

        {/* Zonas táctiles invisibles para caminar al tocar un módulo (Issue #3) */}
        {ZONAS_TOQUE.map((z) => (
          <mesh key={z.id} position={[z.x, 0.2, z.z]} onClick={alTocarModulo(z.id)}>
            <boxGeometry args={[z.w, 0.4, z.d]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}

        <AstronautController destinoTactil={destinoTactil} posicionRef={posicionJugadorRef} />
      </group>
    </>
  );
}
