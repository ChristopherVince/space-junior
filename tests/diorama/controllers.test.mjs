import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

// Ejecuta los controladores reales con reloj, entradas y renderizador controlados.
async function cargar(controlador, h) {
  globalThis.__dioramaTest = h;
  const result = await build({
    entryPoints: [`src/scenes/diorama/${controlador}.tsx`], bundle: true,
    write: false, platform: 'node', format: 'esm', jsx: 'automatic',
    plugins: [{ name: 'renderizador-controlado', setup(b) {
      b.onResolve({ filter: /^(react|react\/jsx-runtime|@react-three\/fiber)$|\/state\/store$|\.\/Astronaut$/ }, a => ({ path: a.path, namespace: 'mock' }));
      b.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => ({ contents:
        path === 'react' ? `const h=globalThis.__dioramaTest; export const useRef=v=>({current:v}); export const useState=v=>[typeof v==='function'?v():v,()=>{}]; export const useEffect=f=>h.effects.push(f);` :
        path === 'react/jsx-runtime' ? `export const Fragment='fragment'; export function jsx(type, props){if(type==='group'&&props.ref){const group={position:{set(){}},rotation:{y:0}};if(typeof props.ref==='function')props.ref(group);else props.ref.current=group;}return null;} export const jsxs=jsx;` :
        path === '@react-three/fiber' ? `const h=globalThis.__dioramaTest; export const useFrame=f=>h.frames.push(f); export const useThree=f=>f({camera:{getWorldDirection(v){v.set(0,0,-1);}}});` :
        path.endsWith('/store') ? `export const store=globalThis.__dioramaTest.store;` : `export const Astronaut=()=>null;`,
      }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}#${Math.random()}`);
}

for (const inicial of ['preparacion', 'refugio', 'tormenta']) {
  test(`los controladores llegan y bloquean entradas desde ${inicial}`, async () => {
    const listeners = new Set();
    const events = new Map();
    const acciones = [];
    let estado = { fase: inicial, tripulacion: Object.fromEntries([
      ['comandante', 'pasillo'], ['ingeniero', 'energia'], ['medico', 'enfermeria'], ['cientifico', 'invernadero'],
    ].map(([id, modulo]) => [id, { modulo }])) };
    const h = { effects: [], frames: [], store: {
      getState: () => estado,
      subscribe: f => { listeners.add(f); return () => listeners.delete(f); },
      dispatch: a => {
        acciones.push(a);
        estado = { ...estado, tripulacion: { ...estado.tripulacion, [a.quien]: { modulo: a.modulo } } };
        for (const f of listeners) f(estado);
      },
    } };
    const originalWindow = globalThis.window;
    globalThis.window = {
      addEventListener: (tipo, f) => events.set(tipo, f),
      removeEventListener: tipo => events.delete(tipo),
    };
    const cleanups = [];
    try {
      const { AstronautController } = await cargar('AstronautController', h);
      const { CrewController } = await cargar('CrewController', h);
      const posicionRef = { current: { x: 0.1, z: 0 } };
      AstronautController({ destinoTactil: null, posicionRef });
      CrewController();
      for (const effect of h.effects) cleanups.push(effect());
      const fase = valor => { estado = { ...estado, fase: valor }; for (const f of listeners) f(estado); };
      if (inicial === 'preparacion') fase('refugio');
      for (let frame = 0; frame < 2400; frame++) {
        if (frame === 20) fase('tormenta');
        events.get('keydown')?.({ key: 'd' });
        for (const f of h.frames) f({}, 1 / 60);
      }
      for (const miembro of Object.values(estado.tripulacion)) assert.equal(miembro.modulo, 'refugio');
      assert.equal(acciones.filter(a => a.modulo === 'refugio').length, 4);
      assert.ok(Math.abs(posicionRef.current.x + 8.7) < 0.001);
      assert.ok(Math.abs(posicionRef.current.z + 0.7) < 0.001);
      fase('reporte');
      events.get('keydown')?.({ key: 'd' });
      for (const f of h.frames) f({}, 1 / 60);
      assert.ok(posicionRef.current.x > -8.7);
    } finally {
      for (const cleanup of cleanups.reverse()) cleanup?.();
      globalThis.window = originalWindow;
      delete globalThis.__dioramaTest;
    }
    assert.equal(listeners.size, 0);
  });
}
