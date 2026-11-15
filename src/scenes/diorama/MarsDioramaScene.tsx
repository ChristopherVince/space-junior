import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { store } from '../../state/store';
import { t } from '../../i18n';
import type { ModuleId, Phase } from '../../state/types';
import { observarObjetivoGuia } from '../../ui/guia';
import { AstronautController, type DestinoTactil } from './AstronautController';
import { CrewController } from './CrewController';
import { MarsDuneAlphaMap } from './MarsDuneAlphaMap';
import { Pathways } from './Pathways';
import { Rocks } from './Rocks';
import { SolarArray } from './SolarArray';
import { SolarStormVFX } from './SolarStormVFX';
import { StormEffects } from './StormEffects';
import { Terrain } from './Terrain';
import { MODULOS } from './layout';

const ZOOM_MIN = 8.5;
const ZOOM_MAX = 54;

type VistaId = '1' | '2' | '3';

const VISTAS: Record<VistaId, { posicion: [number, number, number]; target: [number, number, number] }> = {
  '1': { posicion: [18, 18, 18], target: [0.1, 0.5, 0] },
  '2': { posicion: [0.1, 28, 0.1], target: [0.1, 0.5, 0] },
  '3': { posicion: [0, 9, 22], target: [0.1, 0.5, 0] },
};

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
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const faseRef = useRef<Phase>(store.getState().fase);

  useEffect(() => {
    const desuscribir = store.subscribe((estado) => {
      faseRef.current = estado.fase;
    });
    return () => {
      desuscribir();
    };
  }, []);

  useFrame(({ clock }) => {
    const fase = faseRef.current;
    const enTormenta = fase === 'tormenta';
    const enRefugio = fase === 'refugio';

    if (enTormenta || enRefugio) {
      const pulso = 0.5 + 0.5 * Math.sin(clock.elapsedTime * (enTormenta ? 7 : 4));
      if (ambientRef.current) {
        ambientRef.current.intensity = enTormenta ? 0.55 + pulso * 0.65 : 0.75 + pulso * 0.45;
        ambientRef.current.color.setRGB(1, 0.55 + pulso * 0.35, 0.48 + pulso * 0.35);
      }
      if (dirRef.current) {
        dirRef.current.intensity = enTormenta ? 1.1 + pulso * 1.1 : 1.4 + pulso * 0.7;
      }
    } else {
      if (ambientRef.current) {
        ambientRef.current.intensity = 1.0;
        ambientRef.current.color.set('#fff5ea');
      }
      if (dirRef.current) {
        dirRef.current.intensity = 1.85;
      }
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={1.0} color="#fff5ea" />
      <hemisphereLight args={['#ffedd6', '#c47a58', 0.65]} />
      <directionalLight
        ref={dirRef}
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const camara = useThree((estado) => estado.camera);
  const [destinoTactil, setDestinoTactil] = useState<DestinoTactil | null>(null);
  const [vista, setVista] = useState<VistaId>('1');
  const [hoverModulo, setHoverModulo] = useState<ModuleId | null>(null);
  const [moduloActual, setModuloActual] = useState<ModuleId>(() => store.getState().tripulacion.comandante.modulo);
  const [fase, setFase] = useState<Phase>(() => store.getState().fase);
  const [objetivoGuia, setObjetivoGuia] = useState<ModuleId | null>(null);

  useEffect(() => observarObjetivoGuia(setObjetivoGuia), []);

  useEffect(() => {
    const desuscribir = store.subscribe((estado) => {
      setModuloActual(estado.tripulacion.comandante.modulo);
      setFase(estado.fase);
    });
    return () => {
      desuscribir();
    };
  }, []);

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        setVista(e.key);
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, []);

  // Botones táctiles 1 / 2 / 3 para cambiar perspectiva en móvil y escritorio
  useEffect(() => {
    const contenedor = document.getElementById('juego') ?? document.body;
    const barra = document.createElement('div');
    barra.style.position = 'fixed';
    barra.style.top = '14px';
    barra.style.left = '60px';
    barra.style.zIndex = '25';
    barra.style.display = 'flex';
    barra.style.gap = '4px';

    (['1', '2', '3'] as VistaId[]).forEach((id) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = id;
      btn.title = t('controles.vista', { numero: id });
      btn.setAttribute('aria-label', btn.title);
      btn.style.padding = '6px 10px';
      btn.style.borderRadius = '8px';
      btn.style.border = '1px solid rgba(255,255,255,0.25)';
      btn.style.background = vista === id ? 'rgba(234, 179, 8, 0.9)' : 'rgba(15, 23, 42, 0.78)';
      btn.style.color = vista === id ? '#0f172a' : '#f8fafc';
      btn.style.fontWeight = '700';
      btn.style.fontSize = '13px';
      btn.style.cursor = 'pointer';
      btn.onclick = () => setVista(id);
      barra.appendChild(btn);
    });

    contenedor.appendChild(barra);
    return () => {
      barra.remove();
    };
  }, [vista]);

  useEffect(() => {
    const config = VISTAS[vista];
    camara.position.set(...config.posicion);
    if (controlsRef.current) {
      controlsRef.current.target.set(...config.target);
      controlsRef.current.update();
    }
  }, [vista, camara]);

  const alTocarModulo = (id: ModuleId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return; // Ignorar arrastres de rotación de cámara
    setDestinoTactil((prev) => ({ modulo: id, seq: (prev?.seq ?? 0) + 1 }));
  };

  return (
    <>
      <CamaraIsometrica />
      <Luces />
      <SolarStormVFX />
      <StormEffects />

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

        {/* Zonas táctiles e indicadores visuales por módulo */}
        {ZONAS_TOQUE.map((z) => {
          const enAlertaRefugio = z.id === 'refugio' && (fase === 'refugio' || fase === 'tormenta');
          const esObjetivo = objetivoGuia === z.id;
          const resaltado = hoverModulo === z.id || moduloActual === z.id || enAlertaRefugio || esObjetivo;
          const color = esObjetivo ? '#fbbf24' : enAlertaRefugio
            ? '#22c55e'
            : hoverModulo === z.id
              ? '#fbbf24'
              : '#60a5fa';
          const opacidad = esObjetivo ? 0.4 : enAlertaRefugio ? 0.28 : hoverModulo === z.id ? 0.2 : 0.1;

          return (
            <group key={z.id} position={[z.x, 0, z.z]}>
              {resaltado && (
                <mesh position={[0, 0.165, 0]} rotation-x={-Math.PI / 2}>
                  <planeGeometry args={[z.w - 0.35, z.d - 0.35]} />
                  <meshBasicMaterial color={color} transparent opacity={opacidad} depthWrite={false} />
                </mesh>
              )}
              {esObjetivo && (
                <mesh position={[0, 3.5, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.45, 0.9, 4]} />
                  <meshBasicMaterial color="#fbbf24" depthTest={false} />
                </mesh>
              )}
              <mesh
                position={[0, 0.2, 0]}
                onClick={alTocarModulo(z.id)}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoverModulo(z.id);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  setHoverModulo((prev) => (prev === z.id ? null : prev));
                  document.body.style.cursor = 'auto';
                }}
              >
                <boxGeometry args={[z.w, 0.4, z.d]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </group>
          );
        })}

        <AstronautController destinoTactil={destinoTactil} posicionRef={posicionJugadorRef} />
        <CrewController />
      </group>
    </>
  );
}
