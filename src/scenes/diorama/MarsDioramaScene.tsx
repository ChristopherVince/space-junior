import { Html, OrbitControls } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { store } from '../../state/store';
import { getIdioma, t } from '../../i18n';
import type { ModuleId, Phase } from '../../state/types';
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

interface ZonaInteractivaProps {
  zona: ZonaModulo;
  fase: Phase;
  moduloActual: ModuleId;
  hoverModulo: ModuleId | null;
  idioma: ReturnType<typeof getIdioma>;
  onSelect: (id: ModuleId) => void;
  onHover: (id: ModuleId | null) => void;
}

function ZonaInteractivaModulo({
  zona,
  fase,
  moduloActual,
  hoverModulo,
  onSelect,
  onHover,
}: ZonaInteractivaProps) {
  const matPisoRef = useRef<THREE.MeshBasicMaterial>(null);
  const esRefugio = zona.id === 'refugio';
  const enAlertaRefugio = esRefugio && (fase === 'refugio' || fase === 'tormenta');
  const estaAdentro = moduloActual === zona.id;
  const estaHover = hoverModulo === zona.id;
  const mostrarEtiqueta = fase !== 'aviso' && fase !== 'reporte';

  const colorBase = enAlertaRefugio
    ? '#22c55e'
    : estaHover
      ? '#fbbf24'
      : estaAdentro
        ? '#f59e0b'
        : zona.color;

  const opacidadBase = enAlertaRefugio
    ? 0.34
    : estaHover
      ? 0.25
      : estaAdentro
        ? 0.2
        : esRefugio
          ? 0.16
          : 0.1;

  const opacidadBorde = enAlertaRefugio
    ? 0.92
    : estaHover || estaAdentro
      ? 0.85
      : esRefugio
        ? 0.68
        : 0.48;

  useFrame(({ clock }) => {
    if (!matPisoRef.current) return;
    if (enAlertaRefugio) {
      const pulso = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 6);
      matPisoRef.current.opacity = 0.22 + pulso * 0.24;
    } else if (esRefugio && !estaHover && !estaAdentro) {
      const pulsoSuave = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.2);
      matPisoRef.current.opacity = 0.13 + pulsoSuave * 0.06;
    } else {
      matPisoRef.current.opacity = opacidadBase;
    }
  });

  const anchoInterior = Math.max(0.4, zona.w - 0.34);
  const fondoInterior = Math.max(0.4, zona.d - 0.34);
  const grosorBorde = esRefugio || estaAdentro || estaHover ? 0.11 : 0.08;

  const clasesEtiqueta = [
    'etiqueta-modulo',
    esRefugio ? 'etiqueta-modulo--refugio' : '',
    enAlertaRefugio ? 'etiqueta-modulo--alerta' : '',
    estaAdentro || estaHover ? 'etiqueta-modulo--activo' : '',
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

      {/* Etiqueta flotante con ícono y nombre localizado sobre cada módulo (#43) */}
      {mostrarEtiqueta && (
        <Html
          position={[zona.etiquetaPos[0] - zona.x, zona.etiquetaPos[1], zona.etiquetaPos[2] - zona.z]}
          center
          zIndexRange={[8, 0]}
        >
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
          </button>
        </Html>
      )}

      {/* Volumen táctil que coincide 1 a 1 con detectarModulo (#43) */}
      <mesh
        position={[0, 0.2, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta > 6) return;
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
  const camara = useThree((estado) => estado.camera);
  const [destinoTactil, setDestinoTactil] = useState<DestinoTactil | null>(null);
  const [vista, setVista] = useState<VistaId>('1');
  const [hoverModulo, setHoverModulo] = useState<ModuleId | null>(null);
  const [moduloActual, setModuloActual] = useState<ModuleId>(() => store.getState().tripulacion.comandante.modulo);
  const [fase, setFase] = useState<Phase>(() => store.getState().fase);
  const [idioma, setIdiomaEstado] = useState(() => getIdioma());

  useEffect(() => {
    const desuscribir = store.subscribe((estado) => {
      setModuloActual(estado.tripulacion.comandante.modulo);
      setFase(estado.fase);
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

  const seleccionarModulo = (id: ModuleId) => {
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

        {/* Zonas táctiles e indicadores visuales unificados por módulo (#43) */}
        {ZONAS_MODULOS.map((z) => (
          <ZonaInteractivaModulo
            key={z.id}
            zona={z}
            fase={fase}
            moduloActual={moduloActual}
            hoverModulo={hoverModulo}
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
