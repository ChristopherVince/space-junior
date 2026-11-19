import { Html, OrbitControls } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import * as THREE from 'three';
import { store } from '../../state/store';
import { getIdioma, t } from '../../i18n';
import type { CrewId, GameState, ModuleId, Phase } from '../../state/types';
import { observarObjetivoGuia } from '../../ui/guia';
import { AstronautController, type DestinoTactil } from './AstronautController';
import { ZONAS_MODULOS, type ZonaModulo } from './collision';
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

function CamaraIsometrica() {
  const camara = useThree((estado) => estado.camera) as unknown as THREE.OrthographicCamera;
  const tamano = useThree((estado) => estado.size);

  useEffect(() => {
    const esMovil = tamano.width < 640;
    const zoomObjetivo = esMovil
      ? Math.min(tamano.width / 23.5, tamano.height / 18.5)
      : Math.min(tamano.width / 30.4, tamano.height / 20);
    const calculado = Math.min(Math.max(zoomObjetivo, ZOOM_MIN), ZOOM_MAX);
    camara.zoom = calculado;
    camara.updateProjectionMatrix();
  }, [camara, tamano]);

  return null;
}

function TransicionCamara({
  vista,
  controlsRef,
  animandoRef,
}: {
  vista: VistaId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: RefObject<any>;
  animandoRef: MutableRefObject<boolean>;
}) {
  const camara = useThree((estado) => estado.camera);
  const posObjetivo = useRef(new THREE.Vector3(...VISTAS['1'].posicion));
  const targetObjetivo = useRef(new THREE.Vector3(...VISTAS['1'].target));
  const primerMontaje = useRef(true);

  useEffect(() => {
    const config = VISTAS[vista];
    posObjetivo.current.set(...config.posicion);
    targetObjetivo.current.set(...config.target);
    window.dispatchEvent(new CustomEvent('space-junior:vista-actual', { detail: vista }));

    if (primerMontaje.current) {
      primerMontaje.current = false;
      camara.position.copy(posObjetivo.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetObjetivo.current);
        controlsRef.current.update();
      }
      return;
    }

    animandoRef.current = true;
  }, [vista, camara, controlsRef, animandoRef]);

  useFrame((_, delta) => {
    if (!animandoRef.current) return;
    const factor = Math.min(1, delta * 9);
    camara.position.lerp(posObjetivo.current, factor);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetObjetivo.current, factor);
      controlsRef.current.update();
    }
    const distPos = camara.position.distanceToSquared(posObjetivo.current);
    const distTarget = controlsRef.current
      ? controlsRef.current.target.distanceToSquared(targetObjetivo.current)
      : 0;
    if (distPos < 0.002 && distTarget < 0.002) {
      camara.position.copy(posObjetivo.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetObjetivo.current);
        controlsRef.current.update();
      }
      animandoRef.current = false;
    }
  });

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

interface ZonaInteractivaProps {
  zona: ZonaModulo;
  fase: Phase;
  moduloActual: ModuleId;
  hoverModulo: ModuleId | null;
  esObjetivo: boolean;
  energiaAsignada: number;
  fallaTexto: string | null;
  idioma: ReturnType<typeof getIdioma>;
  onSelect: (id: ModuleId) => void;
  onHover: (id: ModuleId | null) => void;
}

const TRIPULACION_IDS: readonly CrewId[] = ['comandante', 'ingeniero', 'medico', 'cientifico'];

function obtenerFallaModulo(id: ModuleId, e: GameState): string | null {
  if (e.fase !== 'tormenta') return null;

  const alguienFueraAqui =
    id !== 'refugio' && TRIPULACION_IDS.some((c) => e.tripulacion[c].modulo === id);

  if (id === 'comunicaciones' && (e.energiaAsignada.comunicaciones ?? 0) === 0) {
    return t('hud.fallas.sinComunicaciones');
  }
  if (id === 'refugio' && e.recursos.blindaje < 60) {
    return t('hud.fallas.blindajeBajo', { pct: Math.round(e.recursos.blindaje) });
  }
  if (id === 'energia') {
    if (e.recursos.blindaje < 60) {
      return t('hud.fallas.energiaBlindaje', { pct: Math.round(e.recursos.blindaje) });
    }
    return t('hud.fallas.panelesApagados');
  }
  if (id === 'invernadero') {
    if (e.recursos.soporteVital < 50) {
      return t('hud.fallas.soporteBajo', { pct: Math.round(e.recursos.soporteVital) });
    }
    if ((e.energiaAsignada.invernadero ?? 0) < 4) {
      return t('hud.fallas.invernaderoDescuidado');
    }
    return t('hud.fallas.invernaderoPausado');
  }
  if (alguienFueraAqui) {
    return t('hud.fallas.fueraRefugio');
  }
  return null;
}

function ZonaInteractivaModulo({
  zona,
  fase,
  moduloActual,
  hoverModulo,
  esObjetivo,
  energiaAsignada,
  fallaTexto,
  onSelect,
  onHover,
}: ZonaInteractivaProps) {
  const matPisoRef = useRef<THREE.MeshBasicMaterial>(null);
  const coneObjetivoRef = useRef<THREE.Mesh>(null);
  const esRefugio = zona.id === 'refugio';
  const enAlertaRefugio = esRefugio && (fase === 'refugio' || fase === 'tormenta');
  const tieneFalla = Boolean(fallaTexto);
  const estaAdentro = moduloActual === zona.id;
  const estaHover = hoverModulo === zona.id;
  const mostrarEtiqueta = fase !== 'aviso' && fase !== 'reporte';

  const colorBase = enAlertaRefugio && !tieneFalla
    ? '#22c55e'
    : tieneFalla
      ? '#ef4444'
      : esObjetivo
        ? '#fbbf24'
        : estaHover
          ? '#fbbf24'
          : estaAdentro
            ? '#f59e0b'
            : zona.color;

  const opacidadBase = esObjetivo
    ? 0.4
    : enAlertaRefugio
      ? 0.34
      : estaHover
        ? 0.25
        : estaAdentro
          ? 0.2
          : esRefugio
            ? 0.16
            : 0.1;

  const opacidadBorde = enAlertaRefugio || esObjetivo
    ? 0.92
    : estaHover || estaAdentro
      ? 0.85
      : esRefugio
        ? 0.68
        : 0.48;

  useFrame(({ clock }, delta) => {
    if (coneObjetivoRef.current) {
      coneObjetivoRef.current.position.y = 3.5 + Math.sin(clock.elapsedTime * 4) * 0.2;
      coneObjetivoRef.current.rotation.y += delta * 1.4;
    }
    if (!matPisoRef.current) return;
    if (enAlertaRefugio) {
      const pulso = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 6);
      matPisoRef.current.opacity = 0.22 + pulso * 0.24;
    } else if (esRefugio && !estaHover && !estaAdentro && !esObjetivo) {
      const pulsoSuave = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.2);
      matPisoRef.current.opacity = 0.13 + pulsoSuave * 0.06;
    } else {
      matPisoRef.current.opacity = opacidadBase;
    }
  });

  const anchoInterior = Math.max(0.4, zona.w - 0.34);
  const fondoInterior = Math.max(0.4, zona.d - 0.34);
  const grosorBorde = esRefugio || estaAdentro || estaHover || esObjetivo ? 0.11 : 0.08;

  const clasesEtiqueta = [
    'etiqueta-modulo',
    esRefugio ? 'etiqueta-modulo--refugio' : '',
    enAlertaRefugio ? 'etiqueta-modulo--alerta' : '',
    estaAdentro || estaHover || esObjetivo ? 'etiqueta-modulo--activo' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <group position={[zona.x, 0, zona.z]}>
      {/* Iluminación suave permanente en el piso del módulo (#43) */}
      <mesh position={[0, 0.162, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[anchoInterior, fondoInterior]} />
        <meshBasicMaterial
          ref={matPisoRef}
          color={colorBase}
          transparent
          opacity={opacidadBase}
          depthWrite={false}
        />
      </mesh>

      {/* Contorno perimetral visible siempre en el piso del módulo (#43) */}
      <group position={[0, 0.166, 0]}>
        <mesh position={[0, 0, -fondoInterior / 2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[anchoInterior, grosorBorde]} />
          <meshBasicMaterial color={colorBase} transparent opacity={opacidadBorde} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, fondoInterior / 2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[anchoInterior, grosorBorde]} />
          <meshBasicMaterial color={colorBase} transparent opacity={opacidadBorde} depthWrite={false} />
        </mesh>
        <mesh position={[-anchoInterior / 2, 0, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[grosorBorde, fondoInterior]} />
          <meshBasicMaterial color={colorBase} transparent opacity={opacidadBorde} depthWrite={false} />
        </mesh>
        <mesh position={[anchoInterior / 2, 0, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[grosorBorde, fondoInterior]} />
          <meshBasicMaterial color={colorBase} transparent opacity={opacidadBorde} depthWrite={false} />
        </mesh>
      </group>

      {/* Indicador visual del objetivo de la guía del primer sol */}
      {esObjetivo && (
        <mesh ref={coneObjetivoRef} position={[0, 3.5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.45, 0.9, 4]} />
          <meshBasicMaterial color="#fbbf24" depthTest={false} />
        </mesh>
      )}

      {/* Etiqueta flotante con ícono, nombre localizado y aviso de falla sobre cada módulo (#43) */}
      {mostrarEtiqueta && (
        <Html
          position={[zona.etiquetaPos[0] - zona.x, zona.etiquetaPos[1], zona.etiquetaPos[2] - zona.z]}
          center
          zIndexRange={[8, 0]}
        >
          <div className="etiqueta-modulo-contenedor">
            {fallaTexto && (
              <div className="falla-modulo" role="status">
                {fallaTexto}
              </div>
            )}
            <button
              type="button"
              className={clasesEtiqueta}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(zona.id);
              }}
              onMouseEnter={() => onHover(zona.id)}
              onMouseLeave={() => onHover(null)}
            >
              <span className="etiqueta-modulo__icono" aria-hidden="true">
                {zona.icono}
              </span>
              <span className="etiqueta-modulo__texto">{t(`modulo.${zona.id}`)}</span>
              {energiaAsignada > 0 && zona.id !== 'pasillo' && (
                <span className="etiqueta-modulo__energia" aria-hidden="true">
                  ⚡{energiaAsignada}
                </span>
              )}
            </button>
          </div>
        </Html>
      )}

      {/* Volumen táctil que coincide 1 a 1 con detectarModulo (#43) */}
      <mesh
        position={[0, 0.2, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta > 12) return;
          onSelect(zona.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(zona.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[zona.w, 0.4, zona.d]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Escena 3D principal del juego: Mars Dune Alpha + comandante controlable por teclado y toque. */
export function MarsDioramaScene() {
  const posicionJugadorRef = useRef({ x: 0.1, z: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const animandoCamaraRef = useRef(false);
  const tamano = useThree((estado) => estado.size);
  const esMovil = tamano.width < 640;
  const [destinoTactil, setDestinoTactil] = useState<DestinoTactil | null>(null);
  const [vista, setVista] = useState<VistaId>('1');
  const [hoverModulo, setHoverModulo] = useState<ModuleId | null>(null);
  const [moduloActual, setModuloActual] = useState<ModuleId>(() => store.getState().tripulacion.comandante.modulo);
  const [fase, setFase] = useState<Phase>(() => store.getState().fase);
  const [estadoJuego, setEstadoJuego] = useState<GameState>(() => store.getState());
  const [idioma, setIdiomaEstado] = useState(() => getIdioma());
  const [objetivoGuia, setObjetivoGuia] = useState<ModuleId | null>(null);

  useEffect(() => observarObjetivoGuia(setObjetivoGuia), []);

  useEffect(() => {
    const desuscribir = store.subscribe((estado) => {
      setModuloActual(estado.tripulacion.comandante.modulo);
      setFase(estado.fase);
      setEstadoJuego(estado);
      setIdiomaEstado(getIdioma());
      if (estado.fase === 'aviso') setDestinoTactil(null);
    });
    return () => {
      desuscribir();
    };
  }, []);

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      const actual = store.getState();
      if (actual.pausado || actual.fase === 'aviso' || actual.fase === 'reporte') return;
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        setVista(e.key);
      }
    };
    const alCambiarVistaHud = (ev: Event) => {
      const nueva = (ev as CustomEvent<VistaId>).detail;
      if (nueva === '1' || nueva === '2' || nueva === '3') {
        setVista(nueva);
      }
    };
    const alIrModuloHud = (ev: Event) => {
      const mod = (ev as CustomEvent<ModuleId>).detail;
      if (mod) {
        setDestinoTactil((prev) => ({ modulo: mod, seq: (prev?.seq ?? 0) + 1 }));
      }
    };

    window.addEventListener('keydown', alPresionar);
    window.addEventListener('space-junior:vista', alCambiarVistaHud);
    window.addEventListener('space-junior:ir-modulo', alIrModuloHud);
    return () => {
      window.removeEventListener('keydown', alPresionar);
      window.removeEventListener('space-junior:vista', alCambiarVistaHud);
      window.removeEventListener('space-junior:ir-modulo', alIrModuloHud);
    };
  }, []);

  const seleccionarModulo = (id: ModuleId) => {
    setDestinoTactil((prev) => ({ modulo: id, seq: (prev?.seq ?? 0) + 1 }));
  };

  return (
    <>
      <CamaraIsometrica />
      <TransicionCamara vista={vista} controlsRef={controlsRef} animandoRef={animandoCamaraRef} />
      <Luces />
      <SolarStormVFX />
      <StormEffects />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0.1, 0.5, 0]}
        enablePan={esMovil}
        enableRotate
        enableZoom
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.65}
        zoomSpeed={0.75}
        minPolarAngle={0.002}
        maxPolarAngle={Math.PI / 2 - 0.25}
        minZoom={ZOOM_MIN}
        maxZoom={ZOOM_MAX}
        onStart={() => {
          animandoCamaraRef.current = false;
        }}
      />

      <group>
        <Terrain />
        <Rocks />
        <Pathways />
        <MarsDuneAlphaMap />
        <group position={[MODULOS.energia.posicion[0], 0, MODULOS.energia.posicion[1]]}>
          <SolarArray />
        </group>

        {/* Zonas táctiles e indicadores visuales unificados por módulo (#43) */}
        {ZONAS_MODULOS.map((z) => (
          <ZonaInteractivaModulo
            key={z.id}
            zona={z}
            fase={fase}
            moduloActual={moduloActual}
            hoverModulo={hoverModulo}
            esObjetivo={objetivoGuia === z.id}
            energiaAsignada={estadoJuego.energiaAsignada[z.id] ?? 0}
            fallaTexto={obtenerFallaModulo(z.id, estadoJuego)}
            idioma={idioma}
            onSelect={seleccionarModulo}
            onHover={(id) => setHoverModulo((prev) => (id === null ? null : id ?? prev))}
          />
        ))}

        <AstronautController destinoTactil={destinoTactil} posicionRef={posicionJugadorRef} />
        <CrewController />
      </group>
    </>
  );
}
