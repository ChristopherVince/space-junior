import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { t, type Idioma } from '../../i18n';
import { Pathways } from '../environment/Pathways';
import { Rocks } from '../environment/Rocks';
import { Terrain } from '../environment/Terrain';
import { MarsDuneAlphaMap } from '../modules/MarsDuneAlphaMap';
import { SolarArray } from '../modules/SolarArray';
import { MODULOS, type ModuleKey } from './layout';
import { SelectableModule } from './SelectableModule';

interface MarsDioramaSceneProps {
  idioma: Idioma;
  seleccion: ModuleKey | null;
  onSeleccion: (id: ModuleKey | null) => void;
  /** Cambia de valor para devolver la cámara a la vista isométrica inicial. */
  reinicio: number;
}

interface ControlesOrbita {
  setAzimuthalAngle(valor: number): void;
  setPolarAngle(valor: number): void;
  update(): void;
}

const AZIMUT = Math.PI / 4;
const POLAR = 0.94;
const ZOOM_MIN = 8.5;
const ZOOM_MAX = 54;

/** Cámara ortográfica isométrica que se ajusta al tamaño de la ventana. */
function CamaraIsometrica({ reinicio }: { reinicio: number }) {
  const camara = useThree((estado) => estado.camera) as unknown as THREE.OrthographicCamera;
  const tamano = useThree((estado) => estado.size);
  const controles = useThree((estado) => estado.controls) as unknown as ControlesOrbita | null;
  const zoom = useRef(36);

  useEffect(() => {
    const calculado = Math.min(
      Math.max(Math.min(tamano.width / 41, tamano.height / 27), ZOOM_MIN),
      ZOOM_MAX,
    );
    zoom.current = calculado;
    camara.zoom = calculado;
    camara.updateProjectionMatrix();
    controles?.update();
  }, [camara, controles, tamano]);

  useEffect(() => {
    if (!controles) return;
    controles.setAzimuthalAngle(AZIMUT);
    controles.setPolarAngle(POLAR);
    camara.zoom = zoom.current;
    camara.updateProjectionMatrix();
    controles.update();
  }, [camara, controles, reinicio]);

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

/** Mapa 3D completo de Mars Dune Alpha. */
export function MarsDioramaScene({ idioma, seleccion, onSeleccion, reinicio }: MarsDioramaSceneProps) {
  const zonaProps = (id: ModuleKey) => ({
    ...MODULOS[id],
    id,
    etiqueta: t(idioma, `modulo.${id}`),
    rol: t(idioma, `modulo.${id}.rol`),
    seleccionado: seleccion === id,
    onSeleccionar: onSeleccion,
  });

  return (
    <>
      <CamaraIsometrica reinicio={reinicio} />

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

      <group position={[0, 0, 0]}>
        <Terrain />
        <Rocks />
        <Pathways />

        {/* Planta arquitectónica 3D fiel a Mars Dune Alpha */}
        <MarsDuneAlphaMap />

        {/* Zona de energía solar exterior conectada al norte del hábitat */}
        <SelectableModule {...zonaProps('energia')}>
          <SolarArray />
        </SelectableModule>

        {/* Zonas interactivas superpuestas sobre cada área del mapa */}
        {(['dormitorios', 'invernadero', 'habitat', 'investigacion', 'enfermeria'] as const).map((id) => {
          const z = MODULOS[id];
          return (
            <SelectableModule key={id} {...zonaProps(id)}>
              <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[z.anchoResalte * 1.7, 0.5, z.fondoResalte * 1.7]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </SelectableModule>
          );
        })}
      </group>
    </>
  );
}
