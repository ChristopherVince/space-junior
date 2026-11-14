import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { store } from '../../state/store';
import type { Phase } from '../../state/types';

const CANTIDAD_PARTICULAS = 900;
const RANGO_X = 24;
const RANGO_Y = 8.5;
const RANGO_Z = 20;

/** Ventisca de polvo marciano y partículas energéticas durante la tormenta solar. */
export function SolarStormVFX() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const fogRef = useRef<THREE.FogExp2>(null);
  const faseRef = useRef<Phase>(store.getState().fase);
  const testRef = useRef(false);

  useEffect(() => {
    const desuscribir = store.subscribe((estado) => {
      faseRef.current = estado.fase;
    });
    const alTest = (e: Event) => {
      testRef.current = Boolean((e as CustomEvent<{ activa: boolean }>).detail?.activa);
    };
    window.addEventListener('test-tormenta', alTest);
    return () => {
      desuscribir();
      window.removeEventListener('test-tormenta', alTest);
    };
  }, []);

  const posiciones = useMemo(() => {
    const arr = new Float32Array(CANTIDAD_PARTICULAS * 3);
    for (let i = 0; i < CANTIDAD_PARTICULAS; i++) {
      arr[i * 3] = (Math.random() - 0.5) * RANGO_X * 2;
      arr[i * 3 + 1] = 0.25 + Math.random() * RANGO_Y;
      arr[i * 3 + 2] = (Math.random() - 0.5) * RANGO_Z * 2;
    }
    return arr;
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const fase = faseRef.current;
    const enTormenta = fase === 'tormenta' || testRef.current;
    const enRefugio = fase === 'refugio';
    const intensa = enTormenta || enRefugio;

    const velX = enTormenta ? 16 : enRefugio ? 9 : 1.1;
    const velZ = enTormenta ? 4.5 : enRefugio ? 2.5 : 0.35;

    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      const t = clock.elapsedTime;

      for (let i = 0; i < CANTIDAD_PARTICULAS; i++) {
        const idx = i * 3;
        arr[idx] += velX * dt;
        arr[idx + 1] += Math.sin(t * 2.5 + i) * (intensa ? 0.9 : 0.15) * dt;
        arr[idx + 2] += velZ * dt;

        if (arr[idx] > RANGO_X) arr[idx] = -RANGO_X;
        if (arr[idx + 2] > RANGO_Z) arr[idx + 2] = -RANGO_Z;
        if (arr[idx + 1] < 0.2) arr[idx + 1] = RANGO_Y;
        if (arr[idx + 1] > RANGO_Y) arr[idx + 1] = 0.25;
      }
      attr.needsUpdate = true;
    }

    if (materialRef.current) {
      materialRef.current.opacity = enTormenta ? 0.78 : enRefugio ? 0.5 : 0.2;
      materialRef.current.size = enTormenta ? 0.19 : 0.12;
      materialRef.current.color.set(intensa ? '#ff7b54' : '#e6b89c');
    }

    if (fogRef.current) {
      fogRef.current.density = enTormenta ? 0.024 : enRefugio ? 0.015 : 0.006;
      fogRef.current.color.set(enTormenta ? '#8f2d1e' : enRefugio ? '#b0482e' : '#d99b78');
    }
  });

  return (
    <>
      <fogExp2 ref={fogRef} attach="fog" args={['#d99b78', 0.006]} />
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[posiciones, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={materialRef}
          color="#e6b89c"
          size={0.12}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </points>
    </>
  );
}

