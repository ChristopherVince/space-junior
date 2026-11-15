import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { store } from '../../state/store';
import type { ModuleId, Phase } from '../../state/types';
import {
  calcularRutaAlRefugio,
  calcularRutaFija,
  resolverTransicionRefugio,
  type PuntoRuta,
} from '../rutas';
import { Astronaut } from './Astronaut';
import { detectarModulo, resolverMovimientoConMuros } from './collision';

const VELOCIDAD = 4.2;
const RADIO_JUGADOR = 0.26;
const PISO_Y = 0.15;
const EJE_Y = new THREE.Vector3(0, 1, 0);
const forwardVec = new THREE.Vector3();
const rightVec = new THREE.Vector3();

export interface DestinoTactil {
  modulo: ModuleId;
  seq: number;
}

interface AstronautControllerProps {
  destinoTactil: DestinoTactil | null;
  posicionRef: MutableRefObject<{ x: number; z: number }>;
}

export function AstronautController({ destinoTactil, posicionRef }: AstronautControllerProps) {
  const camera = useThree((estado) => estado.camera);
  const grupo = useRef<THREE.Group>(null);
  const pos = useRef({ x: 0.1, z: 0 });
  const rutaRef = useRef<PuntoRuta[]>([]);
  const teclas = useRef(new Set<string>());
  const bloqueadoEnRefugioRef = useRef(false);
  const pausadoRef = useRef(Boolean(store.getState().pausado));
  const [caminando, setCaminando] = useState(false);

  useEffect(() => {
    if (!destinoTactil || bloqueadoEnRefugioRef.current) return;
    rutaRef.current = calcularRutaFija(pos.current.x, pos.current.z, destinoTactil.modulo);
  }, [destinoTactil]);

  useEffect(() => {
    const actualizarBloqueo = (fase: Phase, pausado: boolean) => {
      pausadoRef.current = pausado;
      if (pausado) {
        teclas.current.clear();
        setCaminando(false);
      }
      if (fase === 'aviso') {
        pos.current = { x: 0.1, z: 0 };
        posicionRef.current = { x: 0.1, z: 0 };
        rutaRef.current = [];
        teclas.current.clear();
        bloqueadoEnRefugioRef.current = false;
        setCaminando(false);
        if (grupo.current) {
          grupo.current.position.set(0.1, PISO_Y, 0);
          grupo.current.rotation.y = 0;
        }
        return;
      }
      const transicion = resolverTransicionRefugio(fase, bloqueadoEnRefugioRef.current);
      if (transicion === 'iniciar') {
        bloqueadoEnRefugioRef.current = true;
        teclas.current.clear();
        rutaRef.current = calcularRutaAlRefugio('comandante', pos.current.x, pos.current.z);
      } else if (transicion === 'liberar') {
        bloqueadoEnRefugioRef.current = false;
        rutaRef.current = [];
      }
    };

    const inicial = store.getState();
    actualizarBloqueo(inicial.fase, Boolean(inicial.pausado));
    const desuscribir = store.subscribe((estado) => actualizarBloqueo(estado.fase, Boolean(estado.pausado)));
    return () => {
      desuscribir();
    };
  }, []);

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        if (bloqueadoEnRefugioRef.current || pausadoRef.current) return;
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
    const inputRight = (k.has('arrowright') || k.has('d') ? 1 : 0) - (k.has('arrowleft') || k.has('a') ? 1 : 0);
    const inputForward = (k.has('arrowup') || k.has('w') ? 1 : 0) - (k.has('arrowdown') || k.has('s') ? 1 : 0);

    let dx = 0;
    let dz = 0;
    const usaTeclado = !bloqueadoEnRefugioRef.current && (inputRight !== 0 || inputForward !== 0);
    if (usaTeclado) {
      camera.getWorldDirection(forwardVec);
      forwardVec.y = 0;
      if (forwardVec.lengthSq() > 0.0001) {
        forwardVec.normalize();
      } else {
        forwardVec.set(0, 0, -1);
      }
      rightVec.crossVectors(forwardVec, EJE_Y).normalize();

      dx = forwardVec.x * inputForward + rightVec.x * inputRight;
      dz = forwardVec.z * inputForward + rightVec.z * inputRight;
      rutaRef.current = [];
    } else if (rutaRef.current.length > 0) {
      const objetivo = rutaRef.current[0];
      const diffX = objetivo.x - pos.current.x;
      const diffZ = objetivo.z - pos.current.z;
      // El último paso se recorta a la distancia restante, así que llega exacto.
      if (Math.hypot(diffX, diffZ) < 0.0001) {
        rutaRef.current.shift();
        if (
          rutaRef.current.length === 0 &&
          bloqueadoEnRefugioRef.current
        ) {
          store.dispatch({ type: 'MOVER_TRIPULANTE', quien: 'comandante', modulo: 'refugio' });
        }
      } else {
        dx = diffX;
        dz = diffZ;
      }
    }

    const enMovimiento = dx !== 0 || dz !== 0;
    if (enMovimiento !== caminando) setCaminando(enMovimiento);

    if (enMovimiento) {
      const len = Math.hypot(dx, dz);
      const paso = usaTeclado ? VELOCIDAD * dt : Math.min(VELOCIDAD * dt, len);
      const vx = (dx / len) * paso;
      const vz = (dz / len) * paso;
      const siguiente = resolverMovimientoConMuros(pos.current.x, pos.current.z, vx, vz, RADIO_JUGADOR);
      pos.current.x = siguiente.x;
      pos.current.z = siguiente.z;

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

      if (!bloqueadoEnRefugioRef.current) {
        const modulo = detectarModulo(pos.current.x, pos.current.z);
        const actual = store.getState().tripulacion.comandante.modulo;
        if (modulo && modulo !== actual) {
          store.dispatch({ type: 'MOVER_TRIPULANTE', quien: 'comandante', modulo });
        }
      }
    }
  });

  return (
    <group ref={grupo} position={[0.1, PISO_Y, 0]}>
      <Astronaut caminando={caminando} />
    </group>
  );
}
