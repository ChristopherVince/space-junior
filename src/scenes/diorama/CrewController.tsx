import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { store } from '../../state/store';
import type { CrewId, ModuleId, Phase } from '../../state/types';
import { calcularRutaAlRefugio, resolverTransicionRefugio, type PuntoRuta } from '../rutas';
import { Astronaut } from './Astronaut';
import { resolverMovimientoConMuros } from './collision';

const BOTS: {
  id: Exclude<CrewId, 'comandante'>;
  moduloBase: ModuleId;
  posicionInicial: [number, number];
}[] = [
  { id: 'ingeniero', moduloBase: 'energia', posicionInicial: [3.6, 3.2] },
  { id: 'medico', moduloBase: 'enfermeria', posicionInicial: [7.6, 3.2] },
  { id: 'cientifico', moduloBase: 'invernadero', posicionInicial: [-5.5, 0] },
];

const VELOCIDAD_BOT = 3.6;
const RADIO_BOT = 0.26;
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
  const [caminandoBots, setCaminandoBots] = useState<Record<string, boolean>>({});
  const caminandoRef = useRef<Record<string, boolean>>({});

  const estadoBots = useRef<Record<string, BotState>>(
    Object.fromEntries(
      BOTS.map((b) => {
        const [bx, bz] = b.posicionInicial;
        return [
          b.id,
          { x: bx, z: bz, ruta: [], destino: b.moduloBase },
        ];
      }),
    ),
  );

  useEffect(() => {
    const actualizarDestinos = (fase: Phase) => {
      for (const b of BOTS) {
        const st = estadoBots.current[b.id];
        const transicion = resolverTransicionRefugio(fase, st.destino === 'refugio');
        if (transicion === 'iniciar') {
          st.destino = 'refugio';
          st.ruta = calcularRutaAlRefugio(b.id, st.x, st.z);
        } else if (transicion === 'liberar') {
          st.ruta = [];
          st.destino = store.getState().tripulacion[b.id].modulo;
        }
      }
    };

    actualizarDestinos(store.getState().fase);
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
        const rx = objetivo.x - st.x;
        const rz = objetivo.z - st.z;
        const dist = Math.hypot(rx, rz);

        if (dist < 0.0001) {
          st.ruta.shift();
          if (st.ruta.length === 0) {
            store.dispatch({ type: 'MOVER_TRIPULANTE', quien: b.id, modulo: st.destino });
          }
        } else {
          const paso = Math.min(VELOCIDAD_BOT * dt, dist);
          const siguiente = resolverMovimientoConMuros(
            st.x,
            st.z,
            (rx / dist) * paso,
            (rz / dist) * paso,
            RADIO_BOT,
          );
          st.x = siguiente.x;
          st.z = siguiente.z;
          grupo.rotation.y = Math.atan2(rx, rz);
        }
      }

      const moviendo = st.ruta.length > 0;
      if (caminandoRef.current[b.id] !== moviendo) {
        caminandoRef.current[b.id] = moviendo;
        setCaminandoBots((prev) => ({ ...prev, [b.id]: moviendo }));
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
          <Astronaut caminando={Boolean(caminandoBots[b.id])} rol={b.id} />
        </group>
      ))}
    </>
  );
}
