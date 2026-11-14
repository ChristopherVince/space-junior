import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { store } from '../../state/store';
import type { CrewId, ModuleId, Phase } from '../../state/types';
import { calcularRutaFija, type PuntoRuta } from '../rutas';
import { Astronaut } from './Astronaut';
import { MODULOS } from './layout';

const BOTS: { id: Exclude<CrewId, 'comandante'>; moduloBase: keyof typeof MODULOS; offset: [number, number] }[] = [
  { id: 'ingeniero', moduloBase: 'energia', offset: [-0.45, 0.35] },
  { id: 'medico', moduloBase: 'enfermeria', offset: [0.45, -0.35] },
  { id: 'cientifico', moduloBase: 'invernadero', offset: [0.35, 0.45] },
];

const VELOCIDAD_BOT = 3.6;
const PISO_Y = 0.15;

interface BotState {
  x: number;
  z: number;
  ruta: PuntoRuta[];
  destino: ModuleId;
}

/** Controla a los 3 bots de la tripulación y los lleva al refugio durante alerta/tormenta (Issue #4). */
export function CrewController() {
  const gruposRef = useRef<Record<string, THREE.Group | null>>({});

  const estadoBots = useRef<Record<string, BotState>>(
    Object.fromEntries(
      BOTS.map((b) => {
        const [bx, bz] = MODULOS[b.moduloBase].posicion;
        return [
          b.id,
          { x: bx + b.offset[0], z: bz + b.offset[1], ruta: [], destino: b.moduloBase as ModuleId },
        ];
      }),
    ),
  );

  useEffect(() => {
    const actualizarDestinos = (fase: Phase) => {
      const irARefugio = fase === 'refugio' || fase === 'tormenta';
      for (const b of BOTS) {
        const st = estadoBots.current[b.id];
        const nuevoDestino: ModuleId = irARefugio ? 'refugio' : store.getState().tripulacion[b.id].modulo;
        if (st.destino !== nuevoDestino) {
          st.destino = nuevoDestino;
          st.ruta = calcularRutaFija(st.x, st.z, nuevoDestino);
        }
      }
    };

    const desuscribir = store.subscribe((estado) => {
      actualizarDestinos(estado.fase);
    });

    return () => {
      desuscribir();
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    for (const b of BOTS) {
      const st = estadoBots.current[b.id];
      const grupo = gruposRef.current[b.id];
      if (!grupo) continue;

      if (st.ruta.length > 0) {
        const objetivo = st.ruta[0];
        const tx = objetivo.x + b.offset[0] * 0.5;
        const tz = objetivo.z + b.offset[1] * 0.5;
        const rx = tx - st.x;
        const rz = tz - st.z;
        const dist = Math.hypot(rx, rz);

        if (dist < 0.12) {
          st.ruta.shift();
          if (st.ruta.length === 0 && store.getState().tripulacion[b.id].modulo !== st.destino) {
            store.dispatch({ type: 'MOVER_TRIPULANTE', quien: b.id, modulo: st.destino });
          }
        } else {
          const paso = Math.min(VELOCIDAD_BOT * dt, dist);
          st.x += (rx / dist) * paso;
          st.z += (rz / dist) * paso;
          grupo.rotation.y = Math.atan2(rx, rz);
        }
      }

      grupo.position.set(st.x, PISO_Y, st.z);
    }
  });

  return (
    <>
      {BOTS.map((b) => (
        <group
          key={b.id}
          ref={(el) => {
            gruposRef.current[b.id] = el;
          }}
        >
          <Astronaut caminando={false} rol={b.id} />
        </group>
      ))}
    </>
  );
}
