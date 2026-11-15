import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

test('silencio persistente y limpieza del ciclo de tormenta', async () => {
  const slots = [], effects = [], pending = [], nodes = new Set(), events = new Map();
  const intervals = new Set(), rafs = new Set(), subscribers = new Set();
  let cursor = 0, fase = 'preparacion', beeps = 0, stops = 0, closed = false;
  const h = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useEffect(fn, deps) {
      const i = cursor++, old = effects[i];
      if (!old || deps.some((v, j) => v !== old.deps[j])) pending.push(() => {
        old?.cleanup?.(); effects[i] = { deps, cleanup: fn() };
      });
    },
    store: { getState: () => ({ fase }), subscribe: f => { subscribers.add(f); return () => subscribers.delete(f); } },
  };
  globalThis.__stormTest = h;
  const previous = { window: globalThis.window, document: globalThis.document };
  const container = { appendChild: n => nodes.add(n) };
  const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} };
  class AudioContext {
    state = 'suspended'; currentTime = 0; destination = {};
    async resume() { this.state = 'running'; }
    async close() { closed = true; }
    createOscillator() { return { frequency: param, connect() {}, disconnect() {}, start() { beeps++; }, stop() { stops++; } }; }
    createGain() { return { gain: param, connect() {}, disconnect() {} }; }
  }
  globalThis.window = {
    AudioContext, innerWidth: 1000, innerHeight: 700,
    addEventListener: (k, f) => events.set(k, f), removeEventListener: k => events.delete(k),
    setInterval: f => { intervals.add(f); return f; }, clearInterval: f => intervals.delete(f),
    requestAnimationFrame: f => { rafs.add(f); return f; }, cancelAnimationFrame: f => rafs.delete(f),
  };
  globalThis.document = {
    body: container, getElementById: () => container,
    createElement: tag => {
      const n = { tag, style: {}, setAttribute() {}, remove: () => nodes.delete(n), getContext: () => ({}) };
      return n;
    },
  };
  try {
    const result = await build({ entryPoints: ['src/scenes/diorama/StormEffects.tsx'], bundle: true, write: false, format: 'esm', platform: 'node',
      plugins: [{ name: 'reloj-y-dom', setup(b) {
        b.onResolve({ filter: /^react$|\/state\/store$|\/i18n$/ }, a => ({ path: a.path, namespace: 'mock' }));
        b.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => ({ contents: path === 'react'
          ? `const h=globalThis.__stormTest; export const useState=h.useState,useRef=h.useRef,useEffect=h.useEffect;`
          : path.endsWith('/store') ? `export const store=globalThis.__stormTest.store;` : `export const t=k=>k;` }));
      } }],
    });
    const { StormEffects } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
    const render = () => { cursor = 0; StormEffects(); while (pending.length) pending.shift()(); };
    const cambiar = valor => { fase = valor; for (const f of subscribers) f({ fase }); render(); };
    const button = () => [...nodes].find(n => n.tag === 'button');
    render();
    assert.equal(nodes.size, 0);
    events.get('pointerdown')(); await Promise.resolve(); render();
    cambiar('refugio');
    assert.equal(intervals.size, 1); assert.equal(rafs.size, 1); assert.equal(beeps, 1);
    const canvas = [...nodes].find(n => n.tag === 'canvas');
    button().onclick(); render();
    assert.equal(intervals.size, 0); assert.ok(stops >= 2); assert.ok(nodes.has(canvas));
    cambiar('tormenta');
    assert.equal(intervals.size, 0);
    button().onclick(); render();
    assert.equal(intervals.size, 1); assert.equal(beeps, 2);
    cambiar('reporte');
    assert.equal(intervals.size, 0); assert.equal(rafs.size, 0); assert.equal(nodes.size, 0);
  } finally {
    for (const effect of effects) effect?.cleanup?.();
    globalThis.window = previous.window; globalThis.document = previous.document;
    delete globalThis.__stormTest;
  }
  assert.equal(subscribers.size, 0); assert.equal(events.size, 0); assert.ok(closed);
});
