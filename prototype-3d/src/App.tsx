import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import type { ModuleKey } from './components/scene/layout';
import { MarsDioramaScene } from './components/scene/MarsDioramaScene';
import { idiomaInicial } from './i18n';

export function App() {
  const [idioma] = useState(idiomaInicial);
  const [seleccion, setSeleccion] = useState<ModuleKey | null>(null);

  return (
    <div className="app">
      <div className="lienzo">
        <Canvas
          shadows
          orthographic
          dpr={[1, 2]}
          camera={{ position: [19, 17, 19], zoom: 38, near: 1, far: 200 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onPointerMissed={() => setSeleccion(null)}
        >
          <MarsDioramaScene
            idioma={idioma}
            seleccion={seleccion}
            onSeleccion={setSeleccion}
            reinicio={0}
          />
        </Canvas>
      </div>
    </div>
  );
}
