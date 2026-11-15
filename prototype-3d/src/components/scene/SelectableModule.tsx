import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import type { ModuleKey } from './layout';
import { PALETA } from './palette';

export interface SelectableModuleProps {
  id: ModuleKey;
  etiqueta: string;
  rol: string;
  posicion: [number, number];
  anchoResalte: number;
  fondoResalte: number;
  alturaEtiqueta: number;
  seleccionado: boolean;
  onSeleccionar: (id: ModuleKey | null) => void;
  children: ReactNode;
}

const REBOTE = 9;
const SUAVIZADO = 12;

/**
 * Envoltorio interactivo de cada módulo: eleva levemente el volumen, dibuja un
 * anillo cálido en la base y muestra un tooltip con el nombre (texto de i18n).
 */
export function SelectableModule({
  id,
  etiqueta,
  rol,
  posicion,
  anchoResalte,
  fondoResalte,
  alturaEtiqueta,
  seleccionado,
  onSeleccionar,
  children,
}: SelectableModuleProps) {
  const grupo = useRef<THREE.Group>(null);
  const anillo = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const salida = useRef<number | null>(null);
  const [encima, setEncima] = useState(false);
  const activo = encima || seleccionado;

  useEffect(() => {
    if (!encima) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = '';
    };
  }, [encima]);

  useEffect(
    () => () => {
      if (salida.current !== null) window.clearTimeout(salida.current);
    },
    [],
  );

  useFrame((_, delta) => {
    const alturaObjetivo = activo ? 0.16 : 0;
    if (grupo.current) {
      grupo.current.position.y = THREE.MathUtils.damp(grupo.current.position.y, alturaObjetivo, REBOTE, delta);
    }
    const opacidadAnillo = activo ? 0.95 : 0;
    const opacidadHalo = activo ? 0.12 : 0;
    if (anillo.current) {
      const material = anillo.current.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.damp(material.opacity, opacidadAnillo, SUAVIZADO, delta);
    }
    if (halo.current) {
      const material = halo.current.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.damp(material.opacity, opacidadHalo, SUAVIZADO, delta);
    }
  });

  // El hover puede saltar entre hijos del mismo grupo: se retrasa la salida para
  // que el tooltip y el resalte no parpadeen.
  const entrar = (evento: ThreeEvent<PointerEvent>) => {
    evento.stopPropagation();
    if (salida.current !== null) {
      window.clearTimeout(salida.current);
      salida.current = null;
    }
    setEncima(true);
  };

  const programarSalida = () => {
    if (salida.current !== null) window.clearTimeout(salida.current);
    salida.current = window.setTimeout(() => {
      salida.current = null;
      setEncima(false);
    }, 30);
  };

  const alternar = (evento: ThreeEvent<MouseEvent>) => {
    evento.stopPropagation();
    onSeleccionar(seleccionado ? null : id);
  };

  return (
    <group position={[posicion[0], 0, posicion[1]]}>
      <group
        ref={grupo}
        onClick={alternar}
        onPointerOver={entrar}
        onPointerMove={entrar}
        onPointerOut={programarSalida}
      >
        {children}

        {activo && (
          <Html
            position={[0, alturaEtiqueta, 0]}
            center
            zIndexRange={[1, 0]}
            pointerEvents="none"
            style={{ pointerEvents: 'none' }}
          >
            <div className="etiqueta-modulo">
              <span className="etiqueta-modulo__nombre">{etiqueta}</span>
              <span className="etiqueta-modulo__rol">{rol}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Halo suave sobre la arena */}
      <mesh ref={halo} rotation-x={-Math.PI / 2} position-y={0.02} scale={[anchoResalte, fondoResalte, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial
          color={PALETA.resalte}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Anillo de selección */}
      <mesh
        ref={anillo}
        rotation-x={-Math.PI / 2}
        position-y={0.16}
        scale={[anchoResalte, fondoResalte, 1]}
      >
        <torusGeometry args={[1, 0.02, 6, 96]} />
        <meshBasicMaterial color={PALETA.resalte} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
