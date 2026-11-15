import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

async function cargar() {
  const result = await build({
    stdin: { contents: "export { reducer, estadoInicial } from './src/state/store.ts';", resolveDir: process.cwd(), loader: 'ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}#${Math.random()}`);
}

test('no se puede cambiar la energía durante la alerta ni durante la tormenta', async () => {
  const { reducer, estadoInicial } = await cargar();
  let e = reducer(estadoInicial(), {
    type: 'INICIAR_PARTIDA',
    eventoId: 'prueba',
    pronostico: { horasPronosticadas: 20, margenHoras: 7, horasReales: 14 },
  });
  e = reducer(e, { type: 'ASIGNAR_ENERGIA', modulo: 'energia', unidades: 3 });
  e = reducer(e, { type: 'ASIGNAR_ENERGIA', modulo: 'comunicaciones', unidades: 1 });
  assert.equal(e.energiaAsignada.energia, 3, 'en preparación sí se puede');

  // Avanza hasta la alerta (Comunicaciones encendido) y luego hasta la tormenta.
  while (e.fase === 'preparacion') e = reducer(e, { type: 'AVANZAR_HORAS', horas: 1 });
  assert.equal(e.fase, 'refugio');
  const enAlerta = reducer(e, { type: 'ASIGNAR_ENERGIA', modulo: 'energia', unidades: 6 });
  assert.equal(enAlerta.energiaAsignada.energia, 3, 'en la alerta no cambia');

  while (e.fase === 'refugio') e = reducer(e, { type: 'AVANZAR_HORAS', horas: 1 });
  assert.equal(e.fase, 'tormenta');
  assert.ok(e.horaInicioTormenta < e.pronostico.horasPronosticadas, 'la tormenta llegó antes de lo pronosticado');
  const enTormenta = reducer(e, { type: 'ASIGNAR_ENERGIA', modulo: 'invernadero', unidades: 2 });
  assert.equal(enTormenta.energiaAsignada.invernadero ?? 0, 0, 'en la tormenta no cambia');
  assert.equal(enTormenta.recursos.energia, e.recursos.energia);
});
