import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { build } from 'esbuild';

async function cargarSimulador() {
  const entry = `
    export { store, estadoInicial, reducer } from './src/state/store.ts';
    export { revisarBots } from './src/bots/bots.ts';
  `;
  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

function simularEvento(reducer, estadoInicial, evento, asignaciones, enRefugio) {
  let e = reducer(estadoInicial(), {
    type: 'INICIAR_PARTIDA',
    eventoId: evento.id,
    pronostico: {
      horasPronosticadas: evento.horasPronosticadas,
      margenHoras: evento.margenHoras,
      horasReales: evento.horasReales,
    },
  });

  for (const [modulo, unidades] of Object.entries(asignaciones)) {
    e = reducer(e, { type: 'ASIGNAR_ENERGIA', modulo, unidades });
  }

  for (let paso = 0; paso < 200 && e.fase !== 'reporte'; paso++) {
    if ((e.fase === 'refugio' || e.fase === 'tormenta') && enRefugio && e.tripulacion.comandante.modulo !== 'refugio') {
      e = reducer(e, { type: 'MOVER_TRIPULANTE', quien: 'comandante', modulo: 'refugio' });
    }
    e = reducer(e, { type: 'AVANZAR_HORAS', horas: 1 });
  }
  return e;
}

test('Issue #40: simulaciones sobre los 16 eventos reales mantienen dilema con datos de RadLab', async () => {
  const { reducer, estadoInicial } = await cargarSimulador();
  const eventos = JSON.parse(fs.readFileSync('src/data/events.json', 'utf8')).eventos.filter((e) => !e.esEjemplo);
  assert.ok(eventos.length >= 16);

  let fallosTodoBlindaje = 0;

  for (const evento of eventos) {
    // 1. Todo al blindaje (sin invernadero): la mayoría de eventos debe colapsar por soporte vital.
    const todoBlindaje = simularEvento(reducer, estadoInicial, evento, { energia: 10 }, true);
    if (todoBlindaje.motivoFin === 'sinSoporteVital') fallosTodoBlindaje++;

    // 2. Sin refugio ni blindaje: dosis elevada (~1,700-2,000 µGy)
    const sinRefugio = simularEvento(reducer, estadoInicial, evento, { invernadero: 4 }, false);
    assert.equal(sinRefugio.motivoFin, 'tormentaSuperada');
    assert.ok(sinRefugio.tripulacion.comandante.dosis > 1600, `${evento.id}: dosis sin refugio muy baja`);

    // 3. Estrategia balanceada con comunicaciones y refugio: sobrevive y reduce dosis
    const balanceado = simularEvento(
      reducer,
      estadoInicial,
      evento,
      { invernadero: 4, energia: 5, comunicaciones: 1 },
      true,
    );
    assert.equal(balanceado.motivoFin, 'tormentaSuperada', `${evento.id}: balanceado debe superar la tormenta`);
    assert.ok(balanceado.recursos.soporteVital > 30, `${evento.id}: soporte vital final muy bajo`);
    assert.ok(
      balanceado.tripulacion.comandante.dosis < sinRefugio.tripulacion.comandante.dosis,
      `${evento.id}: refugio con blindaje debe reducir la dosis`,
    );
  }

  assert.ok(fallosTodoBlindaje >= 12, `Se esperaban >= 12 fallos por soporte vital sin invernadero, hubo ${fallosTodoBlindaje}`);
});

test('El Oficial Médico ya no pide energía para la Enfermería (no tiene efecto en las reglas)', async () => {
  // Antes (#40) el médico pedía energía para la Enfermería, pero esa energía no
  // reduce la dosis en ninguna regla: enseñaba algo falso y repetía la petición
  // sin fin. Ahora el médico solo da avisos en la alerta y en la tormenta.
  const { store, revisarBots } = await cargarSimulador();
  store.dispatch({
    type: 'INICIAR_PARTIDA',
    eventoId: 'test-radlab',
    pronostico: { horasPronosticadas: 30, margenHoras: 7, horasReales: 24 },
  });
  store.dispatch({ type: 'ASIGNAR_ENERGIA', modulo: 'invernadero', unidades: 4 });
  store.dispatch({ type: 'ASIGNAR_ENERGIA', modulo: 'energia', unidades: 4 });

  for (let h = 1; h <= 60 && store.getState().fase !== 'reporte'; h++) {
    store.dispatch({ type: 'AVANZAR_HORAS', horas: 1 });
    revisarBots();
    const pet = store.getState().peticionActiva;
    assert.notEqual(pet?.de, 'medico', 'El médico no debe pedir energía');
    assert.notEqual(pet?.modulo, 'enfermeria', 'Ninguna petición debe ir a la Enfermería');
    if (pet) store.dispatch({ type: 'RESOLVER_PETICION', aceptada: false });
  }
});

test('Issue #40: textos i18n y archivos de datos usan las cifras de RadLab sin valores antiguos', () => {
  const balance = JSON.parse(fs.readFileSync('src/data/balance.json', 'utf8'));
  const curiosity = JSON.parse(fs.readFileSync('src/data/curiosity_mayo2024.json', 'utf8'));
  const es = fs.readFileSync('src/i18n/es.json', 'utf8');
  const en = fs.readFileSync('src/i18n/en.json', 'utf8');

  assert.equal(balance.dosisBasePorHora, curiosity.fondo.promedioMicrograyPorHora);
  assert.equal(balance.duracionTormentaHoras, curiosity.evento.duracionHoras);
  assert.ok(!/8[.,]?100/.test(es), 'es.json no debe conservar 8,100');
  assert.ok(!/8[.,]?100/.test(en), 'en.json no debe conservar 8,100');
  assert.match(es, /4,115/);
  assert.match(en, /4\.115/);
  assert.match(es, /1\.645/);
  assert.match(en, /1,645/);
  assert.match(es, /304/);
  assert.match(en, /304/);
});
