import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { store } from '../../state/store';
import type { ModuleId } from '../../state/types';
import { calcularRutaFija, type PuntoRuta } from '../rutas';
import { Astronaut } from './Astronaut';
import { colisionaConMuros, detectarModulo } from './collision';

const VELOCIDAD = 4.2;
const RADIO_JUGADOR = 0.26;
const PISO_Y = 0.15;

export interface DestinoTactil {
  modulo: ModuleId;
  seq: number;
}

interface AstronautControllerProps {
  destinoTactil: DestinoTactil | null;
  posicionRef: MutableRefObject<{ x: number; z: number }>;
}

export function AstronautController({ destinoTactil, posicionRef }: AstronautControllerProps) {
  const grupo = useRef<THREE.Group>(null);
  const pos = useRef({ x: 0.1, z: 0 });
  const rutaRef = useRef<PuntoRuta[]>([]);
  const teclas = useRef(new Set<string>());
  const [caminando, setCaminando] = useState(false);

  useEffect(() => {
    if (!destinoTactil) return;
    rutaRef.current = calcularRutaFija(pos.current.x, pos.current.z, destinoTactil.modulo);
  }, [destinoTactil]);

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        teclas.current.add(k);
      }
    };
    const alSoltar = (e: KeyboardEvent) => {
      teclas.current.delete(e.key.toLowerCase());
    };
    const alPerderFoco = () => teclas.current.clear();

    window.addEventListener('keydown', alPresionar);
    window.addEventListener('keyup', alSoltar);
    window.addEventListener('blur', alPerderFoco);
    return () => {
      window.removeEventListener('keydown', alPresionar);
      window.removeEventListener('keyup', alSoltar);
      window.removeEventListener('blur', alPerderFoco);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = teclas.current;
    let dx = (k.has('arrowright') || k.has('d') ? 1 : 0) - (k.has('arrowleft') || k.has('a') ? 1 : 0);
    let dz = (k.has('arrowdown') || k.has('s') ? 1 : 0) - (k.has('arrowup') || k.has('w') ? 1 : 0);

    const usaTeclado = dx !== 0 || dz !== 0;
    if (usaTeclado) {
      rutaRef.current = [];
    } else if (rutaRef.current.length > 0) {
      const objetivo = rutaRef.current[0];
      const diffX = objetivo.x - pos.current.x;
      const diffZ = objetivo.z - pos.current.z;
      if (Math.hypot(diffX, diffZ) < 0.14) {
        rutaRef.current.shift();
      } else {
        dx = diffX;
        dz = diffZ;
      }
    }

    const enMovimiento = dx !== 0 || dz !== 0;
    if (enMovimiento !== caminando) setCaminando(enMovimiento);

    if (enMovimiento) {
      const len = Math.hypot(dx, dz);
      const vx = (dx / len) * VELOCIDAD * dt;
      const vz = (dz / len) * VELOCIDAD * dt;

      if (usaTeclado) {
        if (!colisionaConMuros(pos.current.x + vx, pos.current.z, RADIO_JUGADOR)) {
          pos.current.x += vx;
        }
        if (!colisionaConMuros(pos.current.x, pos.current.z + vz, RADIO_JUGADOR)) {
          pos.current.z += vz;
        }
      } else {
        pos.current.x += vx;
        pos.current.z += vz;
      }

      posicionRef.current.x = pos.current.x;
      posicionRef.current.z = pos.current.z;

      if (grupo.current) {
        grupo.current.position.set(pos.current.x, PISO_Y, pos.current.z);
        const anguloObjetivo = Math.atan2(dx, dz);
        let diff = anguloObjetivo - grupo.current.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        grupo.current.rotation.y += diff * Math.min(1, delta * 14);
      }

      const modulo = detectarModulo(pos.current.x, pos.current.z);
      const actual = store.getState().tripulacion.comandante.modulo;
      if (modulo && modulo !== actual) {
        store.dispatch({ type: 'MOVER_TRIPULANTE', quien: 'comandante', modulo });
      }
    }
  });

  return (
    <group ref={grupo} position={[0.1, PISO_Y, 0]}>
      <Astronaut caminando={caminando} />
    </group>
  );
}
