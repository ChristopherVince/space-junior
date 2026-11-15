import { RoundedBox } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { store } from '../../state/store';
import type { Phase } from '../../state/types';
import { PALETA } from './palette';
import { Cimiento, PanelSolar } from './primitives';

/** Zona de energía: cuatro paneles inclinados y una unidad de baterías reactiva al estado. */
export function SolarArray() {
  const [estado, setEstado] = useState<{ unidades: number; fase: Phase }>(() => {
    const e = store.getState();
    return { unidades: e.energiaAsignada.energia ?? 0, fase: e.fase };
  });

  useEffect(() => {
    const desuscribir = store.subscribe((e) => {
      const unidades = e.energiaAsignada.energia ?? 0;
      setEstado((prev) =>
        prev.unidades === unidades && prev.fase === e.fase ? prev : { unidades, fase: e.fase },
      );
    });
    return () => {
      desuscribir();
    };
  }, []);

  const enTormenta = estado.fase === 'tormenta' || estado.fase === 'refugio';
  const panelesActivos = estado.unidades > 0 && !enTormenta;
  const colorLed = enTormenta ? '#f59e0b' : panelesActivos ? '#22c55e' : PALETA.coral;

  return (
    <group>
      <Cimiento ancho={5} fondo={4.4} alto={0.24} />

      {[-1.05, 1.05].map((x) =>
        [-0.95, 0.95].map((z) => (
          <PanelSolar
            key={`${x}-${z}`}
            posicion={[x, 0.24, z]}
            inclinacion={z > 0 ? -0.5 : -0.42}
            activa={panelesActivos}
          />
        )),
      )}

      {/* Unidad de baterías y transformador */}
      <RoundedBox
        args={[0.95, 1.05, 0.9]}
        radius={0.08}
        smoothness={2}
        bevelSegments={2}
        position={[2, 0.765, -1.95]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PALETA.muroCalido} roughness={0.8} flatShading />
      </RoundedBox>
      <mesh position={[2, 0.78, -1.49]} castShadow>
        <boxGeometry args={[0.7, 0.8, 0.05]} />
        <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.55} metalness={0.3} />
      </mesh>
      {/* Barras LED de potencia asignada */}
      {[0, 1, 2].map((nivel) => {
        const encendido = panelesActivos && estado.unidades >= nivel * 2 + 1;
        return (
          <mesh key={nivel} position={[2, 0.56 + nivel * 0.2, -1.455]}>
            <boxGeometry args={[0.46, 0.09, 0.02]} />
            <meshStandardMaterial
              color={encendido ? '#4ade80' : '#334155'}
              emissive={encendido ? '#22c55e' : '#000000'}
              emissiveIntensity={encendido ? 1.1 : 0}
              roughness={0.4}
            />
          </mesh>
        );
      })}
      <mesh position={[2, 1.2, -1.46]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial
          color={colorLed}
          emissive={colorLed}
          emissiveIntensity={1.2}
          roughness={0.4}
        />
      </mesh>
      {[1.78, 2.2].map((x) => (
        <mesh key={x} position={[x, 1.34, -2.12]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.14, 10]} />
          <meshStandardMaterial color={PALETA.metalOscuro} roughness={0.55} metalness={0.3} flatShading />
        </mesh>
      ))}
    </group>
  );
}
