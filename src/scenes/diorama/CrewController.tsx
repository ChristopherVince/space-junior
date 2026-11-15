import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BOTS_ESCENA, destinoDeBot, type BotId } from '../../bots/bots';
import { store } from '../../state/store';
import type { GameState, ModuleId } from '../../state/types';
import { calcularRutaFija, calcularRutaAlRefugio, type PuntoRuta } from '../rutas';
import { Astronaut } from './Astronaut';
import { resolverMovimientoConMuros } from './collision';

const VELOCIDAD_BOT = 4.8;
const RADIO_BOT = 0.26;
const PISO_Y = 0.15;

interface BotState {
  x: number;
  z: number;
  ruta: PuntoRuta[];
  destino: ModuleId;
  evacuando: boolean;
}

/**
 * Controla a los 3 bots de la tripulación (#14 y #4):
 * - Cada uno inicia y trabaja en su módulo (Energía, Enfermería, Invernadero).
 * - Cuando tiene una petición activa, camina por la ruta fija hacia el módulo del comandante.
 * - Al llegar junto al comandante, actualiza su módulo en el store (lo que abre el diálogo #13).
 * - Después de responder, regresa caminando a su módulo base.
 * - En fase 'refugio' o 'tormenta', todos corren al refugio.
 */
export function CrewController() {
  const gruposRef = useRef<Record<BotId, THREE.Group | null>>({
    ingeniero: null,
    medico: null,
    cientifico: null,
  });

  const [caminando, setCaminando] = useState<Record<BotId, boolean>>({
    ingeniero: false,
    medico: false,
    cientifico: false,
  });

  const [botConPeticion, setBotConPeticion] = useState<BotId | null>(null);

  const estadoBots = useRef<Record<BotId, BotState>>(
    Object.fromEntries(
      BOTS_ESCENA.map((b) => [
        b.id,
        {
          x: b.posInicial[0],
          z: b.posInicial[1],
          ruta: [],
          destino: b.moduloBase,
          evacuando: false,
        },
      ]),
    ) as unknown as Record<BotId, BotState>,
  );

  useEffect(() => {
    const sincronizarConEstado = (estado: GameState) => {
      const alerta = estado.fase === 'refugio' || estado.fase === 'tormenta';
      const peticionDe =
        estado.peticionActiva && estado.peticionActiva.de !== 'comandante'
          ? estado.peticionActiva.de
          : null;
      setBotConPeticion(alerta ? null : peticionDe);

      for (const b of BOTS_ESCENA) {
        const st = estadoBots.current[b.id];
        if (alerta) {
          if (!st.evacuando) {
            st.evacuando = true;
            st.destino = 'refugio';
            st.ruta = calcularRutaAlRefugio(b.id, st.x, st.z);
          }
          continue;
        }
        st.evacuando = false;
        if (estado.fase === 'reporte') {
          st.ruta = [];
          continue;
        }
        const nuevoDestino = destinoDeBot(estado, b);

        if (st.destino !== nuevoDestino) {
          const veniaDeHablar = st.destino !== b.moduloBase && nuevoDestino === b.moduloBase;
          st.destino = nuevoDestino;
          st.ruta = calcularRutaFija(st.x, st.z, nuevoDestino);

          if (veniaDeHablar && estado.tripulacion[b.id].modulo !== b.moduloBase) {
            store.dispatch({ type: 'MOVER_TRIPULANTE', quien: b.id, modulo: b.moduloBase });
          } else if (
            peticionDe === b.id &&
            st.ruta.length > 0 &&
            estado.tripulacion[b.id].modulo === nuevoDestino
          ) {
            const moduloTransito: ModuleId = nuevoDestino === 'pasillo' ? b.moduloBase : 'pasillo';
            store.dispatch({ type: 'MOVER_TRIPULANTE', quien: b.id, modulo: moduloTransito });
          }
        } else if (
          peticionDe === b.id &&
          st.ruta.length === 0 &&
          estado.tripulacion[b.id].modulo !== nuevoDestino
        ) {
          // Si ya estaba en el destino sin tramos pendientes, confirma llegada.
          st.ruta = calcularRutaFija(st.x, st.z, nuevoDestino);
        }
      }
    };

    sincronizarConEstado(store.getState());
    const desuscribir = store.subscribe(sincronizarConEstado);
    return () => {
      desuscribir();
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    let huboCambioCaminando = false;
    const nuevoCaminando: Record<BotId, boolean> = { ...caminando };

    for (const b of BOTS_ESCENA) {
      const st = estadoBots.current[b.id];
      const grupo = gruposRef.current[b.id];
      if (!grupo) continue;

      const enMarcha = st.ruta.length > 0;
      if (nuevoCaminando[b.id] !== enMarcha) {
        nuevoCaminando[b.id] = enMarcha;
        huboCambioCaminando = true;
      }

      if (enMarcha) {
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
          const siguiente = resolverMovimientoConMuros(st.x, st.z, rx / dist * paso, rz / dist * paso, RADIO_BOT);
          st.x = siguiente.x;
          st.z = siguiente.z;

          const anguloObjetivo = Math.atan2(rx, rz);
          let diff = anguloObjetivo - grupo.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          grupo.rotation.y += diff * Math.min(1, delta * 14);
        }
      }

      grupo.position.set(st.x, PISO_Y, st.z);
    }

    if (huboCambioCaminando) {
      setCaminando(nuevoCaminando);
    }
  });

  return (
    <>
      {BOTS_ESCENA.map((b) => (
        <group
          key={b.id}
          position={[b.posInicial[0], PISO_Y, b.posInicial[1]]}
          ref={(el) => {
            gruposRef.current[b.id] = el;
          }}
        >
          <Astronaut caminando={caminando[b.id]} rol={b.id} />
          {botConPeticion === b.id && (
            <group position={[0, 1.24, 0]}>
              <mesh position={[0, 0.08, 0]}>
                <capsuleGeometry args={[0.045, 0.12, 4, 8]} />
                <meshBasicMaterial color="#facc15" />
              </mesh>
              <mesh position={[0, -0.08, 0]}>
                <sphereGeometry args={[0.048, 8, 8]} />
                <meshBasicMaterial color="#facc15" />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </>
  );
}
