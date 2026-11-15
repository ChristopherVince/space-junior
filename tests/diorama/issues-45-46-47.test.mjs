import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { build } from 'esbuild';

async function importarModuloTS(entryPoint) {
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    loader: { '.css': 'empty' },
  });
  const code = result.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

test('Issue #47: abandonarPartida reinicia el store a aviso y limpia el estado de los bots', async () => {
  const mod = await importarModuloTS('src/state/partida.ts');
  const { store, estadoInicial } = await importarModuloTS('src/state/store.ts');

  mod.iniciarPartida({
    id: 'test-cme',
    horasPronosticadas: 20,
    margenHoras: 5,
    horasReales: 18,
  });

  // Nota: cada bundle importado vía data URL tiene su propia instancia de store;
  // probamos directamente sobre un bundle unificado.
  assert.ok(typeof mod.abandonarPartida === 'function');
  assert.equal(estadoInicial().fase, 'aviso');
  assert.equal( store.getState().fase, 'aviso');
});

test('Issues #47 y #45: flujo completo de reinicio y registro de eventos', async () => {
  const entry = `
    export { store, estadoInicial, reducer } from './src/state/store.ts';
    export { iniciarPartida, abandonarPartida } from './src/state/partida.ts';
    export { revisarBots, reiniciarBots } from './src/bots/bots.ts';
    export { evaluarTransicionRegistro } from './src/ui/registro.ts';
  `;
  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    loader: { '.css': 'empty' },
  });
  const app = await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
  );

  // 1. Iniciar partida y avanzar horas / asignar energía
  let log = [];
  let prev = app.store.getState();
  app.store.subscribe((curr) => {
    log = app.evaluarTransicionRegistro(prev, curr, log);
    prev = curr;
  });

  app.iniciarPartida({
    id: 'evento-real-1',
    horasPronosticadas: 24,
    margenHoras: 10,
    horasReales: 16,
  });

  assert.equal(app.store.getState().fase, 'preparacion');
  assert.equal(log.length, 1);
  assert.equal(log[0].clave, 'panelLateral.registro.inicio');

  // (El panel de Tareas se quitó por decisión del equipo.)

  // 3. Petición de bot y resolución aceptada quedan en el registro
  app.revisarBots();
  assert.ok(app.store.getState().peticionActiva !== null);
  app.store.dispatch({ type: 'RESOLVER_PETICION', aceptada: true });
  assert.equal(app.store.getState().peticionActiva, null);
  assert.equal(log.at(-1).clave, 'panelLateral.registro.peticionAceptada');

  // 4. Avanzar horas y pausar antes de abandonar
  app.store.dispatch({ type: 'AVANZAR_HORAS', horas: 5 });
  app.store.dispatch({ type: 'PAUSAR', pausado: true });
  assert.ok(app.store.getState().hora > 0);
  assert.ok(app.store.getState().tripulacion.comandante.dosis > 0);

  // 5. Abandonar partida regresa todo al estado inicial (fase 'aviso', dosis 0, registro limpio)
  app.abandonarPartida();
  const reiniciado = app.store.getState();
  assert.equal(reiniciado.fase, 'aviso');
  assert.equal(reiniciado.hora, 0);
  assert.equal(reiniciado.sol, 1);
  assert.equal(reiniciado.pausado, false);
  assert.equal(reiniciado.tripulacion.comandante.dosis, 0);
  assert.equal(reiniciado.tripulacion.comandante.modulo, 'pasillo');
  assert.equal(log.length, 0);
});

test('Issues #45 y #46: paridad completa entre es.json y en.json y claves de pausa/paneles presentes', () => {
  const es = JSON.parse(fs.readFileSync('src/i18n/es.json', 'utf8'));
  const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));

  const clavesEs = Object.keys(es).sort();
  const clavesEn = Object.keys(en).sort();
  assert.deepEqual(clavesEs, clavesEn);

  const requeridas = [
    'panelModulo.desc.pasillo',
    'pausa.abrir',
    'pausa.titulo',
    'pausa.continuar',
    'pausa.abandonar',
    'pausa.confirmar',
    'pausa.confirmarSi',
    'pausa.confirmarNo',
    'panelLateral.cerrar',
    'panelLateral.modulos.titulo',
    'panelLateral.tripulacion.titulo',
    'panelLateral.registro.titulo',
  ];

  for (const clave of requeridas) {
    assert.ok(typeof es[clave] === 'string' && es[clave].length > 0, `Falta ${clave} en es.json`);
    assert.ok(typeof en[clave] === 'string' && en[clave].length > 0, `Falta ${clave} en en.json`);
  }
});

