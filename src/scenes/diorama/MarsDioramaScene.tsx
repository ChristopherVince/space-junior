import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { AstronautController } from './AstronautController';
import { MarsDuneAlphaMap } from './MarsDuneAlphaMap';
import { Pathways } from './Pathways';
import { Rocks } from './Rocks';
import { SolarArray } from './SolarArray';
import { Terrain } from './Terrain';
import { MODULOS } from './layout';

const AZIMUT = Math.PI / 4;
const ZOOM_MIN = 8.5;
const ZOOM_MAX = 54;

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
      <ambientLight intensity={0.68} color="#fff1e0" />
      <hemisphereLight args={['#ffe8cc', '#b86b4b', 0.45]} />
      <directionalLight
        position={[16, 22, 12]}
        intensity={1.4}
        color="#fff3dc"
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
      <directionalLight position={[-14, 9, -12]} intensity={0.4} color="#e9c6b0" />
    </>
  );
}

/** Escena 3D principal del juego: Mars Dune Alpha + comandante controlable por teclado. */
export function MarsDioramaScene() {
  return (
    <>
      <CamaraIsometrica />
      <Luces />

      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        minPolarAngle={Math.PI / 2 - 0.85}
        maxPolarAngle={Math.PI / 2 - 0.35}
        minAzimuthAngle={AZIMUT - 0.65}
        maxAzimuthAngle={AZIMUT + 0.65}
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
        <AstronautController />
      </group>
    </>
  );
}

